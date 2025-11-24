import { URL } from "url";

interface MobileAPIListResponse {
  devices?: MobileAPIDevice[];
  data?: MobileAPIDevice[];
  results?: MobileAPIDevice[];
}

export interface MobileAPIDevice {
  id?: string;
  slug?: string;
  name: string;
  brand_name: string;
  model_name?: string;
  release_date?: string;
  announcement_date?: string;
  price?: {
    usd?: number | string;
    eur?: number | string;
    gbp?: number | string;
    inr?: number | string;
    pkr?: number | string;
  };
  prices?: Record<string, number | string>;
  hardware?: string;
  processor?: string;
  chipset?: string;
  ram?: string;
  storage?: string;
  storage_options?: string[];
  display?: string;
  screen_resolution?: string;
  screen_size?: string;
  display_size_inches?: number;
  camera?: string;
  rear_camera?: string;
  front_camera?: string;
  battery_capacity?: string;
  battery?: string;
  charging?: string;
  os?: string;
  platform?: string;
  dimensions?: string;
  weight?: string;
  thickness?: string;
  colors?: string;
  images?: string[];
  image_urls?: string[];
  description?: string;
  extras?: Record<string, unknown>;
  [key: string]: unknown;
}

export class MobileAPIService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.MOBILEAPI_BASE_URL ?? "https://api.mobileapi.dev";
    this.apiKey = process.env.MOBILEAPI_KEY ?? "";

    if (!this.apiKey) {
      throw new Error(
        "MOBILEAPI_KEY must be set in environment variables to use MobileAPI.dev integration."
      );
    }
  }

  async searchDevices(query: string, limit = 25): Promise<MobileAPIDevice[]> {
    if (!query.trim()) {
      return [];
    }

    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}/devices/search`);
    url.searchParams.set("name", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("key", this.apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": "mobile-price-com-importer",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `MobileAPI search failed (${response.status}): ${response.statusText} - ${body}`
      );
    }

    const payload: MobileAPIListResponse | MobileAPIDevice[] = await response.json();
    if (Array.isArray(payload)) {
      return payload;
    }

    return payload.devices ?? payload.data ?? payload.results ?? [];
  }

  async listLatest(limit = 50): Promise<MobileAPIDevice[]> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}/devices/latest`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("key", this.apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": "mobile-price-com-importer",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `MobileAPI latest fetch failed (${response.status}): ${response.statusText} - ${body}`
      );
    }

    const payload: MobileAPIListResponse | MobileAPIDevice[] = await response.json();
    if (Array.isArray(payload)) {
      return payload;
    }

    return payload.devices ?? payload.data ?? payload.results ?? [];
  }

  async listDevicesByBrand(brand: string, limit = 50): Promise<MobileAPIDevice[]> {
    if (!brand.trim()) {
      return [];
    }

    // Try dedicated brand endpoint first (if available)
    const brandUrl = new URL(`${this.baseUrl.replace(/\/$/, "")}/brands/${encodeURIComponent(brand)}/devices`);
    brandUrl.searchParams.set("limit", String(limit));
    brandUrl.searchParams.set("key", this.apiKey);

    const brandResponse = await fetch(brandUrl.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": "mobile-price-com-importer",
      },
    });

    if (brandResponse.ok) {
      const payload: MobileAPIListResponse | MobileAPIDevice[] = await brandResponse.json();
      if (Array.isArray(payload)) {
        return payload.slice(0, limit);
      }
      const entries = payload.devices ?? payload.data ?? payload.results ?? [];
      if (entries.length > 0) {
        return entries.slice(0, limit);
      }
    }

    // Fallback: search by brand name
    return this.searchDevices(brand, limit);
  }
}


