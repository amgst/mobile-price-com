import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import { storage } from "./storage.js";

const RESERVED_TOP_LEVEL_PATHS = new Set([
  "mobiles",
  "brands",
  "search",
  "compare",
  "reviews",
  "guide",
  "contact",
  "privacy",
  "terms",
  "sitemap",
  "admin",
  "export",
  "api",
]);

function getBaseUrl(): string {
  return process.env.VITE_SITE_URL || "https://mobile-price.com";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeJsonForScriptTag(json: string): string {
  // Prevent premature </script> termination when embedding JSON-LD.
  return json.replace(/</g, "\\u003c");
}

function generateMobileTitle(mobile: any): string {
  const brand = mobile.brand.charAt(0).toUpperCase() + mobile.brand.slice(1);
  const price = (mobile.price || "").replace(/[^\d,₨-]/g, "").trim();
  const year = new Date().getFullYear();
  const priceSuffix = price ? ` - ${price}` : "";
  return `${brand} ${mobile.name} Price in Pakistan ${year}${priceSuffix} | Specifications & Reviews`;
}

function generateMobileDescription(mobile: any): string {
  const brand = mobile.brand.charAt(0).toUpperCase() + mobile.brand.slice(1);
  const specs: string[] = [];
  const shortSpecs = mobile.shortSpecs || {};

  if (shortSpecs.ram) specs.push(`${shortSpecs.ram} RAM`);
  if (shortSpecs.storage) specs.push(`${shortSpecs.storage} Storage`);
  if (shortSpecs.camera) {
    const mpMatch = String(shortSpecs.camera).match(/(\d+)\s*MP/i);
    if (mpMatch) specs.push(`${mpMatch[1]}MP Camera`);
  }
  if (shortSpecs.battery) specs.push(`${shortSpecs.battery} Battery`);

  const specsText = specs.length > 0 ? ` Features: ${specs.slice(0, 3).join(", ")}.` : "";

  return `${brand} ${mobile.name} price in Pakistan is ${mobile.price}.${specsText} Compare specifications, camera quality, performance reviews and buy online with best deals.`;
}

function generateBrandTitle(brand: any, mobileCount: number): string {
  const year = new Date().getFullYear();
  const count = mobileCount > 0 ? `${mobileCount}+ ` : "";
  return `${brand.name} Mobile Phones Price in Pakistan ${year} - ${count}Latest Models & Specifications`;
}

function generateBrandDescription(brand: any, mobileCount: number): string {
  const year = new Date().getFullYear();
  const count = mobileCount > 0 ? `${mobileCount}+ ` : "";
  return `Latest ${brand.name} mobile phone prices in Pakistan. Compare ${count}models with detailed specifications, camera reviews, and performance analysis. Updated ${year}.`;
}

// Prices we don't have a verified price_pkr for are free-text strings like
// "Rs 119,000 - 139,000 (Est.)". Stripping all non-digits from that concatenates
// both bounds into a nonsensical number, so instead pull just the first digit
// group (the range's lower bound) as a sane, if approximate, single price.
function parseLowerBoundPrice(price: string | undefined): string {
  if (!price) return "0";
  const match = price.match(/[\d,]+/);
  if (!match) return "0";
  return match[0].replace(/[^0-9]/g, "") || "0";
}

function generateProductSchema(mobile: any, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: mobile.name,
    description: `${mobile.name} with ${mobile.shortSpecs?.ram} RAM, ${mobile.shortSpecs?.storage} storage, ${mobile.shortSpecs?.camera} camera. Complete specifications and price in Pakistan.`,
    image:
      mobile.carouselImages && mobile.carouselImages.length > 0
        ? mobile.carouselImages
        : [mobile.imageUrl || `${baseUrl}/images/og-default-mobile.jpg`],
    brand: {
      "@type": "Brand",
      name: mobile.brand,
    },
    offers: {
      "@type": "Offer",
      // Prefer the real numeric price_pkr column; only fall back to
      // parsing the free-text price (which can be a fabricated "(Est.)"
      // range) when it's unset.
      price:
        typeof mobile.pricePkr === "number"
          ? String(mobile.pricePkr)
          : parseLowerBoundPrice(mobile.price),
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/${mobile.brand.toLowerCase()}/${mobile.slug}`,
    },
  };
}

function generateBreadcrumbSchema(
  breadcrumbs: { label: string; href: string }[],
  baseUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${baseUrl}${crumb.href}`,
    })),
  };
}

function generateCollectionPageSchema(brand: any, mobiles: any[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand.name} Mobile Phones in Pakistan`,
    description: `Complete collection of ${brand.name} mobile phones with latest prices and specifications in Pakistan.`,
    url: `${baseUrl}/${brand.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: mobiles.length,
      itemListElement: mobiles.slice(0, 20).map((mobile, index) => ({
        "@type": "Product",
        position: index + 1,
        name: mobile.name,
        url: `${baseUrl}/${brand.slug}/${mobile.slug}`,
        image: mobile.imageUrl || `${baseUrl}/images/og-default-mobile.jpg`,
      })),
    },
  };
}

