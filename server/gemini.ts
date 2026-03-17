import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ParameterReading {
  value: number | null;
  confidence: number | null;
  interval: number | null;
}

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
  parameters: Record<string, ParameterReading>;
  intervals: Record<string, number | null>;
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

const parameterReadingSchema = {
  type: "object" as const,
  properties: {
    value: { type: "number" as const },
    confidence: { type: "number" as const },
    interval: { type: "number" as const },
  },
};

function isRetryableError(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return msg.includes("resource_exhausted") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("503") ||
    msg.includes("syntaxerror") ||
    msg.includes("json") ||
    msg.includes("empty response");
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function classifyGeminiError(error: unknown): { message: string; isQuota: boolean } {
  const msg = String(error).toLowerCase();
  if (msg.includes("resource_exhausted") || msg.includes("quota") || msg.includes("429")) {
    return {
      message: "AI service temporarily unavailable due to rate limits. Please wait a moment and try again.",
      isQuota: true,
    };
  }
  if (msg.includes("invalid") && msg.includes("api key")) {
    return { message: "AI service configuration error. Please check the API key.", isQuota: false };
  }
  if (msg.includes("503") || msg.includes("unavailable")) {
    return { message: "AI service is temporarily unavailable. Please try again shortly.", isQuota: false };
  }
  return { message: "Failed to analyze the test strip image. Please try again with a clearer photo.", isQuota: false };
}

export async function analyzeTestStrip(
  images: ImageData[],
  brandInfo?: BrandInfo | null
): Promise<ChemicalReadings> {
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

FOR EACH PARAMETER you can detect, return an object with:
1. "value": the numerical reading by matching the pad color to the closest color block on the key
2. "confidence": a per-parameter confidence score (0.0 to 1.0) based on image focus, lighting quality, and how closely the pad matches a specific color block
3. "interval": a margin of error based on how close the pad color is to adjacent color blocks (e.g. 0.2 means ±0.2)

If you cannot detect a specific parameter, set all three fields (value, confidence, interval) to null.

Return a JSON object with:
- "parameters": an object with keys "pH", "chlorine", "alkalinity", "bromine", "hardness", each containing {value, confidence, interval}
- "confidence": overall confidence across all readings (0-1)

Be conservative with confidence scores - only give high confidence when colors are clearly visible, well-lit, and closely match a specific color block on the key.`;

  const imageParts = images.map(img => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType,
    },
  }));

  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [1000, 2000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.1,
          topK: 1,
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: "object",
            properties: {
              parameters: {
                type: "object",
                properties: {
                  pH: parameterReadingSchema,
                  chlorine: parameterReadingSchema,
                  alkalinity: parameterReadingSchema,
                  bromine: parameterReadingSchema,
                  hardness: parameterReadingSchema,
                },
                required: ["pH", "chlorine", "alkalinity", "bromine", "hardness"],
              },
              confidence: { type: "number" },
            },
            required: ["parameters", "confidence"],
          },
        },
        contents: [
          ...imageParts,
          "Analyze this test strip image and extract all chemical readings with per-parameter confidence scores and margins of error.",
        ],
      });

      let rawJson = "";
      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if ("text" in part && part.text && !("thought" in part && part.thought)) {
            rawJson += part.text;
          }
        }
      }
      if (!rawJson) {
        rawJson = result.text || "";
      }

      if (!rawJson) {
        throw new Error("Empty response from Gemini");
      }

      const raw = JSON.parse(rawJson) as {
        parameters: Record<string, { value?: number | null; confidence?: number | null; interval?: number | null }>;
        confidence: number;
      };

      const p = raw.parameters;
      const param = (key: string) => ({
        value: p[key]?.value ?? null,
        confidence: p[key]?.confidence ?? null,
        interval: p[key]?.interval ?? null,
      });

      const pH = param("pH");
      const chlorine = param("chlorine");
      const alkalinity = param("alkalinity");
      const bromine = param("bromine");
      const hardness = param("hardness");

      const data: ChemicalReadings = {
        pH: pH.value,
        chlorine: chlorine.value,
        alkalinity: alkalinity.value,
        bromine: bromine.value,
        hardness: hardness.value,
        confidence: raw.confidence,
        pHConfidence: pH.confidence,
        chlorineConfidence: chlorine.confidence,
        alkalinityConfidence: alkalinity.confidence,
        bromineConfidence: bromine.confidence,
        hardnessConfidence: hardness.confidence,
        pHInterval: pH.interval,
        chlorineInterval: chlorine.interval,
        alkalinityInterval: alkalinity.interval,
        bromineInterval: bromine.interval,
        hardnessInterval: hardness.interval,
        parameters: { pH, chlorine, alkalinity, bromine, hardness },
        intervals: {
          pH: pH.interval,
          chlorine: chlorine.interval,
          alkalinity: alkalinity.interval,
          bromine: bromine.interval,
          hardness: hardness.interval,
        },
      };
      return data;
    } catch (error) {
      lastError = error;
      console.error(`Gemini attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, error);

      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        console.log(`Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }

      break;
    }
  }

  const classified = classifyGeminiError(lastError);
  throw new Error(classified.message);
}
