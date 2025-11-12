import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const csvPath = path.join(projectRoot, 'data', 'data.csv');

function deduplicateCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  const lines = raw.split(/\r?\n/);
  if (lines.length < 2) {
    console.log('No data rows found.');
    return;
  }

  const header = lines[0];
  const seen = new Set();
  const dedupedRows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const columns = line.split(',');
    if (columns.length < 2) continue;

    const key = `${columns[0]}|${columns[1]}`.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    dedupedRows.push(line);
  }

  fs.writeFileSync(filePath, [header, ...dedupedRows].join('\n') + '\n');

  console.log(`Original rows: ${lines.length - 1}`);
  console.log(`Deduplicated rows: ${dedupedRows.length}`);
  console.log(`Removed duplicates: ${(lines.length - 1) - dedupedRows.length}`);
}

deduplicateCsv(csvPath);

