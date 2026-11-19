-- Run this ONCE in MySQL Workbench, using the lancert_db schema.
-- It adds one active opaque QR token slot per certificate.
-- Generating a new QR replaces the hash, automatically revoking the previous QR.

USE lancert_db;

ALTER TABLE certificates
  ADD COLUMN qr_token_hash CHAR(64)
    CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD COLUMN qr_token_issued_at DATETIME NULL,
  ADD COLUMN qr_token_expires_at DATETIME NULL,
  ADD UNIQUE KEY uq_certificates_qr_token_hash (qr_token_hash);
