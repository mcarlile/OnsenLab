import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ChemicalReadings {
  pH: number | null;
  chlorine: number | null;
  alkalinity: number | null;
  bromine: number | null;
  hardness: number | null;
  confidence: number;
}

interface BrandInfo {
  name: string;
  manufacturer: string;
  description: string | null;
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export async function analyzeTestStrip(
  images: ImageData[],
  brandInfo?: BrandInfo | null
): Promise<ChemicalReadings> {
  try {
    const brandContext = brandInfo 
      ? `\n\nThe test strip is a ${brandInfo.manufacturer} ${brandInfo.name}.${brandInfo.description ? ` ${brandInfo.description}` : ''} Use this information to help identify the correct color ranges and parameters.`
      : '';

    const multiImageNote = images.length > 1
      ? '\n\nYou are being provided multiple images of the SAME test strip. The strip may have been too long to capture in a single photo, so each image shows different pads/sections. Combine readings from all images to produce a single complete set of results.'
      : '';

    const systemPrompt = `You are an expert at analyzing hot tub and pool test strips from images.
Analyze the test strip in the image and extract the chemical readings.${brandContext}${multiImageNote}

Look for these measurements:
- pH (typically 6.0-8.4 range)
- Total Chlorine (typically 0-10 ppm)
- Total Alkalinity (typically 0-240 ppm)
- Total Bromine (typically 0-20 ppm, may not be present)
- Total Hardness (typically 0-1000 ppm, may not be present)

Return a JSON object with these exact fields:
{
  "pH": number or null,
  "chlorine": number or null,
  "alkalinity": number or null,
  "bromine": number or null,
  "hardness": number or null,
  "confidence": number (0-1, your confidence in the readings)
}

If you cannot detect a specific reading, set it to null.
Be conservative with your confidence score - only give high confidence when the colors are clearly visible and match the color chart.`;

    const imageParts = images.map(img => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType,
      },
    }));

    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            pH: { type: ["number", "null"] },
            chlorine: { type: ["number", "null"] },
            alkalinity: { type: ["number", "null"] },
            bromine: { type: ["number", "null"] },
            hardness: { type: ["number", "null"] },
            confidence: { type: "number" },
          },
          required: ["pH", "chlorine", "alkalinity", "bromine", "hardness", "confidence"],
        },
      },
      contents: [
        ...imageParts,
        "Analyze this test strip image and extract all chemical readings you can detect.",
      ],
    });

    const rawJson = result.text;

    if (rawJson) {
      const data: ChemicalReadings = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Failed to analyze test strip:", error);
    throw new Error(`Failed to analyze test strip: ${error}`);
  }
}
