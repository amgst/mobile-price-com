import type { Express } from "express";
import OpenAI from "openai";
import { storage } from "./storage.js";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

export function setupAIAnalysisRoutes(app: Express) {
  // Camera Quality Analysis
  app.post('/api/ai/analyze-camera', async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured. AI analysis features are unavailable.' });
      }
      
      const { mobileId } = req.body;
      const mobile = await storage.getMobile(mobileId);
      
      if (!mobile) {
        return res.status(404).json({ error: 'Mobile not found' });
      }

      const cameraSpecs = {
        mainCamera: mobile.specifications?.camera?.rear || "Not specified",
        frontCamera: mobile.specifications?.camera?.front || "Not specified", 
        videoRecording: mobile.specifications?.camera?.video || "Not specified",
        features: mobile.specifications?.camera?.features || []
      };

      const prompt = `Analyze the camera quality of this mobile phone based on its specifications:

Phone: ${mobile.name}
Camera Specifications: ${JSON.stringify(cameraSpecs, null, 2)}

Provide a detailed analysis in JSON format with:
1. Overall camera score (1-10)
2. Individual quality scores for daylight, low-light, portrait, and video (1-10 each)
3. Key strengths and weaknesses (arrays)
4. Real-world performance comparison (string)
5. What types of users this camera is best for (array)

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
      res.json(validateCameraAnalysis(analysis));
    } catch (error) {
      console.error('Camera analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Screen Quality Analysis
  app.post('/api/ai/analyze-screen', async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured. AI analysis features are unavailable.' });
      }
      
      const { mobileId } = req.body;
      const mobile = await storage.getMobile(mobileId);
      
      if (!mobile) {
        return res.status(404).json({ error: 'Mobile not found' });
      }

      const displaySpecs = {
        screenSize: mobile.specifications?.display?.size || "Not specified",
        resolution: mobile.specifications?.display?.resolution || "Not specified",
        displayType: mobile.specifications?.display?.type || "Not specified",
        refreshRate: mobile.specifications?.display?.refreshRate || "60Hz",
        ppi: mobile.specifications?.display?.ppi || "Not specified"
      };

      const prompt = `Analyze the screen quality of this mobile phone:

Phone: ${mobile.name}
Display Specifications: ${JSON.stringify(displaySpecs, null, 2)}

Provide analysis in JSON format with:
1. Overall screen score (1-10)
2. Individual scores for sharpness, color accuracy, brightness, viewing angles (1-10 each)
3. Key strengths and weaknesses (arrays)
4. Best use case scenario (string)
5. Comparison to typical phone displays (string)

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
      res.json(validateScreenAnalysis(analysis));
    } catch (error) {
      console.error('Screen analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Design Similarity Analysis
  app.post('/api/ai/find-similar-designs', async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured. AI analysis features are unavailable.' });
      }
      
      const { targetMobileId, candidateIds } = req.body;
      const targetMobile = await storage.getMobile(targetMobileId);
      
      if (!targetMobile) {
        return res.status(404).json({ error: 'Target mobile not found' });
      }

      const results = [];
      
      for (const candidateId of candidateIds.slice(0, 5)) { // Limit for performance
        const candidate = await storage.getMobile(candidateId);
        if (!candidate) continue;

        const targetSpecs = {
          brand: targetMobile.brand,
          dimensions: targetMobile.dimensions,
          buildMaterial: targetMobile.specifications?.build || "Not specified",
          colors: targetMobile.specifications?.colors || [],
          weight: targetMobile.dimensions?.weight || "Not specified"
        };

        const candidateSpecs = {
          brand: candidate.brand,
          dimensions: candidate.dimensions,
          buildMaterial: candidate.specifications?.build || "Not specified",
          colors: candidate.specifications?.colors || [],
          weight: candidate.dimensions?.weight || "Not specified"
        };

        const prompt = `Compare the design similarity between these two phones:

Target Phone: ${targetMobile.name}
Target Specs: ${JSON.stringify(targetSpecs, null, 2)}

Candidate Phone: ${candidate.name}
Candidate Specs: ${JSON.stringify(candidateSpecs, null, 2)}

Provide comparison in JSON format with:
1. similarity: percentage (0-100)
2. similarAspects: array of similar design aspects
3. keyDifferences: array of key design differences
4. aestheticMatch: string describing overall aesthetic match`;

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
        results.push({
          mobileId: candidateId,
          mobileName: candidate.name,
          similarity: Math.min(100, Math.max(0, similarity.similarity || 0)),
          similarAspects: similarity.similarAspects || [],
          keyDifferences: similarity.keyDifferences || [],
          aestheticMatch: similarity.aestheticMatch || "Some design similarities"
        });
      }
      
      res.json(results.sort((a, b) => b.similarity - a.similarity));
    } catch (error) {
      console.error('Design similarity error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Photo Similarity Analysis
  app.post('/api/ai/find-similar-photos', async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured. AI analysis features are unavailable.' });
      }
      
      const { imageBase64, mobileIds } = req.body;

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
      const results = [];
      
      // Match against available phones
      for (const mobileId of mobileIds.slice(0, 8)) { // Limit for performance
        const mobile = await storage.getMobile(mobileId);
        if (!mobile) continue;

        const designSpecs = {
          brand: mobile.brand,
          dimensions: mobile.dimensions,
          buildMaterial: mobile.specifications?.build || "Not specified",
          colors: mobile.specifications?.colors || []
        };

        const matchPrompt = `Compare this phone description with the visual characteristics from the uploaded image:

Image Analysis: ${imageAnalysis}

Phone to Compare: ${mobile.name}
Brand: ${mobile.brand}
Specifications: ${JSON.stringify(designSpecs, null, 2)}

Provide matching analysis in JSON format with:
1. similarity: percentage (0-100)
2. matchingFeatures: array of matching visual features
3. confidence: level (0-100)`;

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

      const filteredResults = results
        .filter(r => r.similarity > 20)
        .sort((a, b) => b.similarity - a.similarity);

      res.json(filteredResults);
    } catch (error) {
      console.error('Photo similarity error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });
}

function validateCameraAnalysis(analysis: any) {
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

function validateScreenAnalysis(analysis: any) {
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