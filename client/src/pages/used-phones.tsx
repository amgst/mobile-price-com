import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { Search, MapPin, Tag } from "lucide-react";
import type { UsedListing } from "@shared/schema";

function UsedPhonesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: listings = [], isLoading } = useQuery<UsedListing[]>({
    queryKey: ["/api/listings"],
  });

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const query = searchQuery.toLowerCase();
    return listings.filter(
      (listing) =>
        listing.brand.toLowerCase().includes(query) ||
        listing.model.toLowerCase().includes(query) ||
        listing.city?.toLowerCase().includes(query)
    );
  }, [listings, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Used Phones for Sale | MobilePrices.pk</title>
        <meta
          name="description"
          content="Browse used mobile phones for sale from sellers across Pakistan. Find great deals on second-hand smartphones."
        />
      </Helmet>

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Used Phones for Sale</h1>
            <p className="text-gray-600">Browse phones listed by sellers near you</p>
          </div>
          <Link href="/sell">
            <Button size="lg" data-testid="button-sell-your-phone">
              Sell Your Phone
            </Button>
          </Link>
        </div>

        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by brand, model, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-used-phones-search"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              {searchQuery ? `No listings found matching "${searchQuery}"` : "No used phones listed yet. Be the first to sell one!"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Link key={listing.id} href={`/used-phones/${listing.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`card-listing-${listing.id}`}>
                  <SafeImage
                    src={listing.images}
                    alt={`${listing.brand} ${listing.model}`}
                    className="w-full h-48 rounded-t-lg"
                  />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {listing.brand} {listing.model}
                      </h3>
                      <Badge variant="secondary">{listing.condition}</Badge>
                    </div>
                    <p className="text-lg font-bold text-primary flex items-center mb-1">
                      <Tag className="h-4 w-4 mr-1" />
                      {listing.price}
                    </p>
                    {listing.city && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {listing.city}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default UsedPhonesPage;
