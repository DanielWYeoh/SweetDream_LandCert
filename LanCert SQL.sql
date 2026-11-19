
CREATE DATABASE IF NOT EXISTS lancert_db;
USE lancert_db;

CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    owner_name VARCHAR(160) NOT NULL,
    land_type VARCHAR(100),
    area VARCHAR(50),
    location VARCHAR(150),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Verified',
    verified_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update verification date if missing
UPDATE certificates
SET verified_at = CURRENT_TIMESTAMP
WHERE verified_at IS NULL;

-- Sample certificate
INSERT INTO certificates (
    certificate_number,
    owner_name,
    land_type,
    area,
    location,
    latitude,
    longitude,
    status,
    verified_at
)
VALUES (
    'CT-20261119-8A31F09C',
    'Sample Land Owner',
    'Freehold Title (SHM)',
    '1,250 m2',
    'Sleman, Yogyakarta',
    -7.7167,
    110.3556,
    'Verified',
    '2026-11-19 13:00:00'
)
ON DUPLICATE KEY UPDATE
    certificate_number = VALUES(certificate_number);

-- Check database records
SELECT * FROM certificates;

ALTER TABLE certificates
ADD COLUMN verified_at DATETIME NULL;

DESCRIBE certificates;

ALTER TABLE certificates
ADD COLUMN owner_name VARCHAR(160) NOT NULL DEFAULT 'Owner not recorded',
ADD COLUMN latitude DECIMAL(10,7) NOT NULL DEFAULT 0,
ADD COLUMN longitude DECIMAL(10,7) NOT NULL DEFAULT 0;