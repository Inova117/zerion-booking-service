import { getTodayDate } from './tools.js';

async function testGetTodayDate() {
  try {
    console.log('🧪 Probando la herramienta getTodayDate...');
    const result = await getTodayDate();
    console.log('✅ Resultado:', result);
    console.log('📅 Fecha obtenida:', result.today);
    return result;
  } catch (error) {
    console.error('❌ Error al probar getTodayDate:', error);
    throw error;
  }
}

// Ejecutar la prueba inmediatamente
(async () => {
  try {
    await testGetTodayDate();
    console.log('✨ Prueba completada con éxito');
  } catch (error) {
    console.error('💥 La prueba falló:', error);
    process.exit(1);
  }
})(); 