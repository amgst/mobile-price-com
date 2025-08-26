import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCompare } from "@/hooks/use-compare";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Search, X, Plus } from "lucide-react";
import type { Mobile } from "@shared/schema";

export default function Compare() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { compareList, addToCompare, removeFromCompare, clearCompare } = useCompare();

  // Update URL when compare list changes
  useEffect(() => {
    const currentParams = new URLSearchParams(location.split('?')[1] || '');
    if (compareList.length > 0) {
      currentParams.set('phones', compareList.join(','));
      const newUrl = `/compare?${currentParams.toString()}`;
      if (location !== newUrl) {
        window.history.replaceState({}, '', newUrl);
      }
    } else {
      if (location !== '/compare') {
        window.history.replaceState({}, '', '/compare');
      }
    }
  }, [compareList, location]);

  const { data: searchResults } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles", { search: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const { data: allMobiles } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const compareMobiles = allMobiles?.filter(mobile => 
    compareList.includes(mobile.id)
  ) || [];

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Compare", href: "/compare", isActive: true }
  ];

  const handleAddToCompare = (mobile: Mobile) => {
    addToCompare(mobile);
    setSearchQuery("");
  };

  const getCompareTitle = () => {
    if (compareMobiles.length === 0) return "Compare Mobile Phones";
    if (compareMobiles.length === 1) return `${compareMobiles[0].name} - Mobile Comparison`;
    return `${compareMobiles.map(m => m.name).join(' vs ')} - Mobile Comparison`;
  };

  return (
    <>
      <SEOHead 
        title={getCompareTitle()}
        description={compareMobiles.length > 0 
          ? `Compare ${compareMobiles.map(m => m.name).join(', ')} specifications, prices, and features side by side.`
          : "Compare mobile phones side by side. Add phones to compare specifications, prices, camera, battery and more features."
        }
        canonical="/compare"
        noIndex={compareMobiles.length === 0}
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Compare Mobile Phones</h1>
            <p className="text-lg text-gray-600">
              Compare specifications, features, and prices of up to 4 mobile phones side by side.
            </p>
          </div>

          {/* Add Phone Search */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search phones to add to comparison..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-compare"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {compareList.length}/4 phones selected
                </div>
              </div>

              {/* Search Results */}
              {searchResults && searchResults.length > 0 && searchQuery.length > 2 && (
                <div className="mt-4 border rounded-lg bg-white max-h-60 overflow-y-auto">
                  {searchResults.slice(0, 10).map((mobile) => (
                    <div
                      key={mobile.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <SafeImage
                          src={mobile.imageUrl}
                          alt={mobile.name}
                          className="w-10 h-10 object-contain rounded"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{mobile.name}</div>
                          <div className="text-sm text-gray-600">{mobile.brand} • {mobile.price}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCompare(mobile)}
                        disabled={compareList.length >= 4 || compareList.includes(mobile.id)}
                        data-testid={`button-add-compare-${mobile.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>



          {/* Comparison Table */}
          {compareMobiles.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900 min-w-[200px]">
                          Specification
                        </th>
                        {compareMobiles.map((mobile) => (
                          <th key={mobile.id} className="text-center p-4 min-w-[200px]">
                            <div className="text-center">
                              <SafeImage
                                src={mobile.imageUrl}
                                alt={mobile.name}
                                className="w-16 h-16 object-contain mx-auto mb-2"
                              />
                              <div className="font-semibold text-sm">{mobile.name}</div>
                              <div className="text-green-600 font-bold text-sm">{mobile.price}</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCompare(mobile.id)}
                                className="mt-2"
                                data-testid={`button-remove-compare-${mobile.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Basic Info */}
                      <tr>
                        <td className="p-4 font-medium text-gray-700">Brand</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm capitalize">
                            {mobile.brand}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-gray-700">Release Date</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm">
                            {mobile.releaseDate}
                          </td>
                        ))}
                      </tr>

                      {/* Short Specs */}
                      <tr>
                        <td className="p-4 font-medium text-gray-700">Display</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm">
                            {mobile.shortSpecs.display || "-"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-gray-700">Processor</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm">
                            {mobile.shortSpecs.processor || "-"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-gray-700">RAM</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm">
                            {mobile.shortSpecs.ram}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-gray-700">Storage</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm">
                            {mobile.shortSpecs.storage}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-gray-700">Main Camera</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm">
                            {mobile.shortSpecs.camera}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-gray-700">Battery</td>
                        {compareMobiles.map((mobile) => (
                          <td key={mobile.id} className="p-4 text-center text-sm">
                            {mobile.shortSpecs.battery || "-"}
                          </td>
                        ))}
                      </tr>

                      {/* Dimensions */}
                      {compareMobiles.some(m => m.dimensions) && (
                        <>
                          <tr>
                            <td className="p-4 font-medium text-gray-700">Weight</td>
                            {compareMobiles.map((mobile) => (
                              <td key={mobile.id} className="p-4 text-center text-sm">
                                {mobile.dimensions?.weight || "-"}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-4 font-medium text-gray-700">Dimensions</td>
                            {compareMobiles.map((mobile) => (
                              <td key={mobile.id} className="p-4 text-center text-sm">
                                {mobile.dimensions ? 
                                  `${mobile.dimensions.height} × ${mobile.dimensions.width} × ${mobile.dimensions.thickness}` 
                                  : "-"
                                }
                              </td>
                            ))}
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 text-center">
                  <Button 
                    onClick={clearCompare}
                    variant="outline"
                    data-testid="button-clear-comparison"
                  >
                    Clear Comparison
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No phones selected for comparison</p>
              <p className="text-gray-600">Use the search above to add phones to compare their specifications.</p>
            </div>
          )}
        </main>

        <Footer />
      </div>


    </>
  );
}
