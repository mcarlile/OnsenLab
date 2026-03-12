import { type TestReading, type InsertTestReading, type TestStripBrand, type InsertTestStripBrand } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getTestReading(id: string): Promise<TestReading | undefined>;
  getAllTestReadings(): Promise<TestReading[]>;
  getReadingsByBrandId(brandId: string): Promise<TestReading[]>;
  createTestReading(reading: InsertTestReading): Promise<TestReading>;

  getTestStripBrand(id: string): Promise<TestStripBrand | undefined>;
  getAllTestStripBrands(): Promise<TestStripBrand[]>;
  createTestStripBrand(brand: InsertTestStripBrand): Promise<TestStripBrand>;
  updateTestStripBrand(id: string, brand: Partial<InsertTestStripBrand>): Promise<TestStripBrand | undefined>;
  deleteTestStripBrand(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private testReadings: Map<string, TestReading>;
  private testStripBrands: Map<string, TestStripBrand>;

  constructor() {
    this.testReadings = new Map();
    this.testStripBrands = new Map();
    
    const defaultBrands = [
      {
        id: randomUUID(),
        name: "6-in-1 Test Strips",
        manufacturer: "AquaChek",
        sku: "AQ-6IN1",
        description: "Tests pH, Total Chlorine, Total Bromine, Total Alkalinity, Total Hardness, and Cyanuric Acid",
        imageUrl: null,
        colorRanges: null,
      },
      {
        id: randomUUID(),
        name: "7-Way Test Strips",
        manufacturer: "JNW Direct",
        sku: "JNW-7WAY",
        description: "Tests pH, Free Chlorine, Total Chlorine, Bromine, Alkalinity, Hardness, and Cyanuric Acid",
        imageUrl: null,
        colorRanges: null,
      },
    ];
    
    defaultBrands.forEach(brand => {
      this.testStripBrands.set(brand.id, brand);
    });
  }

  async getTestReading(id: string): Promise<TestReading | undefined> {
    return this.testReadings.get(id);
  }

  async getAllTestReadings(): Promise<TestReading[]> {
    return Array.from(this.testReadings.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async getReadingsByBrandId(brandId: string): Promise<TestReading[]> {
    return Array.from(this.testReadings.values())
      .filter(r => r.brandId === brandId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createTestReading(insertReading: InsertTestReading): Promise<TestReading> {
    const id = randomUUID();
    const reading: TestReading = { 
      id,
      timestamp: new Date(),
      imageTopUrl: insertReading.imageTopUrl ?? null,
      imageBottomUrl: insertReading.imageBottomUrl ?? null,
      brandId: insertReading.brandId ?? null,
      pH: insertReading.pH ?? null,
      chlorine: insertReading.chlorine ?? null,
      alkalinity: insertReading.alkalinity ?? null,
      bromine: insertReading.bromine ?? null,
      hardness: insertReading.hardness ?? null,
      confidence: insertReading.confidence ?? null,
      pHInterval: insertReading.pHInterval ?? null,
      chlorineInterval: insertReading.chlorineInterval ?? null,
      alkalinityInterval: insertReading.alkalinityInterval ?? null,
      bromineInterval: insertReading.bromineInterval ?? null,
      hardnessInterval: insertReading.hardnessInterval ?? null,
      pHConfidence: insertReading.pHConfidence ?? null,
      chlorineConfidence: insertReading.chlorineConfidence ?? null,
      alkalinityConfidence: insertReading.alkalinityConfidence ?? null,
      bromineConfidence: insertReading.bromineConfidence ?? null,
      hardnessConfidence: insertReading.hardnessConfidence ?? null,
    };
    this.testReadings.set(id, reading);
    return reading;
  }

  async getTestStripBrand(id: string): Promise<TestStripBrand | undefined> {
    return this.testStripBrands.get(id);
  }

  async getAllTestStripBrands(): Promise<TestStripBrand[]> {
    return Array.from(this.testStripBrands.values()).sort(
      (a, b) => a.name.localeCompare(b.name)
    );
  }

  async createTestStripBrand(insertBrand: InsertTestStripBrand): Promise<TestStripBrand> {
    const id = randomUUID();
    const brand: TestStripBrand = {
      id,
      name: insertBrand.name,
      manufacturer: insertBrand.manufacturer,
      sku: insertBrand.sku ?? null,
      description: insertBrand.description ?? null,
      imageUrl: insertBrand.imageUrl ?? null,
      colorRanges: insertBrand.colorRanges ?? null,
    };
    this.testStripBrands.set(id, brand);
    return brand;
  }

  async updateTestStripBrand(id: string, updates: Partial<InsertTestStripBrand>): Promise<TestStripBrand | undefined> {
    const existing = this.testStripBrands.get(id);
    if (!existing) return undefined;
    
    const updated: TestStripBrand = {
      ...existing,
      ...updates,
    };
    this.testStripBrands.set(id, updated);
    return updated;
  }

  async deleteTestStripBrand(id: string): Promise<boolean> {
    return this.testStripBrands.delete(id);
  }
}

export const storage = new MemStorage();
