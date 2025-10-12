import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { useCompare } from "@/hooks/use-compare";
import { ImageUtils } from "@/lib/image-utils";
import { formatCompactCamera, formatCompactDisplay, formatCompactProcessor } from "@/lib/text-utils";
import { 
  Heart, 
  Share2, 
  Plus, 
  Check, 
  Camera,
  Monitor,
  Palette,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { PhotoUploadSearch } from "@/components/ai/photo-upload-search";
import { CameraQualityAnalyzer } from "@/components/ai/camera-quality-analyzer";
import { ScreenQualityAnalyzer } from "@/components/ai/screen-quality-analyzer";
import { DesignSimilarityFinder } from "@/components/ai/design-similarity-finder";
import type { Mobile } from "@shared/schema";

interface MobileHeroProps {
  mobile: Mobile;
}

export function MobileHero({ mobile }: MobileHeroProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPhotoSearch, setShowPhotoSearch] = useState(false);
  const [showCameraAnalyzer, setShowCameraAnalyzer] = useState(false);
  const [showScreenAnalyzer, setShowScreenAnalyzer] = useState(false);
  const [showDesignFinder, setShowDesignFinder] = useState(false);
  const [expandedSpecs, setExpandedSpecs] = useState<{ [key: string]: boolean }>({});

  const { addToCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(mobile.id);

  // Create comprehensive image sources for hero display (includes brand fallbacks)
  const allImages = ImageUtils.createImageSources(
    mobile.imageUrl,
    mobile.carouselImages || [],
    mobile.brand
  );

  // Real images provided by the mobile itself (primary + carousel), excluding brand fallbacks
  const realImages = Array.from(new Set([mobile.imageUrl, ...(mobile.carouselImages || [])].filter(Boolean)));

  // Prioritize the selected real image, then other real images, and finally brand fallbacks for robustness
  const prioritizedSources = [
    ...realImages.slice(selectedImage, selectedImage + 1),
    ...realImages.filter((_, i) => i !== selectedImage),
    ...ImageUtils.getBrandFallbacks(mobile.brand)
  ];

  const scrollToSpecs = () => {
    const specsSection = document.getElementById('detailed-specifications');
    if (specsSection) {
      specsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      });
    }
  };

  const handleAddToCompare = () => {
    addToCompare(mobile);
  };

  const toggleSpecExpansion = (specKey: string) => {
    setExpandedSpecs(prev => ({
      ...prev,
      [specKey]: !prev[specKey]
    }));
  };

  return (
    <section className="mb-12">
      <Card>
        <CardContent className="p-0">
          <div className="lg:flex">
            {/* Image Gallery */}
            <div className="lg:w-1/2 p-6">
              <div className="aspect-square bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-lg mb-4 relative overflow-hidden shadow-inner">
                <SafeImage
                  src={prioritizedSources}
                  alt={mobile.name}
                  className="w-full h-full rounded-lg"
                  objectFit="contain"
                  quality="high"
                  placeholder={ImageUtils.generatePlaceholder(prioritizedSources[0] || mobile.imageUrl)}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  data-testid="mobile-hero-image"
                />
                
                {/* Image quality indicator */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  High Quality
                </div>
              </div>

              {/* Enhanced thumbnail gallery - only show if there are multiple real images */}
              {realImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {realImages.slice(0, 8).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded border-2 transition-all duration-200 hover:shadow-md ${
                        selectedImage === index
                          ? "border-primary ring-2 ring-primary/30 shadow-lg"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                      data-testid={`mobile-hero-thumbnail-${index}`}
                    >
                      <SafeImage
                        src={image}
                        alt={`${mobile.name} view ${index + 1}`}
                        className="w-full h-full rounded"
                        objectFit="contain"
                        quality="low"
                        showFallback={false}
                        loading="lazy"
                      />
                    </button>
                  ))}
                  
                  {/* View all images indicator */}
                  {realImages.length > 8 && (
                    <div className="aspect-square border-2 border-gray-200 dark:border-gray-600 rounded flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                      +{realImages.length - 8}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="lg:w-1/2 p-6">
              <div className="mb-4">
                <Badge className="mb-2">{mobile.brand}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{mobile.name}</h1>
              <div className="text-4xl font-bold text-green-600 mb-6" data-testid="mobile-price">
                {mobile.price}
              </div>

              {/* Key Features */}
              <div className="space-y-4 mb-6">
                {mobile.shortSpecs.display && (
                  <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Display</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-right">
                          {expandedSpecs.display ? (
                            <span dangerouslySetInnerHTML={{ __html: mobile.shortSpecs.display }} />
                          ) : (
                            formatCompactDisplay(mobile.shortSpecs.display)
                          )}
                        </span>
                        <button
                          onClick={() => toggleSpecExpansion('display')}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title={expandedSpecs.display ? "Show less" : "Show more"}
                        >
                          {expandedSpecs.display ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {mobile.shortSpecs.processor && (
                  <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Processor</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-right">
                          {expandedSpecs.processor ? (
                            mobile.shortSpecs.processor
                          ) : (
                            formatCompactProcessor(mobile.shortSpecs.processor)
                          )}
                        </span>
                        <button
                          onClick={() => toggleSpecExpansion('processor')}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title={expandedSpecs.processor ? "Show less" : "Show more"}
                        >
                          {expandedSpecs.processor ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">RAM</span>
                  <span className="font-medium">{mobile.shortSpecs.ram}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">Storage</span>
                  <span className="font-medium">{mobile.shortSpecs.storage}</span>
                </div>
                
                <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Main Camera</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-right">
                        {expandedSpecs.camera ? (
                          <span dangerouslySetInnerHTML={{ __html: mobile.shortSpecs.camera }} />
                        ) : (
                          formatCompactCamera(mobile.shortSpecs.camera)
                        )}
                      </span>
                      <button
                        onClick={() => toggleSpecExpansion('camera')}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title={expandedSpecs.camera ? "Show less" : "Show more"}
                      >
                        {expandedSpecs.camera ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  <Button onClick={handleAddToCompare} variant={inCompare ? "secondary" : "default"}>
                    {inCompare ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {inCompare ? "In Compare" : "Add to Compare"}
                  </Button>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </div>
              </div>

              {/* AI Tools */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">Camera Quality Analyzer</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowCameraAnalyzer(!showCameraAnalyzer)}>
                    {showCameraAnalyzer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {showCameraAnalyzer && (
                  <div className="p-4 border rounded-lg">
                    <CameraQualityAnalyzer mobile={mobile} />
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">Screen Quality Analyzer</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowScreenAnalyzer(!showScreenAnalyzer)}>
                    {showScreenAnalyzer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {showScreenAnalyzer && (
                  <div className="p-4 border rounded-lg">
                    <ScreenQualityAnalyzer mobile={mobile} />
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">Design Similarity Finder</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowDesignFinder(!showDesignFinder)}>
                    {showDesignFinder ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {showDesignFinder && (
                  <div className="p-4 border rounded-lg">
                    <DesignSimilarityFinder mobile={mobile} />
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">Photo Upload Search</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowPhotoSearch(!showPhotoSearch)}>
                    {showPhotoSearch ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {showPhotoSearch && (
                  <div className="p-4 border rounded-lg">
                    <PhotoUploadSearch onClose={() => setShowPhotoSearch(false)} />
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">Helpful Tips</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={scrollToSpecs}>
                    View Specifications
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
