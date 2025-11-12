import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const csvPath = path.join(projectRoot, 'data', 'data.csv');

function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  const lines = raw.split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing data rows');
  }
  const headers = lines[0].split(',');

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? '';
    });
    return record;
  });
}

function analyze(records) {
  const anomalies = [];
  const brandCounts = {};

  for (const row of records) {
    const brand = row.brand?.trim();
    const model = row.model?.trim();
    const os = row.os?.trim().toLowerCase();
    const processor = row.processor?.trim().toLowerCase();
    const battery = parseInt(row.battery_mah, 10);
    const charging = parseInt(row.charging_watt, 10);
    const display = parseFloat(row.display_size_inch);

    brandCounts[brand] = (brandCounts[brand] || 0) + 1;

    const issues = [];

    if (brand === 'Apple' && os !== 'ios') {
      issues.push(`Apple device running non-iOS (${row.os})`);
    }

    if (brand === 'Apple' && processor.includes('snapdragon')) {
      issues.push(`Apple device using Snapdragon processor (${row.processor})`);
    }

    if (brand !== 'Apple' && os === 'ios') {
      issues.push(`Non-Apple device running iOS`);
    }

    if (battery && (battery < 2000 || battery > 7000)) {
      issues.push(`Suspicious battery capacity (${battery}mAh)`);
    }

    if (charging && charging > 120) {
      issues.push(`Extreme charging wattage (${charging}W)`);
    }

    if (display && (display < 4.5 || display > 7.6)) {
      issues.push(`Suspicious display size (${display}" )`);
    }

    if (issues.length > 0) {
      anomalies.push({
        brand,
        model,
        issues,
        raw: row,
      });
    }
  }

  return { brandCounts, anomalies };
}

function summarize() {
  const records = loadCsv(csvPath);
  const { brandCounts, anomalies } = analyze(records);

  const totalRows = records.length;
  const totalBrands = Object.keys(brandCounts).length;

  console.log('--- CSV Snapshot ---');
  console.log(`Total rows            : ${totalRows}`);
  console.log(`Distinct brands       : ${totalBrands}`);

  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\nTop brands by entries:');
  topBrands.forEach(([brand, count]) => {
    console.log(`  - ${brand}: ${count}`);
  });

  console.log(`\nAnomalies detected    : ${anomalies.length}`);
  anomalies.slice(0, 25).forEach((entry, idx) => {
    console.log(`\n#${idx + 1}: ${entry.brand} ${entry.model}`);
    entry.issues.forEach((issue) => console.log(`   • ${issue}`));
  });

  if (anomalies.length > 25) {
    console.log(`\n...and ${anomalies.length - 25} more anomalies.`);
  }
}

try {
  summarize();
} catch (error) {
  console.error('Failed to analyze CSV:', error.message);
  process.exit(1);
}

