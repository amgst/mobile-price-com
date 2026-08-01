export const PRODUCT_IMAGE_PLACEHOLDER_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23f3f4f6'/%3E%3Cg fill='none' stroke='%239ca3af' stroke-width='16'%3E%3Crect x='210' y='120' width='180' height='360' rx='24'/%3E%3Ccircle cx='300' cy='430' r='10'/%3E%3C/g%3E%3Ctext x='300' y='520' text-anchor='middle' font-family='Arial,sans-serif' font-size='28' fill='%236b7280'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export function getProductImageUrl(path?: string | null): string {
  if (!path) return "";

  const normalizedPath = path.trim();
  if (!normalizedPath) return "";

  if (
    normalizedPath.startsWith("http") ||
    normalizedPath.startsWith("/") ||
    normalizedPath.startsWith("data:") ||
    normalizedPath.startsWith("blob:")
  ) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("products/")) {
    return `/${normalizedPath}`;
  }

  return `/products/${normalizedPath}`;
}
