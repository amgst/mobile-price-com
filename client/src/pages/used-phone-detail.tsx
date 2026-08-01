import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { MapPin, Tag, Phone, MessageCircle, ArrowLeft } from "lucide-react";
import type { UsedListing } from "@shared/schema";

function UsedPhoneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState(0);

  const { data: listing, isLoading, error } = useQuery<UsedListing>({
    queryKey: [`/api/listings/${id}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">Loading listing...</main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600 mb-4">This listing is not available. It may have been sold or removed.</p>
          <Link href="/used-phones">
            <Button variant="outline">Back to Used Phones</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const whatsappNumber = listing.sellerPhone.replace(/[^0-9]/g, "");

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{listing.brand} {listing.model} - Used for Sale | MobilePrices.pk</title>
        <meta
          name="description"
          content={`${listing.condition} condition ${listing.brand} ${listing.model} for sale at ${listing.price}${listing.city ? ` in ${listing.city}` : ""}.`}
        />
      </Helmet>

      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/used-phones" className="inline-flex items-center text-gray-600 hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Used Phones
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SafeImage
              src={listing.images[activeImage] || listing.images}
              alt={`${listing.brand} ${listing.model}`}
              className="w-full aspect-square rounded-xl mb-3"
            />
            {listing.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {listing.images.map((img, index) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(index)}
                    className={`rounded-lg overflow-hidden border-2 ${
                      index === activeImage ? "border-primary" : "border-transparent"
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <SafeImage src={img} alt={`${listing.brand} ${listing.model} photo ${index + 1}`} className="w-full aspect-square" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {listing.brand} {listing.model}
              </h1>
              <Badge variant="secondary" className="whitespace-nowrap">{listing.condition}</Badge>
            </div>
            <p className="text-3xl font-bold text-primary flex items-center mb-4">
              <Tag className="h-6 w-6 mr-2" />
              {listing.price}
            </p>
            {listing.city && (
              <p className="text-gray-600 flex items-center mb-6">
                <MapPin className="h-4 w-4 mr-1" /> {listing.city}
              </p>
            )}

            {listing.description && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Contact Seller</h3>
                <p className="text-sm text-gray-600">{listing.sellerName}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={`tel:${listing.sellerPhone}`} className="flex-1">
                    <Button variant="outline" className="w-full" data-testid="button-call-seller">
                      <Phone className="h-4 w-4 mr-2" /> {listing.sellerPhone}
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-whatsapp-seller">
                      <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                  </a>
                </div>
                <p className="text-xs text-gray-400">
                  Meet in a safe public place and inspect the phone before paying.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default UsedPhoneDetailPage;
