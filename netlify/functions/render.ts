import { Handler } from '@netlify/functions';
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../shared/schema.ts";
import { eq, and } from "drizzle-orm";
import { brands, mobiles } from "../../shared/schema.ts";
import { injectSeoTags, type HeadTagsDataSource } from "../../server/seo-render.ts";

// Every page route (product pages, brand pages, everything else /* falls
// through to) is proxied here by netlify.toml so it can get a per-page
// <title>/description/canonical/JSON-LD instead of the static index.html
// shell — without that, every page reported the same canonical URL as the
// homepage and Google collapsed them all into ~2 indexed pages.

const createDbConnection = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  return drizzle(pool, { schema });
};

let cachedTemplate: string | null = null;

async function getTemplate(host: string, proto: string): Promise<string> {
  if (cachedTemplate) return cachedTemplate;
  const res = await fetch(`${proto}://${host}/index.html`);
  if (!res.ok) {
    throw new Error(`Failed to fetch index.html template: ${res.status}`);
  }
  cachedTemplate = await res.text();
  return cachedTemplate;
}

export const handler: Handler = async (event) => {
  const host = event.headers.host || 'mobile-price.com';
  const proto = event.headers['x-forwarded-proto'] || 'https';

  let template: string;
  try {
    template = await getTemplate(host, proto);
  } catch (error) {
    console.error('Failed to load page template:', error);
    return { statusCode: 502, body: 'Failed to load page' };
  }

  try {
    const db = createDbConnection();
    const dataSource: HeadTagsDataSource = {
      async getMobileBySlug(brandSlug, mobileSlug) {
        const [mobile] = await db
          .select()
          .from(mobiles)
          .where(and(eq(mobiles.brand, brandSlug), eq(mobiles.slug, mobileSlug)));
        return mobile;
      },
      async getBrandBySlug(brandSlug) {
        const [brand] = await db.select().from(brands).where(eq(brands.slug, brandSlug));
        return brand;
      },
      async getMobilesByBrand(brandSlug) {
        return await db.select().from(mobiles).where(eq(mobiles.brand, brandSlug));
      },
    };

    const html = await injectSeoTags(template, { path: event.path }, dataSource);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=60, s-maxage=3600',
      },
      body: html,
    };
  } catch (error) {
    // Never fail the page load over a DB/SEO-tag hiccup — fall back to the
    // generic template so the SPA still renders client-side.
    console.error('SEO render failed for', event.path, error);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      body: template,
    };
  }
};
