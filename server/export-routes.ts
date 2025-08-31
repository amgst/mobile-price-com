import type { Express, Request, Response } from "express";
import { storage } from "./storage.js";
import * as csvWriter from "csv-writer";

export function registerExportRoutes(app: Express) {
  // Export all data as JSON
  app.get('/api/export/json', async (req: Request, res: Response) => {
    try {
      const [brands, mobiles] = await Promise.all([
        storage.getAllBrands(),
        storage.getAllMobiles()
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        stats: {
          totalBrands: brands.length,
          totalMobiles: mobiles.length
        },
        brands,
        mobiles
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mobileprices-db-${new Date().toISOString().split('T')[0]}.json"`);
      
      res.json(exportData);
    } catch (error) {
      console.error('JSON export error:', error);
      res.status(500).json({ message: 'Failed to export database' });
    }
  });

  // Export brands as CSV
  app.get('/api/export/brands/csv', async (req: Request, res: Response) => {
    try {
      const brands = await storage.getAllBrands();
      
      const csvStringifier = csvWriter.createObjectCsvStringifier({
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'slug', title: 'Slug' },
          { id: 'logo', title: 'Logo' },
          { id: 'phoneCount', title: 'Phone Count' },
          { id: 'description', title: 'Description' },
          { id: 'isVisible', title: 'Is Visible' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });

      const csvHeader = csvStringifier.getHeaderString();
      const csvRecords = csvStringifier.stringifyRecords(brands);
      const csv = csvHeader + csvRecords;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="brands-${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send(csv);
    } catch (error) {
      console.error('Brands CSV export error:', error);
      res.status(500).json({ message: 'Failed to export brands' });
    }
  });

  // Export mobiles as CSV
  app.get('/api/export/mobiles/csv', async (req: Request, res: Response) => {
    try {
      const mobiles = await storage.getAllMobiles();
      
      // Flatten mobile data for CSV
      const flattenedMobiles = mobiles.map(mobile => ({
        id: mobile.id,
        name: mobile.name,
        brand: mobile.brand,
        model: mobile.model,
        slug: mobile.slug,
        imageUrl: mobile.imageUrl,
        releaseDate: mobile.releaseDate,
        price: mobile.price,
        // Flatten short specs
        ram: mobile.shortSpecs?.ram || '',
        storage: mobile.shortSpecs?.storage || '',
        camera: mobile.shortSpecs?.camera || '',
        battery: mobile.shortSpecs?.battery || '',
        display: mobile.shortSpecs?.display || '',
        processor: mobile.shortSpecs?.processor || '',
        // Additional fields
        carouselImages: mobile.carouselImages ? JSON.stringify(mobile.carouselImages) : '',
        createdAt: mobile.createdAt
      }));

      const csvStringifier = csvWriter.createObjectCsvStringifier({
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'brand', title: 'Brand' },
          { id: 'model', title: 'Model' },
          { id: 'slug', title: 'Slug' },
          { id: 'imageUrl', title: 'Image URL' },
          { id: 'releaseDate', title: 'Release Date' },
          { id: 'price', title: 'Price' },
          { id: 'ram', title: 'RAM' },
          { id: 'storage', title: 'Storage' },
          { id: 'camera', title: 'Camera' },
          { id: 'battery', title: 'Battery' },
          { id: 'display', title: 'Display' },
          { id: 'processor', title: 'Processor' },
          { id: 'carouselImages', title: 'Carousel Images (JSON)' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });

      const csvHeader = csvStringifier.getHeaderString();
      const csvRecords = csvStringifier.stringifyRecords(flattenedMobiles);
      const csv = csvHeader + csvRecords;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="mobiles-${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send(csv);
    } catch (error) {
      console.error('Mobiles CSV export error:', error);
      res.status(500).json({ message: 'Failed to export mobiles' });
    }
  });

  // Export database backup SQL (PostgreSQL format)
  app.get('/api/export/sql', async (req: Request, res: Response) => {
    try {
      const [brands, mobiles] = await Promise.all([
        storage.getAllBrands(),
        storage.getAllMobiles()
      ]);

      let sql = `-- MobilePrices.pk Database Backup
-- Generated on: ${new Date().toISOString()}
-- Total Brands: ${brands.length}
-- Total Mobiles: ${mobiles.length}

-- Disable foreign key checks
SET session_replication_role = replica;

-- Clear existing data
TRUNCATE TABLE brands CASCADE;
TRUNCATE TABLE mobiles CASCADE;

-- Reset sequences
ALTER SEQUENCE brands_id_seq RESTART WITH 1;
ALTER SEQUENCE mobiles_id_seq RESTART WITH 1;

-- Insert Brands
`;

      // Generate brand insert statements
      for (const brand of brands) {
        const values = [
          `'${brand.id}'`,
          `'${brand.name.replace(/'/g, "''")}'`,
          `'${brand.slug}'`,
          `'${(brand.logo || '').replace(/'/g, "''")}'`,
          `'${brand.phoneCount}'`,
          `'${(brand.description || '').replace(/'/g, "''")}'`,
          brand.isVisible ? 'true' : 'false',
          `'${brand.createdAt}'`
        ].join(', ');

        sql += `INSERT INTO brands (id, name, slug, logo, "phoneCount", description, "isVisible", "createdAt") VALUES (${values});\n`;
      }

      sql += `\n-- Insert Mobiles\n`;

      // Generate mobile insert statements
      for (const mobile of mobiles) {
        const shortSpecs = mobile.shortSpecs ? `'${JSON.stringify(mobile.shortSpecs).replace(/'/g, "''")}'` : 'NULL';
        const carouselImages = mobile.carouselImages ? `'${JSON.stringify(mobile.carouselImages).replace(/'/g, "''")}'` : 'NULL';
        const specifications = mobile.specifications ? `'${JSON.stringify(mobile.specifications).replace(/'/g, "''")}'` : 'NULL';

        const values = [
          `'${mobile.id}'`,
          `'${mobile.name.replace(/'/g, "''")}'`,
          `'${mobile.brand}'`,
          `'${mobile.model?.replace(/'/g, "''") || ''}'`,
          `'${mobile.slug}'`,
          `'${mobile.imageUrl || ''}'`,
          `'${mobile.releaseDate || ''}'`,
          `'${mobile.price || ''}'`,
          shortSpecs,
          carouselImages,
          specifications,
          `'${mobile.createdAt}'`
        ].join(', ');

        sql += `INSERT INTO mobiles (id, name, brand, model, slug, "imageUrl", "releaseDate", price, "shortSpecs", "carouselImages", specifications, "createdAt") VALUES (${values});\n`;
      }

      sql += `\n-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Update sequences to current max values
SELECT setval('brands_id_seq', (SELECT MAX(CAST(SUBSTRING(id FROM 1 FOR 8) AS INTEGER)) FROM brands), true);
SELECT setval('mobiles_id_seq', (SELECT MAX(CAST(SUBSTRING(id FROM 1 FOR 8) AS INTEGER)) FROM mobiles), true);

-- Backup completed successfully
`;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="mobileprices-backup-${new Date().toISOString().split('T')[0]}.sql"`);
      
      res.send(sql);
    } catch (error) {
      console.error('SQL export error:', error);
      res.status(500).json({ message: 'Failed to export SQL backup' });
    }
  });

  // Get export statistics
  app.get('/api/export/stats', async (req: Request, res: Response) => {
    try {
      const [brands, mobiles] = await Promise.all([
        storage.getAllBrands(),
        storage.getAllMobiles()
      ]);

      // Calculate statistics
      const brandStats = brands.reduce((acc, brand) => {
        acc[brand.name] = parseInt(brand.phoneCount || '0');
        return acc;
      }, {} as Record<string, number>);

      const priceRanges = {
        under25k: 0,
        '25k-50k': 0,
        '50k-100k': 0,
        '100k-150k': 0,
        above150k: 0
      };

      mobiles.forEach(mobile => {
        const price = parseInt(mobile.price?.replace(/[^\d]/g, '') || '0');
        if (price < 25000) priceRanges.under25k++;
        else if (price < 50000) priceRanges['25k-50k']++;
        else if (price < 100000) priceRanges['50k-100k']++;
        else if (price < 150000) priceRanges['100k-150k']++;
        else priceRanges.above150k++;
      });

      const stats = {
        totalBrands: brands.length,
        totalMobiles: mobiles.length,
        brandDistribution: brandStats,
        priceDistribution: priceRanges,
        lastUpdated: new Date().toISOString(),
        availableFormats: ['json', 'csv', 'sql']
      };

      res.json(stats);
    } catch (error) {
      console.error('Export stats error:', error);
      res.status(500).json({ message: 'Failed to get export statistics' });
    }
  });
}