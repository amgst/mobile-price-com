import { InsertMobile, InsertBrand } from "../../shared/schema.js";

interface RapidAPIPhone {
  id: number;
  manufacturer: string;
  model: string;
  chipset?: string;
  androidVersion?: string;
  battery?: string;
  cpu?: string;
  displayResolution?: string;
  displaySize?: string;
  displayType?: string;
  gpu?: string;
  internal?: string;
  mainCameraFeatures?: string;
  mainCameraSpecs?: string;
  mainVideoSpecs?: string;
  selfieCameraFeatures?: string;
  selfieCameraSpecs?: string;
  selfieVideoSpecs?: string;
  sensors?: string;
}

// No longer needed as brands are just strings

export class DataTransformer {
  
  static transformBrand(brandName: string, phoneCount: number = 0): InsertBrand {
    const slug = DataTransformer.createSlug(brandName);
    const logo = DataTransformer.getBrandLogo(brandName);
    
    return {
      name: brandName,
      slug: slug,
      logo: logo,
      phoneCount: phoneCount.toString(),
      description: DataTransformer.getBrandDescription(brandName)
    };
  }

  static transformMobile(rapidApiPhone: RapidAPIPhone): InsertMobile {
    const fullName = `${rapidApiPhone.manufacturer} ${rapidApiPhone.model}`;
    const slug = DataTransformer.createSlug(fullName);
    const brandSlug = DataTransformer.createSlug(rapidApiPhone.manufacturer);
    
    // Extract short specs from available data
    const shortSpecs = DataTransformer.extractShortSpecsFromRapidAPI(rapidApiPhone);
    
    // Transform detailed specifications
    const specifications = DataTransformer.transformDetailedSpecsFromRapidAPI(rapidApiPhone);
    
    // Generate high-quality GSMArena image URL
    const imageUrl = DataTransformer.generateImageUrl(rapidApiPhone.manufacturer, rapidApiPhone.model);
    
    // Create multiple image sources for carousel (different angles/quality)
    const carouselImages = DataTransformer.generateCarouselImages(rapidApiPhone.manufacturer, rapidApiPhone.model);
    
    return {
      slug: slug,
      name: fullName,
      brand: brandSlug,
      model: rapidApiPhone.model,
      imageUrl: imageUrl,
      imagekitPath: `/mobiles/${brandSlug}/${slug}.jpg`,
      releaseDate: DataTransformer.extractReleaseDateFromAndroid(rapidApiPhone.androidVersion),
      price: DataTransformer.generatePriceRange(rapidApiPhone.manufacturer, rapidApiPhone.model),
      shortSpecs: shortSpecs,
      carouselImages: carouselImages,
      specifications: specifications,
      dimensions: null,
      buildMaterials: null
    };
  }

