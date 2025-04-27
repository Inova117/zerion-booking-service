import { TOOL_SCHEMAS, getTodayDate } from './tools.js';

/**
 * Este archivo muestra cómo integrar las herramientas con un asistente.
 * Es solo un ejemplo y debe adaptarse según la plataforma o framework de asistente que estés utilizando.
 */

// Mapa de funciones de herramientas disponibles
const TOOL_FUNCTIONS = {
  getTodayDate
};

/**
 * Ejecuta una herramienta solicitada por el asistente
 * @param {string} toolName - Nombre de la herramienta a ejecutar
 * @param {Object} params - Parámetros para la herramienta
 * @returns {Promise<any>} - Resultado de la ejecución de la herramienta
 */
export async function executeToolForAssistant(toolName, params = {}) {
  if (!TOOL_FUNCTIONS[toolName]) {
    throw new Error(`La herramienta "${toolName}" no está disponible`);
  }
  
  try {
    // Ejecutar la función de la herramienta con los parámetros proporcionados
    const result = await TOOL_FUNCTIONS[toolName](params);
    console.log(`✅ Herramienta ${toolName} ejecutada con éxito:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Error al ejecutar la herramienta ${toolName}:`, error);
    throw error;
  }
}

/**
 * Ejemplo de uso:
 * 
 * // 1. Configuración del asistente con las herramientas disponibles
 * const assistantConfig = {
 *   tools: TOOL_SCHEMAS
 * };
 * 
 * // 2. Cuando el asistente solicita ejecutar una herramienta
 * async function handleAssistantToolCall(toolCall) {
 *   const { name, arguments: args } = toolCall;
 *   return await executeToolForAssistant(name, args);
 * }
 */

// Ejemplo simple de uso para probar la herramienta
if (process.argv[2] === '--test') {
  (async () => {
    try {
      const result = await getTodayDate();
      console.log('Resultado de getTodayDate:', result);
      
      // Usar la fecha actual para consultar slots disponibles, no una fecha hardcodeada
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log(`📅 Obteniendo horarios disponibles para: ${formattedDate}`);
    } catch (error) {
      console.error('Error en la prueba:', error);
    }
  })();
} 