// Script para arreglar los caracteres de escape en template literals
const fs = require('fs');
const path = require('path');

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
  content = content.replace(/\\\`\\\$\{/g, '`${');  // Reemplaza \`\${
  content = content.replace(/\\\}\\\`/g, '}`');     // Reemplaza \}\`
  content = content.replace(/\\\`/g, '`');          // Reemplaza \`
  
  // Más patrones específicos
  content = content.replace(/\`\\\$\{/g, '`${');    // Reemplaza `\${
  content = content.replace(/\\\}\`/g, '}`');       // Reemplaza \}`
  
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