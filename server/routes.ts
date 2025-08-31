import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAIAnalysisRoutes } from "./ai-analysis-routes.js";
import { registerSitemapRoutes } from "./sitemap-routes.js";
import { registerExportRoutes } from "./export-routes.js";
import { insertBrandSchema, insertMobileSchema } from "../shared/schema.js";
import { aiService } from "./ai-service.js";
import { 
  requireJWTAuth, 
  handleJWTLogin, 
  handleJWTLogout, 
  checkJWTAuthStatus 
} from "./jwt-auth-middleware.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (public)
  app.post("/api/auth/login", handleJWTLogin);
  app.post("/api/auth/logout", handleJWTLogout);
  app.get("/api/auth/status", checkJWTAuthStatus);
  
  // Setup AI Analysis routes
  setupAIAnalysisRoutes(app);
  
  // Setup SEO routes (sitemap, robots.txt)
  registerSitemapRoutes(app);
  
  // Setup database export routes (protected)
  app.use('/api/export', requireJWTAuth);
  registerExportRoutes(app);
  
  // Protect all admin routes
  app.use('/api/admin', requireJWTAuth);
  
  // Brands API
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getAllBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.get("/api/brands/:slug", async (req, res) => {
    try {
      const brand = await storage.getBrandBySlug(req.params.slug);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.json(brand);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brand" });
    }
  });

  app.post("/api/admin/brands", async (req, res) => {
    try {
      const brandData = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(brandData);
      res.status(201).json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid brand data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  app.put("/api/admin/brands/:id", async (req, res) => {
    try {
      const brandData = insertBrandSchema.partial().parse(req.body);
      const brand = await storage.updateBrand(req.params.id, brandData);
      res.json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid brand data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update brand" });
    }
  });

  app.delete("/api/admin/brands/:id", async (req, res) => {
    try {
      await storage.deleteBrand(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  // Mobiles API
  app.get("/api/mobiles", async (req, res) => {
    try {
      const { brand, featured, search } = req.query;
      
      let mobiles;
      if (brand) {
        mobiles = await storage.getMobilesByBrand(brand as string);
      } else if (featured === "true") {
        mobiles = await storage.getFeaturedMobiles();
      } else if (search) {
        mobiles = await storage.searchMobiles(search as string);
      } else {
        mobiles = await storage.getAllMobiles();
      }
      
      res.json(mobiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mobiles" });
    }
  });

  app.get("/api/mobiles/:brand/:slug", async (req, res) => {
    try {
      const mobile = await storage.getMobileBySlug(req.params.brand, req.params.slug);
      if (!mobile) {
        return res.status(404).json({ message: "Mobile not found" });
      }
      res.json(mobile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mobile" });
    }
  });

  app.get("/api/admin/mobiles/:id", async (req, res) => {
    try {
      const mobile = await storage.getMobileById(req.params.id);
      if (!mobile) {
        return res.status(404).json({ message: "Mobile not found" });
      }
      res.json(mobile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mobile" });
    }
  });

  app.post("/api/admin/mobiles", async (req, res) => {
    try {
      const mobileData = insertMobileSchema.parse(req.body);
      const mobile = await storage.createMobile(mobileData);
      res.status(201).json(mobile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mobile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mobile" });
    }
  });

  // Data Import Routes
  app.post("/api/admin/import/brands", async (req, res) => {
    try {
      const { ImportService } = await import("./data-import/import-service");
      const importService = new ImportService();
      const results = await importService.importBrands();
      res.json(results);
    } catch (error) {
      console.error("Brand import failed:", error);
      res.status(500).json({ message: "Failed to import brands", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/import/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const { ImportService } = await import("./data-import/import-service");
      const importService = new ImportService();
      const results = await importService.importLatestMobiles(limit);
      res.json(results);
    } catch (error) {
      console.error("Latest mobiles import failed:", error);
      res.status(500).json({ message: "Failed to import latest mobiles", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/import/brand/:brandName", async (req, res) => {
    try {
      const brandName = req.params.brandName;
      const limit = parseInt(req.query.limit as string) || 20;
      const { ImportService } = await import("./data-import/import-service");
      const importService = new ImportService();
      const results = await importService.importMobilesByBrand(brandName, limit);
      res.json(results);
    } catch (error) {
      console.error(`Brand ${req.params.brandName} import failed:`, error);
      res.status(500).json({ message: `Failed to import mobiles for brand ${req.params.brandName}`, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/import/popular", async (req, res) => {
    try {
      const { ImportService } = await import("./data-import/import-service");
      const importService = new ImportService();
      const results = await importService.importPopularBrands();
      res.json(results);
    } catch (error) {
      console.error("Popular brands import failed:", error);
      res.status(500).json({ message: "Failed to import popular brands", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/import/search", async (req, res) => {
    try {
      const { query, limit = 10 } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const { ImportService } = await import("./data-import/import-service");
      const importService = new ImportService();
      const results = await importService.searchAndImportMobiles(query, limit);
      res.json(results);
    } catch (error) {
      console.error("Search import failed:", error);
      res.status(500).json({ message: "Failed to import searched mobiles", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/import/status", async (req, res) => {
    try {
      const { ImportService } = await import("./data-import/import-service");
      const importService = new ImportService();
      const status = await importService.getImportStatus();
      res.json(status);
    } catch (error) {
      console.error("Import status failed:", error);
      res.status(500).json({ message: "Failed to get import status", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/admin/mobiles/:id", async (req, res) => {
    try {
      const mobileData = insertMobileSchema.partial().parse(req.body);
      const mobile = await storage.updateMobile(req.params.id, mobileData);
      res.json(mobile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mobile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update mobile" });
    }
  });

  app.delete("/api/admin/mobiles/:id", async (req, res) => {
    try {
      await storage.deleteMobile(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mobile" });
    }
  });

  // AI Enhancement API endpoints
  app.post("/api/admin/ai/enhance-mobile", async (req, res) => {
    try {
      const { mobileData } = req.body;
      if (!mobileData) {
        return res.status(400).json({ message: "Mobile data is required" });
      }

      const enhancement = await aiService.enhanceMobileData(mobileData);
      res.json(enhancement);
    } catch (error: any) {
      console.error("AI enhancement error:", error);
      res.status(500).json({ message: error.message || "Failed to enhance mobile data" });
    }
  });

  app.post("/api/admin/ai/generate-specs", async (req, res) => {
    try {
      const { brand, model, year } = req.body;
      if (!brand || !model) {
        return res.status(400).json({ message: "Brand and model are required" });
      }

      const specs = await aiService.generateMobileSpecs(brand, model, year);
      res.json(specs);
    } catch (error: any) {
      console.error("AI spec generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate mobile specs" });
    }
  });

  app.post("/api/admin/ai/detailed-specs", async (req, res) => {
    try {
      const { mobileData } = req.body;
      if (!mobileData) {
        return res.status(400).json({ message: "Mobile data is required" });
      }

      const detailedSpecs = await aiService.generateDetailedSpecs(mobileData);
      res.json({ specifications: detailedSpecs });
    } catch (error: any) {
      console.error("AI detailed specs error:", error);
      res.status(500).json({ message: error.message || "Failed to generate detailed specs" });
    }
  });

  app.post("/api/admin/ai/similar-phones", async (req, res) => {
    try {
      const { mobileData } = req.body;
      if (!mobileData) {
        return res.status(400).json({ message: "Mobile data is required" });
      }

      const allMobiles = await storage.getAllMobiles();
      const mobilesForAI = allMobiles.map(m => ({
        name: m.name,
        brand: m.brand,
        model: m.model,
        price: m.price || undefined,
        shortSpecs: m.shortSpecs,
      }));
      const suggestions = await aiService.suggestSimilarPhones(mobileData, mobilesForAI);
      res.json({ suggestions });
    } catch (error: any) {
      console.error("AI similar phones error:", error);
      res.status(500).json({ message: error.message || "Failed to suggest similar phones" });
    }
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
