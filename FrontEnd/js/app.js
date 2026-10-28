// LANCERT frontend prototype. Certificate verification uses sample data only.
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
  if (location.hash !== `#${viewName}`)
    history.replaceState(null, "", `#${viewName}`);
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
$("#login-button").addEventListener("click", () =>
  showNotice(
    "Sign-in is not available yet",
    "This is a frontend-only prototype. A backend team can connect authentication and user sessions here.",
  ),
);

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
    showNotice("Certificate Number Required", "Enter a certificate number first.");
    return;
  }

  button.disabled = true;
  button.textContent = "Verifying...";

  let certificateData = null;
  let hasError = false;

  try {
    const response = await fetch(`http://localhost:3000/api/certificates/${number}`);
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
  const progressValue = $("#progress-value"); const processItems = $$("#process-list li");
  
  let currentProgress = 0;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < processItems.length; i++) {
    const targetProgress = (i + 1) * 25; // 25%, 50%, 75%, 100%
    
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
  button.innerHTML = 'Run Verification <span>→</span>';

  if (hasError || !certificateData) {
    showView("enter");
    showNotice("Not Found", "This certificate number does not exist in the database.");
    return;
  }

  $("#result-number").textContent = certificateData.certificate_number;
  $("#result-status").querySelector("b").textContent = "Official Verification Successful";
  $("#result-status").querySelector("small").textContent = 
    `Land Type: ${certificateData.land_type} | Location: ${certificateData.location}`;
  $("#result-status").querySelector(".status-tag").textContent = "VERIFIED";

  showView("result");
});

$("#download-summary").addEventListener("click", () => {
  const number = $("#result-number").textContent;
  const content = [
    "LANCERT — VERIFICATION SUMMARY (DEMO)",
    "=====================================",
    `Certificate number: ${number}`,
    "Result: DEMO ONLY — NOT OFFICIAL",
    "Land type: Freehold Title (SHM) — sample data",
    "Area: 1,250 m2 — sample data",
    "Location: Sleman, Yogyakarta — sample data",
    "",
    "This file was generated by a frontend-only prototype.",
    "No official land registry was queried. Do not use this summary as legal evidence.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lancert-demo-summary.txt";
  anchor.click();
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
  $("#map-image").style.transform = "scale(1)";
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
  } else
    showNotice(
      "Search Land Parcels",
      "Enter a search term or certificate number first.",
    );
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
    } catch (e) {

    }
    html5QrCodeScanner = null;
  }

  html5QrCodeScanner = new Html5QrcodeScanner("qr-reader", {
    fps: 10,
    qrbox: { width: 200, height: 200 }
  });

  html5QrCodeScanner.render(
    async (decodedText) => {
      console.log("Secure QR Token Scanned:", decodedText);

      try {
        await html5QrCodeScanner.clear();
      } catch (e) {}
      html5QrCodeScanner = null;

      await handleScannedCode(decodedText);
    },
    (errorMessage) => {
    }
  );
}

async function handleScannedCode(scannedToken) {
  showView("process");
  $("#process-status").textContent = "Verifying secure QR token with backend...";
  
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
    const response = await fetch(`http://localhost:3000/api/verify-token/${scannedToken}`);
    if (!response.ok) {
      hasError = true;
    } else {
      certificateData = await response.json();
    }
  } catch (error) {
    console.error("Connection error:", error);
    hasError = true;
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
    showNotice("Security Warning", "This QR code is invalid, fake, or has been tampered with!");
    return;
  }

  $("#result-number").textContent = certificateData.certificate_number;
  $("#result-status").querySelector("b").textContent = "Official Secure Verification Successful";
  $("#result-status").querySelector("small").textContent = 
    `Land Type: ${certificateData.land_type} | Location: ${certificateData.location}`;
  $("#result-status").querySelector(".status-tag").textContent = "SECURELY VERIFIED";
  
  showView("result");

}

const scanBtn = document.getElementById("start-scan-btn");
if (scanBtn) {
  scanBtn.addEventListener("click", () => {
    startQrScanner();
  });

window.addEventListener("hashchange", () => showView(location.hash.slice(1)));
const requestedView = location.hash.slice(1);
showView(validViews.includes(requestedView) ? requestedView : "home");
}