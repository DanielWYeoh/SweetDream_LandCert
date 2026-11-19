const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const dialog = $("#notice-dialog");

function showNotice(title, message) {
  $("#dialog-title").textContent = title;
  $("#dialog-message").textContent = message;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else alert(`${title}\n\n${message}`);
}

$("#dialog-close").addEventListener("click", () => dialog.close());
$("#dialog-ok").addEventListener("click", () => dialog.close());

const validViews = [
  "home",
  "enter",
  "process",
  "result",
  "login",
  "account",
  "map",
  "education",
  "help",
  "about",
];

function showView(name) {
  const viewName = validViews.includes(name) ? name : "home";

  $$(".app-view").forEach((view) =>
    view.classList.toggle("active", view.dataset.view === viewName),
  );

  $$(".nav-links a").forEach((link) =>
    link.classList.toggle("active", link.dataset.navigate === viewName),
  );

  $("#nav-links").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (location.hash !== `#${viewName}`) {
    history.replaceState(null, "", `#${viewName}`);
  }
}

$("#menu-toggle").addEventListener("click", () =>
  $("#nav-links").classList.toggle("open"),
);

$$("[data-navigate]").forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showView(link.dataset.navigate);
  }),
);

$$("[data-go]").forEach((button) =>
  button.addEventListener("click", () => showView(button.dataset.go)),
);

// Use the same host as the frontend. This lets a phone on the same Wi-Fi
// reach the laptop backend instead of trying to call the phone's own localhost.
const API_BASE =
  window.LANCERT_API_BASE || `${window.location.protocol}//${window.location.hostname}:3000`;

function extractTokenFromQrPayload(payload) {
  const value = String(payload || "").trim();
  try {
    const url = new URL(value);
    const token = url.searchParams.get("verify");
    if (token) return token;
  } catch (_error) {
    // Imported/scanned raw opaque tokens are also accepted.
  }
  return value;
}

function formatVerifiedAt(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function renderCertificateResult(record) {
  $("#result-owner").textContent = record.owner_name || "Not provided";
  $("#result-number").textContent = record.certificate_number || "—";
  $("#result-location").textContent = record.location || "Not provided";
  $("#result-coordinates").textContent =
    record.latitude != null && record.longitude != null
      ? `${record.latitude}, ${record.longitude}`
      : "Not provided";
  $("#result-verified-at").textContent = formatVerifiedAt(record.verified_at);

  $("#result-land-type").textContent = record.land_type || "Not provided";
  $("#result-area").textContent = record.area || "Not provided";
  $("#result-record-status").textContent = record.status || "Unknown";
}

let generatedQrUrl = null;

$("#login-button").addEventListener("click", () => {
  const signedIn = sessionStorage.getItem("lancertDemoSignedIn") === "true";

  if (signedIn) {
    showView("account");
    loadAccountRecord();
  } else {
    showView("login");
  }
});

$("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const username = $("#login-username").value.trim();
  const email = $("#login-email").value.trim();
  if (username.length < 3 || !email) return;

  // Demo-only session: this is a display profile, not secure authentication.
  sessionStorage.setItem("lancertDemoSignedIn", "true");
  sessionStorage.setItem("lancertDemoUsername", username);
  sessionStorage.setItem("lancertDemoEmail", email);

  $("#account-username").textContent = username;
  $("#account-email").textContent = email;
  $("#login-button").textContent = "My Account";

  showView("account");
  loadAccountRecord();
});

$("#sign-out-button").addEventListener("click", () => {
  sessionStorage.removeItem("lancertDemoSignedIn");
  sessionStorage.removeItem("lancertDemoEmail");
  sessionStorage.removeItem("lancertDemoUsername");

  $("#login-button").textContent = "Sign In";
  showView("home");
});

