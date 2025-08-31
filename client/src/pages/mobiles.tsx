import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { MobileCard } from "@/components/mobile/mobile-card";
import { Button } from "@/components/ui/button";
import type { Mobile } from "@shared/schema";

export default function Mobiles() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<'all' | 'budget' | 'midrange' | 'flagship'>('all');

  const { data: mobiles, isLoading } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const filteredMobiles = useMemo(() => {
    if (!mobiles) return [];
    
    switch (filter) {
      case 'budget':
        return mobiles.filter(m => (m.price || 0) < 50000);
      case 'midrange':
        return mobiles.filter(m => (m.price || 0) >= 50000 && (m.price || 0) <= 150000);
      case 'flagship':
        return mobiles.filter(m => (m.price || 0) > 150000);
      default:
        return mobiles;
    }
  }, [mobiles, filter]);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "All Mobiles", href: "/mobiles", isActive: true }
  ];

  return (
    <>
      <SEOHead 
        title="All Mobile Phones - Mobile Price"
        description="Browse all mobile phones with prices and specifications. Compare smartphones from all brands."
        canonical="/mobiles"
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">All Mobile Phones</h1>
            <div className="flex space-x-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={filter === 'budget' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('budget')}
              >
                Budget
              </Button>
              <Button 
                variant={filter === 'midrange' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('midrange')}
              >
                Mid-Range
              </Button>
              <Button 
                variant={filter === 'flagship' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('flagship')}
              >
                Flagship
              </Button>
            </div>
          </div>

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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredMobiles.length} mobile phones
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMobiles.map((mobile) => (
                  <MobileCard key={mobile.id} mobile={mobile} />
                ))}
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}