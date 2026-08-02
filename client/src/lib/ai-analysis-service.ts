import type { Mobile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export interface CameraQualityAnalysis {
  overallScore: number; // 1-10
  photoQuality: {
    daylight: number;
    lowLight: number;
    portrait: number;
    video: number;
  };
  strengths: string[];
  weaknesses: string[];
  realWorldComparison: string;
  recommendedFor: string[];
}

export interface ScreenQualityAnalysis {
  overallScore: number; // 1-10
  displayMetrics: {
    sharpness: number;
    colorAccuracy: number;
    brightness: number;
    viewingAngles: number;
  };
  strengths: string[];
  weaknesses: string[];
  bestUseCase: string;
  comparison: string;
}

export interface DesignSimilarityResult {
  mobileId?: string;
  mobileName?: string;
  similarity: number; // 0-100%
  similarAspects: string[];
  keyDifferences: string[];
  aestheticMatch: string;
}

export interface PhotoSimilarityResult {
  phoneId: string;
  phoneName: string;
  similarity: number; // 0-100%
  matchingFeatures: string[];
  confidence: number;
}

// All analysis runs server-side (Cloudflare Workers AI). Failures throw so the
// UI can show a real error instead of pretending with fabricated results.
async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

class AIAnalysisService {
  async analyzeCameraQuality(mobile: Mobile): Promise<CameraQualityAnalysis> {
    return post("/api/ai/analyze-camera", { mobileId: mobile.id });
  }

  async analyzeScreenQuality(mobile: Mobile): Promise<ScreenQualityAnalysis> {
    return post("/api/ai/analyze-screen", { mobileId: mobile.id });
  }

  async findSimilarDesigns(targetMobile: Mobile, allMobiles: Mobile[]): Promise<DesignSimilarityResult[]> {
    return post("/api/ai/find-similar-designs", {
      targetMobileId: targetMobile.id,
      candidateIds: allMobiles
        .filter((m) => m.id !== targetMobile.id)
        .slice(0, 8)
        .map((m) => m.id),
    });
  }

  async findSimilarPhones(imageBase64: string, allMobiles: Mobile[]): Promise<PhotoSimilarityResult[]> {
    return post("/api/ai/find-similar-photos", {
      imageBase64,
      mobileIds: allMobiles.slice(0, 15).map((m) => m.id),
    });
  }
}

export const aiAnalysisService = new AIAnalysisService();
