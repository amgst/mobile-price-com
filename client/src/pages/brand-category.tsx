import { useMemo, useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { RichMetaTags } from "@/components/seo/meta-tags";
import { generateCollectionPageSchema, generateBreadcrumbSchema, generateOrganizationSchema } from "@/components/seo/structured-data";
import { MobileCard } from "@/components/mobile/mobile-card";
import { LastUpdated } from "@/components/seo/last-updated";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Brand, Mobile } from "@shared/schema";

type PriceFilter = "all" | "budget" | "mid" | "premium";
type SortOption = "newest" | "price-low" | "price-high" | "popular";

const getNumericPrice = (price: Mobile["price"]) => {
  if (!price) return 0;
  if (typeof price === "number") return price;
  const numeric = parseInt(price.replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const getReleaseYear = (mobile: Mobile) => {
  if (!mobile.releaseDate) return "";
  const match = mobile.releaseDate.match(/\d{4}/);
  return match ? match[0] : "";
};

const getReleaseTimestamp = (mobile: Mobile) => {
  if (!mobile.releaseDate) return 0;
  const timestamp = Date.parse(mobile.releaseDate);
  if (!Number.isNaN(timestamp)) return timestamp;
  const year = getReleaseYear(mobile);
  return year ? new Date(Number(year), 0, 1).getTime() : 0;
};

export default function BrandCategory() {
  const { brand: brandSlug } = useParams<{ brand: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [releaseYearFilter, setReleaseYearFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const { data: brand } = useQuery<Brand>({
    queryKey: ["/api/brands", brandSlug],
  });

  const { data: mobiles, isLoading } = useQuery<Mobile[]>({
    queryKey: [`/api/mobiles?brand=${brandSlug}`],
    enabled: !!brandSlug,
  });

  useEffect(() => {
    setCurrentPage(1);
    setPriceFilter("all");
    setReleaseYearFilter("all");
    setSortOption("newest");
  }, [brandSlug]);

  const releaseYearOptions = useMemo(() => {
    if (!mobiles) return [] as string[];
    const years = new Set<string>();
    mobiles.forEach((mobile) => {
      const year = getReleaseYear(mobile);
      if (year) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [mobiles]);

  const filteredMobiles = useMemo(() => {
    if (!mobiles) return [] as Mobile[];

    let result = mobiles;

    if (priceFilter !== "all") {
      result = result.filter((mobile) => {
        const price = getNumericPrice(mobile.price);
        if (price === 0) return false;
        if (priceFilter === "budget") return price < 50000;
        if (priceFilter === "mid") return price >= 50000 && price <= 150000;
        if (priceFilter === "premium") return price > 150000;
        return true;
      });
    }

    if (releaseYearFilter !== "all") {
      result = result.filter((mobile) => getReleaseYear(mobile) === releaseYearFilter);
    }

    const sorted = [...result];
    switch (sortOption) {
      case "price-low":
        sorted.sort((a, b) => getNumericPrice(a.price) - getNumericPrice(b.price));
        break;
      case "price-high":
        sorted.sort((a, b) => getNumericPrice(b.price) - getNumericPrice(a.price));
        break;
      case "popular":
        sorted.sort((a, b) => {
          const bPopular = (b as any).isFeatured ? 1 : 0;
          const aPopular = (a as any).isFeatured ? 1 : 0;
          if (bPopular !== aPopular) {
            return bPopular - aPopular;
          }
          return getReleaseTimestamp(b) - getReleaseTimestamp(a);
        });
        break;
      case "newest":
      default:
        sorted.sort((a, b) => getReleaseTimestamp(b) - getReleaseTimestamp(a));
        break;
    }

    return sorted;
  }, [mobiles, priceFilter, releaseYearFilter, sortOption]);

  useEffect(() => {
    setCurrentPage(1);
  }, [priceFilter, releaseYearFilter, sortOption]);

  useEffect(() => {
    if (filteredMobiles.length === 0) {
      setCurrentPage(1);
      return;
    }
    const totalPages = Math.max(1, Math.ceil(filteredMobiles.length / itemsPerPage));
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [filteredMobiles, itemsPerPage]);

  const paginatedMobiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMobiles.slice(startIndex, endIndex);
  }, [filteredMobiles, currentPage, itemsPerPage]);

  const totalBrandMobiles = mobiles?.length ?? 0;
  const totalFilteredMobiles = filteredMobiles.length;
  const totalPages = totalFilteredMobiles > 0 ? Math.ceil(totalFilteredMobiles / itemsPerPage) : 0;

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
        title={`${brand?.name || brandSlug} Mobile Price in Pakistan (Updated 2025) – ${brand?.name || brandSlug}`}
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
                <h1 className="text-3xl font-bold text-gray-900">{brand?.name || brandSlug} Mobile Price in Pakistan (Updated 2025)</h1>
                <p className="text-gray-600">{totalBrandMobiles} models available</p>
              </div>
            </div>
            {brand?.description && (
              <p className="text-lg text-gray-600 max-w-3xl">
                {brand.description}
              </p>
            )}
            {/* Last Updated Date */}
            <div className="mt-4">
              <LastUpdated />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Select
              value={priceFilter}
              onValueChange={(value) => setPriceFilter(value as PriceFilter)}
            >
              <SelectTrigger className="w-[180px]" data-testid="filter-price">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="budget">Under ₨50,000</SelectItem>
                <SelectItem value="mid">₨50K - ₨150K</SelectItem>
                <SelectItem value="premium">Above ₨150K</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={releaseYearFilter}
              onValueChange={(value) => setReleaseYearFilter(value)}
            >
              <SelectTrigger className="w-[180px]" data-testid="filter-release">
                <SelectValue placeholder="Release Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {releaseYearOptions.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value as SortOption)}
            >
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

            <Button
              variant="outline"
              data-testid="button-clear-filters"
              onClick={() => {
                setPriceFilter("all");
                setReleaseYearFilter("all");
                setSortOption("newest");
              }}
              disabled={priceFilter === "all" && releaseYearFilter === "all" && sortOption === "newest"}
            >
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
            filteredMobiles.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalFilteredMobiles)} - {Math.min(currentPage * itemsPerPage, totalFilteredMobiles)} of {totalFilteredMobiles} mobile phones
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedMobiles.map((mobile) => (
                    <MobileCard key={mobile.id} mobile={mobile} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No mobiles match the selected filters.</p>
                <Button variant="outline" onClick={() => {
                  setPriceFilter("all");
                  setReleaseYearFilter("all");
                  setSortOption("newest");
                }}>
                  Reset Filters
                </Button>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No mobiles found for {brand?.name}</p>
            </div>
          )}

          {/* FAQ Section for Brand Category */}
          {brand && mobiles && mobiles.length > 0 && (
            <section className="mt-12 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">
                      What is the latest {brand.name} mobile price in Pakistan?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      The latest {brand.name} mobile prices in Pakistan range from budget-friendly options under ₨50,000 to premium flagship devices above ₨150,000. Browse our complete list to find the exact price for any {brand.name} model.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">
                      How many {brand.name} mobile models are available in Pakistan?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      Currently, there are {totalBrandMobiles} {brand.name} mobile models available in Pakistan. This includes budget, mid-range, and flagship devices to suit different needs and budgets.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">
                      Where can I buy {brand.name} mobile phones in Pakistan?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      {brand.name} mobile phones are available across Pakistan through authorized dealers, major electronics stores, and online retailers. Popular platforms include Daraz, Shophive, and local mobile markets in Karachi, Lahore, and Islamabad.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">
                      Which {brand.name} mobile is best for budget buyers?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      For budget-conscious buyers, {brand.name} offers several options under ₨50,000 with excellent features. Use our price filter to view budget-friendly {brand.name} models and compare their specifications.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">
                      Are {brand.name} mobile prices updated regularly?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      Yes, we regularly update {brand.name} mobile prices to reflect the latest market rates in Pakistan. Prices are checked daily to ensure accuracy, though actual prices may vary slightly by retailer.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">
                      What is the price range for {brand.name} phones in Pakistan?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      {brand.name} mobile prices in Pakistan range from budget-friendly options under ₨50,000 to premium flagship devices above ₨150,000. Use our filters to explore phones in your preferred price range.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
