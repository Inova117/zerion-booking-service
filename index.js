import fs from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

// ✅ Restaurar los archivos si no existen
function restoreFile(filename, encoded) {
  if (!fs.existsSync(filename) && process.env[encoded]) {
    fs.writeFileSync(filename, Buffer.from(process.env[encoded], 'base64').toString());
  }
}

restoreFile('credentials.json', 'GOOGLE_CREDENTIALS_B64');
restoreFile('token.json', 'GOOGLE_TOKEN_B64');

// ✅ Inicializar express y rutas después de que los archivos existan
const app = express();
app.use(express.json());

// ✅ Configuración robusta de CORS
const allowedOrigins = ["https://zerionstudio.com", "http://localhost:8081"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Permitir respuesta inmediata para preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Middleware para diagnosticar problemas de CORS
app.use((req, res, next) => {
  console.log('Petición recibida:');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // ✅ Importamos calendarService dinámicamente ahora que los archivos ya existen
  const { getAvailableSlots, bookSlot } = await import('./calendarService.js');

  app.post('/available-slots', async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    try {
      const slots = await getAvailableSlots(date);
      res.json({ available: slots });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

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

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