async function loadAccountRecord() {
  const number = $("#account-cert-number").textContent.trim();

  $("#account-username").textContent =
    sessionStorage.getItem("lancertDemoUsername") || "Demo User";
  $("#account-username").textContent =
    sessionStorage.getItem("lancertDemoUsername") || "Demo User";
  $("#account-email").textContent =
    sessionStorage.getItem("lancertDemoEmail") || "demo@example.com";

  $("#account-record-status").textContent = "Loading record";

  try {
    const response = await fetch(
      `${API_BASE}/api/certificates/${encodeURIComponent(number)}`,
      { cache: "no-store" },
    );

    const record = await response.json();

    if (!response.ok) {
      throw new Error(record.error || "Certificate not found");
    }

    $("#account-cert-number").textContent = record.certificate_number || number;
    $("#account-qr-number").textContent = record.certificate_number || number;
    $("#account-owner-name").textContent = record.owner_name || "Not provided";
    $("#account-land-coordinates").textContent =
      record.latitude != null && record.longitude != null
        ? `${record.latitude}, ${record.longitude}`
        : "Not provided";
    $("#account-verified-at").textContent = formatVerifiedAt(record.verified_at);

    $("#account-land-type").textContent = record.land_type || "Not provided";

    $("#account-land-area").textContent = record.area || "Not provided";

    $("#account-land-location").textContent = record.location || "Not provided";

    $("#account-land-status").textContent = record.status || "Record found";

    $("#account-record-status").textContent = "Found in MySQL";
  } catch (error) {
    console.error("Account record loading failed:", error);

    $("#account-record-status").textContent = "API unavailable";
    $("#account-land-type").textContent = "Unavailable";
    $("#account-land-area").textContent = "Unavailable";
    $("#account-land-location").textContent = "Unavailable";
    $("#account-land-status").textContent = error.message;

    $("#account-qr-caption").textContent =
      "Start the backend and confirm the MySQL record exists.";
  }
}

$("#generate-account-qr").addEventListener("click", async () => {
  const button = $("#generate-account-qr");
  const number = $("#account-cert-number").textContent.trim();
  const image = $("#account-qr-image");
  const caption = $("#account-qr-caption");
  const downloadButton = $("#download-account-qr");

  button.disabled = true;
  button.textContent = "Generating...";
  downloadButton.disabled = true;
  caption.textContent = "Generating QR code from the backend...";

  try {
    if (!number) {
      throw new Error("Certificate number is empty.");
    }

    const endpoint = `${API_BASE}/api/certificates/${encodeURIComponent(number)}/qr.png`;

    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));

      throw new Error(
        data.error || `QR generation failed (${response.status})`,
      );
    }

    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) {
      throw new Error("The backend did not return an image.");
    }

    const imageUrl = URL.createObjectURL(blob);

    try {
      await new Promise((resolve, reject) => {
        const testImage = new Image();

        testImage.onload = () => resolve();

        testImage.onerror = () => {
          reject(new Error("The QR image could not be displayed."));
        };

        testImage.src = imageUrl;
      });
    } catch (error) {
      URL.revokeObjectURL(imageUrl);
      throw error;
    }

    if (generatedQrUrl) {
      URL.revokeObjectURL(generatedQrUrl);
    }

    generatedQrUrl = imageUrl;

    image.dataset.generatedUrl = imageUrl;
    image.src = imageUrl;
    image.alt = "Generated LANCERT certificate QR code";
    image.hidden = false;
    image.style.display = "block";

    caption.textContent = "Generated by Python · certificate checked in MySQL";

    downloadButton.disabled = false;
  } catch (error) {
    console.error("QR generation failed:", error);

    caption.textContent = "QR generation failed. Please try again.";

    showNotice(
      "QR generation failed",
      `${error.message} Make sure Node.js, MySQL, Python, and Python requirements are configured.`,
    );
  } finally {
    button.disabled = false;
    button.textContent = "Generate QR Code";
  }
});

