// Re-export types from shared schema for client use
export type { Mobile, Brand, InsertMobile, InsertBrand } from "@shared/schema";

// Additional client-specific types
export interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export interface SearchFilters {
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  releaseYear?: string;
  sortBy?: "newest" | "price-low" | "price-high" | "popular";
}

export interface CompareItem {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: string;
}
