const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '3RDsmt,Expo',
  database: 'LanCert_db',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database successfully!');
});

const KEY = 'x7K#9mP!q2L$v4Z';

app.get('/api/certificates/:number', (req, res) => {
  const certNumber = req.params.number;
  const query = 'SELECT * FROM certificates WHERE certificate_number = ?';

  db.query(query, [certNumber], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'Certificate not found' });
    }
  });
});

app.get('/api/generate-qr/:number', (req, res) => {
  const certNumber = req.params.number;
  const token = jwt.sign({ certificate_number: certNumber }, KEY);
  res.json({
    certificate_number: certNumber,
    secure_qr_payload: token,
  });
});

app.get('/api/verify-token/:token', (req, res) => {
  const token = req.params.token;
  try {
    const decoded = jwt.verify(token, KEY);
    const certNumber = decoded.certificate_number;
  
    const query = 'SELECT * FROM certificates WHERE certificate_number = ?';
    db.query(query, [certNumber], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database query failed' });
      }

      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ error: 'Certificate not found in registry' });
      }
    });

  } catch (err) {
    console.error('Invalid token signature:', err.message);
    return res.status(403).json({ error: 'Invalid or forged QR code signature!' });
  }
});

app.listen(3000, () => {
  console.log('Backend server running on http://localhost:3000');
});