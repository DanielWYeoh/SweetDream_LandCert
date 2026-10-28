CREATE DATABASE IF NOT EXISTS lancert_db;

USE lancert_db;

CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  certificate_number VARCHAR(100) NOT NULL,
  land_type VARCHAR(100),
  area VARCHAR(50),
  location VARCHAR(150),
  status VARCHAR(50)
);

INSERT INTO certificates (certificate_number, land_type, area, location, status) 
VALUES ('CT-34.12.010.12345', 'Freehold Title (SHM)', '1,250 m2', 'Sleman, Yogyakarta', 'Verified');