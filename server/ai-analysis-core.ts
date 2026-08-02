import type { Mobile } from "../shared/schema.js";
import { isCloudflareAIAvailable, generateText, describeImage } from "./cloudflare-ai.js";
import { repairTruncatedJson } from "./ai-service.js";

// Shared AI analysis logic used by both the Express server and the Netlify
// function. Powered by Cloudflare Workers AI; throws when it is not configured
// so callers surface a real error instead of fabricated results.

function requireAI() {
  if (!isCloudflareAIAvailable()) {
    throw new Error(
      "AI analysis requires Cloudflare Workers AI (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)."
    );
  }
}

function parseJson(raw: string): any {
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) {
    throw new Error("AI response did not contain JSON");
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    return JSON.parse(repairTruncatedJson(match[0]));
  }
}

// Flatten the real schema (shortSpecs + specifications categories) into a
// compact text block the model can reason over.
function specSummary(mobile: Mobile): string {
  const lines: string[] = [
    `Name: ${mobile.name}`,
    `Brand: ${mobile.brand}`,
    mobile.releaseDate ? `Released: ${mobile.releaseDate}` : "",
    mobile.price ? `Price: ${mobile.price}` : "",
  ];

  const short = mobile.shortSpecs;
  if (short) {
    lines.push(
      `Key specs: RAM ${short.ram}, storage ${short.storage}, camera ${short.camera}` +
        (short.battery ? `, battery ${short.battery}` : "") +
        (short.display ? `, display ${short.display}` : "") +
        (short.processor ? `, processor ${short.processor}` : "")
    );
  }

  for (const category of mobile.specifications ?? []) {
    const specs = category.specs.map((s) => `${s.feature}: ${s.value}`).join("; ");
    lines.push(`${category.category} — ${specs}`);
  }

  if (mobile.dimensions) {
    lines.push(
      `Dimensions: ${mobile.dimensions.height} x ${mobile.dimensions.width} x ${mobile.dimensions.thickness}, ${mobile.dimensions.weight}`
    );
  }
  if (mobile.buildMaterials) {
    lines.push(
      `Build: frame ${mobile.buildMaterials.frame}, back ${mobile.buildMaterials.back}, protection ${mobile.buildMaterials.protection}`
    );
  }

  return lines.filter(Boolean).join("\n");
}

const clampScore = (v: unknown, fallback: number) =>
  Math.min(10, Math.max(1, typeof v === "number" && Number.isFinite(v) ? v : fallback));
const clampPct = (v: unknown) =>
  Math.min(100, Math.max(0, typeof v === "number" && Number.isFinite(v) ? v : 0));
const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6) : [];

export async function analyzeCamera(mobile: Mobile) {
  requireAI();

  const raw = await generateText(
    "You are an expert mobile phone camera analyst. Base every judgement strictly on the given specifications. Respond with ONLY a single valid JSON object, no markdown, no commentary.",
    `Analyze the camera quality of this phone based on its specifications:

${specSummary(mobile)}

Respond with ONLY this JSON shape (scores 1-10, one decimal allowed):
{
  "overallScore": 0,
  "photoQuality": { "daylight": 0, "lowLight": 0, "portrait": 0, "video": 0 },
  "strengths": ["", ""],
  "weaknesses": ["", ""],
  "realWorldComparison": "one sentence comparing to similar phones in its price range",
  "recommendedFor": ["", ""]
}`,
    900
  );

  const a = parseJson(raw);
  return {
    overallScore: clampScore(a.overallScore, 5),
    photoQuality: {
      daylight: clampScore(a.photoQuality?.daylight, 5),
      lowLight: clampScore(a.photoQuality?.lowLight, 4),
      portrait: clampScore(a.photoQuality?.portrait, 5),
      video: clampScore(a.photoQuality?.video, 5),
    },
    strengths: strArray(a.strengths),
    weaknesses: strArray(a.weaknesses),
    realWorldComparison: typeof a.realWorldComparison === "string" ? a.realWorldComparison : "",
    recommendedFor: strArray(a.recommendedFor),
  };
}

