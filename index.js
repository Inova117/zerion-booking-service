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
  const origin = req.headers.origin || 'No origin provided';
  
  res.json({
    message: 'CORS está configurado correctamente si puedes ver este mensaje',
    origin: origin,
    corsEnabled: true,
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString(),
    endpoints: {
      availableSlots: {
        GET: `${req.protocol}://${req.get('host')}/available-slots?date=YYYY-MM-DD`,
        POST: `${req.protocol}://${req.get('host')}/available-slots (con body: {"date": "YYYY-MM-DD"})`,
        info: "Si no se proporciona fecha, se usará la fecha actual",
        response: {
          slots: ["09:00", "10:00", "11:00", "..."]  // Ejemplo del formato de respuesta actualizado
        }
      },
      bookSlot: {
        POST: `${req.protocol}://${req.get('host')}/book-slot`,
        body: {
          date: "YYYY-MM-DD",
          time: "HH:MM",
          name: "Nombre del cliente",
          email: "email@example.com",
          service: "Nombre del servicio"
        }
      }
    }
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
  
  // Si no hay parámetro date, usar la fecha actual
  if ((req.method === 'GET' && !req.query.date)) {
    console.log('Petición GET sin fecha: usando la fecha actual como valor predeterminado');
    // Formatear la fecha actual como YYYY-MM-DD
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    req.query.date = formattedDate;
  } else if ((req.method === 'POST' && (!req.body || !req.body.date))) {
    console.log('Petición POST sin fecha: usando la fecha actual como valor predeterminado');
    // Formatear la fecha actual como YYYY-MM-DD
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!req.body) req.body = {};
    req.body.date = formattedDate;
  }
  
  // Continuar con las rutas específicas
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
    
    try {
      const slots = await getAvailableSlots(date);
      res.json({ slots: slots });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/available-slots', setSpecificCORS, async (req, res) => {
    const { date } = req.query;
    
    try {
      const slots = await getAvailableSlots(date);
      res.json({ slots: slots });
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
