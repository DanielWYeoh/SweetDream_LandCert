# LANCERT Web Frontend

A responsive, browser-based frontend prototype for a land-certificate information and verification service. The interface is in English and uses plain HTML, CSS, and JavaScript.

## Run the website

1. Extract the ZIP.
2. Open `index.html` in a browser.

No build step or package installation is required. Some illustrative images load from Unsplash and require an internet connection.

## Page flow

- **Home** — the “Our Land, Our Future” landing page.
- **Verification** — enter a certificate number or open the QR scanner placeholder.
- **Verification Process** — run a simulated four-step progress flow.
- **Verification Result** — review sample details, a demo warning, and download a summary.
- **Map** — a standalone map-style page with search and zoom controls.
- **Education** — a separate article page with category filters.
- **Help** — guidance and service principles.
- **About** — a separate LANCERT mission page.

The navigation now opens one page at a time. Map, Education, Help, and About no longer appear stacked on the same screen.

## Project structure

- `index.html` — page structure and interface content
- `css/style.css` — responsive layout and styles
- `js/app.js` — navigation and frontend interactions
- `assets/` — local static assets

## Frontend-only limitation

This project does not verify real certificates, query a government registry, authenticate users, or store certificate records. Certificate details and parcel boundaries are illustrative sample data. The map is not an official cadastral map.

## Backend integration notes

The intended integration point is `verifyCertificate()` in `js/app.js` (currently represented by the demo flow). A proposed endpoint is:

`POST /api/v1/certificates/verify`

Example request:

```json
{
  "certificateNumber": "CT-34.12.010.12345"
}
```

Example response:

```json
{
  "status": "verified",
  "message": "Certificate record matched",
  "certificate": {
    "number": "CT-34.12.010.12345",
    "rightType": "Freehold Title (SHM)",
    "areaM2": 1250,
    "location": "Sleman, Yogyakarta",
    "issuedAt": "2020-01-12",
    "updatedAt": "2024-03-05"
  }
}
```

These are suggested contracts, not live endpoints. Agree on field names and status values with the backend team before integration.

Suggested endpoints:
- `POST /api/v1/certificates/verify` — authorized certificate verification.
- `GET /api/v1/certificates/{id}` — permitted certificate details.
- `GET /api/v1/certificates/{id}/history` — access-controlled verification history.
- `GET /api/v1/parcels?query=...` — searchable parcel data where disclosure is permitted.
- `POST /api/v1/auth/login` — authentication if accounts are needed.
- `POST /api/v1/qr/resolve` — server-side QR validation.

## Integration and security

1. Keep client-side validation for usability and validate again on the server.
2. Replace demo behavior with `fetch()` to the agreed API.
3. Show loading, success, review-required, not-found, and error states separately.
4. Never show a verified result when the API fails.
5. Keep credentials and secrets on the server.
6. Use HTTPS, authorization checks, rate limits, and audit policies.
7. Treat QR contents as untrusted input and use only authorized data sources.

A real map requires an approved map provider or official data source. Do not present decorative map shapes as official parcel boundaries.


## Homepage layout update

The homepage now focuses on the full-width **Our Land, Our Future** hero and the four main feature links. The **Secure Land, Stronger Communities** mission statement and its three story cards have been moved to the **About** page to avoid an unbalanced split layout and excess empty space.

The interface remains frontend-only. Certificate verification, map information, and other service flows are demonstrations and are not connected to a real land registry backend.


## Local image assets

All website photos are stored in the `assets/` folder and loaded with relative paths. The site does not need external image URLs for its photos.

- `hero-mountain.jpg` — main homepage hero background.
- `family-homes.jpg` — family homes story card.
- `sustainable-development.jpg` — sustainable development and landscape card.
- `future-generations.jpg` — future generations story card and About background.
- `land-parcels.jpg` — parcel/map imagery.
- `land-documents.jpg` — land document education card.

The images are bundled locally so the frontend can display them without fetching the photos from an external image host. Certificate verification and map data remain demonstration-only and are not connected to a real registry backend.