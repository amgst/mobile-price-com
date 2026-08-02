import { isCloudflareAIAvailable, generateText } from "../cloudflare-ai.js";
import { repairTruncatedJson } from "../ai-service.js";
import { uploadBufferToR2 } from "../r2.js";

export interface UrlImportDraft {
  name: string;
  slug: string;
  brand: string;
  model: string;
  releaseDate: string;
  price: string;
  pricePkr: number | null;
  ramGb: number | null;
  storageGb: number | null;
  batteryMah: number | null;
  screenInches: string | null;
  launchYear: number | null;
  imageUrl: string;
  carouselImages: string[];
  shortSpecs: {
    ram: string;
    storage: string;
    camera: string;
    battery?: string;
    display?: string;
    processor?: string;
  };
  specifications: { category: string; specs: { feature: string; value: string }[] }[];
  dimensions: { height: string; width: string; thickness: string; weight: string };
  buildMaterials: { frame: string; back: string; protection: string };
  sourceUrl: string;
  alreadyExists: boolean;
  existingId: string | null;
}

const MAX_PAGE_TEXT = 14000;

async function fetchPage(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Could not fetch the page (HTTP ${response.status}). Some sites block automated requests — try a different source URL.`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("html")) {
    throw new Error(`URL did not return an HTML page (got ${contentType || "unknown content type"})`);
  }

  return response.text();
}

function extractImageUrls(html: string, baseUrl: string): string[] {
  const meta = new Set<string>();
  const metaMatches = html.matchAll(
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi
  );
  for (const m of metaMatches) meta.add(m[1]);
  const metaMatchesRev = html.matchAll(
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["']/gi
  );
  for (const m of metaMatchesRev) meta.add(m[1]);

  const body = new Set<string>();
  // src may be quoted or unquoted; also pick up data-img/data-src lazy-load attributes
  const imgMatches = html.matchAll(
    /(?:<img[^>]+src|data-img|data-src)=(?:["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']|(https?:\/\/[^\s>"']+\.(?:jpg|jpeg|png|webp)[^\s>"']*))/gi
  );
  for (const m of imgMatches) {
    if (body.size >= 40) break;
    body.add(m[1] || m[2]);
  }

  const isJunk = (src: string) =>
    /logo|icon|sprite|avatar|banner|store|badge|flag|ad[sv]?[-_./]/i.test(src) ||
    /\/-?\d{2,3}x\d{2,3}\//.test(src) ||
    /\b\d{1,2}x\d{1,2}\.(?:png|jpg|gif)/i.test(src);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleTokens = new Set(
    (titleMatch?.[1] || "")
      .toLowerCase()
      .split(/[^a-z0-9+]+/)
      .filter((t) => t.length > 1 && !/^(the|and|full|phone|specifications|specs|price|review|vs)$/.test(t))
  );

  const score = (src: string) => {
    let s = 0;
    if (/bigpic|large|full|main|hero|product|original/i.test(src)) s += 2;
    if (/\.(?:jpg|jpeg|webp)/i.test(src)) s += 1;
    if (/thumb|small|mini|tiny/i.test(src)) s -= 2;
    const file = (src.split("/").pop() || "").toLowerCase();
    for (const token of titleTokens) {
      if (file.includes(token)) s += 3;
    }
    return s;
  };

  const candidates = [
    ...Array.from(meta),
    ...Array.from(body)
      .filter((src) => !isJunk(src))
      .sort((a, b) => score(b) - score(a)),
  ];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const u of candidates) {
    try {
      const abs = new URL(u, baseUrl).toString();
      if (!seen.has(abs)) {
        seen.add(abs);
        result.push(abs);
      }
    } catch {
      // skip malformed URLs
    }
    if (result.length >= 12) break;
  }
  return result;
}

function extractJsonLd(html: string): string {
  const blocks: string[] = [];
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of matches) {
    const text = m[1].trim();
    if (text && /Product|Review|ItemPage/i.test(text)) {
      blocks.push(text.slice(0, 3000));
    }
  }
  return blocks.join("\n").slice(0, 6000);
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|td|th)>/gi, "\n")
    .replace(/<td[^>]*>|<th[^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const n = parseInt(value.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

// storage is imported lazily so the Netlify function (which has its own db
// connection) can bundle the extraction helpers without dragging in server/db.ts.
// The site displays PKR only. USD prices from foreign spec sites are converted
// at a live rate (cached 12h; fallback constant if the rate API is down) and
// rounded to the nearest 1,000 — the UI labels all prices "approximately".
let cachedRate: { rate: number; fetchedAt: number } | null = null;
async function usdToPkrRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < 12 * 3600_000) {
    return cachedRate.rate;
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(8000),
    });
    const data: any = await res.json();
    const rate = data?.rates?.PKR;
    if (typeof rate === "number" && rate > 0) {
      cachedRate = { rate, fetchedAt: Date.now() };
      return rate;
    }
  } catch (error) {
    console.error("USD→PKR rate fetch failed, using fallback:", error);
  }
  return 278;
}

async function ensureBrand(brandSlug: string): Promise<string> {
  const { storage } = await import("../storage.js");
  const allBrands = await storage.getAllBrands();
  const matched = allBrands.find(
    (b) => b.slug === brandSlug || b.name.toLowerCase() === brandSlug.replace(/-/g, " ")
  );
  if (matched) return matched.slug;

  const brandName = brandSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  await storage.createBrand({
    name: brandName,
    slug: brandSlug,
    logo: brandName.charAt(0),
    phoneCount: "0",
    description: `${brandName} mobile phones`,
    isVisible: true,
  });
  return brandSlug;
}

// Download external images and re-upload them to our R2 bucket so saved mobiles
// never hotlink another site's images. Failures are skipped, not fatal.
export async function mirrorImagesToR2(urls: string[]): Promise<{ source: string; url: string }[]> {
  const mirrored: { source: string; url: string }[] = [];

  for (const source of urls.slice(0, 8)) {
    try {
      const res = await fetch(source, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) continue;

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) continue;

      const extension = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
          ? "webp"
          : "jpg";
      const url = await uploadBufferToR2(buffer, contentType, extension, "mobiles");
      mirrored.push({ source, url });
    } catch (error) {
      console.error(`Failed to mirror image ${source}:`, error);
    }
  }

  return mirrored;
}

// DB-free draft extraction: fetch + AI + parse only, so it can run both in the
// Express server (with storage) and in the Netlify function (with its own db).
export async function extractDraftFromUrl(url: string): Promise<Omit<UrlImportDraft, "alreadyExists" | "existingId">> {
  if (!isCloudflareAIAvailable()) {
    throw new Error(
      "URL import needs Cloudflare Workers AI. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env."
    );
  }

  const html = await fetchPage(url);
  const jsonLd = extractJsonLd(html);
  const pageText = htmlToText(html).slice(0, MAX_PAGE_TEXT);
  const imageCandidates = extractImageUrls(html, url);

  if (pageText.length < 200) {
    throw new Error("The page returned almost no readable text — it may require JavaScript or block bots. Try another source.");
  }

  const systemPrompt =
    "You are a data-entry assistant for a mobile phone specifications database. " +
    "You extract FACTS (specs, dates, prices) from the provided page content. " +
    "You never copy sentences from the source; any descriptive text must be written in your own words. " +
    "Respond with ONLY a single valid JSON object — no markdown fences, no commentary.";

  const userPrompt = `
Extract the mobile phone's data from this page content. Use ONLY facts present in the content;
leave a field as an empty string (or null for numbers) if the page does not state it. Do NOT guess.

Respond with ONLY this JSON shape:
{
  "name": "Full phone name including brand, e.g. Samsung Galaxy S24 Ultra",
  "brand": "lowercase-brand-slug",
  "model": "model name without the brand",
  "releaseDate": "YYYY-MM-DD or empty string",
  "price": "launch/current price with currency as shown on the page, e.g. Rs 449,999 or $1,199, or empty string",
  "pricePkr": null,
  "ramGb": null,
  "storageGb": null,
  "batteryMah": null,
  "screenInches": null,
  "launchYear": null,
  "shortSpecs": { "ram": "", "storage": "", "camera": "", "battery": "", "display": "", "processor": "" },
  "specifications": [
    { "category": "Display", "specs": [{ "feature": "", "value": "" }] },
    { "category": "Camera", "specs": [{ "feature": "", "value": "" }] },
    { "category": "Performance", "specs": [{ "feature": "", "value": "" }] },
    { "category": "Battery & Charging", "specs": [{ "feature": "", "value": "" }] },
    { "category": "Build & Design", "specs": [{ "feature": "", "value": "" }] },
    { "category": "Connectivity", "specs": [{ "feature": "", "value": "" }] }
  ],
  "dimensions": { "height": "", "width": "", "thickness": "", "weight": "" },
  "buildMaterials": { "frame": "", "back": "", "protection": "" }
}

Rules:
- pricePkr: price in Pakistani Rupees as a plain integer if stated on the page, else null.
- Pakistani sites (.pk domains, or pages saying "Price in Pakistan") list prices in Pakistani
  Rupees even when they display the ₹ symbol — put that amount in pricePkr. Never output the
  ₹ symbol in the price field; write Pakistani Rupee prices as "Rs 120,999".
- ramGb/storageGb: base variant, integers in GB. batteryMah: integer in mAh. screenInches: number like 6.7.
- launchYear: 4-digit year from the release date if known.
- Up to 5 specs per category, values short (under 8 words). Skip categories with no data.
- Spec values must be factual data from the page, reworded/condensed — never sentence-for-sentence copies.

${jsonLd ? `Structured data from the page:\n${jsonLd}\n\n` : ""}Page content:
${pageText}
`;

  const raw = await generateText(systemPrompt, userPrompt, 2400);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI could not extract structured data from this page. Try a page that shows full specifications.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    parsed = JSON.parse(repairTruncatedJson(jsonMatch[0]));
  }

  const name = (parsed.name || "").toString().trim();
  if (!name) {
    throw new Error("Could not identify a phone name on this page.");
  }

  const brandSlug = toSlug(parsed.brand || name.split(/\s+/)[0]);
  const slug = toSlug(name);

  // Normalize pricing: the site displays prices in PKR, so whenever we know the
  // PKR amount the display string is always "Rs 120,999" — never ₹ or raw text.
  const rawPrice = (parsed.price || "").toString().trim();
  let pricePkr = toInt(parsed.pricePkr);
  const sourceHost = new URL(url).hostname;
  if (!pricePkr && sourceHost.endsWith(".pk") && /₹|Rs\.?\s*[\d,]+/i.test(rawPrice)) {
    pricePkr = toInt(rawPrice);
  }
  if (!pricePkr) {
    const usdMatch = rawPrice.match(/\$\s*([\d,]+(?:\.\d+)?)/);
    if (usdMatch) {
      const usd = parseFloat(usdMatch[1].replace(/,/g, ""));
      if (usd > 0) {
        pricePkr = Math.round((usd * (await usdToPkrRate())) / 1000) * 1000;
      }
    }
  }
  const price = pricePkr ? `Rs ${pricePkr.toLocaleString("en-US")}` : rawPrice;

  const screenRaw = parsed.screenInches;
  const screenInches =
    typeof screenRaw === "number" && screenRaw > 0
      ? screenRaw.toFixed(2)
      : typeof screenRaw === "string" && parseFloat(screenRaw) > 0
        ? parseFloat(screenRaw).toFixed(2)
        : null;

  return {
    name,
    slug,
    brand: brandSlug,
    model: (parsed.model || name).toString().trim(),
    releaseDate: (parsed.releaseDate || "").toString(),
    price,
    pricePkr,
    ramGb: toInt(parsed.ramGb),
    storageGb: toInt(parsed.storageGb),
    batteryMah: toInt(parsed.batteryMah),
    screenInches,
    launchYear: toInt(parsed.launchYear),
    imageUrl: imageCandidates[0] || "",
    carouselImages: imageCandidates,
    shortSpecs: {
      ram: parsed.shortSpecs?.ram || "",
      storage: parsed.shortSpecs?.storage || "",
      camera: parsed.shortSpecs?.camera || "",
      battery: parsed.shortSpecs?.battery || "",
      display: parsed.shortSpecs?.display || "",
      processor: parsed.shortSpecs?.processor || "",
    },
    specifications: Array.isArray(parsed.specifications)
      ? parsed.specifications.filter(
          (c: any) => c && c.category && Array.isArray(c.specs) && c.specs.length > 0
        )
      : [],
    dimensions: {
      height: parsed.dimensions?.height || "",
      width: parsed.dimensions?.width || "",
      thickness: parsed.dimensions?.thickness || "",
      weight: parsed.dimensions?.weight || "",
    },
    buildMaterials: {
      frame: parsed.buildMaterials?.frame || "",
      back: parsed.buildMaterials?.back || "",
      protection: parsed.buildMaterials?.protection || "",
    },
    sourceUrl: url,
  };
}

// Full import flow for the Express server: extraction plus brand auto-create
// and duplicate detection via storage.
export async function importFromUrl(url: string): Promise<UrlImportDraft> {
  const { storage } = await import("../storage.js");
  const draft = await extractDraftFromUrl(url);
  const brandSlug = await ensureBrand(draft.brand);
  const existing = await storage.getMobileBySlug(brandSlug, draft.slug);

  return {
    ...draft,
    brand: brandSlug,
    alreadyExists: !!existing,
    existingId: existing?.id ?? null,
  };
}