$("#download-account-qr").addEventListener("click", () => {
  if (!generatedQrUrl) return;

  const link = document.createElement("a");
  link.href = generatedQrUrl;
  link.download = "lancert-certificate-qr.png";

  document.body.appendChild(link);
  link.click();
  link.remove();
});

if (sessionStorage.getItem("lancertDemoSignedIn") === "true") {
  $("#login-button").textContent = "My Account";

  $("#account-username").textContent =
    sessionStorage.getItem("lancertDemoUsername") || "Demo User";
  $("#account-username").textContent =
    sessionStorage.getItem("lancertDemoUsername") || "Demo User";
  $("#account-email").textContent =
    sessionStorage.getItem("lancertDemoEmail") || "demo@example.com";
}

$("#enter-certificate").addEventListener("click", () => showView("enter"));

function updateCertificateNumber(number) {
  const cleanNumber = number.trim();

  if (!cleanNumber) {
    showNotice(
      "Certificate Number Required",
      "Enter a certificate number before continuing.",
    );

    return false;
  }

  $("#certificate-number").value = cleanNumber;
  $("#result-number").textContent = cleanNumber;

  const mapNumber = $("#map-certificate");
  if (mapNumber) mapNumber.textContent = cleanNumber;

  return true;
}

$("#verification-form").addEventListener("submit", (event) => {
  event.preventDefault();

  if (!updateCertificateNumber($("#certificate-number").value)) return;

  $("#process-status").textContent =
    "Certificate number received. Ready to run the demo process.";

  $("#progress-bar").style.width = "0%";
  $("#progress-value").textContent = "0%";

  $$("#process-list li").forEach((item, index) => {
    item.classList.remove("complete");

    const marker = item.querySelector("span");
    if (marker) marker.textContent = String(index + 1);
  });

  showView("process");
});

$("#clear-number").addEventListener("click", () => {
  $("#certificate-number").value = "";
  $("#certificate-number").focus();
});

$("#run-verification").addEventListener("click", async () => {
  const button = $("#run-verification");
  const number = $("#certificate-number").value.trim();

  if (!number) {
    showView("enter");

    showNotice(
      "Certificate Number Required",
      "Enter a certificate number first.",
    );

    return;
  }

  button.disabled = true;
  button.textContent = "Verifying...";

  let certificateData = null;
  let hasError = false;

  try {
    const response = await fetch(
      `${API_BASE}/api/certificates/${encodeURIComponent(number)}`,
    );

    if (!response.ok) {
      hasError = true;
    } else {
      certificateData = await response.json();
    }
  } catch (error) {
    console.error("Connection error:", error);
    hasError = true;
  }

  const progressBar = $("#progress-bar");
  const progressValue = $("#progress-value");
  const processItems = $$("#process-list li");

  let currentProgress = 0;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < processItems.length; i++) {
    const targetProgress = (i + 1) * 25;

    while (currentProgress < targetProgress) {
      currentProgress += 5;
      progressBar.style.width = `${currentProgress}%`;
      progressValue.textContent = `${currentProgress}%`;

      await delay(70);
    }

    processItems[i].classList.add("complete");

    const marker = processItems[i].querySelector("span");
    if (marker) marker.textContent = "✓";
  }

  button.disabled = false;
  button.innerHTML = "Run Verification <span>→</span>";

  if (hasError || !certificateData) {
    showView("enter");

    showNotice(
      "Not Found",
      "This certificate number does not exist in the database.",
    );

    return;
  }

  renderCertificateResult(certificateData);

  $("#result-status").querySelector("b").textContent =
    "Verification Lookup Successful";

  $("#result-status").querySelector("small").textContent =
    `Land Type: ${certificateData.land_type} | Location: ${certificateData.location}`;

  $("#result-status").querySelector(".status-tag").textContent = "VERIFIED";

  showView("result");
});

