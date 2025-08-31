import { Helmet } from "react-helmet-async";

interface MetaTagsProps {
  mobile?: any;
  brand?: any;
  page?: 'home' | 'brand' | 'mobile' | 'search' | 'compare';
}

export function RichMetaTags({ mobile, brand, page = 'home' }: MetaTagsProps) {
  const generateKeywords = () => {
    if (mobile) {
      return `${mobile.name}, ${mobile.brand} mobile, ${mobile.name} price, ${mobile.name} specifications, ${mobile.shortSpecs.ram}, ${mobile.shortSpecs.camera}, mobile price Pakistan, smartphone review`;
    }
    if (brand) {
      return `${brand.name} mobile, ${brand.name} price, ${brand.name} smartphones, mobile phones Pakistan, ${brand.name} latest models`;
    }
    return 'mobile price Pakistan, smartphone comparison, mobile specifications, phone reviews, latest mobiles 2025';
  };

  const generateAlternateTags = () => {
    const baseUrl = import.meta.env.VITE_SITE_URL || 'https://mobileprices.pk';
    return (
      <>
        <link rel="alternate" hrefLang="en" href={`${baseUrl}${mobile ? `/${mobile.brand.toLowerCase()}/${mobile.slug}` : brand ? `/${brand.slug}` : ''}`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${mobile ? `/${mobile.brand.toLowerCase()}/${mobile.slug}` : brand ? `/${brand.slug}` : ''}`} />
      </>
    );
  };

  return (
    <Helmet>
      {/* Rich Keywords */}
      <meta name="keywords" content={generateKeywords()} />
      
      {/* Author and Publisher */}
      <meta name="author" content="MobilePrices.pk" />
      <meta name="publisher" content="MobilePrices.pk" />
      
      {/* Content Information */}
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      
      {/* Mobile Optimization */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Performance and Caching */}
      <meta httpEquiv="Cache-Control" content="public, max-age=31536000" />
      
      {/* Geographic Information */}
      <meta name="geo.region" content="PK" />
      <meta name="geo.country" content="Pakistan" />
      <meta name="ICBM" content="30.3753, 69.3451" />
      
      {/* Additional OpenGraph Tags */}
      {mobile && (
        <>
          <meta property="og:type" content="product" />
          <meta property="product:brand" content={mobile.brand} />
          <meta property="product:availability" content="in stock" />
          <meta property="product:condition" content="new" />
          <meta property="product:price:amount" content={mobile.price?.replace(/[₨,\s]/g, '') || '0'} />
          <meta property="product:price:currency" content="PKR" />
          <meta property="product:retailer_item_id" content={mobile.id} />
        </>
      )}
      
      {/* Article Tags for Mobile Reviews */}
      {mobile && (
        <>
          <meta property="article:published_time" content={new Date().toISOString()} />
          <meta property="article:modified_time" content={new Date().toISOString()} />
          <meta property="article:section" content="Technology" />
          <meta property="article:tag" content={`${mobile.brand} Mobile`} />
          <meta property="article:tag" content="Smartphone Review" />
          <meta property="article:tag" content="Mobile Specifications" />
        </>
      )}
      
      {/* Alternate Language Tags */}
      {generateAlternateTags()}
      
      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fdn2.gsmarena.com" />
      
      {/* Mobile-specific meta tags */}
      {mobile && (
        <>
          <meta name="price" content={mobile.price} />
          <meta name="priceCurrency" content="PKR" />
          <meta name="availability" content="https://schema.org/InStock" />
          <meta name="brand" content={mobile.brand} />
          <meta name="model" content={mobile.model} />
          <meta name="ram" content={mobile.shortSpecs.ram} />
          <meta name="storage" content={mobile.shortSpecs.storage} />
          <meta name="camera" content={mobile.shortSpecs.camera} />
        </>
      )}
    </Helmet>
  );
}