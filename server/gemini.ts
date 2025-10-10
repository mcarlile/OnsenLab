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

export async function analyzeTestStrip(imageBase64: string, mimeType: string): Promise<ChemicalReadings> {
  try {
    const systemPrompt = `You are an expert at analyzing hot tub and pool test strips from images.
Analyze the test strip in the image and extract the chemical readings.

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
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        "Analyze this test strip image and extract all chemical readings you can detect.",
      ],
    });

    const rawJson = result.response.text();

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
