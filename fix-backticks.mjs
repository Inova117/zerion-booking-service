// Script para arreglar los caracteres de escape en template literals
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuración para trabajar con __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lee el archivo original
try {
  console.log('Leyendo archivo index.js...');
  const filePath = path.join(__dirname, 'index.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Crea un respaldo
  console.log('Creando respaldo en index.js.bak...');
  fs.writeFileSync(path.join(__dirname, 'index.js.bak'), content);
  
  // Reemplaza los backticks con escape
  console.log('Reemplazando backticks con escape...');
  
  // Reemplazos específicos para los patrones de error
  content = content.replace(/\\`\\$\{/g, '`${');  // Reemplaza \`\${
  content = content.replace(/\\}\\`/g, '}`');     // Reemplaza \}\`
  
  // Para los casos donde solo hay un escape
  content = content.replace(/\\`\$\{/g, '`${');   // Reemplaza \`${
  content = content.replace(/\\}`/g, '}`');       // Reemplaza \}`
  
  // Corrección para app.listen
  content = content.replace(/console\.log\(\\`🚀 Server/, 'console.log(`🚀 Server');
  content = content.replace(/\${PORT}\\`\)\);/, '${PORT}`));');
  
  // Guarda el archivo corregido
  console.log('Guardando archivo corregido...');
  fs.writeFileSync(path.join(__dirname, 'index.js.fixed'), content);
  
  console.log('¡Corrección completada!');
  console.log('Archivo original: index.js');
  console.log('Archivo de respaldo: index.js.bak');
  console.log('Archivo corregido: index.js.fixed');
  console.log('');
  console.log('Para aplicar los cambios:');
  console.log('1. Revisa index.js.fixed para asegurarte que los cambios son correctos');
  console.log('2. Reemplaza el archivo original con: copy index.js.fixed index.js');
} catch (error) {
  console.error('Error al procesar el archivo:', error);
} 