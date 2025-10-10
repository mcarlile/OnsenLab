import { type TestReading, type InsertTestReading } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getTestReading(id: string): Promise<TestReading | undefined>;
  getAllTestReadings(): Promise<TestReading[]>;
  createTestReading(reading: InsertTestReading): Promise<TestReading>;
}

export class MemStorage implements IStorage {
  private testReadings: Map<string, TestReading>;

  constructor() {
    this.testReadings = new Map();
  }

  async getTestReading(id: string): Promise<TestReading | undefined> {
    return this.testReadings.get(id);
  }

  async getAllTestReadings(): Promise<TestReading[]> {
    return Array.from(this.testReadings.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createTestReading(insertReading: InsertTestReading): Promise<TestReading> {
    const id = randomUUID();
    const reading: TestReading = { 
      id,
      timestamp: new Date(),
      imageUrl: insertReading.imageUrl ?? null,
      pH: insertReading.pH ?? null,
      chlorine: insertReading.chlorine ?? null,
      alkalinity: insertReading.alkalinity ?? null,
      bromine: insertReading.bromine ?? null,
      hardness: insertReading.hardness ?? null,
      confidence: insertReading.confidence ?? null,
    };
    this.testReadings.set(id, reading);
    return reading;
  }
}

export const storage = new MemStorage();
