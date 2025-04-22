// Script de diagnóstico completo para problemas CORS
const { execSync } = require('child_process');
const https = require('https');

const API_URL = 'https://zerion-booking-service-production.up.railway.app';
const ENDPOINT = '/available-slots?date=2025-04-22';

// Función para realizar una petición HTTP con detalles específicos
function makeRequest(origin, method = 'GET') {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Realizando petición ${method} desde origen: ${origin || 'Sin origen'}`);
    
    const options = {
      method: method,
      headers: {}
    };
    
    if (origin) {
      options.headers['Origin'] = origin;
    }
    
    // Para peticiones OPTIONS (preflight)
    if (method === 'OPTIONS') {
      options.headers['Access-Control-Request-Method'] = 'GET';
      options.headers['Access-Control-Request-Headers'] = 'Content-Type, Authorization';
    }
    
    const req = https.request(`${API_URL}${ENDPOINT}`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        console.log('✅ Headers de respuesta:');
        console.log(JSON.stringify(res.headers, null, 2));
        
        if (data && data.length > 0) {
          try {
            const jsonData = JSON.parse(data);
            console.log('✅ Datos recibidos (resumidos):', 
              jsonData.available ? `${jsonData.available.length} slots disponibles` : 'No hay datos disponibles');
          } catch (e) {
            console.log('✅ Datos recibidos (no JSON):', data.substring(0, 100) + '...');
          }
        }
        
        // Verificar headers clave para CORS
        const corsHeaders = [
          'access-control-allow-origin',
          'access-control-allow-methods',
          'access-control-allow-headers',
          'access-control-allow-credentials'
        ];
        
        const missingHeaders = corsHeaders.filter(header => !res.headers[header]);
        
        if (missingHeaders.length > 0) {
          console.log('⚠️ Headers CORS faltantes:', missingHeaders.join(', '));
        }
        
        // Verificar que el origen correcto se devuelve
        if (origin && res.headers['access-control-allow-origin'] !== origin) {
          console.log('⚠️ El origen devuelto no coincide:', res.headers['access-control-allow-origin'], 'vs esperado', origin);
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Ejecutar pruebas secuenciales
async function runTests() {
  console.log('🚀 Iniciando diagnóstico de problemas CORS');
  console.log('===========================================');
  
  try {
    // 1. Probar desde origen permitido
    await makeRequest('https://zerionstudio.com');
    
    // 2. Probar preflight OPTIONS desde origen permitido
    await makeRequest('https://zerionstudio.com', 'OPTIONS');
    
    // 3. Probar desde origen no permitido
    await makeRequest('https://example.com');
    
    // 4. Probar sin origen (como curl directo)
    await makeRequest(null);
    
    console.log('\n✅ Diagnóstico completo');
    console.log('----------------------');
    console.log('Si sigues teniendo problemas, asegúrate de:');
    console.log('1. Verificar los logs del servidor en Railway para ver los headers de entrada y salida');
    console.log('2. Comprobar que el frontend está haciendo la petición exactamente desde https://zerionstudio.com');
    console.log('3. Verificar que no haya múltiples middlewares CORS en conflicto');
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar todos los tests
runTests(); 