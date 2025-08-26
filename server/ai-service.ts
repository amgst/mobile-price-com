import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface MobileSpec {
  name: string;
  brand: string;
  model?: string;
  price?: string;
  shortSpecs: {
    ram: string;
    storage: string;
    camera: string;
    battery?: string;
    display?: string;
    processor?: string;
  };
}

export interface EnhancedMobileData {
  seoDescription: string;
  marketingDescription: string;
  keyFeatures: string[];
  targetAudience: string;
  comparisonPoints: string[];
}

export class AIService {
  private isAIAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async enhanceMobileData(mobile: MobileSpec): Promise<EnhancedMobileData> {
    if (!this.isAIAvailable()) {
      return this.getFallbackEnhancement(mobile);
    }

    try {
      const prompt = `
        Analyze this mobile phone and generate marketing content:
        
        Phone: ${mobile.name}
        Brand: ${mobile.brand}
        Price: ${mobile.price || "Not specified"}
        RAM: ${mobile.shortSpecs.ram}
        Storage: ${mobile.shortSpecs.storage}
        Camera: ${mobile.shortSpecs.camera}
        Battery: ${mobile.shortSpecs.battery || "Not specified"}
        Display: ${mobile.shortSpecs.display || "Not specified"}
        Processor: ${mobile.shortSpecs.processor || "Not specified"}
        
        Generate a JSON response with:
        - seoDescription: SEO-optimized meta description (150-160 chars)
        - marketingDescription: Engaging product description (2-3 paragraphs)
        - keyFeatures: Array of 4-5 standout features
        - targetAudience: Who this phone is best for
        - comparisonPoints: 3-4 key points for comparison with other phones
        
        Make it authentic and based on the actual specifications provided.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert mobile phone analyst and copywriter. Generate authentic, compelling marketing content based on real specifications. Respond with JSON in the exact format requested."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        seoDescription: result.seoDescription || "",
        marketingDescription: result.marketingDescription || "",
        keyFeatures: result.keyFeatures || [],
        targetAudience: result.targetAudience || "",
        comparisonPoints: result.comparisonPoints || [],
      };
    } catch (error) {
      console.error("AI enhancement failed, using fallback:", error);
      return this.getFallbackEnhancement(mobile);
    }
  }

  private getFallbackEnhancement(mobile: MobileSpec): EnhancedMobileData {
    const specs = mobile.shortSpecs;
    return {
      seoDescription: `${mobile.name} with ${specs.ram} RAM, ${specs.storage} storage, and ${specs.camera} camera. Compare prices and specifications.`,
      marketingDescription: `The ${mobile.name} offers reliable performance with ${specs.ram} of RAM and ${specs.storage} of storage space. ${specs.camera} camera system captures your memories with clarity. ${specs.battery ? `Powered by a ${specs.battery} battery for all-day usage.` : ""} Perfect for users seeking quality and functionality.`,
      keyFeatures: [
        `${specs.ram} RAM for smooth performance`,
        `${specs.storage} storage capacity`,
        `${specs.camera} camera system`,
        ...(specs.battery ? [`${specs.battery} battery life`] : []),
        ...(specs.display ? [`${specs.display} display`] : [])
      ].slice(0, 5),
      targetAudience: "Users looking for a reliable smartphone with balanced features and performance",
      comparisonPoints: [
        `Performance: ${specs.ram} RAM`,
        `Storage: ${specs.storage}`,
        `Camera: ${specs.camera}`,
        ...(mobile.price ? [`Price: ${mobile.price}`] : [])
      ].slice(0, 4)
    };
  }

  async generateMobileSpecs(brandName: string, modelName: string, year?: string): Promise<MobileSpec> {
    if (!this.isAIAvailable()) {
      return this.getFallbackMobileSpecs(brandName, modelName, year);
    }

    try {
      const prompt = `
        Generate realistic mobile phone specifications for:
        Brand: ${brandName}
        Model: ${modelName}
        Year: ${year || "2024"}
        
        Create specifications that are realistic for this brand and model name.
        Include current market pricing in the local currency format.
        
        Return JSON with:
        - name: Full phone name
        - brand: Brand slug (lowercase)
        - model: Model name
        - price: Realistic price with currency
        - shortSpecs: object with ram, storage, camera, battery, display, processor
        
        Make specifications realistic and competitive for the current market.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a mobile phone specification expert. Generate realistic, current market specifications based on brand positioning and market trends. Respond with JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        name: result.name || `${brandName} ${modelName}`,
        brand: result.brand || brandName.toLowerCase(),
        model: result.model || modelName,
        price: result.price || "",
        shortSpecs: {
          ram: result.shortSpecs?.ram || "8GB",
          storage: result.shortSpecs?.storage || "128GB",
          camera: result.shortSpecs?.camera || "50MP",
          battery: result.shortSpecs?.battery,
          display: result.shortSpecs?.display,
          processor: result.shortSpecs?.processor,
        },
      };
    } catch (error) {
      console.error("AI spec generation failed, using fallback:", error);
      return this.getFallbackMobileSpecs(brandName, modelName, year);
    }
  }

  private getFallbackMobileSpecs(brandName: string, modelName: string, year?: string): MobileSpec {
    // Generate basic specifications based on brand positioning
    const brandLower = brandName.toLowerCase();
    let specs = {
      ram: "8GB",
      storage: "128GB", 
      camera: "50MP",
      battery: "4000mAh",
      display: "6.1\" OLED",
      processor: "Snapdragon 8 Gen 2"
    };

    // Adjust specs based on brand tier
    if (['apple', 'iphone'].includes(brandLower)) {
      specs = { ...specs, ram: "8GB", storage: "128GB", processor: "A17 Pro", display: "6.1\" Super Retina XDR" };
    } else if (['samsung'].includes(brandLower)) {
      specs = { ...specs, ram: "8GB", storage: "256GB", processor: "Snapdragon 8 Gen 3", display: "6.2\" Dynamic AMOLED" };
    } else if (['google', 'pixel'].includes(brandLower)) {
      specs = { ...specs, processor: "Google Tensor G3", camera: "50MP + 12MP ultrawide" };
    } else if (['xiaomi', 'redmi'].includes(brandLower)) {
      specs = { ...specs, ram: "12GB", storage: "256GB", camera: "108MP" };
    } else if (['oneplus'].includes(brandLower)) {
      specs = { ...specs, ram: "12GB", storage: "256GB", battery: "5400mAh" };
    }

    return {
      name: `${brandName} ${modelName}`,
      brand: brandLower,
      model: modelName,
      price: "",
      shortSpecs: specs,
    };
  }

  async generateDetailedSpecs(mobile: MobileSpec): Promise<any[]> {
    if (!this.isAIAvailable()) {
      return this.getFallbackDetailedSpecs(mobile);
    }

    try {
      const prompt = `
        Generate detailed technical specifications for this mobile phone:
        
        Phone: ${mobile.name}
        Brand: ${mobile.brand}
        Basic specs: RAM ${mobile.shortSpecs.ram}, Storage ${mobile.shortSpecs.storage}, Camera ${mobile.shortSpecs.camera}
        
        Create realistic detailed specifications organized in categories:
        - Display (size, resolution, type, refresh rate, protection)
        - Camera (main, ultra-wide, telephoto, front, video features)
        - Performance (processor, GPU, RAM, storage options)
        - Battery & Charging (capacity, charging speed, wireless charging)
        - Connectivity (5G, WiFi, Bluetooth, NFC, USB)
        - Build & Design (materials, dimensions, weight, colors)
        - Software (OS, UI, security features)
        
        Return JSON array with objects: { category: string, specs: [{ feature: string, value: string }] }
        Make specifications realistic for this brand and phone category.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a technical specifications expert. Generate comprehensive, realistic mobile phone specifications based on current market standards. Respond with JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.specifications || [];
    } catch (error) {
      console.error("AI detailed specs generation failed, using fallback:", error);
      return this.getFallbackDetailedSpecs(mobile);
    }
  }

  private getFallbackDetailedSpecs(mobile: MobileSpec): any[] {
    const specs = mobile.shortSpecs;
    
    return [
      {
        category: "Display",
        specs: [
          { feature: "Size", value: specs.display || "6.1 inches" },
          { feature: "Resolution", value: "2532 x 1170 pixels" },
          { feature: "Type", value: "OLED" },
          { feature: "Refresh Rate", value: "120Hz" },
          { feature: "Protection", value: "Corning Gorilla Glass" }
        ]
      },
      {
        category: "Camera",
        specs: [
          { feature: "Main Camera", value: specs.camera },
          { feature: "Ultra Wide", value: "12MP, f/2.4" },
          { feature: "Front Camera", value: "12MP, f/1.9" },
          { feature: "Video Recording", value: "4K@30fps, 1080p@60fps" },
          { feature: "Features", value: "Night Mode, Portrait Mode" }
        ]
      },
      {
        category: "Performance",
        specs: [
          { feature: "Processor", value: specs.processor || "High-end chipset" },
          { feature: "RAM", value: specs.ram },
          { feature: "Storage", value: specs.storage },
          { feature: "GPU", value: "Integrated graphics" },
          { feature: "AnTuTu Score", value: "800,000+" }
        ]
      },
      {
        category: "Battery & Charging",
        specs: [
          { feature: "Battery", value: specs.battery || "4000mAh" },
          { feature: "Fast Charging", value: "25W wired" },
          { feature: "Wireless Charging", value: "15W" },
          { feature: "Battery Life", value: "All-day usage" }
        ]
      },
      {
        category: "Connectivity",
        specs: [
          { feature: "Network", value: "5G, 4G LTE" },
          { feature: "Wi-Fi", value: "Wi-Fi 6 (802.11ax)" },
          { feature: "Bluetooth", value: "5.3" },
          { feature: "NFC", value: "Yes" },
          { feature: "USB", value: "USB-C" }
        ]
      },
      {
        category: "Build & Design",
        specs: [
          { feature: "Materials", value: "Glass front and back, aluminum frame" },
          { feature: "Dimensions", value: "147.6 x 71.6 x 7.8 mm" },
          { feature: "Weight", value: "174g" },
          { feature: "Colors", value: "Multiple color options available" },
          { feature: "Water Resistance", value: "IP68" }
        ]
      },
      {
        category: "Software",
        specs: [
          { feature: "Operating System", value: mobile.brand === "apple" ? "iOS 17" : "Android 14" },
          { feature: "UI", value: mobile.brand === "apple" ? "iOS" : "One UI 6.1" },
          { feature: "Security", value: "Fingerprint, Face unlock" },
          { feature: "Updates", value: "Regular security updates" }
        ]
      }
    ];
  }

  async suggestSimilarPhones(mobile: MobileSpec, allMobiles: MobileSpec[]): Promise<string[]> {
    if (!this.isAIAvailable()) {
      return this.getFallbackSimilarPhones(mobile, allMobiles);
    }

    try {
      const mobilesContext = allMobiles.map(m => 
        `${m.name} - ${m.shortSpecs.ram} RAM, ${m.shortSpecs.storage} storage, ${m.price || "No price"}`
      ).join('\n');

      const prompt = `
        Given this phone: ${mobile.name} (${mobile.shortSpecs.ram} RAM, ${mobile.shortSpecs.storage} storage, ${mobile.price || "No price"})
        
        From this list of available phones, suggest 3-4 most similar ones for comparison:
        ${mobilesContext}
        
        Consider: price range, specifications, brand positioning, target audience.
        Return JSON array of phone names: ["Phone Name 1", "Phone Name 2", ...]
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a mobile phone comparison expert. Suggest similar phones based on specifications, price range, and target audience. Respond with JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.suggestions || [];
    } catch (error) {
      console.error("AI similar phones suggestion failed, using fallback:", error);
      return this.getFallbackSimilarPhones(mobile, allMobiles);
    }
  }

  private getFallbackSimilarPhones(mobile: MobileSpec, allMobiles: MobileSpec[]): string[] {
    // Simple similarity based on specs and brand
    const similar = allMobiles
      .filter(m => m.name !== mobile.name)
      .map(m => {
        let score = 0;
        
        // Same brand gets higher score
        if (m.brand === mobile.brand) score += 3;
        
        // Similar RAM
        if (m.shortSpecs.ram === mobile.shortSpecs.ram) score += 2;
        else if (Math.abs(parseInt(m.shortSpecs.ram) - parseInt(mobile.shortSpecs.ram)) <= 2) score += 1;
        
        // Similar storage
        if (m.shortSpecs.storage === mobile.shortSpecs.storage) score += 2;
        else if (Math.abs(parseInt(m.shortSpecs.storage) - parseInt(mobile.shortSpecs.storage)) <= 64) score += 1;
        
        // Similar camera MP (rough comparison)
        const mobileCamera = parseInt(mobile.shortSpecs.camera);
        const mCamera = parseInt(m.shortSpecs.camera);
        if (!isNaN(mobileCamera) && !isNaN(mCamera)) {
          if (Math.abs(mCamera - mobileCamera) <= 15) score += 1;
        }
        
        return { name: m.name, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.name);
    
    return similar;
  }
}

export const aiService = new AIService();