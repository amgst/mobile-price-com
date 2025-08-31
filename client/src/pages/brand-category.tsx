import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { RichMetaTags } from "@/components/seo/meta-tags";
import { generateCollectionPageSchema, generateBreadcrumbSchema, generateOrganizationSchema } from "@/components/seo/structured-data";
import { MobileCard } from "@/components/mobile/mobile-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Brand, Mobile } from "@shared/schema";

export default function BrandCategory() {
  const { brand: brandSlug } = useParams<{ brand: string }>();

  const { data: brand } = useQuery<Brand>({
    queryKey: ["/api/brands", brandSlug],
  });

  const { data: mobiles, isLoading } = useQuery<Mobile[]>({
    queryKey: [`/api/mobiles?brand=${brandSlug}`],
    enabled: !!brandSlug,
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Brands", href: "/brands" },
    { label: brand?.name || brandSlug || "", href: `/${brandSlug}`, isActive: true }
  ];

  if (!brandSlug) {
    return <div>Brand not found</div>;
  }

  // Generate rich structured data
  const organizationSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const collectionSchema = brand && mobiles ? generateCollectionPageSchema(brand, mobiles) : null;
  
  const combinedSchema = [organizationSchema, breadcrumbSchema, collectionSchema].filter(Boolean);

  return (
    <>
      <SEOHead 
        title={`${brand?.name || brandSlug} Mobile Phones Price in Pakistan 2025 - Latest Models & Specifications`}
        description={`Latest ${brand?.name || brandSlug} mobile phone prices in Pakistan. Compare ${mobiles?.length || 0}+ models with detailed specifications, camera reviews, and performance analysis. Updated 2025.`}
        canonical={`/${brandSlug}`}
        jsonLd={combinedSchema}
      />
      <RichMetaTags brand={brand} page="brand" />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Brand Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl font-bold text-gray-600">{brand?.logo}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{brand?.name} Mobile Phones</h1>
                <p className="text-gray-600">{mobiles?.length || 0} models available</p>
              </div>
            </div>
            {brand?.description && (
              <p className="text-lg text-gray-600 max-w-3xl">
                {brand.description}
              </p>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Select>
              <SelectTrigger className="w-[180px]" data-testid="filter-price">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Under ₨50,000</SelectItem>
                <SelectItem value="mid">₨50K - ₨150K</SelectItem>
                <SelectItem value="premium">Above ₨150K</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]" data-testid="filter-release">
                <SelectValue placeholder="Release Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]" data-testid="filter-sort">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" data-testid="button-clear-filters">
              Clear Filters
            </Button>
          </div>

          {/* Mobile Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : mobiles && mobiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mobiles.map((mobile) => (
                <MobileCard key={mobile.id} mobile={mobile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No mobiles found for {brand?.name}</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
