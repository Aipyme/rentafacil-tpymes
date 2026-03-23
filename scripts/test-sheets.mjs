import 'dotenv/config';

const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
const sheetId = process.env.GOOGLE_SHEETS_ID;
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:BZ?key=${apiKey}`;
const res = await fetch(url);
const data = await res.json();

if (!data.values || data.values.length < 2) {
  console.log('Sin datos o solo cabeceras');
  process.exit(0);
}

const headers = data.values[0].map(h => h.toLowerCase().trim());
const col = (name) => headers.indexOf(name.toLowerCase());

const idCol = col('id_caso') !== -1 ? col('id_caso') : col('expedienteid');
const nombreCol = col('nombrecompleto') !== -1 ? col('nombrecompleto') : col('nombre');
const emailCol = col('email');
const nifCol = col('nif');
const estadoCol = col('estado');
const nombreEmpresaCol = col('nombreempresa');
const nifPagadorCol = col('nifpagador');

console.log('=== Columnas encontradas ===');
console.log('  id_caso:', idCol);
console.log('  nombreCompleto:', nombreCol);
console.log('  email:', emailCol);
console.log('  nif:', nifCol);
console.log('  estado:', estadoCol);
console.log('  nombreEmpresa:', nombreEmpresaCol, nombreEmpresaCol >= 0 ? '✓' : '✗ NO ENCONTRADA');
console.log('  nifPagador:', nifPagadorCol, nifPagadorCol >= 0 ? '✓' : '✗ NO ENCONTRADA');
console.log('');
console.log('Total filas de datos:', data.values.length - 1);

if (data.values.length > 1) {
  const row = data.values[1];
  console.log('');
  console.log('=== Primer caso ===');
  console.log('  ID:', row[idCol] || '(vacío)');
  console.log('  Nombre:', row[nombreCol] || '(vacío)');
  console.log('  Email:', row[emailCol] || '(vacío)');
  console.log('  Estado:', row[estadoCol] || '(vacío)');
  console.log('  Empresa:', row[nombreEmpresaCol] || '(vacío - normal si es caso antiguo)');
  console.log('  NIF Pagador:', row[nifPagadorCol] || '(vacío - normal si es caso antiguo)');
}
