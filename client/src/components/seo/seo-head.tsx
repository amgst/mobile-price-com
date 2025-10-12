import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  noIndex?: boolean;
  ogImage?: string;
  jsonLd?: object;
  useAI?: boolean; // optional: enable AI-assisted meta description
  mobileData?: {
    name: string;
    brand: string;
    price?: string;
    shortSpecs?: {
      ram?: string;
      storage?: string;
      camera?: string;
      battery?: string;
      display?: string;
      processor?: string;
    };
  };
}

export function SEOHead({ 
  title, 
  description, 
  canonical, 
  noIndex = false, 
  ogImage = "/images/og-default.jpg",
  jsonLd,
  useAI = false,
  mobileData
}: SEOHeadProps) {
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://mobile-price.com';
  const fullCanonical = `${baseUrl}${canonical}`;
  const envUseAI = (import.meta.env.VITE_ENABLE_AI_SEO === 'true');
  const metaTagEnableAI = typeof document !== 'undefined'
    ? (document.querySelector('meta[name="ai-seo"]')?.getAttribute('content') === 'enabled')
    : false;
  const enableAI = useAI || envUseAI || metaTagEnableAI;

  useEffect(() => {
    let cancelled = false;

    async function enhanceDescription() {
      if (!enableAI || !mobileData) {
        setAiDescription(null);
        return;
      }

      try {
        const response = await fetch('/api/admin/ai/enhance-mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileData })
        });

        if (response.ok) {
          const enhancement = await response.json();
          const desc: string = enhancement.seoDescription || '';
          if (!cancelled) setAiDescription(desc);
        } else {
          if (!cancelled) setAiDescription(null);
        }
      } catch (e) {
        if (!cancelled) setAiDescription(null);
      }
    }

    enhanceDescription();
    return () => { cancelled = true; };
  }, [enableAI, mobileData]);

  const finalTitle = useMemo(() => title, [title]);
  const finalDescription = useMemo(() => aiDescription || description, [aiDescription, description]);
  
  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={fullCanonical} />
      
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Mobile Price" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}

      {/* Indicator meta so we can inspect in DevTools */}
      <meta name="ai-seo-enabled" content={enableAI ? 'true' : 'false'} />
    </Helmet>
  );
}