  private static createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '');
  }

  private static cleanHTMLTags(text: string): string {
    if (!text) return text;
    return text
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<sup>/gi, '')
      .replace(/<\/sup>/gi, '')
      .replace(/<sub>/gi, '')
      .replace(/<\/sub>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static getBrandLogo(brandName: string): string {
    const logoMap: Record<string, string> = {
      'Apple': '🍎',
      'Samsung': 'S',
      'Xiaomi': 'X',
      'OnePlus': '1+',
      'Google': 'G',
      'Huawei': 'H',
      'Oppo': 'O',
      'Vivo': 'V',
      'Sony': 'S',
      'Nokia': 'N',
      'Motorola': 'M',
      'Realme': 'R',
      'Honor': 'H',
      'Nothing': 'N'
    };
    
    return logoMap[brandName] || brandName.charAt(0).toUpperCase();
  }

  private static getBrandDescription(brandName: string): string {
    const descriptions: Record<string, string> = {
      'Apple': 'American multinational technology company',
      'Samsung': 'South Korean multinational electronics corporation',
      'Xiaomi': 'Chinese electronics company',
      'OnePlus': 'Chinese smartphone manufacturer',
      'Google': 'American multinational technology corporation',
      'Huawei': 'Chinese multinational technology corporation',
      'Oppo': 'Chinese consumer electronics company',
      'Vivo': 'Chinese technology company',
      'Sony': 'Japanese multinational electronics corporation',
      'Nokia': 'Finnish multinational telecommunications company',
      'Motorola': 'American telecommunications company',
      'Realme': 'Chinese smartphone brand',
      'Honor': 'Chinese smartphone brand',
      'Nothing': 'British consumer technology company'
    };
    
    return descriptions[brandName] || `${brandName} smartphone manufacturer`;
  }

  private static extractShortSpecsFromRapidAPI(rapidApiPhone: RapidAPIPhone): {
    ram: string;
    storage: string;
    camera: string;
    battery?: string;
    display?: string;
    processor?: string;
  } {
    // Extract RAM and storage from internal string like "128GB 8GB RAM, 256GB 8GB RAM"
    const internal = rapidApiPhone.internal || '';
    let ram = '';
    let storage = '';
    
    const ramMatch = internal.match(/(\d+GB)\s+RAM/);
    if (ramMatch) ram = ramMatch[1];
    
    const storageMatch = internal.match(/(\d+GB)\s+\d+GB\s+RAM/);
    if (storageMatch) storage = storageMatch[1];

    return {
      ram: ram || 'Unknown',
      storage: storage || 'Unknown',
      camera: rapidApiPhone.mainCameraSpecs ? DataTransformer.cleanHTMLTags(rapidApiPhone.mainCameraSpecs) : 'Unknown',
      battery: rapidApiPhone.battery ? DataTransformer.cleanHTMLTags(rapidApiPhone.battery) : 'Unknown',
      display: rapidApiPhone.displaySize ? DataTransformer.cleanHTMLTags(rapidApiPhone.displaySize) : 'Unknown',
      processor: rapidApiPhone.chipset ? DataTransformer.cleanHTMLTags(rapidApiPhone.chipset) : (rapidApiPhone.cpu ? DataTransformer.cleanHTMLTags(rapidApiPhone.cpu) : 'Unknown')
    };
  }

  private static transformDetailedSpecsFromRapidAPI(rapidApiPhone: RapidAPIPhone): Array<{
    category: string;
    specs: Array<{ feature: string; value: string }>;
  }> {
    const specs = [];

    // Display category
    if (rapidApiPhone.displaySize || rapidApiPhone.displayType || rapidApiPhone.displayResolution) {
      specs.push({
        category: 'Display',
        specs: [
          { feature: 'Screen Size', value: rapidApiPhone.displaySize ? DataTransformer.cleanHTMLTags(rapidApiPhone.displaySize) : 'Unknown' },
          { feature: 'Resolution', value: rapidApiPhone.displayResolution ? DataTransformer.cleanHTMLTags(rapidApiPhone.displayResolution) : 'Unknown' },
          { feature: 'Display Type', value: rapidApiPhone.displayType ? DataTransformer.cleanHTMLTags(rapidApiPhone.displayType) : 'Unknown' }
        ].filter(spec => spec.value !== 'Unknown')
      });
    }

    // Camera category
    if (rapidApiPhone.mainCameraSpecs || rapidApiPhone.selfieCameraSpecs) {
      specs.push({
        category: 'Camera',
        specs: [
          { feature: 'Main Camera', value: rapidApiPhone.mainCameraSpecs ? DataTransformer.cleanHTMLTags(rapidApiPhone.mainCameraSpecs) : 'Unknown' },
          { feature: 'Front Camera', value: rapidApiPhone.selfieCameraSpecs ? DataTransformer.cleanHTMLTags(rapidApiPhone.selfieCameraSpecs) : 'Unknown' },
          { feature: 'Main Features', value: rapidApiPhone.mainCameraFeatures ? DataTransformer.cleanHTMLTags(rapidApiPhone.mainCameraFeatures) : 'Unknown' },
          { feature: 'Video Recording', value: rapidApiPhone.mainVideoSpecs ? DataTransformer.cleanHTMLTags(rapidApiPhone.mainVideoSpecs) : 'Unknown' }
        ].filter(spec => spec.value !== 'Unknown')
      });
    }

    // Performance category
    if (rapidApiPhone.chipset || rapidApiPhone.cpu || rapidApiPhone.gpu) {
      specs.push({
        category: 'Performance',
        specs: [
          { feature: 'Chipset', value: rapidApiPhone.chipset ? DataTransformer.cleanHTMLTags(rapidApiPhone.chipset) : 'Unknown' },
          { feature: 'CPU', value: rapidApiPhone.cpu ? DataTransformer.cleanHTMLTags(rapidApiPhone.cpu) : 'Unknown' },
          { feature: 'GPU', value: rapidApiPhone.gpu ? DataTransformer.cleanHTMLTags(rapidApiPhone.gpu) : 'Unknown' }
        ].filter(spec => spec.value !== 'Unknown')
      });
    }

    // Battery & Storage
    if (rapidApiPhone.battery || rapidApiPhone.internal) {
      specs.push({
        category: 'Battery & Storage',
        specs: [
          { feature: 'Battery', value: rapidApiPhone.battery ? DataTransformer.cleanHTMLTags(rapidApiPhone.battery) : 'Unknown' },
          { feature: 'Internal Storage', value: rapidApiPhone.internal ? DataTransformer.cleanHTMLTags(rapidApiPhone.internal) : 'Unknown' }
        ].filter(spec => spec.value !== 'Unknown')
      });
    }

    // Other features
    if (rapidApiPhone.sensors || rapidApiPhone.androidVersion) {
      specs.push({
        category: 'Features',
        specs: [
          { feature: 'Operating System', value: `Android ${rapidApiPhone.androidVersion || 'Unknown'}` },
          { feature: 'Sensors', value: rapidApiPhone.sensors || 'Unknown' }
        ].filter(spec => spec.value !== 'Unknown')
      });
    }

    return specs.filter(category => category.specs.length > 0);
  }

  private static extractDimensionsAndMaterials(specifications: Array<{
    category: string;
    specs: Array<{ feature: string; value: string }>;
  }>): {
    dimensions: { height: string; width: string; thickness: string; weight: string } | null;
    buildMaterials: { frame: string; back: string; protection: string } | null;
  } {
    let dimensions = null;
    let buildMaterials = null;

    specifications.forEach(category => {
      if (category.category.toLowerCase().includes('dimension') || 
          category.category.toLowerCase().includes('body')) {
        
        const dimObj = { height: '', width: '', thickness: '', weight: '' };
        const matObj = { frame: '', back: '', protection: '' };

        category.specs.forEach(spec => {
          const feature = spec.feature.toLowerCase();
          
          if (feature.includes('dimension') || feature.includes('size')) {
            // Parse dimensions like "162.3 x 79.0 x 8.6 mm"
            const parts = spec.value.split('x').map(p => p.trim());
            if (parts.length >= 3) {
              dimObj.height = parts[0];
              dimObj.width = parts[1];
              dimObj.thickness = parts[2];
            }
          } else if (feature.includes('weight')) {
            dimObj.weight = spec.value;
          } else if (feature.includes('build') || feature.includes('material')) {
            matObj.frame = spec.value;
          } else if (feature.includes('back')) {
            matObj.back = spec.value;
          } else if (feature.includes('protection')) {
            matObj.protection = spec.value;
          }
        });

        if (dimObj.height || dimObj.width || dimObj.thickness || dimObj.weight) {
          dimensions = dimObj;
        }
        if (matObj.frame || matObj.back || matObj.protection) {
          buildMaterials = matObj;
        }
      }
    });

    return { dimensions, buildMaterials };
  }

  private static generateImageUrl(manufacturer: string, model: string): string {
    const cleanModel = model.toLowerCase()
      .replace(/\([^)]*\)/g, '') // Remove content in parentheses
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Remove duplicate dashes
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
    const cleanManufacturer = manufacturer.toLowerCase();
    
    // High-quality flagship images for each brand (latest models)
    const brandFlagshipImages: Record<string, string[]> = {
      'apple': [
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-plus.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg'
      ],
      'samsung': [
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-plus-5g.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip5.jpg'
      ],
      'google': [
        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8a.jpg'
      ],
      'xiaomi': [
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13t-pro.jpg'
      ],
      'oneplus': [
        'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oneplus-11.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oneplus-open.jpg'
      ],
      'oppo': [
        'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x7-ultra.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno11-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oppo-a79-5g.jpg'
      ],
      'vivo': [
        'https://fdn2.gsmarena.com/vv/bigpic/vivo-x100-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/vivo-v30-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/vivo-y100.jpg'
      ]
    };
    
    // Get random high-quality image from brand's flagship collection
    const brandImages = brandFlagshipImages[cleanManufacturer];
    if (brandImages && brandImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * brandImages.length);
      return brandImages[randomIndex];
    }
    
    // Fallback to generated URL
    return `https://fdn2.gsmarena.com/vv/bigpic/${cleanManufacturer}-${cleanModel}.jpg`;
  }

  private static generateCarouselImages(manufacturer: string, model: string): string[] {
    const cleanManufacturer = manufacturer.toLowerCase();
    
    // Rich carousel image sets with multiple angles and sizes
    const brandCarouselMap: Record<string, string[]> = {
      'apple': [
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-plus.jpg',
        'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg',
        'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-2.jpg'
      ],
      'samsung': [
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-plus-5g.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg',
        'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-1.jpg',
        'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-2.jpg',
        'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-3.jpg'
      ],
      'google': [
        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8.jpg',
        'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-1.jpg',
        'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-2.jpg'
      ],
      'xiaomi': [
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
        'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-14-ultra-1.jpg',
        'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-14-ultra-2.jpg'
      ],
      'oneplus': [
        'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oneplus-11.jpg',
        'https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-1.jpg',
        'https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-2.jpg'
      ],
      'oppo': [
        'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x7-ultra.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno11-pro.jpg',
        'https://fdn2.gsmarena.com/vv/pics/oppo/oppo-find-x7-ultra-1.jpg'
      ],
      'vivo': [
        'https://fdn2.gsmarena.com/vv/bigpic/vivo-x100-pro.jpg',
        'https://fdn2.gsmarena.com/vv/bigpic/vivo-v30-pro.jpg',
        'https://fdn2.gsmarena.com/vv/pics/vivo/vivo-x100-pro-1.jpg'
      ]
    };
    
    // Return brand-specific carousel images
    return brandCarouselMap[cleanManufacturer] || [
      DataTransformer.generateImageUrl(manufacturer, model)
    ];
  }

  private static generatePriceRange(manufacturer: string, model: string): string {
    // Generate realistic price ranges in PKR based on brand positioning and model tier
    const priceRanges: Record<string, { budget: string; mid: string; premium: string; flagship: string }> = {
      'apple': {
        budget: 'Rs 119,000 - 139,000',
        mid: 'Rs 194,000 - 222,000', 
        premium: 'Rs 277,000 - 305,000',
        flagship: 'Rs 333,000 - 444,000'
      },
      'samsung': {
        budget: 'Rs 55,000 - 83,000',
        mid: 'Rs 111,000 - 166,000',
        premium: 'Rs 222,000 - 277,000',
        flagship: 'Rs 305,000 - 388,000'
      },
      'google': {
        budget: 'Rs 111,000 - 139,000',
        mid: 'Rs 166,000 - 194,000',
        premium: 'Rs 249,000 - 277,000',
        flagship: 'Rs 277,000 - 305,000'
      },
      'oneplus': {
        budget: 'Rs 83,000 - 111,000',
        mid: 'Rs 139,000 - 194,000',
        premium: 'Rs 194,000 - 249,000',
        flagship: 'Rs 249,000 - 305,000'
      },
      'xiaomi': {
        budget: 'Rs 41,000 - 69,000',
        mid: 'Rs 83,000 - 139,000',
        premium: 'Rs 166,000 - 222,000',
        flagship: 'Rs 222,000 - 277,000'
      },
      'oppo': {
        budget: 'Rs 50,000 - 78,000',
        mid: 'Rs 97,000 - 153,000',
        premium: 'Rs 180,000 - 236,000',
        flagship: 'Rs 249,000 - 333,000'
      },
      'vivo': {
        budget: 'Rs 47,000 - 75,000',
        mid: 'Rs 91,000 - 147,000',
        premium: 'Rs 175,000 - 230,000',
        flagship: 'Rs 244,000 - 327,000'
      }
    };

    const brand = manufacturer.toLowerCase();
    const modelLower = model.toLowerCase();
    
    // Default to mid-range if brand not found
    const brandPrices = priceRanges[brand] || priceRanges['samsung'];
    
    // Determine tier based on model keywords
    if (modelLower.includes('pro max') || modelLower.includes('ultra') || modelLower.includes('fold') || modelLower.includes('flip')) {
      return `${brandPrices.flagship} (Est.)`;
    } else if (modelLower.includes('pro') || modelLower.includes('plus') || modelLower.includes('note')) {
      return `${brandPrices.premium} (Est.)`;
    } else if (modelLower.includes('mini') || modelLower.includes('lite') || modelLower.includes('se') || modelLower.includes('a')) {
      return `${brandPrices.budget} (Est.)`;
    } else {
      return `${brandPrices.mid} (Est.)`;
    }
  }

  private static extractReleaseDateFromAndroid(androidVersion?: string): string {
    if (!androidVersion) {
      return new Date().toISOString().split('T')[0];
    }
    
    // Map Android versions to approximate release dates
    const androidReleases: Record<string, string> = {
      '14': '2023-10-04',
      '13': '2022-08-15',
      '12': '2021-10-04',
      '11': '2020-09-08',
      '10': '2019-09-03',
      '9': '2018-08-06',
      '8': '2017-08-21',
      '7': '2016-08-22',
      '6': '2015-10-05'
    };
    
    const version = androidVersion.split('.')[0];
    return androidReleases[version] || new Date().toISOString().split('T')[0];
  }

  private static extractPrice(quickSpecs: Array<{ name: string; value: string }>): string {
    for (const spec of quickSpecs) {
      if (spec.name.toLowerCase().includes('price') || 
          spec.name.toLowerCase().includes('cost')) {
        return spec.value;
      }
    }
    return 'Price not available';
  }
}