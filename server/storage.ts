import { type User, type InsertUser, type Brand, type InsertBrand, type Mobile, type InsertMobile, users, brands, mobiles } from "../shared/schema.js";
import { eq, like, or, and, sql } from "drizzle-orm";
import { db } from "./db.js";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Brand operations
  getAllBrands(): Promise<Brand[]>;
  getBrandBySlug(slug: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand>;
  deleteBrand(id: string): Promise<void>;
  
  // Mobile operations
  getAllMobiles(): Promise<Mobile[]>;
  getMobileById(id: string): Promise<Mobile | undefined>;
  getMobilesByBrand(brandSlug: string): Promise<Mobile[]>;
  getMobileBySlug(brandSlug: string, mobileSlug: string): Promise<Mobile | undefined>;
  searchMobiles(query: string): Promise<Mobile[]>;
  getFeaturedMobiles(): Promise<Mobile[]>;
  createMobile(mobile: InsertMobile): Promise<Mobile>;
  updateMobile(id: string, mobile: Partial<InsertMobile>): Promise<Mobile>;
  deleteMobile(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  constructor() {
    // Don't initialize data in constructor for serverless environments
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeData();
      this.initialized = true;
    }
  }

  private async initializeData() {
    try {
      // Check if we already have data
      const existingBrands = await db.select().from(brands).limit(1);
      if (existingBrands.length > 0) {
        return; // Data already exists
      }

      // Initialize sample brands
      const sampleBrands = [
        {
          name: "Samsung",
          slug: "samsung",
          logo: "S",
          phoneCount: "142",
          description: "South Korean multinational electronics company",
        },
        {
          name: "Apple",
          slug: "apple",
          logo: "A",
          phoneCount: "28",
          description: "American multinational technology company",
        },
        {
          name: "Xiaomi", 
          slug: "xiaomi",
          logo: "X",
          phoneCount: "89",
          description: "Chinese electronics company",
        },
        {
          name: "Oppo",
          slug: "oppo", 
          logo: "O",
          phoneCount: "67",
          description: "Chinese consumer electronics company",
        },
        {
          name: "Vivo",
          slug: "vivo",
          logo: "V", 
          phoneCount: "52",
          description: "Chinese technology company",
        },
        {
          name: "OnePlus",
          slug: "oneplus",
          logo: "1+",
          phoneCount: "23",
          description: "Chinese smartphone manufacturer",
        },
      ];

      await db.insert(brands).values(sampleBrands);

      // Initialize sample mobiles
      const sampleMobiles = [
        {
          slug: "galaxy-s24-ultra",
          name: "Samsung Galaxy S24 Ultra",
          brand: "samsung",
          model: "Galaxy S24 Ultra",
          imageUrl: "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg",
          imagekitPath: "/mobiles/samsung/galaxy-s24-ultra.jpg",
          releaseDate: "2024-01-17",
          price: "Rs 449,999",
          shortSpecs: {
            ram: "12GB",
            storage: "256GB",
            camera: "200MP + 50MP + 10MP + 12MP",
            battery: "5000mAh",
            display: "6.8 inches",
            processor: "Snapdragon 8 Gen 3",
          },
          carouselImages: [
            "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg",
            "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-5g-2.jpg",
          ],
          specifications: [
            {
              category: "Display",
              specs: [
                { feature: "Screen Size", value: "6.8 inches" },
                { feature: "Resolution", value: "3120 x 1440 pixels" },
                { feature: "Display Type", value: "Dynamic LTPO AMOLED 2X" },
                { feature: "Refresh Rate", value: "120Hz" },
              ],
            },
            {
              category: "Camera",
              specs: [
                { feature: "Main Camera", value: "200MP, f/1.7" },
                { feature: "Ultra Wide", value: "12MP, f/2.2" },
                { feature: "Telephoto", value: "50MP, f/3.4" },
                { feature: "Front Camera", value: "12MP, f/2.2" },
              ],
            },
          ],
          dimensions: {
            height: "162.3mm",
            width: "79.0mm", 
            thickness: "8.6mm",
            weight: "233g",
          },
          buildMaterials: {
            frame: "Aluminum",
            back: "Glass (Gorilla Glass Victus 2)",
            protection: "IP68",
          },
        },
        {
          slug: "iphone-15-pro-max",
          name: "Apple iPhone 15 Pro Max",
          brand: "apple",
          model: "iPhone 15 Pro Max",
          imageUrl: "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg",
          imagekitPath: "/mobiles/apple/iphone-15-pro-max.jpg",
          releaseDate: "2023-09-22",
          price: "Rs 529,999",
          shortSpecs: {
            ram: "8GB",
            storage: "256GB",
            camera: "48MP + 12MP + 12MP",
            battery: "4441mAh",
            display: "6.7 inches",
            processor: "A17 Pro",
          },
          carouselImages: [
            "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg",
            "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-2.jpg",
          ],
          specifications: [
            {
              category: "Display", 
              specs: [
                { feature: "Screen Size", value: "6.7 inches" },
                { feature: "Resolution", value: "2796 x 1290 pixels" },
                { feature: "Display Type", value: "LTPO Super Retina XDR OLED" },
                { feature: "Refresh Rate", value: "120Hz" },
              ],
            },
          ],
          dimensions: null,
          buildMaterials: null,
        },
        {
          slug: "redmi-note-13-pro",
          name: "Xiaomi Redmi Note 13 Pro",
          brand: "xiaomi",
          model: "Redmi Note 13 Pro",
          imageUrl: "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-5g.jpg",
          imagekitPath: "/mobiles/xiaomi/redmi-note-13-pro.jpg",
          releaseDate: "2023-09-21",
          price: "Rs 89,999",
          shortSpecs: {
            ram: "8GB",
            storage: "256GB",
            camera: "200MP + 8MP + 2MP",
            battery: "5100mAh",
            display: "6.67 inches",
            processor: "Snapdragon 7s Gen 2",
          },
          carouselImages: [
            "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-5g.jpg",
          ],
          specifications: [
            {
              category: "Display",
              specs: [
                { feature: "Screen Size", value: "6.82 inches" },
                { feature: "Resolution", value: "3168 x 1440 pixels" },
                { feature: "Display Type", value: "LTPO OLED" },
                { feature: "Refresh Rate", value: "120Hz" },
              ],
            },
          ],
          dimensions: null,
          buildMaterials: null,
        },
      ];

      await db.insert(mobiles).values(sampleMobiles);
    } catch (error) {
      console.log("Data initialization skipped or failed:", error);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Brand operations
  async getAllBrands(): Promise<Brand[]> {
    await this.ensureInitialized();
    // Get brands with dynamically calculated phone counts
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logo: brands.logo,
        description: brands.description,
        isVisible: brands.isVisible,
        createdAt: brands.createdAt,
        phoneCount: sql<string>`CAST(COUNT(${mobiles.id}) AS TEXT)`.as('phoneCount')
      })
      .from(brands)
      .leftJoin(mobiles, eq(brands.slug, mobiles.brand))
      .groupBy(brands.id, brands.name, brands.slug, brands.logo, brands.description, brands.isVisible, brands.createdAt)
      .orderBy(brands.name);
    
    return result;
  }

  async getBrandBySlug(slug: string): Promise<Brand | undefined> {
    await this.ensureInitialized();
    const [brand] = await db.select().from(brands).where(eq(brands.slug, slug));
    return brand;
  }



  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand> {
    const [updatedBrand] = await db
      .update(brands)
      .set(brand)
      .where(eq(brands.id, id))
      .returning();
    return updatedBrand;
  }

  async deleteBrand(id: string): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }

  // Mobile operations
  async getAllMobiles(): Promise<Mobile[]> {
    await this.ensureInitialized();
    return await db.select().from(mobiles);
  }

  async getMobileById(id: string): Promise<Mobile | undefined> {
    const [mobile] = await db.select().from(mobiles).where(eq(mobiles.id, id));
    return mobile;
  }

  async getMobilesByBrand(brandSlug: string): Promise<Mobile[]> {
    return await db.select().from(mobiles).where(eq(mobiles.brand, brandSlug));
  }

  async getMobileBySlug(brandSlug: string, mobileSlug: string): Promise<Mobile | undefined> {
    const [mobile] = await db
      .select()
      .from(mobiles)
      .where(and(eq(mobiles.brand, brandSlug), eq(mobiles.slug, mobileSlug)));
    return mobile;
  }

  async searchMobiles(query: string): Promise<Mobile[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(mobiles)
      .where(
        or(
          like(mobiles.name, searchTerm),
          like(mobiles.brand, searchTerm),
          like(mobiles.model, searchTerm)
        )
      );
  }

  async getFeaturedMobiles(): Promise<Mobile[]> {
    await this.ensureInitialized();
    return await db.select().from(mobiles).limit(8);
  }

  async createMobile(mobile: InsertMobile): Promise<Mobile> {
    const [newMobile] = await db.insert(mobiles).values(mobile).returning();
    return newMobile;
  }

  async updateMobile(id: string, mobile: Partial<InsertMobile>): Promise<Mobile> {
    const cleanMobile = {
      ...mobile,
      shortSpecs: mobile.shortSpecs ? {
        ram: mobile.shortSpecs.ram || "",
        storage: mobile.shortSpecs.storage || "",
        camera: mobile.shortSpecs.camera || "",
        battery: mobile.shortSpecs.battery as string | undefined,
        display: mobile.shortSpecs.display as string | undefined,
        processor: mobile.shortSpecs.processor as string | undefined,
      } : undefined,
    };
    
    const [updatedMobile] = await db
      .update(mobiles)
      .set(cleanMobile as any)
      .where(eq(mobiles.id, id))
      .returning();
    return updatedMobile;
  }

  async deleteMobile(id: string): Promise<void> {
    await db.delete(mobiles).where(eq(mobiles.id, id));
  }
}

export const storage = new DatabaseStorage();