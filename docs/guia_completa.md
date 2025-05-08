# Guía Completa de Zerion Booking Service

## Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [API Endpoints](#api-endpoints)
6. [Integración con Google Calendar](#integración-con-google-calendar)
7. [Integración con SendFox](#integración-con-sendfox)
8. [Sistema de Persistencia](#sistema-de-persistencia)
9. [Configuración de CORS](#configuración-de-cors)
10. [Manejo de Errores](#manejo-de-errores)
11. [Despliegue](#despliegue)
12. [Mantenimiento](#mantenimiento)
13. [Solución de Problemas](#solución-de-problemas)

## Introducción

Zerion Booking Service es un microservicio backend desarrollado para gestionar el sistema de reservas de citas de Zerion Studio. Este servicio proporciona una API RESTful que permite a los usuarios consultar disponibilidad de horarios, programar citas y gestionar la integración con servicios externos como Google Calendar y SendFox.

### Propósito

El propósito principal de Zerion Booking Service es proporcionar una capa de backend robusta y eficiente para el sistema de reservas, permitiendo:

- Consultar horarios disponibles en un calendario compartido
- Programar citas automáticamente
- Registrar leads en el sistema de marketing por email
- Persistir datos de reservas para análisis y seguimiento

### Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución para JavaScript
- **Express.js**: Framework para crear APIs RESTful
- **Google Calendar API**: Para gestión de eventos y citas
- **SendFox API**: Para registro automático de leads
- **JSON Storage**: Para persistencia local de datos

## Arquitectura del Sistema

Zerion Booking Service sigue una arquitectura de microservicio REST, actuando como intermediario entre el frontend de Zerion Studio y servicios externos como Google Calendar y SendFox.

### Diagrama de Arquitectura

```
+-------------------+      +----------------------+      +------------------+
|                   |      |                      |      |                  |
|  Zerion Frontend  +----->+  Zerion Booking Svc  +----->+  Google Calendar |
|                   |      |                      |      |                  |
+-------------------+      +----------------------+      +------------------+
                                     |
                                     |
                                     v
                           +------------------+
                           |                  |
                           |     SendFox      |
                           |                  |
                           +------------------+
```

### Flujo de Datos

1. El frontend solicita horarios disponibles para una fecha específica
2. El servicio consulta eventos existentes en Google Calendar
3. El servicio filtra horarios ya reservados localmente
4. El servicio devuelve slots disponibles al frontend
5. El usuario selecciona un horario y proporciona sus datos
6. El servicio crea un evento en Google Calendar
7. El servicio registra el lead en SendFox
8. El servicio guarda la reserva localmente para seguimiento

## Instalación y Configuración

### Requisitos Previos

- Node.js v16.x o superior
- Cuenta de Google con acceso a Google Calendar API
- Cuenta de SendFox con API Key
- Variables de entorno configuradas

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone <repository-url>
   cd zerion-booking-service
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Crear un archivo `.env` con las siguientes variables:
   ```
   PORT=3000
   SENDFOX_API_TOKEN=your_sendfox_api_token
   GOOGLE_CREDENTIALS_B64=base64_encoded_credentials_json
   GOOGLE_TOKEN_B64=base64_encoded_token_json
   ```

4. Iniciar el servidor:
   ```bash
   npm start
   ```

### Configuración de Google Calendar

Para configurar la integración con Google Calendar:

1. Crear un proyecto en Google Cloud Console
2. Habilitar Google Calendar API
3. Crear credenciales OAuth 2.0
4. Descargar el archivo `credentials.json`
5. Ejecutar el flujo de autenticación para generar `token.json`
6. Codificar ambos archivos en base64 y guardarlos en variables de entorno

## Estructura del Proyecto

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

### Archivos Principales

#### index.js

Archivo principal que configura el servidor Express, define los endpoints y middleware, e inicia el servidor.

#### auth.cjs

Módulo que gestiona la autenticación con Google Calendar API utilizando OAuth 2.0.

#### services/sendfoxService.js

Servicio que gestiona la integración con SendFox para el registro automático de leads.

## API Endpoints

### GET /available-slots/:date

Devuelve los horarios disponibles para una fecha específica.

**Parámetros:**
- `date`: Fecha en formato YYYY-MM-DD

**Respuesta:**
```json
{
  "available": [
    "09:00",
    "10:00",
    "11:00",
    "15:00",
    "16:00"
  ]
}
```

**Ejemplo de uso:**
```bash
curl -X GET "https://zerion-booking-service-production.up.railway.app/available-slots/2025-05-10"
```

### POST /book-slot

Reserva un horario específico.

**Body:**
```json
{
  "date": "2025-05-10",
  "time": "10:00",
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "service": "Consultoría"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cita programada correctamente",
  "eventId": "abc123xyz"
}
```

**Ejemplo de uso:**
```bash
curl -X POST "https://zerion-booking-service-production.up.railway.app/book-slot" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-05-10","time":"10:00","name":"Juan Pérez","email":"juan@ejemplo.com","service":"Consultoría"}'
```

### GET /today

Devuelve la fecha actual del servidor.

**Respuesta:**
```json
{
  "date": "2025-05-07"
}
```

**Ejemplo de uso:**
```bash
curl -X GET "https://zerion-booking-service-production.up.railway.app/today"
```

### GET /format-test

Endpoint de diagnóstico que muestra diferentes formatos de respuesta.

**Parámetros (query):**
- `format`: Formato específico a probar (opcional)

**Respuesta:**
Varía según el formato solicitado.

**Ejemplo de uso:**
```bash
curl -X GET "https://zerion-booking-service-production.up.railway.app/format-test?format=directArray"
```

### GET /frontend-debug

Herramienta HTML para diagnóstico del frontend.

**Respuesta:**
Página HTML con herramientas de diagnóstico.

### GET /cors-test

Diagnóstico de problemas de CORS.

**Respuesta:**
Información detallada sobre la configuración CORS.

## Integración con Google Calendar

La integración con Google Calendar permite gestionar citas y eventos directamente desde la plataforma.

### Autenticación OAuth

La autenticación con Google Calendar utiliza el flujo OAuth 2.0:

```javascript
// Restaurar los archivos si no existen
function restoreFile(filename, encoded) {
  if (!fs.existsSync(filename) && process.env[encoded]) {
    fs.writeFileSync(filename, Buffer.from(process.env[encoded], 'base64').toString());
  }
}

restoreFile('credentials.json', 'GOOGLE_CREDENTIALS_B64');
restoreFile('token.json', 'GOOGLE_TOKEN_B64');
```

### Consulta de Disponibilidad

El proceso para consultar disponibilidad incluye:

1. Obtener eventos existentes en Google Calendar para la fecha solicitada
2. Filtrar horarios ocupados
3. Generar lista de slots disponibles
4. Filtrar slots ya reservados localmente

### Creación de Eventos

El proceso para crear un evento (cita) incluye:

1. Validar los datos de la reserva
2. Crear un objeto de evento con los datos proporcionados
3. Llamar a la API de Google Calendar para crear el evento
4. Guardar la referencia del evento en la reserva local

## Integración con SendFox

La integración con SendFox permite registrar leads automáticamente cuando se programa una cita.

### Configuración

La integración utiliza un token de API almacenado en variables de entorno:

```javascript
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
```

### Registro de Leads

La función `registrarLeadEnSendFox` gestiona el registro de leads:

```javascript
export async function registrarLeadEnSendFox(leadData) {
  try {
    const { name, email } = leadData;
    
    // Log inicial con información del lead
    console.log(`📤 Enviando lead a SendFox: ${name} - ${email}`);
    
    // Validar que name no sea undefined o vacío
    if (!name) {
      console.warn('⚠️ Nombre no proporcionado para el lead de SendFox');
      // Usar un valor por defecto
      name = 'Cliente';
    }
    
    // Extraer el primer nombre si se proporciona el nombre completo
    const firstName = name.split(' ')[0];
    
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
    
    // Log detallado con la respuesta
    console.log(`✅ Lead enviado a SendFox:`, JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    // Log detallado del error
    console.error(`⚠️ Error al enviar lead a SendFox: ${error.message}`);
    
    // Log adicional si hay detalles de respuesta del servidor
    if (error.response) {
      console.error('Detalles del error:', JSON.stringify(error.response.data));
    }
    
    throw error;
  }
}
```

## Sistema de Persistencia

El sistema utiliza almacenamiento local en archivos JSON para persistir datos.

### Reservas

Las reservas se almacenan en `reservas.json`:

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
```

### Credenciales y Tokens

Los archivos `credentials.json` y `token.json` se utilizan para la autenticación con Google Calendar:

1. Se restauran desde variables de entorno codificadas en base64
2. Se utilizan para autenticar las solicitudes a la API de Google Calendar
3. Se regeneran automáticamente si no existen

## Configuración de CORS

El servicio implementa una configuración robusta de CORS para permitir solicitudes desde dominios específicos:

```javascript
const allowedOrigins = ["https://zerionstudio.com", "http://localhost:8081"];

// Middleware de CORS mejorado para asegurar que se aplica incluso en errores
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Aplicar cabeceras CORS incluso si el origen no está en la lista
  // Esto es útil para entornos de desarrollo y diagnóstico
  res.setHeader("Access-Control-Allow-Origin", origin || '*');
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, cache-control, Cache-Control, pragma");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  // Permitir respuesta inmediata para preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
```

## Manejo de Errores

El servicio implementa un sistema robusto de manejo de errores:

### Logging Detallado

```javascript
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
```

### Respuestas de Error Estructuradas

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

### Fallbacks para Servicios Externos

El sistema implementa fallbacks para casos de fallo en servicios externos:

1. Generación de slots de fallback si Google Calendar no responde
2. Manejo de errores en SendFox para continuar con la reserva
3. Validación local de fechas y horarios

## Despliegue

El servicio está desplegado en Railway, una plataforma de hosting para aplicaciones Node.js.

### Configuración de Railway

1. Crear una cuenta en Railway
2. Conectar el repositorio de GitHub
3. Configurar las variables de entorno:
   - `PORT`
   - `SENDFOX_API_TOKEN`
   - `GOOGLE_CREDENTIALS_B64`
   - `GOOGLE_TOKEN_B64`
4. Configurar el comando de inicio: `npm start`

### URL de Producción

El servicio está disponible en:
```
https://zerion-booking-service-production.up.railway.app
```

## Mantenimiento

### Actualización de Dependencias

Para mantener el servicio actualizado:

1. Revisar dependencias obsoletas:
   ```bash
   npm outdated
   ```

2. Actualizar dependencias:
   ```bash
   npm update
   ```

3. Actualizar dependencias con cambios importantes:
   ```bash
   npm install package@latest
   ```

### Monitoreo de Logs

Railway proporciona acceso a los logs del servicio:

1. Acceder al dashboard de Railway
2. Seleccionar el proyecto
3. Ver la sección de logs

### Backup de Datos

Para realizar backup de los datos:

1. Descargar `reservas.json` regularmente
2. Almacenar copias de seguridad de `credentials.json` y `token.json`
3. Mantener las variables de entorno actualizadas

## Solución de Problemas

### Problemas Comunes

#### Error de CORS

**Síntoma**: El frontend recibe errores de CORS al intentar conectar con el servicio.

**Solución**:
1. Verificar que el origen está permitido en la configuración de CORS
2. Utilizar el endpoint `/cors-test` para diagnóstico
3. Verificar que las cabeceras CORS se están aplicando correctamente

#### Error de Autenticación con Google Calendar

**Síntoma**: El servicio no puede conectar con Google Calendar.

**Solución**:
1. Verificar que `credentials.json` y `token.json` existen
2. Regenerar el token de acceso si ha expirado
3. Actualizar las variables de entorno `GOOGLE_CREDENTIALS_B64` y `GOOGLE_TOKEN_B64`

#### Error al Registrar Lead en SendFox

**Síntoma**: El servicio no puede registrar leads en SendFox.

**Solución**:
1. Verificar que `SENDFOX_API_TOKEN` es válido
2. Comprobar los logs para ver detalles del error
3. Verificar que la lista con ID '578013' existe en SendFox

### Herramientas de Diagnóstico

#### Endpoint /format-test

Permite probar diferentes formatos de respuesta para diagnosticar problemas de integración con el frontend.

#### Endpoint /frontend-debug

Proporciona una herramienta HTML para diagnosticar problemas de integración con el frontend.

#### Endpoint /cors-test

Diagnostica problemas de CORS mostrando información detallada sobre la configuración.

---

*Documento generado el 7 de mayo de 2025*
