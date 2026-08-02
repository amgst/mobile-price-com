import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAIAnalysisRoutes } from "./ai-analysis-routes.js";
import { registerSitemapRoutes } from "./sitemap-routes.js";
import { registerExportRoutes } from "./export-routes.js";
import { insertBrandSchema, insertMobileSchema, insertUsedListingSchema } from "../shared/schema.js";
import { aiService } from "./ai-service.js";
import { createPresignedUpload, uploadBufferToR2 } from "./r2.js";
import { 
  requireJWTAuth, 
  handleJWTLogin, 
  handleJWTLogout, 
  checkJWTAuthStatus 
} from "./jwt-auth-middleware.js";
import { z } from "zod";

function mapDatabaseError(error: any, fallbackMessage: string) {
  const root = error?.cause ?? error;
  const code = (root?.code ?? error?.code) as string | undefined;
  const detail = (root?.detail ?? error?.detail) as string | undefined;
  const rawMessage = (root?.message ?? error?.message) as string | undefined;

  if (code === "23505") {
    const constraint = (error?.constraint as string | undefined) || "";
    if (constraint.includes("slug")) {
      return { status: 409, message: "Slug already exists. Please use a unique slug." };
    }
    return { status: 409, message: "Duplicate value detected. Please use unique values." };
  }

  if (code === "23502") {
    const columnMatch = rawMessage?.match(/column "([^"]+)"/i);
    const column = columnMatch?.[1] || "field";
    return { status: 400, message: `Missing required field: ${column}` };
  }

  if (code === "42P01") {
    return {
      status: 500,
      message: "Database table not found. Run `npm run db:push` to create/update schema.",
    };
  }

  if (code === "42703") {
    return {
      status: 500,
      message: "Database schema mismatch. Run `npm run db:push` to update schema.",
    };
  }

  if (detail) {
    return { status: 400, message: detail };
  }

  if (rawMessage) {
    return { status: 500, message: rawMessage };
  }

  return { status: 500, message: fallbackMessage };
}

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
      const { brand, featured, search, priceMin, priceMax, sort, limit, offset } = req.query;

      if (featured === "true") {
        const items = await storage.getFeaturedMobiles();
        return res.json(items);
      }

      const parsedPriceMin = priceMin !== undefined ? parseInt(priceMin as string, 10) : undefined;
      const parsedPriceMax = priceMax !== undefined ? parseInt(priceMax as string, 10) : undefined;
      const parsedLimit = limit !== undefined ? parseInt(limit as string, 10) : undefined;
      const parsedOffset = offset !== undefined ? parseInt(offset as string, 10) : undefined;
      const allowedSorts = ["price_asc", "price_desc", "newest", "oldest"] as const;
      const parsedSort = allowedSorts.includes(sort as any) ? (sort as (typeof allowedSorts)[number]) : undefined;

      // No filter/sort/pagination params requested: preserve the original
      // "return everything" behavior relied on by several client pages.
      if (
        !brand &&
        !search &&
        parsedPriceMin === undefined &&
        parsedPriceMax === undefined &&
        !parsedSort &&
        parsedLimit === undefined &&
        parsedOffset === undefined
      ) {
        return res.json(await storage.getAllMobiles());
      }

      const result = await storage.getMobilesFiltered({
        brandSlug: brand as string | undefined,
        search: search as string | undefined,
        priceMin: Number.isNaN(parsedPriceMin as number) ? undefined : parsedPriceMin,
        priceMax: Number.isNaN(parsedPriceMax as number) ? undefined : parsedPriceMax,
        sort: parsedSort,
        limit: Number.isNaN(parsedLimit as number) ? undefined : parsedLimit,
        offset: Number.isNaN(parsedOffset as number) ? undefined : parsedOffset,
      });

      // Keep the response shape a bare array for backward compatibility with
      // existing consumers (admin, AI components, sitemap page, etc.) that
      // expect Mobile[]. Callers that need the total count for pagination
      // can read the X-Total-Count header.
      res.setHeader("X-Total-Count", String(result.total));
      res.json(result.items);
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
      console.error("Failed to create mobile:", error);
      const mapped = mapDatabaseError(error, "Failed to create mobile");
      res.status(mapped.status).json({ message: mapped.message });
    }
  });

  // Data Import Routes
  app.get("/api/admin/import/status", async (req, res) => {
    try {
      const [brands, mobiles] = await Promise.all([
        storage.getAllBrands(),
        storage.getAllMobiles(),
      ]);
      res.json({ totalBrands: brands.length, totalMobiles: mobiles.length });
    } catch (error) {
      console.error("Import status failed:", error);
      res.status(500).json({ message: "Failed to get import status", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Import a mobile from an external page URL: fetch the page, extract specs with AI,
  // and return an editable draft. Nothing is saved until the admin reviews and submits it.
  app.post("/api/admin/import/url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "url is required" });
      }
      const { importFromUrl } = await import("./data-import/url-import-service.js");
      const draft = await importFromUrl(url.trim());
      res.json(draft);
    } catch (error) {
      console.error("URL import failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to import from URL" });
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
      console.error("Failed to update mobile:", error);
      const mapped = mapDatabaseError(error, "Failed to update mobile");
      res.status(mapped.status).json({ message: mapped.message });
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

  // Image upload signing (public - used by the sell-your-phone form)
  app.post("/api/uploads/sign", async (req, res) => {
    try {
      const { fileName, contentType } = req.body || {};
      if (!fileName || !contentType) {
        return res.status(400).json({ message: "fileName and contentType are required" });
      }
      const result = await createPresignedUpload(fileName, contentType);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to sign upload" });
    }
  });

  // Used listings (sell-your-phone marketplace)
  app.get("/api/listings", async (req, res) => {
    try {
      const { brand, city, search } = req.query;
      const listings = await storage.getApprovedUsedListings({
        brand: brand as string | undefined,
        city: city as string | undefined,
        search: search as string | undefined,
      });
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getApprovedUsedListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const listingData = insertUsedListingSchema.parse(req.body);
      const listing = await storage.createUsedListing(listingData);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid listing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.get("/api/admin/listings", async (req, res) => {
    try {
      const listings = await storage.getAllUsedListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Admin-created listing (published immediately, no moderation queue)
  app.post("/api/admin/listings", async (req, res) => {
    try {
      const listingData = insertUsedListingSchema.parse(req.body);
      const listing = await storage.createUsedListing(listingData);
      const published = await storage.updateUsedListingStatus(listing.id, "approved");
      res.status(201).json(published);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid listing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  // AI-assisted listing description
  app.post("/api/admin/ai/listing-description", async (req, res) => {
    try {
      const { brand, model, condition, price, city } = req.body || {};
      if (!brand || !model || !condition) {
        return res.status(400).json({ message: "brand, model, and condition are required" });
      }
      const description = await aiService.generateListingDescription({ brand, model, condition, price, city });
      res.json({ description });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate description" });
    }
  });

  // AI-generated listing photo
  app.post("/api/admin/ai/listing-image", async (req, res) => {
    try {
      const { brand, model, condition } = req.body || {};
      if (!brand || !model || !condition) {
        return res.status(400).json({ message: "brand, model, and condition are required" });
      }
      const { buffer, contentType } = await aiService.generateListingImage({ brand, model, condition });
      const url = await uploadBufferToR2(buffer, contentType, "png", "used-listings");
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate image" });
    }
  });

  app.put("/api/admin/listings/:id", async (req, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "approved", "rejected", "sold"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const listing = await storage.updateUsedListingStatus(req.params.id, status);
      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/admin/listings/:id", async (req, res) => {
    try {
      await storage.deleteUsedListing(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete listing" });
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

  // One-shot: type a phone name, get a fully populated draft (specs + AI photo)
  app.post("/api/admin/ai/generate-mobile-draft", async (req, res) => {
    try {
      const { name } = req.body || {};
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "name is required" });
      }
      const trimmedName = name.trim();

      const draft = await aiService.generateMobileDraft(trimmedName);

      // Resolve the AI-suggested brand against real brands, auto-creating one if needed
      // so the phone always has a valid, visible home on a brand page.
      let brandSlug = draft.brand;
      if (brandSlug) {
        const allBrands = await storage.getAllBrands();
        const matched = allBrands.find(
          (b) => b.slug === brandSlug || b.name.toLowerCase() === brandSlug.replace(/-/g, " ")
        );
        if (matched) {
          brandSlug = matched.slug;
        } else {
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
        }
      }

      let imageUrl = "";
      let carouselImages: string[] = [];
      try {
        const images = await aiService.generateMobileImages({ brand: brandSlug, model: draft.model });
        carouselImages = await Promise.all(
          images.map(({ buffer, contentType }) => uploadBufferToR2(buffer, contentType, "jpg", "mobiles"))
        );
        imageUrl = carouselImages[0] || "";
      } catch (imageError) {
        console.error("AI mobile photo generation skipped:", imageError);
      }

      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      res.json({
        name: trimmedName,
        slug,
        brand: brandSlug,
        model: draft.model,
        releaseDate: draft.releaseDate,
        price: draft.price,
        shortSpecs: draft.shortSpecs,
        specifications: draft.specifications,
        dimensions: draft.dimensions,
        buildMaterials: draft.buildMaterials,
        imageUrl,
        carouselImages,
      });
    } catch (error: any) {
      console.error("AI mobile draft generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate mobile draft" });
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
