import type { Express, Request, Response } from "express";
import { storage } from "./storage.js";
import { generateSitemapEntries, generateSitemapXML } from "../client/src/components/seo/sitemap-generator.js";

export function registerSitemapRoutes(app: Express) {
  // XML Sitemap endpoint
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
      // Get all mobiles and brands from storage
      const mobiles = await storage.getAllMobiles();
      const brands = await storage.getAllBrands();
      
      // Generate sitemap entries
      const entries = generateSitemapEntries(mobiles, brands);
      
      // Generate XML
      const xml = generateSitemapXML(entries);
      
      // Set proper headers
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt endpoint
  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = process.env.VITE_SITE_URL || 'https://mobile-price.com';
    
    const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API routes
Disallow: /admin/
Disallow: /api/

# Allow all search engines to crawl
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawl-delay for polite crawling
Crawl-delay: 1`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    res.send(robotsTxt);
  });
}