export async function analyzeScreen(mobile: Mobile) {
  requireAI();

  const raw = await generateText(
    "You are an expert display technology analyst. Base every judgement strictly on the given specifications. Respond with ONLY a single valid JSON object, no markdown, no commentary.",
    `Analyze the screen quality of this phone based on its specifications:

${specSummary(mobile)}

Respond with ONLY this JSON shape (scores 1-10, one decimal allowed):
{
  "overallScore": 0,
  "displayMetrics": { "sharpness": 0, "colorAccuracy": 0, "brightness": 0, "viewingAngles": 0 },
  "strengths": ["", ""],
  "weaknesses": ["", ""],
  "bestUseCase": "one short sentence",
  "comparison": "one sentence comparing to typical phone displays"
}`,
    900
  );

  const a = parseJson(raw);
  return {
    overallScore: clampScore(a.overallScore, 5),
    displayMetrics: {
      sharpness: clampScore(a.displayMetrics?.sharpness, 5),
      colorAccuracy: clampScore(a.displayMetrics?.colorAccuracy, 5),
      brightness: clampScore(a.displayMetrics?.brightness, 5),
      viewingAngles: clampScore(a.displayMetrics?.viewingAngles, 5),
    },
    strengths: strArray(a.strengths),
    weaknesses: strArray(a.weaknesses),
    bestUseCase: typeof a.bestUseCase === "string" ? a.bestUseCase : "",
    comparison: typeof a.comparison === "string" ? a.comparison : "",
  };
}

export async function findSimilarDesigns(target: Mobile, candidates: Mobile[]) {
  requireAI();

  const list = candidates
    .slice(0, 8)
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} (id: ${m.id}) — brand ${m.brand}` +
        (m.dimensions ? `, ${m.dimensions.height} x ${m.dimensions.width} x ${m.dimensions.thickness}, ${m.dimensions.weight}` : "") +
        (m.buildMaterials ? `, frame ${m.buildMaterials.frame}, back ${m.buildMaterials.back}` : "")
    )
    .join("\n");

  const raw = await generateText(
    "You are an expert in mobile phone design and aesthetics. Respond with ONLY a single valid JSON array, no markdown, no commentary.",
    `Target phone:
${specSummary(target)}

Candidate phones:
${list}

Rate the DESIGN similarity of each candidate to the target. Respond with ONLY a JSON array, one entry per candidate:
[
  {
    "id": "candidate id exactly as given",
    "similarity": 0,
    "similarAspects": ["", ""],
    "keyDifferences": ["", ""],
    "aestheticMatch": "one short sentence"
  }
]`,
    1600
  );

  const parsed = parseJson(raw);
  const entries: any[] = Array.isArray(parsed) ? parsed : [];
  const byId = new Map(candidates.map((m) => [m.id, m]));

  return entries
    .map((e) => {
      const mobile = byId.get(e.id);
      if (!mobile) return null;
      return {
        mobileId: mobile.id,
        mobileName: mobile.name,
        similarity: clampPct(e.similarity),
        similarAspects: strArray(e.similarAspects),
        keyDifferences: strArray(e.keyDifferences),
        aestheticMatch: typeof e.aestheticMatch === "string" ? e.aestheticMatch : "",
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.similarity - a.similarity);
}

export async function findSimilarPhonesFromImage(imageBase64: string, candidates: Mobile[]) {
  requireAI();

  // One vision call to describe the uploaded photo, then one text call to rank
  // all candidates against that description (instead of one AI call per phone).
  const imageAnalysis = await describeImage(
    "Describe this mobile phone's visual appearance in detail: overall shape, camera module design and placement, colors and finish, distinctive design elements, and any visible branding or text.",
    imageBase64
  );

  const list = candidates
    .slice(0, 15)
    .map((m) => `- ${m.name} (id: ${m.id}), brand ${m.brand}, camera ${m.shortSpecs?.camera ?? "?"}`)
    .join("\n");

  const raw = await generateText(
    "You match phones to photo descriptions. Respond with ONLY a single valid JSON array, no markdown, no commentary.",
    `A user uploaded a photo of a phone. Vision analysis of the photo:
${imageAnalysis}

Known phones in our database:
${list}

Rank which known phones most plausibly match the photo (consider brand hints, camera layout, colors). Include ONLY plausible matches (similarity above 20). Respond with ONLY a JSON array:
[
  { "id": "phone id exactly as given", "similarity": 0, "matchingFeatures": ["", ""], "confidence": 0 }
]`,
    1200
  );

  const parsed = parseJson(raw);
  const entries: any[] = Array.isArray(parsed) ? parsed : [];
  const byId = new Map(candidates.map((m) => [m.id, m]));

  return entries
    .map((e) => {
      const mobile = byId.get(e.id);
      if (!mobile) return null;
      return {
        phoneId: mobile.id,
        phoneName: mobile.name,
        similarity: clampPct(e.similarity),
        matchingFeatures: strArray(e.matchingFeatures),
        confidence: clampPct(e.confidence),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => r.similarity > 20)
    .sort((a, b) => b.similarity - a.similarity);
}
