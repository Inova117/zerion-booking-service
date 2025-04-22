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

// Endpoint de debugging para probar diferentes formatos de respuesta
app.get('/format-test', (req, res) => {
  const slots = ["09:00", "10:00", "11:00", "12:00"];
  
  // Generamos varios formatos posibles para que el frontend pruebe
  const formats = {
    directArray: slots,
    withAvailableKey: { available: slots },
    withSlotsKey: { slots: slots },
    withDataKey: { data: slots },
    withResultsKey: { results: slots },
    multiFormat: {
      available: slots,
      slots: slots,
      data: slots,
      results: slots
    },
    emptyObject: {},
    nullValue: null,
    emptyArray: [],
    singleSlot: ["09:00"],
    stringValue: "09:00,10:00,11:00,12:00",
    booleanValue: true,
    withMetadata: {
      available: slots,
      metadata: {
        date: "2023-12-31",
        timezone: "UTC"
      }
    }
  };
  
  // Devolvemos el formato especificado o todos si no se especifica
  const format = req.query.format;
  if (format && formats[format]) {
    res.json(formats[format]);
  } else {
    res.json(formats);
  }
});

// Para probar con curl:
// curl -H "Origin: https://zerionstudio.com" https://zerion-booking-service-production.up.railway.app/format-test?format=directArray

// Endpoint para diagnóstico del frontend
app.get('/frontend-debug', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Frontend Debug</title>
      <script>
        // Función para probar todos los formatos
        async function testAllFormats() {
          const baseUrl = "${req.protocol}://${req.get('host')}";
          const results = document.getElementById('results');
          results.innerHTML = '';
          
          // Lista de formatos para probar
          const formats = [
            'directArray',
            'withAvailableKey',
            'withSlotsKey',
            'withDataKey',
            'withResultsKey',
            'multiFormat',
            'emptyObject',
            'nullValue',
            'emptyArray',
            'singleSlot',
            'stringValue',
            'booleanValue',
            'withMetadata'
          ];
          
          // Probamos cada formato
          for (const format of formats) {
            try {
              const response = await fetch(\`\${baseUrl}/format-test?format=\${format}\`);
              const data = await response.json();
              
              // Ahora intentamos procesar estos datos como lo haría el frontend
              let result = '';
              try {
                // Simulamos el procesamiento del frontend
                if (Array.isArray(data)) {
                  result = "✅ OK - Es un array directo con " + data.length + " elementos";
                } else if (data && typeof data === 'object') {
                  if (data.available && Array.isArray(data.available)) {
                    result = "✅ OK - Tiene propiedad 'available' con " + data.available.length + " elementos";
                  } else if (data.slots && Array.isArray(data.slots)) {
                    result = "✅ OK - Tiene propiedad 'slots' con " + data.slots.length + " elementos";
                  } else if (data.data && Array.isArray(data.data)) {
                    result = "✅ OK - Tiene propiedad 'data' con " + data.data.length + " elementos";
                  } else if (data.results && Array.isArray(data.results)) {
                    result = "✅ OK - Tiene propiedad 'results' con " + data.results.length + " elementos";
                  } else {
                    result = "❌ ERROR - No tiene una propiedad reconocible con un array";
                  }
                } else {
                  result = "❌ ERROR - No es un array ni un objeto";
                }
              } catch (procError) {
                result = "❌ ERROR al procesar: " + procError.message;
              }
              
              results.innerHTML += \`
                <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc;">
                  <h3>Formato: \${format}</h3>
                  <p><strong>Resultado:</strong> \${result}</p>
                  <p><strong>Datos:</strong></p>
                  <pre>\${JSON.stringify(data, null, 2)}</pre>
                </div>
              \`;
            } catch (error) {
              results.innerHTML += \`
                <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #f00; background: #fee;">
                  <h3>Formato: \${format}</h3>
                  <p><strong>Error:</strong> \${error.message}</p>
                </div>
              \`;
            }
          }
          
          // Ahora probemos la API real
          try {
            const response = await fetch(\`\${baseUrl}/available-slots?date=2023-12-31\`);
            const data = await response.json();
            
            results.innerHTML += \`
              <div style="margin-bottom: 20px; padding: 10px; border: 2px solid #00f; background: #eef;">
                <h3>API Real: /available-slots</h3>
                <p><strong>Datos:</strong></p>
                <pre>\${JSON.stringify(data, null, 2)}</pre>
              </div>
            \`;
          } catch (error) {
            results.innerHTML += \`
              <div style="margin-bottom: 20px; padding: 10px; border: 2px solid #f00; background: #fee;">
                <h3>API Real: /available-slots</h3>
                <p><strong>Error:</strong> \${error.message}</p>
              </div>
            \`;
          }
        }
      </script>
    </head>
    <body>
      <h1>Diagnóstico del Frontend</h1>
      <p>Esta herramienta te ayudará a diagnosticar problemas con el formato de respuesta de la API.</p>
      
      <button onclick="testAllFormats()">Probar Todos los Formatos</button>
      
      <div id="results" style="margin-top: 20px;"></div>
    </body>
    </html>
  `);
});

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
        response: ["09:00", "10:00", "11:00", "..."]  // Ahora es un array directo
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
  app.get('/available-slots', setSpecificCORS, async (req, res) => {
    const { date } = req.query;
    
    try {
      const slots = await getAvailableSlots(date);
      // Respuesta completa con múltiples formatos para compatibilidad
      res.json({
        // Versión original
        available: slots,
        // Nuevas versiones para compatibilidad
        slots: slots,
        // El array también está disponible en la raíz
        data: slots,
        // Información de diagnóstico
        apiVersion: '1.1',
        timestamp: new Date().toISOString(),
        date: date
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/available-slots', setSpecificCORS, async (req, res) => {
    const { date } = req.body;
    
    try {
      const slots = await getAvailableSlots(date);
      // Respuesta completa con múltiples formatos para compatibilidad
      res.json({
        // Versión original
        available: slots,
        // Nuevas versiones para compatibilidad
        slots: slots,
        // El array también está disponible en la raíz
        data: slots,
        // Información de diagnóstico
        apiVersion: '1.1',
        timestamp: new Date().toISOString(),
        date: date
      });
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
