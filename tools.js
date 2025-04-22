import axios from 'axios';

/**
 * Herramientas disponibles para el asistente
 */

// Esquema de herramientas disponibles para el asistente
export const TOOL_SCHEMAS = [
  {
    "name": "getTodayDate",
    "description": "Devuelve la fecha actual en formato YYYY-MM-DD.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  }
];

/**
 * Obtiene la fecha actual del servidor
 * @returns {Promise<Object>} Objeto con la fecha actual en formato { today: "YYYY-MM-DD" }
 */
export async function getTodayDate() {
  try {
    // URL del endpoint, ajusta según tu entorno
    const serverUrl = process.env.SERVER_URL || 'https://zerion-booking-service-production.up.railway.app';
    const response = await axios.get(`${serverUrl}/today`);
    
    console.log('✅ Fecha obtenida del servidor:', response.data);
    return response.data; // { today: "YYYY-MM-DD" }
  } catch (error) {
    console.error('❌ Error al obtener la fecha:', error.message);
    
    // Si falla, devolver fecha del sistema local como respaldo
    const today = new Date();
    const formatted = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return { today: formatted };
  }
} 