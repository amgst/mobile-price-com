import OpenAI from "openai";
import type { Mobile } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: "dummy-key", // Will be set by server
  dangerouslyAllowBrowser: true
});

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

class AIAnalysisService {
  /**
   * Analyze camera quality based on specifications
   */
  async analyzeCameraQuality(mobile: Mobile): Promise<CameraQualityAnalysis> {
    try {
      // Use server endpoint for AI analysis
      const response = await fetch('/api/ai/analyze-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileId: mobile.id }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Server analysis failed');
      }
    } catch (error) {
      console.error('Camera quality analysis failed:', error);
      return this.getFallbackCameraAnalysis(mobile);
    }
  }

  async analyzeCameraQualityDirect(mobile: Mobile): Promise<CameraQualityAnalysis> {
    try {
      const cameraSpecs = this.extractCameraSpecs(mobile);
      
      const prompt = `Analyze the camera quality of this mobile phone based on its specifications:

Phone: ${mobile.name}
Camera Specifications: ${JSON.stringify(cameraSpecs, null, 2)}

Provide a detailed analysis in JSON format with:
1. Overall camera score (1-10)
2. Individual quality scores for daylight, low-light, portrait, and video (1-10 each)
3. Key strengths and weaknesses
4. Real-world performance comparison
5. What types of users this camera is best for

Consider factors like megapixel count, aperture, sensor size, optical image stabilization, computational photography features, etc.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert mobile phone camera analyst. Provide detailed, accurate assessments based on technical specifications. Respond in JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      return this.validateCameraAnalysis(analysis);
    } catch (error) {
      console.error('Camera quality analysis failed:', error);
      return this.getFallbackCameraAnalysis(mobile);
    }
  }

  /**
   * Analyze screen quality based on specifications
   */
  async analyzeScreenQuality(mobile: Mobile): Promise<ScreenQualityAnalysis> {
    try {
      // Use server endpoint for AI analysis
      const response = await fetch('/api/ai/analyze-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileId: mobile.id }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Server analysis failed');
      }
    } catch (error) {
      console.error('Screen quality analysis failed:', error);
      return this.getFallbackScreenAnalysis(mobile);
    }
  }

  async analyzeScreenQualityDirect(mobile: Mobile): Promise<ScreenQualityAnalysis> {
    try {
      const displaySpecs = this.extractDisplaySpecs(mobile);
      
      const prompt = `Analyze the screen quality of this mobile phone:

Phone: ${mobile.name}
Display Specifications: ${JSON.stringify(displaySpecs, null, 2)}

Provide analysis in JSON format with:
1. Overall screen score (1-10)
2. Individual scores for sharpness, color accuracy, brightness, viewing angles (1-10 each)
3. Key strengths and weaknesses
4. Best use case scenario
5. Comparison to typical phone displays

Consider resolution, PPI, panel type (OLED/LCD), refresh rate, brightness levels, color gamut, HDR support, etc.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert display technology analyst. Provide detailed assessments of mobile phone screens based on technical specifications. Respond in JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      return this.validateScreenAnalysis(analysis);
    } catch (error) {
      console.error('Screen quality analysis failed:', error);
      return this.getFallbackScreenAnalysis(mobile);
    }
  }

  /**
   * Find phones with similar design aesthetics
   */
  async findSimilarDesigns(targetMobile: Mobile, allMobiles: Mobile[]): Promise<DesignSimilarityResult[]> {
    try {
      // Use server endpoint for design similarity
      const response = await fetch('/api/ai/find-similar-designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          targetMobileId: targetMobile.id,
          candidateIds: allMobiles.filter(m => m.id !== targetMobile.id).slice(0, 10).map(m => m.id)
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Server analysis failed');
      }
    } catch (error) {
      console.error('Design similarity analysis failed:', error);
      return [];
    }
  }

  async findSimilarDesignsDirect(targetMobile: Mobile, allMobiles: Mobile[]): Promise<DesignSimilarityResult[]> {
    try {
      const targetSpecs = this.extractDesignSpecs(targetMobile);
      const candidates = allMobiles.filter(m => m.id !== targetMobile.id);
      
      const results: DesignSimilarityResult[] = [];
      
      for (const candidate of candidates.slice(0, 10)) { // Analyze top 10 candidates
        const candidateSpecs = this.extractDesignSpecs(candidate);
        
        const prompt = `Compare the design similarity between these two phones:

Target Phone: ${targetMobile.name}
Target Specs: ${JSON.stringify(targetSpecs, null, 2)}

Candidate Phone: ${candidate.name}
Candidate Specs: ${JSON.stringify(candidateSpecs, null, 2)}

Provide comparison in JSON format with:
1. Similarity percentage (0-100)
2. List of similar design aspects
3. Key design differences
4. Overall aesthetic match description`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert in mobile phone design and aesthetics. Compare phones based on build quality, materials, design language, and overall aesthetic appeal. Respond in JSON format only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        });

        const similarity = JSON.parse(response.choices[0].message.content || "{}");
        results.push(this.validateDesignSimilarity(similarity));
      }
      
      return results.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Design similarity analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze uploaded photo to find similar-looking phones
   */
  async findSimilarPhones(imageBase64: string, allMobiles: Mobile[]): Promise<PhotoSimilarityResult[]> {
    try {
      // Use server endpoint for photo similarity
      const response = await fetch('/api/ai/find-similar-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageBase64,
          mobileIds: allMobiles.slice(0, 15).map(m => m.id)
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Server analysis failed');
      }
    } catch (error) {
      console.error('Photo similarity analysis failed:', error);
      return [];
    }
  }

  async findSimilarPhonesDirect(imageBase64: string, allMobiles: Mobile[]): Promise<PhotoSimilarityResult[]> {
    try {
      const prompt = `Analyze this phone image and identify key visual characteristics:

Look for:
1. Overall shape and form factor
2. Camera module design and placement
3. Color scheme and finish
4. Button placement
5. Screen-to-body ratio
6. Distinctive design elements

Describe the phone's visual appearance in detail, focusing on design elements that would help match it to similar phones.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in mobile phone design recognition. Analyze images and describe key visual characteristics that distinguish different phone models."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3
      });

      const imageAnalysis = response.choices[0].message.content || "";
      
      // Now match against available phones
      const results: PhotoSimilarityResult[] = [];
      
      for (const mobile of allMobiles.slice(0, 15)) { // Analyze top 15 phones
        const matchPrompt = `Compare this phone description with the visual characteristics from the uploaded image:

Image Analysis: ${imageAnalysis}

Phone to Compare: ${mobile.name}
Brand: ${mobile.brand}
Specifications: ${JSON.stringify(this.extractDesignSpecs(mobile), null, 2)}

Provide matching analysis in JSON format with:
1. Similarity percentage (0-100)
2. List of matching visual features
3. Confidence level (0-100)`;

        const matchResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert at matching phones based on visual similarity. Compare uploaded images with phone specifications and design descriptions. Respond in JSON format only."
            },
            {
              role: "user",
              content: matchPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        });

        const match = JSON.parse(matchResponse.choices[0].message.content || "{}");
        results.push({
          phoneId: mobile.id,
          phoneName: mobile.name,
          similarity: Math.min(100, Math.max(0, match.similarity || 0)),
          matchingFeatures: match.matchingFeatures || [],
          confidence: Math.min(100, Math.max(0, match.confidence || 0))
        });
      }

      return results
        .filter(r => r.similarity > 20) // Only show reasonable matches
        .sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Photo similarity analysis failed:', error);
      return [];
    }
  }

  // Helper methods
  private extractCameraSpecs(mobile: Mobile) {
    return {
      mainCamera: this.findSpec(mobile, "camera", "rear") || this.findSpec(mobile, "camera", "main") || "Not specified",
      frontCamera: this.findSpec(mobile, "camera", "front") || this.findSpec(mobile, "camera", "selfie") || "Not specified",
      videoRecording: this.findSpec(mobile, "camera", "video") || "Not specified",
      features: this.getSpecCategory(mobile, "camera")?.specs?.map(s => s.feature) || []
    };
  }

  private extractDisplaySpecs(mobile: Mobile) {
    return {
      screenSize: this.findSpec(mobile, "display", "size") || "Not specified",
      resolution: this.findSpec(mobile, "display", "resolution") || "Not specified",
      displayType: this.findSpec(mobile, "display", "type") || this.findSpec(mobile, "display", "technology") || "Not specified",
      refreshRate: this.findSpec(mobile, "display", "refresh") || "60Hz",
      ppi: this.findSpec(mobile, "display", "ppi") || this.findSpec(mobile, "display", "density") || "Not specified"
    };
  }

  private extractDesignSpecs(mobile: Mobile) {
    return {
      brand: mobile.brand,
      dimensions: mobile.dimensions,
      buildMaterial: this.findSpec(mobile, "build", "material") || this.findSpec(mobile, "design", "build") || "Not specified",
      colors: this.findSpec(mobile, "design", "color")?.split(",") || [],
      weight: mobile.dimensions?.weight || "Not specified"
    };
  }

  private findSpec(mobile: Mobile, category: string, feature: string): string | null {
    if (!mobile.specifications || !Array.isArray(mobile.specifications)) {
      return null;
    }

    const categorySpec = mobile.specifications.find(spec => 
      spec.category?.toLowerCase().includes(category.toLowerCase())
    );

    if (!categorySpec || !categorySpec.specs) {
      return null;
    }

    const featureSpec = categorySpec.specs.find(spec => 
      spec.feature?.toLowerCase().includes(feature.toLowerCase())
    );

    return featureSpec?.value || null;
  }

  private getSpecCategory(mobile: Mobile, category: string) {
    if (!mobile.specifications || !Array.isArray(mobile.specifications)) {
      return null;
    }

    return mobile.specifications.find(spec => 
      spec.category?.toLowerCase().includes(category.toLowerCase())
    );
  }

  private validateCameraAnalysis(analysis: any): CameraQualityAnalysis {
    return {
      overallScore: Math.min(10, Math.max(1, analysis.overallScore || 5)),
      photoQuality: {
        daylight: Math.min(10, Math.max(1, analysis.photoQuality?.daylight || 5)),
        lowLight: Math.min(10, Math.max(1, analysis.photoQuality?.lowLight || 4)),
        portrait: Math.min(10, Math.max(1, analysis.photoQuality?.portrait || 5)),
        video: Math.min(10, Math.max(1, analysis.photoQuality?.video || 5))
      },
      strengths: analysis.strengths || ["Good overall performance"],
      weaknesses: analysis.weaknesses || ["Average in some conditions"],
      realWorldComparison: analysis.realWorldComparison || "Comparable to similar phones in this price range",
      recommendedFor: analysis.recommendedFor || ["General users"]
    };
  }

  private validateScreenAnalysis(analysis: any): ScreenQualityAnalysis {
    return {
      overallScore: Math.min(10, Math.max(1, analysis.overallScore || 5)),
      displayMetrics: {
        sharpness: Math.min(10, Math.max(1, analysis.displayMetrics?.sharpness || 5)),
        colorAccuracy: Math.min(10, Math.max(1, analysis.displayMetrics?.colorAccuracy || 5)),
        brightness: Math.min(10, Math.max(1, analysis.displayMetrics?.brightness || 5)),
        viewingAngles: Math.min(10, Math.max(1, analysis.displayMetrics?.viewingAngles || 5))
      },
      strengths: analysis.strengths || ["Good display quality"],
      weaknesses: analysis.weaknesses || ["Some limitations in bright sunlight"],
      bestUseCase: analysis.bestUseCase || "General use and media consumption",
      comparison: analysis.comparison || "Competitive display for its category"
    };
  }

  private validateDesignSimilarity(similarity: any): DesignSimilarityResult {
    return {
      similarity: Math.min(100, Math.max(0, similarity.similarity || 0)),
      similarAspects: similarity.similarAspects || [],
      keyDifferences: similarity.keyDifferences || [],
      aestheticMatch: similarity.aestheticMatch || "Some design similarities"
    };
  }

  private getFallbackCameraAnalysis(mobile: Mobile): CameraQualityAnalysis {
    // Brand-based fallback scores
    const brandScores: Record<string, number> = {
      'apple': 8.5,
      'samsung': 8.0,
      'google': 8.5,
      'oneplus': 7.5,
      'xiaomi': 7.0,
      'oppo': 6.5,
      'vivo': 6.5
    };

    const baseScore = brandScores[mobile.brand.toLowerCase()] || 6.0;

    return {
      overallScore: baseScore,
      photoQuality: {
        daylight: baseScore,
        lowLight: baseScore - 1,
        portrait: baseScore - 0.5,
        video: baseScore - 0.5
      },
      strengths: ["Reliable camera performance", "Good color reproduction"],
      weaknesses: ["May struggle in very low light", "Limited zoom capabilities"],
      realWorldComparison: `Performs well for a ${mobile.brand} device in this category`,
      recommendedFor: ["General photography", "Social media sharing"]
    };
  }

  private getFallbackScreenAnalysis(mobile: Mobile): ScreenQualityAnalysis {
    const brandScores: Record<string, number> = {
      'apple': 9.0,
      'samsung': 8.5,
      'google': 7.5,
      'oneplus': 8.0,
      'xiaomi': 7.0,
      'oppo': 6.5,
      'vivo': 6.5
    };

    const baseScore = brandScores[mobile.brand.toLowerCase()] || 6.5;

    return {
      overallScore: baseScore,
      displayMetrics: {
        sharpness: baseScore,
        colorAccuracy: baseScore - 0.5,
        brightness: baseScore - 1,
        viewingAngles: baseScore - 0.5
      },
      strengths: ["Good screen clarity", "Decent color reproduction"],
      weaknesses: ["May not be visible in direct sunlight", "Average viewing angles"],
      bestUseCase: "Indoor use and media consumption",
      comparison: `Quality display typical of ${mobile.brand} phones`
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();