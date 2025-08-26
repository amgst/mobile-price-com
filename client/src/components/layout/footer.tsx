import { Link } from "wouter";
import { Smartphone, Facebook, Twitter, Instagram } from "lucide-react";

export function Footer() {
  const popularBrands = [
    { name: "Samsung", slug: "samsung" },
    { name: "Apple", slug: "apple" },
    { name: "Xiaomi", slug: "xiaomi" },
    { name: "Oppo", slug: "oppo" },
    { name: "Vivo", slug: "vivo" },
  ];

  const quickLinks = [
    { name: "Latest Mobiles", href: "/?filter=latest" },
    { name: "Price Comparison", href: "/compare" },
    { name: "Mobile Reviews", href: "/reviews" },
    { name: "Buying Guide", href: "/guide" },
    { name: "Contact Us", href: "/contact" },
  ];

  const priceRanges = [
    { name: "Under $200", href: "/search?price=0-20000" },
    { name: "$200 - $500", href: "/search?price=20000-50000" },
    { name: "$500 - $1000", href: "/search?price=50000-100000" },
    { name: "$1000 - $2000", href: "/search?price=100000-200000" },
    { name: "Above $2000", href: "/search?price=200000-999999" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <Smartphone className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold">Mobile Price</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Your trusted mobile phone price comparison website. Find the best deals on smartphones from all major brands with detailed specifications and reviews.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="social-facebook"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="social-twitter"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="social-instagram"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Popular Brands */}
          <div>
            <h3 className="font-semibold mb-4">Popular Brands</h3>
            <ul className="space-y-2 text-sm">
              {popularBrands.map((brand) => (
                <li key={brand.slug}>
                  <Link 
                    href={`/${brand.slug}`} 
                    className="text-gray-400 hover:text-white transition-colors"
                    data-testid={`footer-brand-${brand.slug}`}
                  >
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-colors"
                    data-testid={`footer-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Ranges */}
          <div>
            <h3 className="font-semibold mb-4">Price Ranges</h3>
            <ul className="space-y-2 text-sm">
              {priceRanges.map((range) => (
                <li key={range.href}>
                  <Link 
                    href={range.href} 
                    className="text-gray-400 hover:text-white transition-colors"
                    data-testid={`footer-price-${range.name.toLowerCase().replace(/[₨\s,-]/g, '')}`}
                  >
                    {range.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Mobile Price. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="footer-privacy"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="footer-terms"
              >
                Terms of Service
              </Link>
              <Link 
                href="/sitemap" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="footer-sitemap"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
