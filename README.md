# LANCERT — QR Verification Update

This package keeps the existing LANCERT frontend and backend, and updates QR generation/verification.

## What changed

- QR content is now a verification URL containing a 48-character random opaque token.
- The database stores only the SHA-256 hash of the token.
- Generating a new QR for a certificate replaces its active token hash, so the previous QR is revoked.
- Tokens expire after 365 days.
- The Python QR uses medium error correction and a larger quiet zone to improve camera scanning.
- The frontend scanner accepts either the LANCERT URL or a raw opaque token.
- Opening the QR URL in a browser automatically sends the token to the LANCERT API.

## 1. Apply the database migration once

Open `BackEnd/LANCERT_QR_TOKEN_MIGRATION.sql` in MySQL Workbench, select the `lancert_db` connection, and run the script once.

It adds:
- `qr_token_hash`
- `qr_token_issued_at`
- `qr_token_expires_at`

Do not run it a second time; the columns and index already exist after the first successful run.

## 2. Install and run backend

In a terminal opened inside `BackEnd`:

```powershell
cd BackEnd
npm install
python -m pip install -r python_qr/requirements.txt
npm start
```

The API should report that it is connected to `lancert_db` and listening on port 3000.

## 3. Run the frontend

Open `FrontEnd/index.html` with VS Code Live Server.

For laptop-only testing, `http://127.0.0.1:5500/FrontEnd/index.html` is fine.

## 4. Test token rotation

1. Generate QR A and save a copy.
2. Generate QR B for the same certificate.
3. Scan QR B: it should verify.
4. Scan QR A: it should be rejected as invalid/revoked/expired.

## Important security note

This is a project/demo verification workflow, not an official land registry. The certificate creation endpoint and demo sign-in are not production-grade authorization. Before real deployment, add staff authentication/authorization, HTTPS, rate limiting, audit logging, proper user ownership checks, and a real trusted registry source.
