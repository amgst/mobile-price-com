import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { MobileCard } from "@/components/mobile/mobile-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import type { Mobile } from "@shared/schema";

export default function Search() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  // Parse query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const query = params.get('q') || '';
    setSearchQuery(query);
    setCurrentQuery(query);
  }, [location]);

  const { data: searchResults, isLoading } = useQuery<Mobile[]>({
    queryKey: ["/api/search", `q=${encodeURIComponent(currentQuery)}`],
    enabled: currentQuery.length > 0,
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Search", href: "/search", isActive: true }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentQuery(searchQuery);
    // Update URL without triggering navigation
    const newUrl = searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : '/search';
    window.history.pushState({}, '', newUrl);
  };

  return (
    <>
      <SEOHead 
        title={currentQuery ? `Search Results for "${currentQuery}" - Mobile Phones` : "Search Mobile Phones"}
        description={currentQuery ? `Find mobile phones matching "${currentQuery}". Compare prices and specifications.` : "Search for mobile phones by name, brand, or specifications."}
        canonical="/search"
        noIndex={true}
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Mobile Phones</h1>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by phone name, brand, or specifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Button type="submit" data-testid="button-search">
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Search Results */}
          {currentQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Search results for "{currentQuery}"
                {searchResults && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({searchResults.length} {searchResults.length === 1 ? 'result' : 'results'})
                  </span>
                )}
              </h2>
            </div>
          )}

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
          ) : currentQuery && searchResults ? (
            searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((mobile) => (
                  <MobileCard key={mobile.id} mobile={mobile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No results found for "{currentQuery}"</p>
                <p className="text-gray-600">Try searching with different keywords or check the spelling.</p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Enter a search term to find mobile phones</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
