import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { Card, CardContent } from "@/components/ui/card";
import type { Brand } from "@shared/schema";

export default function Brands() {
  const { data: brands, isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Brands", href: "/brands", isActive: true }
  ];

  return (
    <>
      <SEOHead 
        title="Mobile Brands - Complete List of Smartphone Manufacturers (2025)"
        description="Browse all mobile phone brands available in Pakistan. Find phones from Samsung, Apple, Xiaomi, Oppo, Vivo, Realme and more with complete specifications and prices."
        canonical="/brands"
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Mobile Brands</h1>
            <p className="text-lg text-gray-600">
              Explore all smartphone manufacturers and their latest mobile phone models available in Pakistan.
            </p>
            {brands && (
              <p className="text-sm text-gray-500 mt-2">
                Showing {brands.filter(brand => 
                  brand.isVisible !== false && 
                  parseInt(brand.phoneCount || '0') > 0
                ).length} brands with available phones
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="h-16 w-16 mx-auto mb-4 bg-gray-200 rounded-lg"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {brands?.filter(brand => 
                brand.isVisible !== false && 
                parseInt(brand.phoneCount || '0') > 0
              ).map((brand) => (
                <a
                  key={brand.id}
                  href={`/${brand.slug}`}
                  data-testid={`brand-detail-${brand.slug}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <div className="h-16 w-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-600">{brand.logo}</span>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">{brand.name}</h2>
                      <p className="text-primary font-medium mb-3">{brand.phoneCount} phones available</p>
                      {brand.description && (
                        <p className="text-sm text-gray-600">{brand.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
