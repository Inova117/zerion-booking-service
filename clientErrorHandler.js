/**
 * Función para obtener horarios disponibles con manejo de errores y fallback automático
 * 
 * Para usar en el frontend:
 * import { getAvailableSlotsWithFallback } from './clientErrorHandler.js';
 * 
 * // Luego usar así:
 * const slots = await getAvailableSlotsWithFallback('2025-04-23');
 */

/**
 * Obtiene los horarios disponibles para una fecha, con manejo automático de errores
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} - Lista de horarios disponibles
 */
export async function getAvailableSlotsWithFallback(date, options = {}) {
  const {
    baseUrl = 'https://zerion-booking-service-production.up.railway.app',
    retryCount = 1,
    useFallback = true,
    logErrors = true
  } = options;
  
  // URL principal para obtener horarios
  const mainUrl = `${baseUrl}/available-slots?date=${date}`;
  
  // URL de respaldo en caso de error
  const fallbackUrl = `${baseUrl}/available-slots-fallback?date=${date}`;
  
  try {
    // Intentar obtener los horarios desde el endpoint principal
    console.log(`📆 Consultando horarios disponibles para ${date} en: ${mainUrl}`);
    const response = await fetch(mainUrl);
    
    console.log('📡 Respuesta recibida del servidor de horarios');
    
    // Si hay error, lanzarlo para que lo maneje el catch
    if (!response.ok) {
      console.log(`❌ Error HTTP: ${response.status}`);
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Procesar la respuesta exitosa
    const data = await response.json();
    const slots = data.available || data.slots || data.data || [];
    console.log(`✅ Horarios encontrados: ${slots.length}`);
    
    return slots;
  } catch (error) {
    if (logErrors) {
      console.error(`❌ Error al obtener horarios: ${error.message}`);
    }
    
    // Si hay intentos restantes, volver a intentar
    if (retryCount > 0) {
      console.log(`🔄 Reintentando consulta (${retryCount} intentos restantes)...`);
      return getAvailableSlotsWithFallback(date, {
        ...options,
        retryCount: retryCount - 1
      });
    }
    
    // Si se permite usar el fallback, intentar con él
    if (useFallback) {
      try {
        console.log(`⚠️ Usando endpoint de fallback: ${fallbackUrl}`);
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback también falló con HTTP ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        const fallbackSlots = fallbackData.available || fallbackData.slots || fallbackData.data || [];
        console.log(`ℹ️ Usando ${fallbackSlots.length} horarios de fallback`);
        
        return fallbackSlots;
      } catch (fallbackError) {
        if (logErrors) {
          console.error(`❌ Error también en fallback: ${fallbackError.message}`);
        }
      }
    }
    
    // Si todo falla, devolver array vacío
    console.warn('❗ No se pudieron obtener horarios. Devolviendo lista vacía.');
    return [];
  }
} 