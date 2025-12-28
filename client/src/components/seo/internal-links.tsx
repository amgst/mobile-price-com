import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { Mobile } from "@shared/schema";

interface InternalLinksProps {
  mobile: Mobile;
  relatedMobiles?: Mobile[];
}

export function InternalLinks({ mobile, relatedMobiles }: InternalLinksProps) {
  if (!relatedMobiles || relatedMobiles.length === 0) return null;

  // Generate keyword-rich internal links (3-5 links)
  // Focus on related models and similar price ranges
  const getNumericPrice = (price: string | undefined) => {
    if (!price) return 0;
    return parseInt(price.replace(/[₨,\s]/g, '')) || 0;
  };

  const currentPrice = getNumericPrice(mobile.price);
  
  // Find similar price range mobiles and other models from same brand
  const similarPriceMobiles = relatedMobiles
    .filter(m => {
      const price = getNumericPrice(m.price);
      const priceDiff = Math.abs(price - currentPrice);
      return m.id !== mobile.id && priceDiff < currentPrice * 0.3; // Within 30% price range
    })
    .slice(0, 3);

  // If not enough similar price, add same brand models
  const sameBrandMobiles = relatedMobiles
    .filter(m => m.id !== mobile.id && m.brand.toLowerCase() === mobile.brand.toLowerCase())
    .slice(0, 5 - similarPriceMobiles.length);

  const linksToShow = [...similarPriceMobiles, ...sameBrandMobiles].slice(0, 5);

  if (linksToShow.length === 0) return null;

  // Generate keyword-rich anchor texts
  const getAnchorText = (m: Mobile) => {
    const brandLower = m.brand.toLowerCase();
    const modelName = m.name.toLowerCase();
    
    // Create keyword-rich anchor texts like "samsung a15 price in pakistan"
    if (modelName.includes(m.brand.toLowerCase())) {
      return `${m.name} price in pakistan`;
    }
    return `${brandLower} ${modelName} price in pakistan`;
  };

  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Related Mobile Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {linksToShow.map((linkMobile) => (
              <Link 
                key={linkMobile.id} 
                href={`/${linkMobile.brand.toLowerCase()}/${linkMobile.slug}`}
                className="block group"
              >
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-gray-50 transition-all">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {getAnchorText(linkMobile)}
                    </span>
                    <div className="text-sm text-gray-600 mt-1">
                      {linkMobile.price} • {linkMobile.shortSpecs.ram} • {linkMobile.shortSpecs.storage}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors ml-4" />
                </div>
              </Link>
            ))}
          </div>
          
          {/* Brand category link */}
          <div className="mt-6 pt-6 border-t">
            <Link 
              href={`/${mobile.brand.toLowerCase()}`}
              className="inline-flex items-center text-primary hover:text-primary/80 font-medium group"
            >
              View all {mobile.brand} mobile prices in Pakistan
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

