import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Registra un nuevo lead en SendFox
 * @param {Object} leadData - Datos del lead
 * @param {string} leadData.name - Nombre del lead
 * @param {string} leadData.email - Email del lead
 * @returns {Promise<Object>} - Respuesta de la API de SendFox
 */
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
    
    // Validar que firstName no sea undefined
    if (!firstName) {
      console.warn('⚠️ No se pudo extraer el primer nombre correctamente');
      firstName = name; // Usar el nombre completo como fallback
    }
    
    // Validar que email no sea undefined o vacío
    if (!email) {
      console.error('❌ Email no proporcionado para el lead de SendFox');
      throw new Error('Email es requerido para registrar un lead en SendFox');
    }
    
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

export default {
  registrarLeadEnSendFox
};
