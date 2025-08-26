import { generateOGImageUrl } from "@/lib/seo-utils";

interface WebsiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  potentialAction: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
}

interface ProductSchema {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  image: string[];
  brand: {
    "@type": "Brand";
    name: string;
  };
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    reviewCount: string;
  };
}

interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

interface FAQSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

interface ReviewSchema {
  "@context": "https://schema.org";
  "@type": "Review";
  reviewRating: {
    "@type": "Rating";
    ratingValue: string;
    bestRating: string;
  };
  author: {
    "@type": "Person";
    name: string;
  };
  reviewBody: string;
  datePublished: string;
}

interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

interface CollectionPageSchema {
  "@context": "https://schema.org";
  "@type": "CollectionPage";
  name: string;
  description: string;
  url: string;
  mainEntity: {
    "@type": "ItemList";
    numberOfItems: number;
    itemListElement: {
      "@type": "Product";
      position: number;
      name: string;
      url: string;
      image: string;
      offers: {
        "@type": "Offer";
        price: string;
        priceCurrency: string;
      };
    }[];
  };
}

export function generateWebsiteSchema(): WebsiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MobilePrices.pk",
    url: import.meta.env.VITE_SITE_URL || "https://mobileprices.pk",
    description: "Pakistan's trusted mobile phone price comparison website",
    potentialAction: {
      "@type": "SearchAction",
      target: `${import.meta.env.VITE_SITE_URL || "https://mobileprices.pk"}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateProductSchema(mobile: any): ProductSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: mobile.name,
    description: `${mobile.name} with ${mobile.shortSpecs?.ram} RAM, ${mobile.shortSpecs?.storage} storage, ${mobile.shortSpecs?.camera} camera. Complete specifications and price in Pakistan.`,
    image: mobile.carouselImages && mobile.carouselImages.length > 0 
      ? mobile.carouselImages 
      : [generateOGImageUrl(mobile)],
    brand: {
      "@type": "Brand",
      name: mobile.brand
    },
    offers: {
      "@type": "Offer",
      price: mobile.price?.replace(/[₨,\s]/g, '') || "0",
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      url: `${import.meta.env.VITE_SITE_URL || "https://mobileprices.pk"}/${mobile.brand.toLowerCase()}/${mobile.slug}`
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.2",
      reviewCount: "156"
    }
  };
}

export function generateBreadcrumbSchema(breadcrumbs: { label: string; href: string }[]): BreadcrumbSchema {
  const baseUrl = import.meta.env.VITE_SITE_URL || "https://mobileprices.pk";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${baseUrl}${crumb.href}`
    }))
  };
}

export function generateFAQSchema(mobile: any): FAQSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the price of ${mobile.name} in Pakistan?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The current price of ${mobile.name} in Pakistan is ${mobile.price}. This price may vary depending on the retailer and availability.`
        }
      },
      {
        "@type": "Question",
        name: `What are the key specifications of ${mobile.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${mobile.name} features ${mobile.shortSpecs?.ram} RAM, ${mobile.shortSpecs?.storage} internal storage, ${mobile.shortSpecs?.camera} camera system, and ${mobile.shortSpecs?.battery || 'advanced'} battery technology.`
        }
      },
      {
        "@type": "Question",
        name: `When was ${mobile.name} released?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${mobile.name} was released in ${mobile.releaseDate}.`
        }
      },
      {
        "@type": "Question",
        name: `Is ${mobile.name} available in Pakistan?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, ${mobile.name} is available in Pakistan through various retailers and online stores.`
        }
      }
    ]
  };
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MobilePrices.pk",
    url: import.meta.env.VITE_SITE_URL || "https://mobileprices.pk",
    logo: `${import.meta.env.VITE_SITE_URL || "https://mobileprices.pk"}/logo.png`,
    description: "Pakistan's most trusted mobile phone price comparison website providing latest mobile prices, specifications, reviews and comparisons.",
    sameAs: [
      "https://facebook.com/mobileprices.pk",
      "https://twitter.com/mobileprices_pk",
      "https://instagram.com/mobileprices.pk"
    ]
  };
}

export function generateCollectionPageSchema(brand: any, mobiles: any[]): CollectionPageSchema {
  const baseUrl = import.meta.env.VITE_SITE_URL || "https://mobileprices.pk";
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand.name} Mobile Phones in Pakistan`,
    description: `Complete collection of ${brand.name} mobile phones with latest prices and specifications in Pakistan.`,
    url: `${baseUrl}/${brand.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: mobiles.length,
      itemListElement: mobiles.slice(0, 20).map((mobile, index) => ({
        "@type": "Product",
        position: index + 1,
        name: mobile.name,
        url: `${baseUrl}/${brand.slug}/${mobile.slug}`,
        image: generateOGImageUrl(mobile),
        offers: {
          "@type": "Offer",
          price: mobile.price?.replace(/[₨,\s]/g, '') || "0",
          priceCurrency: "PKR"
        }
      }))
    }
  };
}
