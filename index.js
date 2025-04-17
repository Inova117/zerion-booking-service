import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Reconstruir archivos desde base64 si existen
if (process.env.GOOGLE_CREDENTIALS_B64 && process.env.GOOGLE_TOKEN_B64) {
  fs.writeFileSync('credentials.json', Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64').toString());
  fs.writeFileSync('token.json', Buffer.from(process.env.GOOGLE_TOKEN_B64, 'base64').toString());
}


import express from 'express';
import { getAvailableSlots, bookSlot } from './calendarService.js';

const app = express();
app.use(express.json());

// Ruta para obtener horarios disponibles
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

// Ruta para reservar un horario
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
