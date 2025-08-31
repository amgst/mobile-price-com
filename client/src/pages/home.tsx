import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { MobileCard } from "@/components/mobile/mobile-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, ArrowRight } from "lucide-react";
import { useStats } from "@/hooks/use-stats";
import type { Mobile, Brand } from "@shared/schema";

export default function Home() {
  const [filter, setFilter] = useState<'latest' | 'popular' | 'budget'>('latest');
  
  const { data: allMobiles, isLoading: mobilesLoading } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const stats = useStats();

  const filteredMobiles = allMobiles?.filter(mobile => {
    if (filter === 'budget') return (mobile.price || 0) < 50000;
    if (filter === 'popular') return mobile.isFeatured;
    return true; // latest - show all
  }).slice(0, 8) || [];

  const budgetCount = allMobiles?.filter(m => (m.price || 0) < 50000).length || 0;
  const midRangeCount = allMobiles?.filter(m => (m.price || 0) >= 50000 && (m.price || 0) <= 150000).length || 0;
  const flagshipCount = allMobiles?.filter(m => (m.price || 0) > 150000).length || 0;

  const breadcrumbs = [
    { label: "Home", href: "/", isActive: true }
  ];

  return (
    <>
      <SEOHead 
        title="Mobile Price - Compare Mobile Phones & Prices | Latest Smartphone Reviews"
        description="Compare mobile phone prices and specifications at Mobile Price. Find the best deals on smartphones from top brands including Samsung, Apple, Xiaomi and more."
        canonical="/"
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Compare Mobile Phones & Find Best Prices
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Your ultimate destination for mobile phone comparisons. Compare specifications, prices, and reviews from all major brands to find your perfect smartphone.
              </p>
            </div>

            {/* Stats Bar */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="stats-total-phones">{stats.totalMobiles.toLocaleString()}+</div>
                    <div className="text-sm text-gray-600">Mobile Phones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="stats-brands">{stats.totalBrands}+</div>
                    <div className="text-sm text-gray-600">Brands</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="stats-updates">{stats.dailyUpdates}</div>
                    <div className="text-sm text-gray-600">Price Updates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="stats-reviews">{stats.userReviews}</div>
                    <div className="text-sm text-gray-600">User Reviews</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Popular Brands Grid */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Popular Brands</h2>
              <a 
                href="/brands" 
                className="text-primary hover:text-primary-700 font-medium flex items-center"
                data-testid="link-view-all-brands"
              >
                View All Brands
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>

            {brandsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border p-6 text-center animate-pulse">
                    <div className="h-12 w-12 mx-auto mb-3 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {brands?.filter(brand => 
                  brand.isVisible !== false && 
                  parseInt(brand.phoneCount || '0') >= 5
                ).slice(0, 6).map((brand) => (
                  <a
                    key={brand.id}
                    href={`/${brand.slug}`}
                    className="bg-white rounded-lg border hover:shadow-md transition-shadow p-6 text-center cursor-pointer"
                    data-testid={`brand-card-${brand.slug}`}
                  >
                    <div className="h-12 w-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">{brand.logo}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{brand.name}</h3>
                    <p className="text-sm text-gray-500">{brand.phoneCount} phones</p>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Featured Mobiles */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Latest & Featured Mobiles</h2>
              <div className="flex space-x-2">
                <Button 
                  variant={filter === 'latest' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFilter('latest')}
                  data-testid="filter-latest"
                >
                  Latest
                </Button>
                <Button 
                  variant={filter === 'popular' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFilter('popular')}
                  data-testid="filter-popular"
                >
                  Popular
                </Button>
                <Button 
                  variant={filter === 'budget' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFilter('budget')}
                  data-testid="filter-budget"
                >
                  Budget
                </Button>
              </div>
            </div>

            {mobilesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMobiles.map((mobile) => (
                  <MobileCard key={mobile.id} mobile={mobile} />
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/mobiles'}
                data-testid="button-view-all-mobiles"
              >
                View All Mobiles
              </Button>
            </div>
          </section>

          {/* Price Ranges Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Price Range</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => window.location.href = '/mobiles?price=budget'}
                   data-testid="price-range-budget">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Budget Phones</h3>
                <p className="text-green-600 text-2xl font-bold mb-2">Under ₨50,000</p>
                <p className="text-sm text-green-700 mb-4">Great value smartphones with essential features</p>
                <span className="text-sm font-medium text-green-800">{budgetCount} phones</span>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => window.location.href = '/mobiles?price=midrange'}
                   data-testid="price-range-midrange">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Mid-Range</h3>
                <p className="text-blue-600 text-2xl font-bold mb-2">₨50K - ₨150K</p>
                <p className="text-sm text-blue-700 mb-4">Perfect balance of features and performance</p>
                <span className="text-sm font-medium text-blue-800">{midRangeCount} phones</span>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => window.location.href = '/mobiles?price=flagship'}
                   data-testid="price-range-flagship">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Flagship</h3>
                <p className="text-purple-600 text-2xl font-bold mb-2">Above ₨150K</p>
                <p className="text-sm text-purple-700 mb-4">Premium smartphones with cutting-edge technology</p>
                <span className="text-sm font-medium text-purple-800">{flagshipCount} phones</span>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
