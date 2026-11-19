require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json({ limit: "32kb" }));

const PORT = Number(process.env.PORT || 3000);
const db = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lancert_db",
});

db.connect((err) => {
  if (err) console.error("MySQL connection failed:", err.message);
  else console.log(`Connected to MySQL database "${process.env.DB_NAME || "lancert_db"}".`);
});

const PUBLIC_FIELDS = `id, certificate_number, owner_name, land_type, area,
  location, latitude, longitude, status, verified_at`;

function findCertificate(certNumber, callback) {
  db.query(
    `SELECT ${PUBLIC_FIELDS} FROM certificates WHERE certificate_number = ? LIMIT 1`,
    [certNumber],
    callback,
  );
}

function makeCertificateNumber(latitude, longitude, verifiedAt) {
  // Date and coordinates contribute to the reference; a random nonce prevents
  // collisions and avoids exposing the coordinates in the certificate number.
  const date = new Date(verifiedAt).toISOString().slice(0, 10).replace(/-/g, "");
  const coordinates = `${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`;
  const nonce = crypto.randomBytes(16).toString("hex");
  const digest = crypto.createHash("sha256")
    .update(`${date}|${coordinates}|${nonce}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `CT-${date}-${digest}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function buildVerificationUrl(req, token) {
  const configured = process.env.FRONTEND_VERIFY_URL;
  const origin = req.get("origin");
  const base = configured || (origin
    ? `${origin.replace(/\/$/, "")}/FrontEnd/index.html`
    : "http://127.0.0.1:5500/FrontEnd/index.html");
  const url = new URL(base);
  url.searchParams.set("verify", token);
  url.hash = "home";
  return url.toString();
}

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "LANCERT API" }),
);

app.get("/api/certificates/:number", (req, res) => {
  findCertificate(req.params.number, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database query failed" });
    if (!rows.length) return res.status(404).json({ error: "Certificate not found" });
    res.json(rows[0]);
  });
});

// Demo-only certificate creation. Protect this endpoint with staff authentication
// and an authorization workflow before any real deployment.
app.post("/api/certificates", (req, res) => {
  const { owner_name, land_type, area, location, latitude, longitude } = req.body || {};
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!owner_name || !land_type || !area || !location ||
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      error: "Provide owner, land details, and valid latitude/longitude.",
    });
  }

  const verifiedAt = new Date();
  const number = makeCertificateNumber(lat, lng, verifiedAt);
  const sql = `INSERT INTO certificates
    (certificate_number, owner_name, land_type, area, location, latitude, longitude, status, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Verified', ?)`;

  db.query(
    sql,
    [number, owner_name.trim(), land_type, area, location, lat, lng, verifiedAt],
    (err) => {
      if (err) {
        console.error("Certificate creation failed:", err.message);
        return res.status(500).json({
          error: "Unable to save certificate. Check the database schema and unique number.",
        });
      }
      findCertificate(number, (lookupErr, rows) => {
        if (lookupErr || !rows.length) {
          return res.status(500).json({ error: "Record saved but could not be retrieved." });
        }
        res.status(201).json(rows[0]);
      });
    },
  );
});

// Each successful generation rotates the opaque token. The database stores only
// its SHA-256 hash, so a previously generated QR becomes invalid after rotation.
app.get("/api/certificates/:number/qr.png", (req, res) => {
  findCertificate(req.params.number, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database query failed" });
    if (!rows.length) return res.status(404).json({ error: "Certificate not found" });

    const record = rows[0];
    const token = crypto.randomBytes(24).toString("hex"); // 48 hex chars
    const tokenHash = sha256(token);
    const verificationUrl = buildVerificationUrl(req, token);
    const generator = path.join(__dirname, "python_qr", "generate_qr.py");
    const python = process.env.PYTHON_COMMAND ||
      (process.platform === "win32" ? "python" : "python3");

    execFile(
      python,
      [generator, verificationUrl],
      { timeout: 15000, maxBuffer: 1024 * 1024 },
      (generationError, stdout, stderr) => {
        if (generationError) {
          console.error("Python QR generation failed:", stderr || generationError.message);
          return res.status(500).json({
            error: "QR generation failed. Install python_qr/requirements.txt.",
          });
        }

        const imagePath = stdout.trim();
        const outputDir = path.join(__dirname, "python_qr", "generated") + path.sep;
        if (!imagePath.startsWith(outputDir)) {
          return res.status(500).json({ error: "Invalid QR output path." });
        }

        // Save the new hash only after the PNG was generated successfully.
        // This atomically makes every older QR for this certificate invalid.
        db.query(
          `UPDATE certificates
           SET qr_token_hash = ?, qr_token_issued_at = NOW(),
               qr_token_expires_at = DATE_ADD(NOW(), INTERVAL 365 DAY)
           WHERE id = ?`,
          [tokenHash, record.id],
          (updateError, result) => {
            if (updateError || !result.affectedRows) {
              console.error("QR token activation failed:", updateError?.message || "No row updated");
              return res.status(500).json({
                error: "QR was generated but could not be activated. Run the QR token SQL migration.",
              });
            }

            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", "no-store, max-age=0");
            res.sendFile(imagePath);
          },
        );
      },
    );
  });
});

app.get("/api/verify-token/:token", (req, res) => {
  const token = String(req.params.token || "");
  if (!/^[a-f0-9]{48}$/i.test(token)) {
    return res.status(403).json({ error: "Invalid QR token." });
  }

  const tokenHash = sha256(token);
  const sql = `SELECT ${PUBLIC_FIELDS}
    FROM certificates
    WHERE qr_token_hash = ?
      AND qr_token_expires_at IS NOT NULL
      AND qr_token_expires_at > NOW()
      AND status = 'Verified'
    LIMIT 1`;

  db.query(sql, [tokenHash], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database query failed" });
    if (!rows.length) {
      return res.status(403).json({
        error: "This QR code is invalid, revoked, or expired. Generate a new LANCERT QR code.",
      });
    }
    res.json(rows[0]);
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LANCERT backend running on http://localhost:${PORT}`);
});
