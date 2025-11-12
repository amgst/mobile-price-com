import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const csvPath = path.join(projectRoot, 'data', 'data.csv');

function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function monthToNumber(month) {
  if (!month) return '01';
  const normalized = month.trim().toLowerCase();
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  const index = months.indexOf(normalized);
  if (index >= 0) return String(index + 1).padStart(2, '0');

  // Handle shortened month names (e.g., "Sept")
  const shortMonths = months.map((m) => m.slice(0, 3));
  const shortIndex = shortMonths.indexOf(normalized.slice(0, 3));
  if (shortIndex >= 0) return String(shortIndex + 1).padStart(2, '0');

  return '01';
}

function buildReleaseDate(month, year) {
  const safeYear = year && Number.isInteger(Number(year)) ? String(year).padStart(4, '0') : new Date().getFullYear();
  const monthNumber = monthToNumber(month);
  return `${safeYear}-${monthNumber}-01`;
}

function generatePlaceholderImage(name) {
  const encoded = encodeURIComponent(name);
  return `https://dummyimage.com/600x600/0d6efd/ffffff&text=${encoded}`;
}

function buildCarouselImages(name) {
  const base = generatePlaceholderImage(name);
  // Provide a few variations to populate the carousel
  return [
    base,
    `${base}&variant=1`,
    `${base}&variant=2`,
  ];
}

function toNumber(value) {
  if (value === undefined || value === null) return undefined;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function formatSpecValue(value, suffix) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return suffix ? `${value}${suffix}` : String(value);
}

function buildShortSpecs(row) {
  return {
    ram: formatSpecValue(row.ram_gb, 'GB') || 'Unknown',
    storage: formatSpecValue(row.storage_gb, 'GB') || 'Unknown',
    camera: formatSpecValue(row.camera_mp, 'MP') || 'Unknown',
    battery: formatSpecValue(row.battery_mah, 'mAh'),
    display: formatSpecValue(row.display_size_inch, '"'),
    processor: row.processor || 'Unknown',
  };
}

