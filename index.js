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

// Funciones para manejar las reservas persistentes
function getReservas() {
  try {
    if (!fs.existsSync('reservas.json')) {
      fs.writeFileSync('reservas.json', JSON.stringify([]));
      return [];
    }
    const reservasData = fs.readFileSync('reservas.json', 'utf8');
    return JSON.parse(reservasData);
  } catch (error) {
    console.error('Error al leer reservas.json:', error);
    return [];
  }
}

function guardarReserva(reserva) {
  try {
    const reservas = getReservas();
    
    // Agregar la nueva reserva
    reservas.push({
      fecha: reserva.date,
      hora: reserva.time,
      email: reserva.email,
      nombre: reserva.name || 'Sin nombre',
      servicio: reserva.service || 'Sin especificar',
      createdAt: new Date().toISOString()
    });
    
    // Guardar el archivo actualizado
    fs.writeFileSync('reservas.json', JSON.stringify(reservas, null, 2));
    console.log(`💾 Reserva guardada en reservas.json: ${reserva.date} ${reserva.time}`);
    return true;
  } catch (error) {
    console.error('Error al guardar en reservas.json:', error);
    return false;
  }
}

function getHorariosReservados(fecha) {
  try {
    const reservas = getReservas();
    const horariosReservados = reservas
      .filter(r => r.fecha === fecha)
      .map(r => r.hora);
    
    console.log(`🔍 Para la fecha ${fecha} hay ${horariosReservados.length} horarios ya reservados:`, horariosReservados);
    return horariosReservados;
  } catch (error) {
    console.error('Error al obtener horarios reservados:', error);
    return [];
  }
}

function filtrarHorariosDisponibles(fecha, horarios) {
  const horariosReservados = getHorariosReservados(fecha);
  const horariosDisponibles = horarios.filter(hora => !horariosReservados.includes(hora));
  
  console.log(`📅 Después de filtrar horarios reservados para ${fecha}:`);
  console.log(`- Total horarios originales: ${horarios.length}`);
  console.log(`- Horarios reservados: ${horariosReservados.length}`);
  console.log(`- Horarios disponibles: ${horariosDisponibles.length}`);
  
  return horariosDisponibles;
}

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
  res.send(
    `<!DOCTYPE html>
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
               const response = \`\${baseUrl}/format-test?format=\${format}\`);
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
             const response = \`\${baseUrl}/available-slots?date=2023-12-31\`);
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
   `
  );
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
      // Validar que la fecha no sea en el pasado
      const requestedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (requestedDate < today) {
        return res.status(400).json({ error: "Fecha en el pasado no permitida" });
      }
      
      // Obtener los slots disponibles desde el calendar service
      const slotsFromCalendar = await getAvailableSlots(date);
      
      // Filtrar los slots que ya están reservados localmente
      const slots = filtrarHorariosDisponibles(date, slotsFromCalendar);
      
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
      // Validar que la fecha no sea en el pasado
      const requestedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (requestedDate < today) {
        return res.status(400).json({ error: "Fecha en el pasado no permitida" });
      }
      
      // Obtener los slots disponibles desde el calendar service
      const slotsFromCalendar = await getAvailableSlots(date);
      
      // Filtrar los slots que ya están reservados localmente
      const slots = filtrarHorariosDisponibles(date, slotsFromCalendar);
      
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
    console.log("📥 Petición recibida en /book-slot:");
    console.log("Body:", req.body);

    const { date, time, name, email, service } = req.body;

    if (!date || !time || !name || !email) {
      console.error("❌ Faltan campos para crear el evento");
      return res.status(400).json({ success: false, message: "Faltan datos para agendar la cita" });
    }

    console.log("📆 Creando cita con:", { date, time, name, email, service });

    try {
      const result = await bookSlot({ date, time, name, email, service });
      console.log("✅ Evento creado:", result);
      
      // Guardar la reserva en el archivo local
      guardarReserva(req.body);
      
      res.json({ 
        success: true, 
        status: "confirmed", 
        event_link: result?.event_link || null 
      });
    } catch (err) {
      console.error("❌ Error al agendar:", err);
      console.error("❌ Error detallado:", err.message);
      console.error("❌ Stack trace:", err.stack);
      res.status(500).json({ success: false, message: "No se pudo agendar la cita" });
    }
  });

  // Endpoint para ver las reservas guardadas (con protección básica)
  app.get('/admin/reservas', async (req, res) => {
    // Una protección básica con una clave en la URL
    const { key } = req.query;
    if (key !== 'zerion2024') {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    try {
      const reservas = getReservas();
      
      // HTML básico para mostrar las reservas
      res.send(`<!DOCTYPE html>
         <html>
         <head>
           <title>Administrador de Reservas</title>
           <style>
             body { font-family: Arial, sans-serif; margin: 20px; }
             h1 { color: #333; }
             table { border-collapse: collapse; width: 100%; }
             th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
             tr:nth-child(even) { background-color: #f2f2f2; }
             .actions { display: flex; gap: 10px; }
             button { cursor: pointer; padding: 5px 10px; }
           </style>
         </head>
         <body>
           <h1>Administrador de Reservas</h1>
           <p>Total de reservas: ${reservas.length}</p>
           
           <table>
             <tr>
               <th>Fecha</th>
               <th>Hora</th>
               <th>Email</th>
               <th>Nombre</th>
               <th>Servicio</th>
               <th>Creado</th>
             </tr>
             ${reservas.map((r, i) => `
               <tr>
                 <td>${r.fecha}</td>
                 <td>${r.hora}</td>
                 <td>${r.email}</td>
                 <td>${r.nombre}</td>
                 <td>${r.servicio}</td>
                 <td>${r.createdAt}</td>
               </tr>
             `).join('')}
           </table>
           
           <hr />
           <h2>Respaldo</h2>
           <pre>${JSON.stringify(reservas, null, 2)}</pre>
         </body>
         </html>`
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Endpoint simplificado solo para pruebas del frontend
  app.post('/test-book-slot', setSpecificCORS, (req, res) => {
    console.log("📥 Petición de prueba recibida en /test-book-slot:");
    console.log(req.body); // Verás el contenido del evento

    // Solo para test, responde algo simple
    res.status(200).json({ 
      message: "Reserva recibida correctamente", 
      success: true,
      data: req.body
    });
  });

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
