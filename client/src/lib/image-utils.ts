// Image optimization utilities for mobile phone images

export interface ImageOptions {
  quality?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export class ImageUtils {
  // Generate optimized GSMArena image URLs
  static getOptimizedUrl(originalUrl: string, options: ImageOptions = {}): string {
    const { quality = 'high', width, height } = options;
    
    if (!originalUrl.includes('gsmarena.com')) {
      return originalUrl;
    }

    let optimizedUrl = originalUrl;

    // Quality optimization
    switch (quality) {
      case 'low':
        optimizedUrl = optimizedUrl.replace('/bigpic/', '/thumbs/');
        break;
      case 'medium':
        optimizedUrl = optimizedUrl.replace('/bigpic/', '/pics/');
        break;
      case 'high':
      default:
        // Keep bigpic for highest quality
        break;
    }

    return optimizedUrl;
  }

  // Generate multiple image sources for different screen sizes
  static generateResponsiveSources(imageUrl: string): Array<{ src: string; media: string; quality: 'low' | 'medium' | 'high' }> {
    return [
      { src: this.getOptimizedUrl(imageUrl, { quality: 'high' }), media: '(min-width: 1024px)', quality: 'high' },
      { src: this.getOptimizedUrl(imageUrl, { quality: 'medium' }), media: '(min-width: 768px)', quality: 'medium' },
      { src: this.getOptimizedUrl(imageUrl, { quality: 'low' }), media: '(max-width: 767px)', quality: 'low' }
    ];
  }

  // Generate placeholder for progressive loading
  static generatePlaceholder(imageUrl: string): string {
    // Generate a low-quality version for initial load
    return this.getOptimizedUrl(imageUrl, { quality: 'low' });
  }

  // Brand-specific fallback images
  static getBrandFallbacks(brand: string): string[] {
    const brandMap: Record<string, string[]> = {
      'apple': [
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg'
      ],
      'samsung': [
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg'
      ],
      'google': [
        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8.jpg'
      ],
      'xiaomi': [
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg'
      ],
      'oneplus': [
        'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oneplus-11.jpg'
      ],
      'oppo': [
        'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x7-ultra.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno11-pro.jpg'
      ],
      'vivo': [
        'https://fdn2.gsmarena.com/vv/bigpic/vivo-x100-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/vivo-v30-pro.jpg'
      ]
    };

    return brandMap[brand.toLowerCase()] || [];
  }

  // Create comprehensive image source array with fallbacks
  static createImageSources(primaryUrl: string, carouselImages: string[], brand: string): string[] {
    const sources = [];
    
    // Add primary image
    if (primaryUrl) sources.push(primaryUrl);
    
    // Add carousel images
    if (carouselImages && carouselImages.length > 0) {
      sources.push(...carouselImages);
    }
    
    // Add brand-specific fallbacks
    sources.push(...this.getBrandFallbacks(brand));
    
    // Remove duplicates using Array.from
    return Array.from(new Set(sources));
  }

  // Preload critical images
  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
    });
  }

  // Batch preload multiple images
  static async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.slice(0, 3).map(url => this.preloadImage(url));
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }
}