# Informe Técnico - Zerion Booking Service

## Resumen Ejecutivo

Zerion Booking Service es un microservicio backend desarrollado para gestionar el sistema de reservas de citas de Zerion Studio. Este servicio proporciona una API RESTful que permite consultar disponibilidad de horarios, programar citas y gestionar la integración con Google Calendar y SendFox. Está construido con tecnologías modernas como Express.js, Node.js y utiliza almacenamiento local para persistencia de datos.

## Arquitectura Técnica

### Stack Tecnológico

- **Runtime**: Node.js
- **Framework**: Express.js
- **Autenticación**: OAuth 2.0 (Google API)
- **Almacenamiento**: Archivos JSON locales
- **Integraciones**: 
  - Google Calendar API
  - SendFox API
- **Despliegue**: Railway

### Estructura del Proyecto

```
zerion-booking-service/
├── services/              # Servicios externos
│   └── sendfoxService.js  # Integración con SendFox
├── auth.cjs               # Autenticación para Google Calendar
├── index.js               # Servidor Express principal
├── package.json           # Dependencias y scripts
├── .env                   # Variables de entorno
├── reservas.json          # Almacenamiento local de reservas
├── credentials.json       # Credenciales de Google (generado)
└── token.json             # Token de autenticación (generado)
```

## Componentes Principales

### Servidor Express

El núcleo del servicio es un servidor Express que expone varios endpoints para la gestión de reservas. El servidor implementa middleware para CORS, logging y manejo de errores.

```javascript
const app = express();
app.use(express.json());
app.use(cors());
```

### Sistema de Autenticación

La autenticación con Google Calendar se implementa utilizando el flujo OAuth 2.0:

```javascript
// Restaurar los archivos de credenciales si no existen
function restoreFile(filename, encoded) {
  if (!fs.existsSync(filename) && process.env[encoded]) {
    fs.writeFileSync(filename, Buffer.from(process.env[encoded], 'base64').toString());
  }
}

restoreFile('credentials.json', 'GOOGLE_CREDENTIALS_B64');
restoreFile('token.json', 'GOOGLE_TOKEN_B64');
```

### Persistencia de Datos

El sistema utiliza almacenamiento local en archivos JSON para persistir datos:

- **reservas.json**: Almacena todas las reservas realizadas
- **credentials.json**: Almacena las credenciales de Google API
- **token.json**: Almacena el token de autenticación de Google

```javascript
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
```

### Integración con Google Calendar

El servicio se integra con Google Calendar para:

1. Consultar eventos existentes
2. Verificar disponibilidad de horarios
3. Crear nuevos eventos (citas)

La integración utiliza la biblioteca oficial de Google API para Node.js.

### Integración con SendFox

El servicio se integra con SendFox para registrar leads automáticamente cuando se programa una cita:

```javascript
export async function registrarLeadEnSendFox(leadData) {
  try {
    const { name, email } = leadData;
    
    // Realizar la petición a SendFox
    const response = await axios.post(
      'https://api.sendfox.com/contacts',
      {
        email,
        first_name: firstName,
        lists: ['578013'] // ID de la lista en SendFox
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SENDFOX_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`⚠️ Error al enviar lead a SendFox: ${error.message}`);
    throw error;
  }
}
```

## API Endpoints

### Consulta de Disponibilidad

**Endpoint**: `GET /available-slots/:date`

Devuelve los horarios disponibles para una fecha específica:

1. Consulta eventos existentes en Google Calendar
2. Filtra horarios ya reservados localmente
3. Devuelve lista de slots disponibles

### Reserva de Horarios

**Endpoint**: `POST /book-slot`

Permite reservar un horario específico:

1. Valida los datos de la reserva
2. Crea un evento en Google Calendar
3. Registra la reserva localmente
4. Registra el lead en SendFox
5. Devuelve confirmación

### Fecha Actual

**Endpoint**: `GET /today`

Devuelve la fecha actual del servidor, utilizado para sincronización.

### Endpoints de Diagnóstico

- **GET /format-test**: Prueba diferentes formatos de respuesta
- **GET /frontend-debug**: Herramienta de diagnóstico para el frontend
- **GET /cors-test**: Diagnóstico de problemas de CORS

## Configuración CORS

El servicio implementa una configuración robusta de CORS para permitir solicitudes desde dominios específicos:

```javascript
const allowedOrigins = ["https://zerionstudio.com", "http://localhost:8081"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  res.setHeader("Access-Control-Allow-Origin", origin || '*');
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, cache-control, Cache-Control, pragma");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
```

## Manejo de Errores

El servicio implementa un sistema robusto de manejo de errores:

1. Logging detallado para diagnóstico
2. Respuestas de error estructuradas
3. Fallbacks para casos de fallo en servicios externos

```javascript
// Middleware para capturar y formatear errores
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      status: err.status || 500
    }
  });
});
```

## Seguridad

- **Variables de Entorno**: Credenciales almacenadas en variables de entorno
- **Codificación Base64**: Tokens y credenciales codificados en base64
- **Validación de Entrada**: Sanitización de datos de usuario
- **Configuración CORS**: Restricción de orígenes permitidos

## Rendimiento

- **Logs Optimizados**: Sistema de logging que no afecta el rendimiento
- **Manejo Asíncrono**: Operaciones asíncronas para no bloquear el hilo principal
- **Respuestas Comprimidas**: Compresión de respuestas HTTP

## Conclusiones y Recomendaciones

Zerion Booking Service es un microservicio robusto que proporciona funcionalidades esenciales para el sistema de reservas. Para el futuro desarrollo, se recomienda:

1. Refactorizar a TypeScript para mejorar la tipificación y mantenibilidad
2. Implementar pruebas unitarias y de integración
3. Migrar de almacenamiento local a una base de datos como MongoDB o PostgreSQL
4. Implementar un sistema de caché para reducir llamadas a APIs externas
5. Desarrollar un panel de administración para gestionar reservas

---

*Documento generado el 7 de mayo de 2025*
