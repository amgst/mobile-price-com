/**
 * SEO utility functions for mobile phone comparison website
 */

/**
 * Generate SEO-optimized title for mobile detail page
 */
export function generateMobileTitle(mobile: any): string {
  const brand = mobile.brand.charAt(0).toUpperCase() + mobile.brand.slice(1);
  const price = mobile.price.replace(/[^\d,₨-]/g, '').trim();
  return `${brand} ${mobile.name} Price in Pakistan ${new Date().getFullYear()} - ${price} | Specifications & Reviews`;
}

/**
 * Generate SEO-optimized description for mobile detail page
 */
export function generateMobileDescription(mobile: any): string {
  const brand = mobile.brand.charAt(0).toUpperCase() + mobile.brand.slice(1);
  const specs = [];
  
  if (mobile.shortSpecs.ram) specs.push(`${mobile.shortSpecs.ram} RAM`);
  if (mobile.shortSpecs.storage) specs.push(`${mobile.shortSpecs.storage} Storage`);
  if (mobile.shortSpecs.camera) specs.push(extractMainCamera(mobile.shortSpecs.camera));
  if (mobile.shortSpecs.battery) specs.push(`${mobile.shortSpecs.battery} Battery`);
  
  const specsText = specs.length > 0 ? ` Features: ${specs.slice(0, 3).join(', ')}.` : '';
  
  return `${brand} ${mobile.name} price in Pakistan is ${mobile.price}.${specsText} Compare specifications, camera quality, performance reviews and buy online with best deals.`;
}

/**
 * Generate SEO-optimized title for brand category page
 */
export function generateBrandTitle(brand: any, mobileCount: number = 0): string {
  const brandName = brand.name;
  const count = mobileCount > 0 ? `${mobileCount}+ ` : '';
  return `${brandName} Mobile Phones Price in Pakistan ${new Date().getFullYear()} - ${count}Latest Models & Specifications`;
}

/**
 * Generate SEO-optimized description for brand category page
 */
export function generateBrandDescription(brand: any, mobileCount: number = 0): string {
  const count = mobileCount > 0 ? `${mobileCount}+ ` : '';
  return `Latest ${brand.name} mobile phone prices in Pakistan. Compare ${count}models with detailed specifications, camera reviews, and performance analysis. Updated ${new Date().getFullYear()}.`;
}

/**
 * Extract main camera megapixels from camera specification
 */
function extractMainCamera(cameraText: string): string {
  if (!cameraText) return '';
  
  const mpMatch = cameraText.match(/(\d+)\s*MP/i);
  return mpMatch ? `${mpMatch[1]}MP Camera` : '';
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://mobile-price.com';
  return `${baseUrl}${path}`;
}

/**
 * Generate Open Graph image URL for mobile
 */
export function generateOGImageUrl(mobile: any): string {
  // Use mobile's main image or fallback to default
  if (mobile.imageUrl) {
    return mobile.imageUrl;
  }
  
  // Fallback to default OG image
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://mobileprices.pk';
  return `${baseUrl}/images/og-default-mobile.jpg`;
}

/**
 * Generate keywords for mobile detail page
 */
export function generateMobileKeywords(mobile: any): string {
  const keywords = [
    `${mobile.name}`,
    `${mobile.brand} mobile`,
    `${mobile.name} price`,
    `${mobile.name} specifications`,
    `${mobile.name} Pakistan`,
    'mobile price Pakistan',
    'smartphone comparison',
    'mobile reviews',
    `${mobile.brand} ${new Date().getFullYear()}`,
  ];
  
  // Add spec-based keywords
  if (mobile.shortSpecs.ram) keywords.push(`${mobile.shortSpecs.ram} mobile`);
  if (mobile.shortSpecs.camera) {
    const mpMatch = mobile.shortSpecs.camera.match(/(\d+)\s*MP/i);
    if (mpMatch) keywords.push(`${mpMatch[1]}MP camera mobile`);
  }
  
  return keywords.slice(0, 15).join(', ');
}

/**
 * Generate structured FAQ data for mobile
 */
export function generateMobileFAQ(mobile: any) {
  return [
    {
      question: `What is the price of ${mobile.name} in Pakistan?`,
      answer: `The ${mobile.name} price in Pakistan is ${mobile.price}. This price may vary depending on the retailer and current market conditions.`
    },
    {
      question: `What are the key specifications of ${mobile.name}?`,
      answer: `The ${mobile.name} features ${mobile.shortSpecs.ram} RAM, ${mobile.shortSpecs.storage} storage, ${mobile.shortSpecs.camera} camera system, and ${mobile.shortSpecs.battery || 'efficient'} battery.`
    },
    {
      question: `When was ${mobile.name} released?`,
      answer: `The ${mobile.name} was released on ${mobile.releaseDate}.`
    },
    {
      question: `Is ${mobile.name} worth buying in ${new Date().getFullYear()}?`,
      answer: `The ${mobile.name} offers excellent value with its ${mobile.shortSpecs.camera} camera, ${mobile.shortSpecs.ram} RAM, and ${mobile.shortSpecs.storage} storage at ${mobile.price} price point in Pakistan.`
    }
  ];
}