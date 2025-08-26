import { RapidAPIService } from './rapidapi-service.js';
import { DataTransformer } from './data-transformer.js';
import { storage } from '../storage.js';

export class ImportService {
  private rapidApi: RapidAPIService;

  constructor() {
    this.rapidApi = new RapidAPIService();
  }

  async importBrands(): Promise<{ success: number; errors: string[] }> {
    console.log('Starting brand import from RapidAPI...');
    const results = { success: 0, errors: [] as string[] };

    try {
      const brandNames = await this.rapidApi.getAllBrands();
      console.log(`Found ${brandNames.length} brands from RapidAPI`);

      for (const brandName of brandNames) {
        try {
          const transformedBrand = DataTransformer.transformBrand(brandName);
          
          // Check if brand already exists
          const existingBrand = await storage.getBrandBySlug(transformedBrand.slug);
          if (!existingBrand) {
            await storage.createBrand(transformedBrand);
            results.success++;
            console.log(`✓ Imported brand: ${transformedBrand.name}`);
          } else {
            console.log(`- Brand already exists: ${transformedBrand.name}`);
          }
        } catch (error) {
          const errorMsg = `Failed to import brand ${brandName}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to fetch brands from RapidAPI: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    console.log(`Brand import completed. Success: ${results.success}, Errors: ${results.errors.length}`);
    return results;
  }

  async importLatestMobiles(limit: number = 50): Promise<{ success: number; errors: string[]; existing: number; processed: number }> {
    console.log(`Starting import of up to ${limit} latest mobiles from RapidAPI...`);
    const results = { success: 0, errors: [] as string[], existing: 0, processed: 0 };

    try {
      // Since getAllDeviceSpecs isn't working, let's try getting phones from popular brands
      const popularBrands = ['Samsung', 'Apple', 'Xiaomi', 'OnePlus', 'Google'];
      const phonesPerBrand = Math.ceil(limit / popularBrands.length);
      let allPhones: any[] = [];
      
      for (const brand of popularBrands) {
        try {
          const brandPhones = await this.rapidApi.getPhonesByBrand(brand);
          allPhones = allPhones.concat(brandPhones.slice(0, phonesPerBrand));
          if (allPhones.length >= limit) break;
        } catch (error) {
          console.log(`Could not fetch phones for ${brand}: ${error}`);
        }
      }
      
      const phones = allPhones.slice(0, limit);
      console.log(`Processing ${phones.length} phones from RapidAPI`);

      for (const rapidApiPhone of phones) {
        try {
          const transformedMobile = DataTransformer.transformMobile(rapidApiPhone);
          results.processed++;
          
          // Check if mobile already exists
          const existingMobile = await storage.getMobileBySlug(transformedMobile.brand, transformedMobile.slug);
          if (!existingMobile) {
            await storage.createMobile(transformedMobile);
            results.success++;
            console.log(`✓ Imported mobile: ${transformedMobile.name}`);
          } else {
            results.existing++;
            console.log(`- Mobile already exists: ${transformedMobile.name}`);
          }

          // Add small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          const errorMsg = `Failed to import mobile ${rapidApiPhone.manufacturer} ${rapidApiPhone.model}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to fetch mobiles from RapidAPI: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    console.log(`Mobile import completed. Success: ${results.success}, Existing: ${results.existing}, Errors: ${results.errors.length}`);
    return results;
  }

  async importMobilesByBrand(brandName: string, limit: number = 20): Promise<{ success: number; errors: string[] }> {
    console.log(`Starting import of up to ${limit} mobiles for brand: ${brandName}...`);
    const results = { success: 0, errors: [] as string[] };

    try {
      const rapidApiPhones = await this.rapidApi.getPhonesByBrand(brandName);
      const phones = rapidApiPhones.slice(0, limit);
      console.log(`Found ${phones.length} phones for brand ${brandName} from RapidAPI`);

      for (const rapidApiPhone of phones) {
        try {
          const transformedMobile = DataTransformer.transformMobile(rapidApiPhone);
          
          // Check if mobile already exists
          const existingMobile = await storage.getMobileBySlug(transformedMobile.brand, transformedMobile.slug);
          if (!existingMobile) {
            await storage.createMobile(transformedMobile);
            results.success++;
            console.log(`✓ Imported mobile: ${transformedMobile.name}`);
          } else {
            console.log(`- Mobile already exists: ${transformedMobile.name}`);
          }

          // Add small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          const errorMsg = `Failed to import mobile ${rapidApiPhone.manufacturer} ${rapidApiPhone.model}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to fetch mobiles for brand ${brandName} from RapidAPI: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    console.log(`Brand mobile import completed. Success: ${results.success}, Errors: ${results.errors.length}`);
    return results;
  }

  async importPopularBrands(): Promise<{ success: number; errors: string[] }> {
    console.log('Starting import of popular brands...');
    const popularBrands = ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Google', 'Oppo', 'Vivo'];
    const results = { success: 0, errors: [] as string[] };

    for (const brandName of popularBrands) {
      try {
        const brandResults = await this.importMobilesByBrand(brandName, 10);
        results.success += brandResults.success;
        results.errors.push(...brandResults.errors);
        
        // Add delay between brands to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        const errorMsg = `Failed to import brand ${brandName}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log(`Popular brands import completed. Success: ${results.success}, Errors: ${results.errors.length}`);
    return results;
  }

  async searchAndImportMobiles(query: string, limit: number = 10): Promise<{ success: number; errors: string[] }> {
    console.log(`Starting search and import for query: "${query}"...`);
    const results = { success: 0, errors: [] as string[] };

    try {
      // Search by getting phones from multiple brands and filtering
      const brandNames = await this.rapidApi.getAllBrands();
      let allPhones: any[] = [];
      
      for (const brand of brandNames.slice(0, 10)) { // Limit to first 10 brands for efficiency
        try {
          const brandPhones = await this.rapidApi.getPhonesByBrand(brand);
          allPhones = allPhones.concat(brandPhones);
        } catch (error) {
          console.log(`Could not fetch phones for ${brand}: ${error}`);
        }
      }
      
      const filteredPhones = allPhones.filter(phone => 
        phone.manufacturer.toLowerCase().includes(query.toLowerCase()) ||
        phone.model.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);
      
      console.log(`Found ${filteredPhones.length} phones matching "${query}" from RapidAPI`);

      for (const rapidApiPhone of filteredPhones) {
        try {
          const transformedMobile = DataTransformer.transformMobile(rapidApiPhone);
          
          // Check if mobile already exists
          const existingMobile = await storage.getMobileBySlug(transformedMobile.brand, transformedMobile.slug);
          if (!existingMobile) {
            await storage.createMobile(transformedMobile);
            results.success++;
            console.log(`✓ Imported mobile: ${transformedMobile.name}`);
          } else {
            console.log(`- Mobile already exists: ${transformedMobile.name}`);
          }

          // Add small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          const errorMsg = `Failed to import mobile ${rapidApiPhone.manufacturer} ${rapidApiPhone.model}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to search mobiles with query "${query}" from RapidAPI: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    console.log(`Search import completed. Success: ${results.success}, Errors: ${results.errors.length}`);
    return results;
  }

  async getImportStatus(): Promise<{
    totalBrands: number;
    totalMobiles: number;
    lastImport?: string;
  }> {
    const brands = await storage.getAllBrands();
    const mobiles = await storage.getAllMobiles();
    
    return {
      totalBrands: brands.length,
      totalMobiles: mobiles.length,
      lastImport: new Date().toISOString()
    };
  }
}