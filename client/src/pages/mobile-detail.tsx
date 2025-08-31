import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { RichMetaTags } from "@/components/seo/meta-tags";
import { generateProductSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/components/seo/structured-data";
import { generateOGImageUrl } from "@/lib/seo-utils";
import { TechnicalHighlights, PriceAnalysis, FrequentlyAskedQuestions, ComparisonSuggestions, ExpertReview } from "@/components/seo/rich-content";
import { MobileHero } from "@/components/mobile/mobile-hero";
import { SpecsTable } from "@/components/mobile/specs-table";
import { ImageGallery } from "@/components/mobile/image-gallery";
import { MobileCard } from "@/components/mobile/mobile-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Edit } from "lucide-react";
import type { Mobile } from "@shared/schema";

export default function MobileDetail() {
  const { brand: brandSlug, model: mobileSlug } = useParams<{ brand: string; model: string }>();
  const { isAuthenticated } = useAuth();

  const { data: mobile, isLoading } = useQuery<Mobile>({
    queryKey: ["/api/mobiles", brandSlug, mobileSlug],
    enabled: !!brandSlug && !!mobileSlug,
  });

  const { data: relatedMobiles } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles", { brand: brandSlug }],
    enabled: !!brandSlug,
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Brands", href: "/brands" },
    { label: mobile?.brand || brandSlug || "", href: `/${brandSlug}` },
    { label: mobile?.name || mobileSlug || "", href: `/${brandSlug}/${mobileSlug}`, isActive: true }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mobile Not Found</h1>
            <p className="text-gray-600">The requested mobile phone could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  // Generate comprehensive structured data
  const productSchema = generateProductSchema(mobile);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const faqSchema = generateFAQSchema(mobile);
  
  // Combine all structured data
  const combinedSchema = [productSchema, breadcrumbSchema, faqSchema];

  return (
    <>
      <SEOHead 
        title={`${mobile.name} Price in Pakistan, Full Specifications & Review (2025)`}
        description={`${mobile.name} price in Pakistan is ${mobile.price}. Complete specifications: ${mobile.shortSpecs.ram} RAM, ${mobile.shortSpecs.storage} storage, ${mobile.shortSpecs.camera} camera. Expert review and comparison.`}
        canonical={`/${brandSlug}/${mobileSlug}`}
        ogImage={generateOGImageUrl(mobile)}
        jsonLd={combinedSchema}
      />
      <RichMetaTags mobile={mobile} page="mobile" />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Admin Edit Button */}
          {isAuthenticated && (
            <div className="mb-6 flex justify-end">
              <Button
                onClick={() => window.location.href = `/admin?edit=${mobile.id}`}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Mobile
              </Button>
            </div>
          )}

          {/* Mobile Hero Section */}
          <MobileHero mobile={mobile} />

          {/* Technical Highlights - Rich Content */}
          <TechnicalHighlights mobile={mobile} />

          {/* Price Analysis - Rich Content */}
          <PriceAnalysis mobile={mobile} />

          {/* Image Gallery */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
            <ImageGallery images={mobile.carouselImages} alt={mobile.name} />
          </section>

          {/* Expert Review - Rich Content */}
          <ExpertReview mobile={mobile} />

          {/* Detailed Specifications */}
          <section id="detailed-specifications" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Specifications</h2>
            <SpecsTable specifications={mobile.specifications} />
          </section>

          {/* Dimensions & Build */}
          {mobile.dimensions && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dimensions & Build</h2>
              <div className="bg-white rounded-lg border p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{mobile.dimensions.height}</div>
                    <div className="text-sm text-gray-600">Height</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{mobile.dimensions.width}</div>
                    <div className="text-sm text-gray-600">Width</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{mobile.dimensions.thickness}</div>
                    <div className="text-sm text-gray-600">Thickness</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{mobile.dimensions.weight}</div>
                    <div className="text-sm text-gray-600">Weight</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Comparison Suggestions - Rich Content */}
          <ComparisonSuggestions mobile={mobile} relatedMobiles={relatedMobiles} />

          {/* Frequently Asked Questions - Rich Content */}
          <FrequentlyAskedQuestions mobile={mobile} />

          {/* Related Mobiles */}
          {relatedMobiles && relatedMobiles.length > 1 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">More from {mobile.brand}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {relatedMobiles
                  .filter(related => related.id !== mobile.id)
                  .slice(0, 4)
                  .map((relatedMobile) => (
                    <MobileCard key={relatedMobile.id} mobile={relatedMobile} />
                  ))}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
