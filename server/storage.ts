import {
  type TestReading, type InsertTestReading,
  type TestStripBrand, type InsertTestStripBrand,
  testReadings, testStripBrands,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getTestReading(id: string, userId: string): Promise<TestReading | undefined>;
  getAllTestReadings(userId: string): Promise<TestReading[]>;
  getReadingsByBrandId(brandId: string, userId: string): Promise<TestReading[]>;
  createTestReading(reading: InsertTestReading): Promise<TestReading>;

  getTestStripBrand(id: string, userId: string): Promise<TestStripBrand | undefined>;
  getAllTestStripBrands(userId: string): Promise<TestStripBrand[]>;
  createTestStripBrand(brand: InsertTestStripBrand): Promise<TestStripBrand>;
  updateTestStripBrand(id: string, userId: string, brand: Partial<InsertTestStripBrand>): Promise<TestStripBrand | undefined>;
  deleteTestStripBrand(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getTestReading(id: string, userId: string): Promise<TestReading | undefined> {
    const [reading] = await db.select().from(testReadings)
      .where(and(eq(testReadings.id, id), eq(testReadings.userId, userId)));
    return reading;
  }

  async getAllTestReadings(userId: string): Promise<TestReading[]> {
    return db.select().from(testReadings)
      .where(eq(testReadings.userId, userId))
      .orderBy(desc(testReadings.timestamp));
  }

  async getReadingsByBrandId(brandId: string, userId: string): Promise<TestReading[]> {
    return db.select().from(testReadings)
      .where(and(eq(testReadings.brandId, brandId), eq(testReadings.userId, userId)))
      .orderBy(desc(testReadings.timestamp));
  }

  async createTestReading(reading: InsertTestReading): Promise<TestReading> {
    const [created] = await db.insert(testReadings).values(reading).returning();
    return created;
  }

  async getTestStripBrand(id: string, userId: string): Promise<TestStripBrand | undefined> {
    const [brand] = await db.select().from(testStripBrands)
      .where(and(eq(testStripBrands.id, id), eq(testStripBrands.userId, userId)));
    return brand;
  }

  async getAllTestStripBrands(userId: string): Promise<TestStripBrand[]> {
    return db.select().from(testStripBrands)
      .where(eq(testStripBrands.userId, userId))
      .orderBy(testStripBrands.name);
  }

  async createTestStripBrand(brand: InsertTestStripBrand): Promise<TestStripBrand> {
    const [created] = await db.insert(testStripBrands).values(brand).returning();
    return created;
  }

  async updateTestStripBrand(id: string, userId: string, updates: Partial<InsertTestStripBrand>): Promise<TestStripBrand | undefined> {
    const [updated] = await db.update(testStripBrands)
      .set(updates)
      .where(and(eq(testStripBrands.id, id), eq(testStripBrands.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTestStripBrand(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(testStripBrands)
      .where(and(eq(testStripBrands.id, id), eq(testStripBrands.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
