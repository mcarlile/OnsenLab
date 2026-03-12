import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const testStripBrands = pgTable("test_strip_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  sku: text("sku"),
  description: text("description"),
  imageUrl: text("image_url"),
  colorRanges: text("color_ranges"),
});

export const testReadings = pgTable("test_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  imageTopUrl: text("image_top_url"),
  imageBottomUrl: text("image_bottom_url"),
  brandId: varchar("brand_id"),
  pH: real("ph"),
  chlorine: real("chlorine"),
  alkalinity: real("alkalinity"),
  bromine: real("bromine"),
  hardness: real("hardness"),
  confidence: real("confidence"),
  pHInterval: real("ph_interval"),
  chlorineInterval: real("chlorine_interval"),
  alkalinityInterval: real("alkalinity_interval"),
  bromineInterval: real("bromine_interval"),
  hardnessInterval: real("hardness_interval"),
  pHConfidence: real("ph_confidence"),
  chlorineConfidence: real("chlorine_confidence"),
  alkalinityConfidence: real("alkalinity_confidence"),
  bromineConfidence: real("bromine_confidence"),
  hardnessConfidence: real("hardness_confidence"),
});

export const insertTestStripBrandSchema = createInsertSchema(testStripBrands).omit({
  id: true,
});

export const insertTestReadingSchema = createInsertSchema(testReadings).omit({
  id: true,
  timestamp: true,
});

export type InsertTestStripBrand = z.infer<typeof insertTestStripBrandSchema>;
export type TestStripBrand = typeof testStripBrands.$inferSelect;
export type InsertTestReading = z.infer<typeof insertTestReadingSchema>;
export type TestReading = typeof testReadings.$inferSelect;
