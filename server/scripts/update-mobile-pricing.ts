#!/usr/bin/env tsx

import { db } from "../db.js";
import { mobiles } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

// Enhanced pricing logic (same as in data-transformer.ts)
function generatePriceRange(manufacturer: string, model: string): string {
  const priceRanges: Record<string, { budget: string; mid: string; premium: string; flagship: string }> = {
    'apple': {
      budget: '$429 - $499',
      mid: '$699 - $799', 
      premium: '$999 - $1,099',
      flagship: '$1,199 - $1,599'
    },
    'samsung': {
      budget: '$199 - $299',
      mid: '$399 - $599',
      premium: '$799 - $999',
      flagship: '$1,099 - $1,399'
    },
    'google': {
      budget: '$399 - $499',
      mid: '$599 - $699',
      premium: '$899 - $999',
      flagship: '$999 - $1,099'
    },
    'oneplus': {
      budget: '$299 - $399',
      mid: '$499 - $699',
      premium: '$699 - $899',
      flagship: '$899 - $1,099'
    },
    'xiaomi': {
      budget: '$149 - $249',
      mid: '$299 - $499',
      premium: '$599 - $799',
      flagship: '$799 - $999'
    },
    'oppo': {
      budget: '$179 - $279',
      mid: '$349 - $549',
      premium: '$649 - $849',
      flagship: '$899 - $1,199'
    },
    'vivo': {
      budget: '$169 - $269',
      mid: '$329 - $529',
      premium: '$629 - $829',
      flagship: '$879 - $1,179'
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

function generateImageUrl(manufacturer: string, model: string): string {
  // Generate high-quality GSMArena image URL pattern
  const cleanModel = model.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cleanManufacturer = manufacturer.toLowerCase();
  
  return `https://fdn2.gsmarena.com/vv/bigpic/${cleanManufacturer}-${cleanModel}.jpg`;
}

function generateCarouselImages(manufacturer: string, model: string): string[] {
  const cleanModel = model.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cleanManufacturer = manufacturer.toLowerCase();
  
  return [
    `https://fdn2.gsmarena.com/vv/bigpic/${cleanManufacturer}-${cleanModel}.jpg`,
    `https://fdn2.gsmarena.com/vv/pics/${cleanManufacturer}/${cleanManufacturer}-${cleanModel}-1.jpg`,
    `https://fdn2.gsmarena.com/vv/pics/${cleanManufacturer}/${cleanManufacturer}-${cleanModel}-2.jpg`,
    `https://fdn2.gsmarena.com/vv/pics/${cleanManufacturer}/${cleanManufacturer}-${cleanModel}-3.jpg`
  ];
}

async function updateMobilePricing() {
  console.log("🔄 Starting mobile pricing and image update...");
  
  try {
    // Get all mobiles that need price updates
    const allMobiles = await db.select().from(mobiles);
    console.log(`📱 Found ${allMobiles.length} mobiles to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const mobile of allMobiles) {
      try {
        // Extract manufacturer from brand or name
        const manufacturer = mobile.brand;
        const model = mobile.model;
        
        // Generate new pricing if current price is "Price not available"
        let newPrice = mobile.price;
        if (mobile.price === "Price not available" || !mobile.price) {
          newPrice = generatePriceRange(manufacturer, model);
        }
        
        // Generate better image URLs
        const newImageUrl = generateImageUrl(manufacturer, model);
        const newCarouselImages = generateCarouselImages(manufacturer, model);
        
        // Update the mobile
        await db.update(mobiles)
          .set({
            price: newPrice,
            imageUrl: newImageUrl,
            carouselImages: newCarouselImages
          })
          .where(eq(mobiles.id, mobile.id));
        
        updated++;
        console.log(`✅ Updated: ${mobile.name} - ${newPrice}`);
        
      } catch (error) {
        console.error(`❌ Failed to update ${mobile.name}:`, error);
        skipped++;
      }
    }
    
    console.log(`\n🎉 Update completed!`);
    console.log(`✅ Updated: ${updated} mobiles`);
    console.log(`⚠️ Skipped: ${skipped} mobiles`);
    
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
}

// Run the update
updateMobilePricing().then(() => {
  console.log("🏁 All done!");
  process.exit(0);
});