import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

function leadingNumber(value) {
  if (value === undefined || value === null) return undefined;
  const match = String(value).match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const parsed = parseFloat(match[1]);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseLaunchYear(releaseDate) {
  if (!releaseDate) return undefined;
  const match = String(releaseDate).match(/^(\d{4})/);
  if (!match) return undefined;
  const year = parseInt(match[1], 10);
  return Number.isNaN(year) ? undefined : year;
}

// Only trust text that unambiguously denotes PKR. Fabricated "(Est.)" ranges,
// "Price not available", and bare USD/$ figures are left NULL rather than guessed at.
function parsePricePkr(price) {
  if (!price) return { value: undefined, reason: 'missing' };

  const text = String(price).trim();

  if (/price not available/i.test(text)) return { value: undefined, reason: 'unavailable' };
  if (/\(est\.?\)/i.test(text)) return { value: undefined, reason: 'estimated' };
  if (!/rs\.?\s|pkr|₨/i.test(text)) return { value: undefined, reason: 'foreign-currency-or-unrecognized' };
  if (/-/.test(text)) return { value: undefined, reason: 'range' };

  const digits = text.replace(/[^0-9]/g, '');
  if (!digits) return { value: undefined, reason: 'unparseable' };

  const value = parseInt(digits, 10);
  return Number.isNaN(value) ? { value: undefined, reason: 'unparseable' } : { value, reason: 'ok' };
}

async function backfill() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please configure your database connection.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  const priceSkipReasons = {};
  let priceOk = 0;
  let total = 0;
  let specsPartial = 0;

  try {
    const { rows } = await client.query(
      'SELECT id, price, release_date, short_specs FROM mobiles',
    );
    total = rows.length;
    console.log(`Found ${total} mobiles to backfill.`);

    await client.query('BEGIN');

    for (const row of rows) {
      const shortSpecs = row.short_specs || {};
      // ram_gb/storage_gb/battery_mah are integer columns; the source strings
      // are expected to be whole numbers, but round defensively in case a
      // decimal slips through (e.g. a battery value expressed in Wh).
      const round = (n) => (n === undefined ? undefined : Math.round(n));
      const ramGb = round(leadingNumber(shortSpecs.ram));
      const storageGb = round(leadingNumber(shortSpecs.storage));
      const batteryMah = round(leadingNumber(shortSpecs.battery));
      const screenInches = leadingNumber(shortSpecs.display);
      const launchYear = parseLaunchYear(row.release_date);
      const { value: pricePkr, reason } = parsePricePkr(row.price);

      if (pricePkr !== undefined) {
        priceOk += 1;
      } else {
        priceSkipReasons[reason] = (priceSkipReasons[reason] || 0) + 1;
      }

      if (ramGb === undefined || storageGb === undefined || batteryMah === undefined || screenInches === undefined) {
        specsPartial += 1;
      }

      await client.query(
        `UPDATE mobiles
         SET ram_gb = $1, storage_gb = $2, battery_mah = $3, screen_inches = $4, launch_year = $5, price_pkr = $6
         WHERE id = $7`,
        [ramGb ?? null, storageGb ?? null, batteryMah ?? null, screenInches ?? null, launchYear ?? null, pricePkr ?? null, row.id],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Backfill failed:', error);
    process.exitCode = 1;
    return;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\nBackfill completed.');
  console.log(`   Total rows: ${total}`);
  console.log(`   Rows with usable price_pkr: ${priceOk}`);
  console.log(`   Rows with at least one missing spec column: ${specsPartial}`);
  console.log('   Rows skipped for price_pkr, by reason:');
  for (const [reason, count] of Object.entries(priceSkipReasons)) {
    console.log(`     - ${reason}: ${count}`);
  }
}

backfill().catch((error) => {
  console.error('Unhandled error while backfilling:', error);
  process.exit(1);
});
