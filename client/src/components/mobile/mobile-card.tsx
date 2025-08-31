import { Link } from "wouter";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { useCompare } from "@/hooks/use-compare";
import { ImageUtils } from "@/lib/image-utils";
import { formatCompactCamera, formatCompactDisplay, formatCompactProcessor } from "@/lib/text-utils";
import type { Mobile } from "@shared/schema";

interface MobileCardProps {
  mobile: Mobile;
}

export function MobileCard({ mobile }: MobileCardProps) {
  const { addToCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(mobile.id);

  // Create comprehensive image sources with fallbacks
  const imageSources = ImageUtils.createImageSources(
    mobile.imageUrl, 
    mobile.carouselImages || [], 
    mobile.brand
  );

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(mobile);
  };

  return (
    <Link href={`/${mobile.brand}/${mobile.slug}`} data-testid={`mobile-card-${mobile.slug}`}>
      <div className="bg-white rounded-lg border hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 relative overflow-hidden">
          <SafeImage
            src={imageSources}
            alt={mobile.name}
            className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
            loading="lazy"
            quality="medium"
            placeholder={ImageUtils.generatePlaceholder(mobile.imageUrl)}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          
          {/* Price badge overlay */}
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
            PKR
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {mobile.brand}
            </Badge>
            <span className="text-xs text-gray-500">{mobile.releaseDate.split('-')[0]}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={mobile.name}>
            {mobile.name}
          </h3>
          <div className="text-lg font-bold text-green-600 mb-3">
            {mobile.price}
          </div>

          {/* Key Specs */}
          <div className="space-y-1 text-sm text-gray-600 mb-4">
            {mobile.shortSpecs.display && (
              <div className="flex justify-between items-center">
                <span>Display:</span>
                <span className="text-right text-xs font-medium" title={mobile.shortSpecs.display}>
                  {formatCompactDisplay(mobile.shortSpecs.display)}
                </span>
              </div>
            )}
            {mobile.shortSpecs.processor && (
              <div className="flex justify-between items-center">
                <span>Processor:</span>
                <span className="text-right text-xs font-medium" title={mobile.shortSpecs.processor}>
                  {formatCompactProcessor(mobile.shortSpecs.processor)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>RAM:</span>
              <span className="text-right font-medium">{mobile.shortSpecs.ram}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Storage:</span>
              <span className="text-right font-medium">{mobile.shortSpecs.storage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Camera:</span>
              <span className="text-right text-xs font-medium" title={mobile.shortSpecs.camera}>
                {formatCompactCamera(mobile.shortSpecs.camera)}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              data-testid={`button-view-details-${mobile.slug}`}
            >
              View Details
            </Button>
            <Button
              variant={inCompare ? "default" : "outline"}
              size="sm"
              onClick={handleAddToCompare}
              disabled={inCompare}
              data-testid={`button-add-compare-${mobile.slug}`}
              title={inCompare ? "Already in comparison" : "Add to comparison"}
            >
              {inCompare ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
