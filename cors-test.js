// Script para probar CORS desde el dominio permitido
const testCORS = async () => {
  try {
    console.log('🧪 Probando petición a la API con origen: https://zerionstudio.com');
    
    const response = await fetch('https://zerion-booking-service-production.up.railway.app/available-slots?date=2025-04-22', {
      method: 'GET',
      headers: {
        'Origin': 'https://zerionstudio.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    console.log('✅ Headers de respuesta:');
    response.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });
    
    const data = await response.json();
    console.log('✅ Datos recibidos:', data);
    
    return { success: true, data, headers: Object.fromEntries([...response.headers.entries()]) };
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    return { success: false, error: error.message };
  }
};

// Ejecutar el test
testCORS().then(result => {
  console.log('Resultado final:', result);
});

// Para ejecutar este script: node cors-test.js 