$("#download-summary").addEventListener("click", () => {
  const number = $("#result-number").textContent;

  const content = [
    "LANCERT — VERIFICATION SUMMARY (PROTOTYPE)",
    "==========================================",
    `Certificate owner: ${$("#result-owner").textContent}`,
    `Certificate number: ${number}`,
    `Land type: ${$("#result-land-type").textContent}`,
    `Area: ${$("#result-area").textContent}`,
    `Location: ${$("#result-location").textContent}`,
    `Coordinates: ${$("#result-coordinates").textContent}`,
    `Verified at: ${$("#result-verified-at").textContent}`,
    `Status: ${$("#result-record-status").textContent}`,
    "",
    "Prototype output only. No official land registry was queried.",
    "Do not use this summary as legal evidence.",
  ].join("\\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "lancert-demo-summary.txt";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
});

$$("[data-map-mode]").forEach((button) =>
  button.addEventListener("click", () => {
    $$("[data-map-mode]").forEach((item) => item.classList.remove("selected"));

    button.classList.add("selected");

    const image = $("#map-image");

    image.style.filter =
      button.dataset.mapMode === "Satellite"
        ? "saturate(1.12) contrast(1.05)"
        : "saturate(.82)";
  }),
);

let zoom = 1;

$("#zoom-in").addEventListener("click", () => {
  zoom = Math.min(zoom + 0.15, 1.75);
  $("#map-image").style.transform = `scale(${zoom})`;
});

$("#zoom-out").addEventListener("click", () => {
  zoom = Math.max(zoom - 0.15, 1);
  $("#map-image").style.transform = `scale(${zoom})`;
});

$("#zoom-reset").addEventListener("click", () => {
  zoom = 1;
  $("#map-image").style.transform = `scale(${zoom})`;
});

$("#close-map-info").addEventListener("click", () => {
  const info = $(".map-info");
  info.hidden = true;

  window.setTimeout(() => {
    info.hidden = false;
  }, 4000);
});

$("#map-search-button").addEventListener("click", () => {
  const query = $("#map-search").value.trim();

  if (query) {
    $("#certificate-number").value = query;

    showNotice(
      "Map Search Demo",
      `Search term "${query}" was copied into the certificate form. Real map search requires a map provider or backend.`,
    );
  } else {
    showNotice(
      "Search Land Parcels",
      "Enter a search term or certificate number first.",
    );
  }
});

$("#map-search").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("#map-search-button").click();
  }
});

$("#topic-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-topic]");
  if (!button) return;

  $$("#topic-tabs button").forEach((item) =>
    item.classList.toggle("selected", item === button),
  );

  $$(".article-card").forEach((card) => {
    card.hidden =
      button.dataset.topic !== "all" &&
      card.dataset.category !== button.dataset.topic;
  });
});

$$(".article-card a").forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();

    showNotice(
      link.closest(".article-card").querySelector("h3").textContent,
      "This article is placeholder content. Editorial content or a content-management API can be added later.",
    );
  }),
);

let html5QrCodeScanner = null;

function startQrScanner() {
  const qrContainer = document.getElementById("qr-reader");
  if (!qrContainer) return;

  if (html5QrCodeScanner) {
    try {
      html5QrCodeScanner.clear().catch(() => {});
    } catch (error) {
      console.warn("Unable to clear previous QR scanner:", error);
    }

    html5QrCodeScanner = null;
  }

  if (typeof Html5QrcodeScanner === "undefined") {
    showNotice(
      "Scanner unavailable",
      "The QR scanner library could not load. Check your internet connection and reload LANCERT.",
    );
    return;
  }

  html5QrCodeScanner = new Html5QrcodeScanner("qr-reader", {
    fps: 12,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    rememberLastUsedCamera: true,
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    supportedScanTypes: [
      Html5QrcodeScanType.SCAN_TYPE_CAMERA,
      Html5QrcodeScanType.SCAN_TYPE_FILE,
    ],
  });

  html5QrCodeScanner.render(
    async (decodedText) => {
      console.log("Secure QR Token Scanned:", decodedText);

      try {
        await html5QrCodeScanner.clear();
      } catch (error) {
        console.warn("Unable to stop QR scanner:", error);
      }

      html5QrCodeScanner = null;

      await handleScannedCode(decodedText);
    },
    () => {},
  );
}

