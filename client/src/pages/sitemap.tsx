import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import type { Brand, Mobile } from "@shared/schema";

export default function Sitemap() {
  const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: mobiles, isLoading: mobilesLoading } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const isLoading = brandsLoading || mobilesLoading;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Sitemap", href: "/sitemap", isActive: true }
  ];

  return (
    <>
      <SEOHead 
        title="HTML Sitemap - Mobile Price"
        description="Browse all important pages, brands, and mobile detail pages of Mobile Price."
        canonical="/sitemap"
      />

      <div className="min-h-screen bg-gray-50">
        <Header />
        <Breadcrumbs items={breadcrumbs} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">HTML Sitemap</h1>
          <p className="text-gray-600 mb-8">Use this sitemap to quickly navigate to key pages, brand lists, and individual mobile detail pages.</p>

          {isLoading ? (
            <div className="space-y-6">
              <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Key Pages */}
              <section aria-labelledby="sitemap-key-pages">
                <h2 id="sitemap-key-pages" className="text-xl font-semibold mb-4">Key Pages</h2>
                <ul className="space-y-2 text-primary">
                  <li><a href="/" className="hover:underline" data-testid="sitemap-home">Home</a></li>
                  <li><a href="/brands" className="hover:underline" data-testid="sitemap-brands">Brands</a></li>
                  <li><a href="/mobiles" className="hover:underline" data-testid="sitemap-mobiles">All Mobiles</a></li>
                  <li><a href="/compare" className="hover:underline" data-testid="sitemap-compare">Compare</a></li>
                  <li><a href="/search" className="hover:underline" data-testid="sitemap-search">Search</a></li>
                  <li><a href="/reviews" className="hover:underline" data-testid="sitemap-reviews">Reviews</a></li>
                  <li><a href="/guide" className="hover:underline" data-testid="sitemap-guide">Buying Guide</a></li>
                  <li><a href="/contact" className="hover:underline" data-testid="sitemap-contact">Contact</a></li>
                  <li><a href="/privacy" className="hover:underline" data-testid="sitemap-privacy">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:underline" data-testid="sitemap-terms">Terms of Service</a></li>
                </ul>
              </section>

              {/* Brands */}
              <section aria-labelledby="sitemap-brands-list">
                <h2 id="sitemap-brands-list" className="text-xl font-semibold mb-4">Brands</h2>
                <ul className="space-y-2 text-primary">
                  {brands?.filter(b => b.isVisible !== false).map((brand) => (
                    <li key={brand.id}>
                      <a href={`/${brand.slug}`} className="hover:underline" data-testid={`sitemap-brand-${brand.slug}`}>
                        {brand.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Mobiles */}
              <section aria-labelledby="sitemap-mobiles-list">
                <h2 id="sitemap-mobiles-list" className="text-xl font-semibold mb-4">Mobile Detail Pages</h2>
                <ul className="space-y-2 text-primary max-h-[600px] overflow-auto border rounded p-4 bg-white">
                  {mobiles?.map((mobile) => (
                    <li key={mobile.id}>
                      <a href={`/${mobile.brand.toLowerCase()}/${mobile.slug}`} className="hover:underline" data-testid={`sitemap-mobile-${mobile.slug}`}>
                        {mobile.brand} {mobile.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}