import type { Express } from "express";
import { storage } from "./storage.js";
import {
  analyzeCamera,
  analyzeScreen,
  findSimilarDesigns,
  findSimilarPhonesFromImage,
} from "./ai-analysis-core.js";

export function setupAIAnalysisRoutes(app: Express) {
  // Camera Quality Analysis
  app.post('/api/ai/analyze-camera', async (req, res) => {
    try {
      const { mobileId } = req.body;
      const mobile = await storage.getMobileById(mobileId);
      if (!mobile) {
        return res.status(404).json({ error: 'Mobile not found' });
      }
      res.json(await analyzeCamera(mobile));
    } catch (error: any) {
      console.error('Camera analysis error:', error);
      res.status(500).json({ error: error?.message || 'Analysis failed' });
    }
  });

  // Screen Quality Analysis
  app.post('/api/ai/analyze-screen', async (req, res) => {
    try {
      const { mobileId } = req.body;
      const mobile = await storage.getMobileById(mobileId);
      if (!mobile) {
        return res.status(404).json({ error: 'Mobile not found' });
      }
      res.json(await analyzeScreen(mobile));
    } catch (error: any) {
      console.error('Screen analysis error:', error);
      res.status(500).json({ error: error?.message || 'Analysis failed' });
    }
  });

  // Design Similarity Analysis
  app.post('/api/ai/find-similar-designs', async (req, res) => {
    try {
      const { targetMobileId, candidateIds } = req.body;
      const targetMobile = await storage.getMobileById(targetMobileId);
      if (!targetMobile) {
        return res.status(404).json({ error: 'Target mobile not found' });
      }

      const candidates = (
        await Promise.all(
          (Array.isArray(candidateIds) ? candidateIds : []).slice(0, 8).map((id: string) => storage.getMobileById(id))
        )
      ).filter((m): m is NonNullable<typeof m> => !!m);

      res.json(await findSimilarDesigns(targetMobile, candidates));
    } catch (error: any) {
      console.error('Design similarity error:', error);
      res.status(500).json({ error: error?.message || 'Analysis failed' });
    }
  });

  // Photo Similarity Analysis
  app.post('/api/ai/find-similar-photos', async (req, res) => {
    try {
      const { imageBase64, mobileIds } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      const candidates = (
        await Promise.all(
          (Array.isArray(mobileIds) ? mobileIds : []).slice(0, 15).map((id: string) => storage.getMobileById(id))
        )
      ).filter((m): m is NonNullable<typeof m> => !!m);

      res.json(await findSimilarPhonesFromImage(imageBase64, candidates));
    } catch (error: any) {
      console.error('Photo similarity error:', error);
      res.status(500).json({ error: error?.message || 'Analysis failed' });
    }
  });
}
