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

// ✅ Configuración robusta de CORS - Aplicada a TODAS las respuestas, incluso errores
const allowedOrigins = ["https://zerionstudio.com", "http://localhost:8081"];

// Middleware de CORS mejorado para asegurar que se aplica incluso en errores
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Aplicar cabeceras CORS incluso si el origen no está en la lista
  // Esto es útil para entornos de desarrollo y diagnóstico
  res.setHeader("Access-Control-Allow-Origin", origin || '*');
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
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
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Capturar los headers que se enviarán
  const originalSend = res.send;
  res.send = function(...args) {
    console.log('Respuesta enviada con headers:', this.getHeaders());
    return originalSend.apply(this, args);
  };
  
  next();
});

const PORT = process.env.PORT || 3000;

// Endpoint específico para diagnóstico de CORS
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS está configurado correctamente si puedes ver este mensaje',
    origin: req.headers.origin || 'No origin provided',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para manejar el caso específico de error (petición sin fecha)
app.all('/available-slots', (req, res, next) => {
  // Esta ruta captura todas las peticiones a /available-slots antes de llegar a las rutas específicas
  // y asegura que los headers CORS estén siempre presentes, incluso para respuestas de error
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  // Si no hay parámetro date, responder con error pero con CORS configurado
  if ((req.method === 'GET' && !req.query.date) || (req.method === 'POST' && (!req.body || !req.body.date))) {
    console.log('Petición sin fecha interceptada y respondida con CORS');
    return res.status(400).json({ 
      error: 'Date is required', 
      example: req.method === 'GET' ? '/available-slots?date=2023-12-31' : 'POST body should include {date: "2023-12-31"}'
    });
  }
  
  // Si llegamos aquí, continuar con las rutas específicas
  next();
});

const startServer = async () => {
  // ✅ Importamos calendarService dinámicamente ahora que los archivos ya existen
  const { getAvailableSlots, bookSlot } = await import('./calendarService.js');

  // Establecer headers CORS específicos para estas rutas (redundante, pero asegura que estén presentes)
  const setSpecificCORS = (req, res, next) => {
    const origin = req.headers.origin;
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  };

  // Rutas para available-slots con CORS específico
  app.post('/available-slots', setSpecificCORS, async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    try {
      const slots = await getAvailableSlots(date);
      res.json({ available: slots });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/available-slots', setSpecificCORS, async (req, res) => {
    const { date } = req.query;
    if (!date) {
      console.log('Falta el parámetro date en la solicitud GET');
      return res.status(400).json({ error: 'Date is required', example: '/available-slots?date=2023-12-31' });
    }

    try {
      const slots = await getAvailableSlots(date);
      res.json({ available: slots });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/book-slot', setSpecificCORS, async (req, res) => {
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
