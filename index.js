import express from 'express';
import dotenv from 'dotenv';
import { getAvailableSlots, bookSlot } from './calendarService.js';

dotenv.config();

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
