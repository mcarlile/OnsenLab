import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { analyzeTestStrip } from "./gemini";
import { uploadAuditImage, objectStorageService } from "./imageStorage";
import { insertTestReadingSchema, insertTestStripBrandSchema } from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { randomUUID } from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  registerObjectStorageRoutes(app);

  app.get("/api/audit-images/*", async (req, res) => {
    try {
      const filePath = req.params[0];
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "Image not found" });
      }
      await objectStorageService.downloadObject(file, res, 86400);
    } catch (error) {
      console.error("Failed to serve audit image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  app.get("/api/readings", async (req, res) => {
    try {
      const readings = await storage.getAllTestReadings();
      res.json(readings);
    } catch (error) {
      console.error("Failed to fetch readings:", error);
      res.status(500).json({ error: "Failed to fetch readings" });
    }
  });

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

  app.post("/api/analyze", upload.array('images', 2), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const brandId = req.body.brandId;
      let brandInfo = null;

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

      const readingId = randomUUID();

      let imageTopUrl: string | null = null;
      let imageBottomUrl: string | null = null;

      try {
        imageTopUrl = await uploadAuditImage(readingId, files[0].buffer, files[0].mimetype, "top");
        if (files[1]) {
          imageBottomUrl = await uploadAuditImage(readingId, files[1].buffer, files[1].mimetype, "bottom");
        }
      } catch (uploadErr) {
        console.error("Image storage upload failed (continuing with analysis):", uploadErr);
      }

      const images = files.map(file => ({
        base64: file.buffer.toString('base64'),
        mimeType: file.mimetype,
      }));

      const analysis = await analyzeTestStrip(images, brandInfo);

      const readingData = insertTestReadingSchema.parse({
        imageTopUrl,
        imageBottomUrl,
        brandId: brandId || null,
        pH: analysis.pH,
        chlorine: analysis.chlorine,
        alkalinity: analysis.alkalinity,
        bromine: analysis.bromine,
        hardness: analysis.hardness,
        confidence: analysis.confidence,
        pHInterval: analysis.pHInterval,
        chlorineInterval: analysis.chlorineInterval,
        alkalinityInterval: analysis.alkalinityInterval,
        bromineInterval: analysis.bromineInterval,
        hardnessInterval: analysis.hardnessInterval,
        pHConfidence: analysis.pHConfidence,
        chlorineConfidence: analysis.chlorineConfidence,
        alkalinityConfidence: analysis.alkalinityConfidence,
        bromineConfidence: analysis.bromineConfidence,
        hardnessConfidence: analysis.hardnessConfidence,
      });

      const reading = await storage.createTestReading(readingData);
      res.json(reading);
    } catch (error) {
      console.error("Failed to analyze test strip:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid data format", 
          details: "The image analysis returned unexpected data. Please try again." 
        });
      }

      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      const isQuota = errorMsg.toLowerCase().includes("rate limit") || errorMsg.toLowerCase().includes("quota");
      
      res.status(isQuota ? 429 : 500).json({ 
        error: "Failed to analyze test strip", 
        details: errorMsg
      });
    }
  });

  app.get("/api/brands/:id/readings", async (req, res) => {
    try {
      const readings = await storage.getReadingsByBrandId(req.params.id);
      res.json(readings);
    } catch (error) {
      console.error("Failed to fetch brand readings:", error);
      res.status(500).json({ error: "Failed to fetch brand readings" });
    }
  });

  app.get("/api/brands/:id", async (req, res) => {
    try {
      const brand = await storage.getTestStripBrand(req.params.id);
      if (!brand) return res.status(404).json({ error: "Brand not found" });
      res.json(brand);
    } catch (error) {
      console.error("Failed to fetch brand:", error);
      res.status(500).json({ error: "Failed to fetch brand" });
    }
  });

  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getAllTestStripBrands();
      res.json(brands);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", async (req, res) => {
    try {
      const brandData = insertTestStripBrandSchema.parse(req.body);
      const brand = await storage.createTestStripBrand(brandData);
      res.json(brand);
    } catch (error) {
      console.error("Failed to create brand:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data format", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create brand" });
    }
  });

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
        return res.status(400).json({ error: "Invalid data format", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update brand" });
    }
  });

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

  app.post("/api/brands/upload-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
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
