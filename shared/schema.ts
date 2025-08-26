import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  phoneCount: text("phone_count").default("0"),
  description: text("description"),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mobiles = pgTable("mobiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  imageUrl: text("image_url").notNull(),
  imagekitPath: text("imagekit_path"),
  releaseDate: text("release_date").notNull(),
  price: text("price"),
  shortSpecs: jsonb("short_specs").$type<{
    ram: string;
    storage: string;
    camera: string;
    battery?: string;
    display?: string;
    processor?: string;
  }>().notNull(),
  carouselImages: jsonb("carousel_images").$type<string[]>().notNull(),
  specifications: jsonb("specifications").$type<{
    category: string;
    specs: { feature: string; value: string; }[];
  }[]>().notNull(),
  dimensions: jsonb("dimensions").$type<{
    height: string;
    width: string;
    thickness: string;
    weight: string;
  }>(),
  buildMaterials: jsonb("build_materials").$type<{
    frame: string;
    back: string;
    protection: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
});

export const insertMobileSchema = createInsertSchema(mobiles).omit({
  id: true,
  createdAt: true,
});

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertMobile = z.infer<typeof insertMobileSchema>;
export type Mobile = typeof mobiles.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
