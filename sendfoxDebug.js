import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function obtenerListasSendFox() {
  try {
    const res = await axios.get('https://api.sendfox.com/lists', {
      headers: {
        Authorization: `Bearer ${process.env.SENDFOX_API_TOKEN}`,
      },
    });

    console.log("✅ Listas obtenidas de SendFox:\n");

    const listas = res.data.data; // ← AQUÍ está el arreglo correcto

    if (!Array.isArray(listas)) {
      console.log("⚠️ No se recibió una lista válida.");
      console.log("📦 Estructura completa:", res.data);
      return;
    }

    listas.forEach(lista => {
      console.log(`📋 Lista: ${lista.name} → ID: ${lista.id}`);
    });

  } catch (error) {
    console.error("❌ Error al obtener listas:", error.message);
  }
}

obtenerListasSendFox();
