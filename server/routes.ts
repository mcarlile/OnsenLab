import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { analyzeTestStrip } from "./gemini";
import { insertTestReadingSchema } from "@shared/schema";
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

      // Convert image to base64
      const imageBase64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      // Analyze with Gemini AI
      const analysis = await analyzeTestStrip(imageBase64, mimeType);

      // Validate and store the reading
      const readingData = insertTestReadingSchema.parse({
        imageUrl: null,
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

  const httpServer = createServer(app);

  return httpServer;
}
