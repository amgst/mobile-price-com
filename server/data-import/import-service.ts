import { RapidAPIService } from './rapidapi-service.js';
import { DataTransformer } from './data-transformer.js';
import { storage } from '../storage.js';
import { MobileAPIService, MobileAPIDevice } from './mobileapi-service.js';
import { MobileAPITransformer } from './mobileapi-transformer.js';

export class ImportService {
  private rapidApi: RapidAPIService;
  private mobileApi?: MobileAPIService;

  constructor() {
    this.rapidApi = new RapidAPIService();
    if (process.env.MOBILEAPI_KEY) {
      try {
        this.mobileApi = new MobileAPIService();
      } catch (error) {
        console.warn('MobileAPI.dev integration unavailable:', error);
      }
    }
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
    if (this.mobileApi) {
      return this.importLatestMobilesFromMobileAPI(limit);
    }

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
    if (this.mobileApi) {
      return this.importMobilesByBrandFromMobileAPI(brandName, limit);
    }

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
    if (this.mobileApi) {
      console.log('MobileAPI.dev integration active; importing latest devices instead of predefined popular brands.');
      const latestResults = await this.importLatestMobilesFromMobileAPI(50);
      return {
        success: latestResults.success,
        errors: latestResults.errors,
      };
    }

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
    if (this.mobileApi) {
      return this.searchAndImportMobilesFromMobileAPI(query, limit);
    }

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

  private async ensureBrand(device: MobileAPIDevice) {
    const transformedBrand = MobileAPITransformer.transformBrand(device);
    const existingBrand = await storage.getBrandBySlug(transformedBrand.slug);

    if (!existingBrand) {
      await storage.createBrand(transformedBrand);
      return { created: true, slug: transformedBrand.slug };
    }

    return { created: false, slug: transformedBrand.slug, id: existingBrand.id };
  }

  private async upsertMobile(device: MobileAPIDevice) {
    const transformedMobile = MobileAPITransformer.transformDevice(device);
    const existingMobile = await storage.getMobileBySlug(transformedMobile.brand, transformedMobile.slug);

    if (existingMobile) {
      await storage.updateMobile(existingMobile.id, transformedMobile);
      return { created: false, slug: transformedMobile.slug };
    }

    await storage.createMobile(transformedMobile);
    return { created: true, slug: transformedMobile.slug };
  }

  private async importLatestMobilesFromMobileAPI(limit: number) {
    if (!this.mobileApi) {
      throw new Error('MobileAPI.dev integration is not configured. Set MOBILEAPI_KEY environment variable.');
    }

    console.log(`Starting import of latest ${limit} mobiles from MobileAPI.dev...`);
    const results = { success: 0, errors: [] as string[], existing: 0, processed: 0 };

    try {
      const devices = await this.mobileApi.listLatest(limit);
      console.log(`Fetched ${devices.length} devices from MobileAPI.dev`);

      for (const device of devices) {
        try {
          await this.ensureBrand(device);
          const outcome = await this.upsertMobile(device);
          results.processed++;
          if (outcome.created) {
            results.success++;
            console.log(`✓ Imported mobile: ${device.name}`);
          } else {
            results.existing++;
            console.log(`- Updated existing mobile: ${device.name}`);
          }
        } catch (error: any) {
          const message = error?.message ?? String(error);
          results.errors.push(`Failed to import ${device.name}: ${message}`);
          console.error(`⚠️  Failed to import ${device.name}:`, message);
        }
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      results.errors.push(`Failed to fetch latest devices: ${message}`);
      console.error('MobileAPI.dev latest import failed:', message);
    }

    console.log(`MobileAPI.dev import completed. Success: ${results.success}, Existing: ${results.existing}, Errors: ${results.errors.length}`);
    return results;
  }

  private async importMobilesByBrandFromMobileAPI(brandName: string, limit: number) {
    if (!this.mobileApi) {
      throw new Error('MobileAPI.dev integration is not configured. Set MOBILEAPI_KEY environment variable.');
    }

    console.log(`Starting MobileAPI.dev import for brand: ${brandName} (limit ${limit})...`);
    const results = { success: 0, errors: [] as string[] };

    try {
      const devices = await this.mobileApi.listDevicesByBrand(brandName, limit);
      console.log(`Fetched ${devices.length} devices for ${brandName} from MobileAPI.dev`);

      for (const device of devices) {
        try {
          await this.ensureBrand(device);
          const outcome = await this.upsertMobile(device);
          if (outcome.created) {
            results.success++;
            console.log(`✓ Imported ${device.name}`);
          } else {
            console.log(`- Updated existing ${device.name}`);
          }
        } catch (error: any) {
          const message = error?.message ?? String(error);
          results.errors.push(`Failed to import ${device.name}: ${message}`);
          console.error(`⚠️  Failed to import ${device.name}:`, message);
        }
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      results.errors.push(`Failed to fetch devices for brand ${brandName}: ${message}`);
      console.error(`MobileAPI.dev brand import failed for ${brandName}:`, message);
    }

    console.log(`MobileAPI.dev brand import completed. Success: ${results.success}, Errors: ${results.errors.length}`);
    return results;
  }

  private async searchAndImportMobilesFromMobileAPI(query: string, limit: number) {
    if (!this.mobileApi) {
      throw new Error('MobileAPI.dev integration is not configured. Set MOBILEAPI_KEY environment variable.');
    }

    console.log(`Searching MobileAPI.dev for "${query}" (limit ${limit})...`);
    const results = { success: 0, errors: [] as string[] };

    try {
      const devices = await this.mobileApi.searchDevices(query, limit);
      console.log(`Found ${devices.length} matching devices on MobileAPI.dev`);

      for (const device of devices) {
        try {
          await this.ensureBrand(device);
          const outcome = await this.upsertMobile(device);
          if (outcome.created) {
            results.success++;
            console.log(`✓ Imported ${device.name}`);
          } else {
            console.log(`- Updated existing ${device.name}`);
          }
        } catch (error: any) {
          const message = error?.message ?? String(error);
          results.errors.push(`Failed to import ${device.name}: ${message}`);
          console.error(`⚠️  Failed to import ${device.name}:`, message);
        }
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      results.errors.push(`Failed to search devices for query "${query}": ${message}`);
      console.error(`MobileAPI.dev search import failed for "${query}":`, message);
    }

    console.log(`MobileAPI.dev search import completed. Success: ${results.success}, Errors: ${results.errors.length}`);
    return results;
  }
}