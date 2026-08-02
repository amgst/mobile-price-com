import type { Mobile } from "@shared/schema";

// Site-wide price display: PKR is the site's currency. Whenever the PKR amount
// is known it wins over whatever text the import captured (e.g. "$559.00").
export function formatMobilePrice(mobile: Pick<Mobile, "price" | "pricePkr">): string {
  if (mobile.pricePkr) {
    return `Rs ${mobile.pricePkr.toLocaleString("en-US")}`;
  }
  // Drop cents/fractions from imported price text: "$444.57" -> "$444"
  return (mobile.price || "").replace(/(\d)\.\d+/g, "$1");
}
