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
  pHConfidence: number | null;
  chlorineConfidence: number | null;
  alkalinityConfidence: number | null;
  bromineConfidence: number | null;
  hardnessConfidence: number | null;
  pHInterval: number | null;
  chlorineInterval: number | null;
  alkalinityInterval: number | null;
  bromineInterval: number | null;
  hardnessInterval: number | null;
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
      ? `\n\nYou are being provided multiple images of the SAME test strip and its color key.
The user took two photos because the strip is long and the bottle key is cylindrical.

IMPORTANT MULTI-IMAGE RULES:
- Identify all reagent pads across both images.
- Identify the brand's color key blocks in both images.
- FOR EACH PAD: Match it to the corresponding color scale found WITHIN THE SAME IMAGE to ensure lighting and color temperature consistency.
- DE-DUPLICATION: If a pad appears in both images, return only the result with the higher confidence score.
- AGNOSTICISM: Do not use pre-known brand colors. Rely entirely on the key provided in the photos.`
      : '';

    const systemPrompt = `ACT AS: A water chemistry expert and computer vision analyst.
Analyze the test strip in the provided image(s) and extract chemical readings.${brandContext}${multiImageNote}

Look for these measurements:
- pH (typically 6.0-8.4 range)
- Total Chlorine (typically 0-10 ppm)
- Total Alkalinity (typically 0-240 ppm)
- Total Bromine (typically 0-20 ppm, may not be present)
- Total Hardness (typically 0-1000 ppm, may not be present)

FOR EACH PARAMETER you can detect:
1. Determine the numerical value by matching the pad color to the closest color block on the key.
2. Assign a per-parameter confidence score (0.0 to 1.0) based on:
   - Image focus and lighting quality
   - How closely the pad color matches a specific color block vs. falling between blocks
   - Whether the color key is visible and legible
3. Calculate a margin of error (interval) based on how close the pad color is to adjacent color blocks.

Return a JSON object with these exact fields:
{
  "pH": number or null,
  "pHConfidence": number (0-1) or null,
  "pHInterval": number (margin of error, e.g. 0.2 for +/- 0.2) or null,
  "chlorine": number or null,
  "chlorineConfidence": number or null,
  "chlorineInterval": number or null,
  "alkalinity": number or null,
  "alkalinityConfidence": number or null,
  "alkalinityInterval": number or null,
  "bromine": number or null,
  "bromineConfidence": number or null,
  "bromineInterval": number or null,
  "hardness": number or null,
  "hardnessConfidence": number or null,
  "hardnessInterval": number or null,
  "confidence": number (0-1, overall confidence across all readings)
}

If you cannot detect a specific reading, set its value, confidence, and interval all to null.
Be conservative with confidence scores - only give high confidence when colors are clearly visible, well-lit, and closely match a specific color block on the key.`;

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
            pHConfidence: { type: ["number", "null"] },
            pHInterval: { type: ["number", "null"] },
            chlorine: { type: ["number", "null"] },
            chlorineConfidence: { type: ["number", "null"] },
            chlorineInterval: { type: ["number", "null"] },
            alkalinity: { type: ["number", "null"] },
            alkalinityConfidence: { type: ["number", "null"] },
            alkalinityInterval: { type: ["number", "null"] },
            bromine: { type: ["number", "null"] },
            bromineConfidence: { type: ["number", "null"] },
            bromineInterval: { type: ["number", "null"] },
            hardness: { type: ["number", "null"] },
            hardnessConfidence: { type: ["number", "null"] },
            hardnessInterval: { type: ["number", "null"] },
            confidence: { type: "number" },
          },
          required: [
            "pH", "pHConfidence", "pHInterval",
            "chlorine", "chlorineConfidence", "chlorineInterval",
            "alkalinity", "alkalinityConfidence", "alkalinityInterval",
            "bromine", "bromineConfidence", "bromineInterval",
            "hardness", "hardnessConfidence", "hardnessInterval",
            "confidence",
          ],
        },
      },
      contents: [
        ...imageParts,
        "Analyze this test strip image and extract all chemical readings with per-parameter confidence scores and margins of error.",
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
