import fs from 'fs';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Reconstruir los archivos SI NO EXISTEN
function restoreFile(filename, encoded) {
  if (!fs.existsSync(filename) && process.env[encoded]) {
    fs.writeFileSync(filename, Buffer.from(process.env[encoded], 'base64').toString());
  }
}

// 🔐 Reconstruir antes de importar calendarService
restoreFile('credentials.json', 'GOOGLE_CREDENTIALS_B64');
restoreFile('token.json', 'GOOGLE_TOKEN_B64');

// ✅ Solo después de reconstruir los archivos, importamos calendarService
import { getAvailableSlots, bookSlot } from './calendarService.js';

const app = express();
app.use(express.json());

app.get('/available-slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    const slots = await getAvailableSlots(date);
    res.json({ available: slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/book-slot', async (req, res) => {
  try {
    const result = await bookSlot(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

