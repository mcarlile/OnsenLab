import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const testReadings = pgTable("test_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  imageUrl: text("image_url"),
  pH: real("ph"),
  chlorine: real("chlorine"),
  alkalinity: real("alkalinity"),
  bromine: real("bromine"),
  hardness: real("hardness"),
  confidence: real("confidence"),
});

export const insertTestReadingSchema = createInsertSchema(testReadings).omit({
  id: true,
  timestamp: true,
});

export type InsertTestReading = z.infer<typeof insertTestReadingSchema>;
export type TestReading = typeof testReadings.$inferSelect;
