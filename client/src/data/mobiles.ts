// This file exports mobile data - in a real app this would come from an API
export const FEATURED_MOBILES = [
  "mobile-1", // Galaxy S24 Ultra
  "mobile-2", // iPhone 15 Pro Max
  "mobile-3", // Xiaomi 14 Pro
  "mobile-4", // OnePlus 12
];

export const PRICE_RANGES = {
  budget: { min: 0, max: 50000, label: "Under ₨50,000" },
  midrange: { min: 50000, max: 150000, label: "₨50K - ₨150K" },
  flagship: { min: 150000, max: Infinity, label: "Above ₨150K" },
};

export const POPULAR_SEARCHES = [
  "Samsung Galaxy",
  "iPhone",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Realme",
  "OnePlus",
  "Nothing",
];
