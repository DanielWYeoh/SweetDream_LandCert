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
$$("[data-scan]").forEach((button) =>
  button.addEventListener("click", () =>
    showNotice(
      "QR Code Scanner",
      "QR scanning is not connected yet. Camera access, QR decoding, and certificate lookup can be integrated later.",
    ),
  ),
);

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

$("#run-verification").addEventListener("click", () => {
  const button = $("#run-verification");
  const number = $("#certificate-number").value.trim();
  if (!number) {
    showView("enter");
    showNotice(
      "Certificate Number Required",
      "Go back and enter a certificate number first.",
    );
    return;
  }
  button.disabled = true;
  button.textContent = "Running Demo Verification…";
  const steps = $$("#process-list li");
  const progress = [25, 50, 75, 100];
  let index = 0;
  $("#process-status").textContent =
    "Checking sample data. No official registry is contacted.";
  const advance = () => {
    if (index > 0 && steps[index - 1])
      steps[index - 1].classList.add("complete");
    if (index < steps.length) {
      $("#progress-bar").style.width = `${progress[index]}%`;
      $("#progress-value").textContent = `${progress[index]}%`;
      if (steps[index]) {
        const marker = steps[index].querySelector("span");
        if (marker) marker.textContent = "•";
      }
      index++;
      window.setTimeout(advance, 550);
    } else {
      steps.forEach((item) => item.classList.add("complete"));
      $("#process-status").textContent =
        "Demo process complete. No official registry was queried.";
      $("#result-status").querySelector("b").textContent = "Demo Result Ready";
      $("#result-status").querySelector("small").textContent =
        "Sample data only. The legal status of this certificate has not been verified.";
      $("#result-status").querySelector(".status-tag").textContent =
        "DEMO ONLY";
      button.disabled = false;
      button.innerHTML = "Run Demo Verification <span>→</span>";
      showView("result");
    }
  };
  advance();
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

window.addEventListener("hashchange", () => showView(location.hash.slice(1)));
const requestedView = location.hash.slice(1);
showView(validViews.includes(requestedView) ? requestedView : "home");
