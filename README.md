# LANCERT — Land Certificate Verification System

LANCERT is a web-based land-certificate information and verification prototype. It provides a responsive interface for certificate verification, QR-code scanning, map exploration, land education, and public guidance.

The project uses HTML, CSS, and vanilla JavaScript for the frontend, with Node.js, Express, MySQL, and JSON Web Tokens (JWT) for backend certificate lookup and QR-token verification.

## Features

- **Home** — Landing page featuring the “Our Land, Our Future” hero and four main feature links.
- **Certificate Verification** — Enter a certificate number to start the verification flow.
- **QR Code Scanner** — Scan QR codes using the HTML5 QR Code library.
- **Verification Process** — Display a four-step progress flow during verification.
- **Verification Result** — Display certificate information returned by the backend and download a verification summary.
- **Interactive Map** — Explore a map-style interface with search and zoom controls.
- **Land Education** — Browse educational articles and filter them by category.
- **Help and Guidance** — Present public guidance and service principles.
- **About** — Explain the LANCERT mission and its commitment to secure land information.
- **REST API** — Provide certificate lookup, QR-token generation, and token verification endpoints.

## Project Structure

```text
SweetDream_LandCert/
├── BackEnd/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── FrontEnd/
│   ├── assets/
│   │   ├── family-homes.jpg
│   │   ├── future-generations.jpg
│   │   ├── hero-mountain.jpg
│   │   ├── land-documents.jpg
│   │   ├── land-int.jpg
│   │   ├── land-parcels.jpg
│   │   ├── sustainable-development.jpg
│   │   └── README.txt
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
│
├── LanCert SQL.sql
└── README.md
```

## Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 QR Code library for QR scanning
- Google Fonts for typography

### Backend

- Node.js
- Express.js
- MySQL
- JSON Web Token (JWT)
- CORS middleware

## Requirements

- Node.js and npm
- MySQL Server
- A modern web browser
- A code editor such as Visual Studio Code

An internet connection is required for external resources such as Google Fonts and the QR-scanning library loaded from a CDN.

## Getting Started

### 1. Configure the Database

Create a MySQL database named `LanCert_db` and a `certificates` table with a `certificate_number` column.

The current backend expects certificate records to be stored in this table. Additional columns depend on the fields used by the frontend and your database schema.

### 2. Configure the Backend

Open a terminal in the backend directory:

```bash
cd BackEnd
```

Install the dependencies:

```bash
npm install
```

Before running the backend, configure the MySQL credentials and JWT signing secret in `server.js` or, preferably, through environment variables.

Do not commit real database passwords or signing secrets to version control.

### 3. Start the Backend

Run:

```bash
node server.js
```

The server listens on:

`http://localhost:3000`

Keep the terminal open while using features that require the backend.

### 4. Open the Frontend

Open `FrontEnd/index.html` in a browser.

For camera-based QR scanning, use a browser environment that supports camera access. Camera permissions and secure-context requirements may prevent scanning from working when the page is opened directly from a local file.

If necessary, serve the frontend through a local development server.

## Backend API Endpoints

The following endpoints are implemented in `BackEnd/server.js`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/certificates/:number` | Look up a certificate by its certificate number. |
| GET | `/api/generate-qr/:number` | Generate a signed JWT payload for a certificate number. |
| GET | `/api/verify-token/:token` | Validate a JWT and retrieve the corresponding certificate record. |

### Certificate Lookup

Example:

```http
GET /api/certificates/CT-34.12.010.12345
```

The backend queries the `certificates` table using a parameterized SQL query.

- `200 OK` — A matching certificate record is returned.
- `404 Not Found` — No matching certificate is found.
- `500 Internal Server Error` — A database query fails.

### QR Token Generation

Example:

```http
GET /api/generate-qr/CT-34.12.010.12345
```

Example response:

```json
{
  "certificate_number": "CT-34.12.010.12345",
  "secure_qr_payload": "<signed-jwt-token>"
}
```

The token is signed using the backend's JWT secret.

### QR Token Verification

Example:

```http
GET /api/verify-token/<signed-jwt-token>
```

The backend verifies the token signature, extracts the certificate number, and looks up the corresponding record.

- `200 OK` — A matching certificate record is returned.
- `403 Forbidden` — The token is invalid or its signature cannot be verified.
- `404 Not Found` — The certificate record does not exist.
- `500 Internal Server Error` — A database query fails.

## Frontend and Backend Integration

The frontend's QR scanning flow sends the scanned token to the backend verification endpoint.

The intended request flow is:

1. The user opens the Verification page.
2. The user enters a certificate number or scans a QR code.
3. The frontend starts the verification progress flow.
4. The scanned token is sent to the backend.
5. The backend validates the JWT and queries MySQL.
6. The frontend displays the returned certificate information or an error message.

The current QR verification code uses `http://localhost:3000`. This address works only when the backend is accessible on the same computer. It must be changed when deploying the frontend and backend to different hosts.

The certificate-number verification flow should also be checked to ensure that it uses the intended backend endpoint rather than demonstration data.

## Security Considerations

Before using LANCERT with real certificate records:

1. Move database credentials and JWT signing secrets into environment variables.
2. Rotate any credentials or secrets that have been exposed in source code.
3. Add authentication and authorization where required.
4. Use HTTPS in deployed environments.
5. Apply rate limiting and request validation to API endpoints.
6. Avoid placing JWTs in URLs because URLs may be recorded in browser history, logs, and monitoring systems.
7. Set an appropriate token expiration time and validate token claims.
8. Protect certificate information from unauthorized access.
9. Use prepared SQL queries and review error handling before deployment.
10. Ensure that a failed API request never produces a successful verification result.

A valid JWT proves that a token was signed with the expected secret; it does not independently prove that a land certificate is legally authentic.

## Current Limitations

- A functioning MySQL database and the expected schema are required for backend certificate lookup.
- The map interface is not necessarily connected to an official cadastral data source.
- Educational article content may contain placeholders.
- The QR scanner depends on browser camera support, permissions, and the external library.
- The API currently implements basic certificate lookup and QR-token operations; authentication and access-control features are not fully implemented.
- Real-world legal verification requires an authorized and reliable land registry data source.