async function handleScannedCode(scannedPayload) {
  const scannedToken = extractTokenFromQrPayload(scannedPayload);
  if (!/^[a-f0-9]{48}$/i.test(scannedToken)) {
    showView("enter");
    showNotice(
      "Unsupported QR Code",
      "This QR code does not contain a valid LANCERT verification token.",
    );
    return;
  }

  showView("process");

  $("#process-status").textContent =
    "Verifying secure QR token with backend...";

  const progressBar = $("#progress-bar");
  const progressValue = $("#progress-value");
  const processItems = $$("#process-list li");

  progressBar.style.width = "0%";
  progressValue.textContent = "0%";

  processItems.forEach((item, index) => {
    item.classList.remove("complete");

    const marker = item.querySelector("span");
    if (marker) marker.textContent = String(index + 1);
  });

  let certificateData = null;
  let hasError = false;

  try {
    const response = await fetch(
      `${API_BASE}/api/verify-token/${encodeURIComponent(scannedToken)}`,
    );

    if (!response.ok) {
      hasError = true;
    } else {
      certificateData = await response.json();
    }
  } catch (error) {
    console.error("Connection error:", error);
    hasError = true;
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let currentProgress = 0;

  for (let i = 0; i < processItems.length; i++) {
    const targetProgress = (i + 1) * 25;

    while (currentProgress < targetProgress) {
      currentProgress += 5;
      progressBar.style.width = `${currentProgress}%`;
      progressValue.textContent = `${currentProgress}%`;

      await delay(50);
    }

    processItems[i].classList.add("complete");

    const marker = processItems[i].querySelector("span");
    if (marker) marker.textContent = "✓";
  }

  if (hasError || !certificateData) {
    showView("enter");

    showNotice(
      "Security Warning",
      "This QR code is invalid, fake, or has been tampered with!",
    );

    return;
  }

  renderCertificateResult(certificateData);

  $("#result-status").querySelector("b").textContent =
    "Certificate Lookup Successful";

  $("#result-status").querySelector("small").textContent =
    `Land Type: ${certificateData.land_type} | Location: ${certificateData.location}`;

  $("#result-status").querySelector(".status-tag").textContent = "VERIFIED";

  showView("result");
}

const scanBtn = document.getElementById("start-scan-btn");

if (scanBtn) {
  scanBtn.addEventListener("click", () => {
    startQrScanner();
  });
}

window.addEventListener("hashchange", () => {
  const requestedView = location.hash.slice(1);
  showView(requestedView);

  if (
    requestedView === "account" &&
    sessionStorage.getItem("lancertDemoSignedIn") === "true"
  ) {
    loadAccountRecord();
  }
});

const requestedView = location.hash.slice(1);
const signedIn = sessionStorage.getItem("lancertDemoSignedIn") === "true";

showView(validViews.includes(requestedView) ? requestedView : "home");

// A phone's native camera opens the URL embedded in the QR. The query token
// is automatically sent to the backend and verified in this same website.
const directVerificationToken = new URLSearchParams(window.location.search).get("verify");
if (directVerificationToken) {
  handleScannedCode(directVerificationToken);
}

if (signedIn) {
  $("#login-button").textContent = "My Account";

  $("#account-username").textContent =
    sessionStorage.getItem("lancertDemoUsername") || "Demo User";
  $("#account-username").textContent =
    sessionStorage.getItem("lancertDemoUsername") || "Demo User";
  $("#account-email").textContent =
    sessionStorage.getItem("lancertDemoEmail") || "demo@example.com";

  if (requestedView === "account") {
    loadAccountRecord();
  }
}
