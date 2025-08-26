import { InsertMobile, InsertBrand } from "../../shared/schema.js";

interface RapidAPIPhone {
  id: number;
  manufacturer: string;
  model: string;
  chipset?: string;
  androidVersion?: string;
  battery?: string;
  cpu?: string;
  displayResolution?: string;
  displaySize?: string;
  displayType?: string;
  gpu?: string;
  internal?: string;
  mainCameraFeatures?: string;
  mainCameraSpecs?: string;
  mainVideoSpecs?: string;
  selfieCameraFeatures?: string;
  selfieCameraSpecs?: string;
  selfieVideoSpecs?: string;
  sensors?: string;
}

interface RapidAPIBrand {
  brand: string;
  phoneCount: number;
}

export class RapidAPIService {
  private baseURL = 'https://gsmarenaparser.p.rapidapi.com';
  private headers: Record<string, string>;

  constructor() {
    if (!process.env.RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is required for mobile data import');
    }
    
    this.headers = {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'gsmarenaparser.p.rapidapi.com'
    };
  }

  async getAllBrands(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/values/availablebrands`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
      }

      const brands = await response.json();
      return Array.isArray(brands) ? brands : [];
    } catch (error) {
      console.error('Error fetching brands from RapidAPI:', error);
      throw error;
    }
  }

  async getPhonesByBrand(brandName: string): Promise<RapidAPIPhone[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/values/getdevices/${encodeURIComponent(brandName)}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
      }

      const phones = await response.json();
      return Array.isArray(phones) ? phones : [];
    } catch (error) {
      console.error(`Error fetching phones for brand ${brandName} from RapidAPI:`, error);
      throw error;
    }
  }

  async getPhoneDetails(manufacturer: string, model: string): Promise<RapidAPIPhone> {
    try {
      const response = await fetch(`${this.baseURL}/api/values/getspecs/${encodeURIComponent(manufacturer)}/${encodeURIComponent(model)}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
      }

      const phone = await response.json();
      return phone;
    } catch (error) {
      console.error(`Error fetching phone details for ${manufacturer} ${model} from RapidAPI:`, error);
      throw error;
    }
  }

  async getAllDeviceSpecs(): Promise<RapidAPIPhone[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/values/getalldevicespecs`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
      }

      const phones = await response.json();
      return Array.isArray(phones) ? phones : [];
    } catch (error) {
      console.error('Error fetching all device specs from RapidAPI:', error);
      throw error;
    }
  }
}