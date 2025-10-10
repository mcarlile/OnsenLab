import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { analyzeTestStrip } from "./gemini";
import { insertTestReadingSchema, insertTestStripBrandSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all test readings
  app.get("/api/readings", async (req, res) => {
    try {
      const readings = await storage.getAllTestReadings();
      res.json(readings);
    } catch (error) {
      console.error("Failed to fetch readings:", error);
      res.status(500).json({ error: "Failed to fetch readings" });
    }
  });

  // Get a specific test reading
  app.get("/api/readings/:id", async (req, res) => {
    try {
      const reading = await storage.getTestReading(req.params.id);
      if (!reading) {
        return res.status(404).json({ error: "Reading not found" });
      }
      res.json(reading);
    } catch (error) {
      console.error("Failed to fetch reading:", error);
      res.status(500).json({ error: "Failed to fetch reading" });
    }
  });

  // Upload and analyze test strip image
  app.post("/api/analyze", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const brandId = req.body.brandId;
      let brandInfo = null;

      // Get brand information if provided
      if (brandId) {
        const brand = await storage.getTestStripBrand(brandId);
        if (brand) {
          brandInfo = {
            name: brand.name,
            manufacturer: brand.manufacturer,
            description: brand.description,
          };
        }
      }

      // Convert image to base64
      const imageBase64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      // Analyze with Gemini AI
      const analysis = await analyzeTestStrip(imageBase64, mimeType, brandInfo);

      // Validate and store the reading
      const readingData = insertTestReadingSchema.parse({
        imageUrl: null,
        brandId: brandId || null,
        pH: analysis.pH,
        chlorine: analysis.chlorine,
        alkalinity: analysis.alkalinity,
        bromine: analysis.bromine,
        hardness: analysis.hardness,
        confidence: analysis.confidence,
      });

      const reading = await storage.createTestReading(readingData);

      res.json(reading);
    } catch (error) {
      console.error("Failed to analyze test strip:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid data format", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to analyze test strip", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get all test strip brands
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getAllTestStripBrands();
      res.json(brands);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  // Create a new test strip brand
  app.post("/api/brands", async (req, res) => {
    try {
      const brandData = insertTestStripBrandSchema.parse(req.body);
      const brand = await storage.createTestStripBrand(brandData);
      res.json(brand);
    } catch (error) {
      console.error("Failed to create brand:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid data format", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to create brand" });
    }
  });

  // Update a test strip brand
  app.patch("/api/brands/:id", async (req, res) => {
    try {
      const updates = insertTestStripBrandSchema.partial().parse(req.body);
      const brand = await storage.updateTestStripBrand(req.params.id, updates);
      
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      res.json(brand);
    } catch (error) {
      console.error("Failed to update brand:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid data format", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to update brand" });
    }
  });

  // Delete a test strip brand
  app.delete("/api/brands/:id", async (req, res) => {
    try {
      const success = await storage.deleteTestStripBrand(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete brand:", error);
      res.status(500).json({ error: "Failed to delete brand" });
    }
  });

  // Upload brand image
  app.post("/api/brands/upload-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Convert image to base64 data URL for in-memory storage
      const base64Image = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      res.json({ imageUrl: dataUrl });
    } catch (error) {
      console.error("Failed to upload brand image:", error);
      res.status(500).json({ error: "Failed to upload brand image" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
