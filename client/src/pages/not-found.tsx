import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SEOHead } from "@/components/seo/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Search, Home, ArrowRight } from "lucide-react";
import type { Brand } from "@shared/schema";

export default function NotFound() {
  const { data: popularBrands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const topBrands = popularBrands?.slice(0, 6) || [];

  return (
    <>
      <SEOHead 
        title="Page Not Found - MobilePrices.pk"
        description="The page you're looking for doesn't exist. Browse our mobile phone collection and compare prices from top brands in Pakistan."
        canonical="/404"
        noIndex={true}
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* 404 Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
                <Smartphone className="w-12 h-12 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Oops! Page Not Found
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                The mobile phone or page you're looking for doesn't exist. Don't worry, 
                we have thousands of other great phones to explore!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="flex items-center gap-2">
                <a href="/">
                  <Home className="w-4 h-4" />
                  Go to Homepage
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
                <a href="/search">
                  <Search className="w-4 h-4" />
                  Search Mobiles
                </a>
              </Button>
            </div>
          </div>

          {/* Popular Brands */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Browse Popular Brands
              </h2>
              <p className="text-gray-600">
                Find the perfect mobile phone from these popular manufacturers
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topBrands.map((brand) => (
                <a
                  key={brand.id}
                  href={`/${brand.slug}`}
                  className="group"
                >
                  <Card className="hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <span className="text-lg font-bold text-gray-600 group-hover:text-blue-600">
                          {brand.logo}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {brand.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {brand.phoneCount}+ phones
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </section>

          {/* Quick Navigation */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quick Navigation
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/" className="group">
                <Card className="hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Homepage</h3>
                    <p className="text-sm text-gray-600">
                      Latest mobile phones and deals
                    </p>
                  </CardContent>
                </Card>
              </a>

              <a href="/brands" className="group">
                <Card className="hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">All Brands</h3>
                    <p className="text-sm text-gray-600">
                      Browse by manufacturer
                    </p>
                  </CardContent>
                </Card>
              </a>

              <a href="/search" className="group">
                <Card className="hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Search className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Search</h3>
                    <p className="text-sm text-gray-600">
                      Find specific mobile phones
                    </p>
                  </CardContent>
                </Card>
              </a>

              <a href="/compare" className="group">
                <Card className="hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <ArrowRight className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Compare</h3>
                    <p className="text-sm text-gray-600">
                      Compare phone specifications
                    </p>
                  </CardContent>
                </Card>
              </a>
            </div>
          </section>

          {/* Help Text */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Still Can't Find What You're Looking For?
                </h3>
                <p className="text-gray-600 mb-6">
                  Try searching for a specific mobile phone model, brand, or browse our 
                  complete collection of smartphones with detailed specifications and 
                  competitive prices in Pakistan.
                </p>
                <Button asChild className="flex items-center gap-2">
                  <a href="/search">
                    <Search className="w-4 h-4" />
                    Start Searching
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}