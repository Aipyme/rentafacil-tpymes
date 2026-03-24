import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer el .env manualmente
let apiKey = process.env.GOOGLE_SHEETS_API_KEY;
let sheetId = process.env.GOOGLE_SHEETS_ID;

// Si no están en el entorno, intentar leerlos del .env
if (!apiKey || !sheetId) {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const [key, ...rest] = line.split('=');
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (key?.trim() === 'GOOGLE_SHEETS_API_KEY') apiKey = val;
      if (key?.trim() === 'GOOGLE_SHEETS_ID') sheetId = val;
    }
  } catch (e) {
    console.log('No se pudo leer .env:', e.message);
  }
}

console.log('API Key disponible:', !!apiKey, apiKey ? apiKey.substring(0, 8) + '...' : 'NO');
console.log('Sheet ID disponible:', !!sheetId, sheetId ? sheetId.substring(0, 15) + '...' : 'NO');

if (!apiKey || !sheetId) {
  console.error('Faltan credenciales');
  process.exit(1);
}

const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:E10?key=${apiKey}`;
const response = await fetch(url);
const data = await response.json();

if (data.error) {
  console.error('Error API:', data.error.message);
  process.exit(1);
}

const rows = data.values || [];
console.log(`\nTotal filas en el Sheet: ${rows.length}`);
console.log('\nÚltimas 5 filas (columnas A-E):');
rows.slice(-5).forEach((row, i) => {
  console.log(`  Fila ${rows.length - 4 + i}: ${JSON.stringify(row.slice(0, 5))}`);
});