export interface HeadTags {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  jsonLd: object[];
}

// Abstracts the data lookups resolveHeadTags needs so it can run against
// either the Express `storage` singleton or a standalone DB connection
// (e.g. a Netlify function, which can't share Express's connection lifecycle).
export interface HeadTagsDataSource {
  getMobileBySlug(brandSlug: string, mobileSlug: string): Promise<any>;
  getBrandBySlug(brandSlug: string): Promise<any>;
  getMobilesByBrand(brandSlug: string): Promise<any[]>;
}

export async function resolveHeadTags(
  reqPath: string,
  dataSource: HeadTagsDataSource = storage,
): Promise<HeadTags | null> {
  const baseUrl = getBaseUrl();
  const segments = reqPath.split("/").filter(Boolean);

  if (segments.length === 0) return null;
  if (RESERVED_TOP_LEVEL_PATHS.has(segments[0])) return null;

  if (segments.length === 2) {
    const [brandSlug, mobileSlug] = segments;
    const mobile = await dataSource.getMobileBySlug(brandSlug, mobileSlug);
    if (!mobile) return null;

    const canonical = `${baseUrl}/${brandSlug}/${mobileSlug}`;
    return {
      title: generateMobileTitle(mobile),
      description: generateMobileDescription(mobile),
      canonical,
      ogImage: mobile.imageUrl || `${baseUrl}/images/og-default-mobile.jpg`,
      jsonLd: [
        generateProductSchema(mobile, baseUrl),
        generateBreadcrumbSchema(
          [
            { label: "Home", href: "/" },
            { label: mobile.brand, href: `/${brandSlug}` },
            { label: mobile.name, href: `/${brandSlug}/${mobileSlug}` },
          ],
          baseUrl,
        ),
      ],
    };
  }

  if (segments.length === 1) {
    const brandSlug = segments[0];
    const brand = await dataSource.getBrandBySlug(brandSlug);
    if (!brand) return null;

    const mobiles = await dataSource.getMobilesByBrand(brandSlug);
    const canonical = `${baseUrl}/${brandSlug}`;
    return {
      title: generateBrandTitle(brand, mobiles.length),
      description: generateBrandDescription(brand, mobiles.length),
      canonical,
      ogImage: `${baseUrl}/images/og-default.jpg`,
      jsonLd: [
        generateCollectionPageSchema(brand, mobiles, baseUrl),
        generateBreadcrumbSchema(
          [
            { label: "Home", href: "/" },
            { label: brand.name, href: `/${brandSlug}` },
          ],
          baseUrl,
        ),
      ],
    };
  }

  return null;
}

function applyHeadTags(html: string, tags: HeadTags): string {
  let result = html;

  result = result.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(tags.title)}</title>`);

  result = result.replace(
    /<meta name="description" content=".*?" \/>/s,
    `<meta name="description" content="${escapeHtml(tags.description)}" />`,
  );

  result = result.replace(
    /<link rel="canonical" href=".*?" \/>/s,
    `<link rel="canonical" href="${escapeHtml(tags.canonical)}" />`,
  );

  const jsonLdScripts = tags.jsonLd
    .map(
      (schema) =>
        `<script type="application/ld+json">${escapeJsonForScriptTag(JSON.stringify(schema))}</script>`,
    )
    .join("\n    ");

  const ogTags = `<meta property="og:title" content="${escapeHtml(tags.title)}" />
    <meta property="og:description" content="${escapeHtml(tags.description)}" />
    <meta property="og:url" content="${escapeHtml(tags.canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${escapeHtml(tags.ogImage)}" />
    <meta property="og:site_name" content="Mobile Price" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(tags.title)}" />
    <meta name="twitter:description" content="${escapeHtml(tags.description)}" />
    <meta name="twitter:image" content="${escapeHtml(tags.ogImage)}" />`;

  result = result.replace("</head>", `${ogTags}\n    ${jsonLdScripts}\n  </head>`);

  return result;
}

export async function injectSeoTags(
  html: string,
  req: { path: string },
  dataSource: HeadTagsDataSource = storage,
): Promise<string> {
  try {
    const tags = await resolveHeadTags(req.path, dataSource);
    if (!tags) return html;
    return applyHeadTags(html, tags);
  } catch (error) {
    console.error("SEO injection failed for", req.path, error);
    return html;
  }
}

export function registerSeoPageRoutes(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  let cachedTemplate: string | null = null;

  function readTemplate(): string {
    if (cachedTemplate) return cachedTemplate;
    const indexPath = path.resolve(distPath, "index.html");
    cachedTemplate = fs.readFileSync(indexPath, "utf-8");
    return cachedTemplate;
  }

  app.get("*", async (req: Request, res: Response) => {
    try {
      const template = readTemplate();
      const html = await injectSeoTags(template, req);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      console.error("Failed to serve SEO-rendered page:", error);
      res.status(500).send("Internal server error");
    }
  });
}