function buildSpecifications(row) {
  const specs = [];

  const overviewSpecs = [
    { feature: 'Brand', value: row.brand },
    { feature: 'Model', value: row.model },
    row.rating ? { feature: 'User Rating', value: `${row.rating}/5` } : null,
    row.year ? { feature: 'Model Year', value: String(row.year) } : null,
  ].filter(Boolean);

  if (overviewSpecs.length) {
    specs.push({ category: 'Overview', specs: overviewSpecs });
  }

  const displaySpecs = [
    formatSpecValue(row.display_size_inch, '"') && { feature: 'Display Size', value: `${row.display_size_inch}"` },
  ].filter(Boolean);

  if (displaySpecs.length) {
    specs.push({ category: 'Display', specs: displaySpecs });
  }

  const performanceSpecs = [
    row.processor && { feature: 'Processor', value: row.processor },
    formatSpecValue(row.ram_gb, 'GB') && { feature: 'RAM', value: `${row.ram_gb}GB` },
    formatSpecValue(row.storage_gb, 'GB') && { feature: 'Storage', value: `${row.storage_gb}GB` },
    row.os && { feature: 'Operating System', value: row.os },
  ].filter(Boolean);

  if (performanceSpecs.length) {
    specs.push({ category: 'Performance', specs: performanceSpecs });
  }

  const cameraSpecs = [
    formatSpecValue(row.camera_mp, 'MP') && { feature: 'Main Camera', value: `${row.camera_mp}MP` },
  ].filter(Boolean);

  if (cameraSpecs.length) {
    specs.push({ category: 'Camera', specs: cameraSpecs });
  }

  const batterySpecs = [
    formatSpecValue(row.battery_mah, 'mAh') && { feature: 'Battery Capacity', value: `${row.battery_mah}mAh` },
    formatSpecValue(row.charging_watt, 'W') && { feature: 'Charging Speed', value: `${row.charging_watt}W` },
  ].filter(Boolean);

  if (batterySpecs.length) {
    specs.push({ category: 'Battery', specs: batterySpecs });
  }

  const connectivitySpecs = [
    row['5g_support'] && { feature: '5G Support', value: row['5g_support'] },
  ].filter(Boolean);

  if (connectivitySpecs.length) {
    specs.push({ category: 'Connectivity', specs: connectivitySpecs });
  }

  return specs;
}

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found at ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file does not contain any data rows');
  }

  const headers = lines[0].split(',').map((header) => header.trim());
  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2} has ${values.length} values, expected ${headers.length}`);
    }
    return headers.reduce((acc, header, idx) => {
      acc[header] = values[idx];
      return acc;
    }, {});
  });

  return rows;
}

async function importCsv() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Please configure your database connection.');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('📄 Parsing CSV data...');
  const records = parseCsv(csvPath);
  console.log(`   • Found ${records.length} mobile entries`);

  const brandMap = new Map();
  for (const row of records) {
    const brandName = row.brand;
    if (!brandMap.has(brandName)) {
      brandMap.set(brandName, {
        name: brandName,
        slug: createSlug(brandName),
        logo: brandName.charAt(0).toUpperCase(),
        description: `${brandName} smartphone manufacturer`,
        count: 0,
      });
    }
    brandMap.get(brandName).count += 1;
  }

  const client = await pool.connect();
  let importedBrands = 0;
  let importedMobiles = 0;

  try {
    await client.query('BEGIN');

    console.log(`🏢 Importing ${brandMap.size} brands...`);

    for (const brand of brandMap.values()) {
      await client.query(
        `
          INSERT INTO brands (name, slug, logo, phone_count, description, is_visible)
          VALUES ($1, $2, $3, $4, $5, true)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            logo = EXCLUDED.logo,
            phone_count = EXCLUDED.phone_count,
            description = EXCLUDED.description,
            is_visible = true
        `,
        [brand.name, brand.slug, brand.logo, String(brand.count), brand.description],
      );
      importedBrands += 1;
    }

    console.log('📱 Importing mobile devices...');

    for (const row of records) {
      const brandSlug = createSlug(row.brand);
      const modelSlug = createSlug(row.model);
      const mobileSlug = createSlug(`${row.brand} ${row.model}`);
      const name = `${row.brand} ${row.model}`.trim();
      const imageUrl = generatePlaceholderImage(name);
      const carouselImages = buildCarouselImages(name);
      const shortSpecs = buildShortSpecs(row);
      const specifications = buildSpecifications(row);
      const releaseDate = buildReleaseDate(row.release_month, row.year);
      const priceUsd = toNumber(row.price_usd);
      const price = priceUsd ? `USD $${priceUsd.toFixed(2)}` : 'Price not available';

      await client.query(
        `
          INSERT INTO mobiles (
            slug,
            name,
            brand,
            model,
            image_url,
            imagekit_path,
            release_date,
            price,
            short_specs,
            carousel_images,
            specifications,
            dimensions,
            build_materials
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL, NULL)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            model = EXCLUDED.model,
            image_url = EXCLUDED.image_url,
            imagekit_path = EXCLUDED.imagekit_path,
            release_date = EXCLUDED.release_date,
            price = EXCLUDED.price,
            short_specs = EXCLUDED.short_specs,
            carousel_images = EXCLUDED.carousel_images,
            specifications = EXCLUDED.specifications
        `,
        [
          mobileSlug,
          name,
          brandSlug,
          row.model,
          imageUrl,
          `/mobiles/${brandSlug}/${modelSlug}.jpg`,
          releaseDate,
          price,
          JSON.stringify(shortSpecs),
          JSON.stringify(carouselImages),
          JSON.stringify(specifications),
        ],
      );

      importedMobiles += 1;
    }

    await client.query('COMMIT');

    console.log('\n🎉 CSV import completed successfully!');
    console.log(`   • Brands processed: ${importedBrands}`);
    console.log(`   • Mobiles processed: ${importedMobiles}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ CSV import failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (import.meta.url === `file://${__filename}`) {
  importCsv().catch((error) => {
    console.error('Unhandled error while importing CSV:', error);
    process.exit(1);
  });
}

export { importCsv };

