import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export type Severity = 'Safe' | 'Attention Needed' | 'Tools Required' | 'Hazardous/Biohazard';

export interface HazardAnalysis {
  severity: Severity;
  summary: string;
  recommendedAction: string;
  smartEquipmentManifest: string[]; // List of tools needed to fix it
  tags: string[];
}

export interface CleanupAnalysis {
  isClean: boolean;
  confidence: number;
  summary: string;
  hypeMessage: string; // Enthusiastic praise for cleaning the area
}

export interface FraudAnalysis {
  isAuthentic: boolean;
  confidence: number;
  fraudReason: string | null;
}

/**
 * Analyzes an image of a park issue to determine environmental hazards.
 * @param imageFile The File object submitted by the user.
 * @returns A structured analysis of the issue.
 */
export async function analyzeParkHazard(imageFile: File): Promise<HazardAnalysis> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API Key is missing. Check your .env setup.");
  }

  try {
    // We use gemini-1.5-flash as it is the standard multimodal fast model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Convert the File to the Generative Part format
    const base64Data = await fileToGenerativePart(imageFile);

    const prompt = `
      You are an expert environmental ranger and park inspector.
      Analyze this image of a local park or community area to determine any environmental hazards or maintenance issues.
      
      Provide your analysis in the following strict JSON format:
      {
        "severity": "Safe" | "Attention Needed" | "Tools Required" | "Hazardous/Biohazard",
        "summary": "A 1-2 sentence description of the issue shown in the photo.",
        "recommendedAction": "A specific action community members or city workers should take to clean or fix this.",
        "smartEquipmentManifest": ["Heavy Duty Gloves", "Trash Bags", "Graffiti Remover", "Wheelbarrow", "etc"],
        "tags": ["Trash", "Graffiti", "Broken Equipment", "Overgrown", "etc"]
      }
      
      Only return the JSON object, NO markdown formatting and NO backticks.
    `;

    const result = await model.generateContent([prompt, base64Data]);
    const responseText = result.response.text();
    
    // Parse the JSON response
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis: HazardAnalysis = JSON.parse(cleanedText);
    
    return analysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image hazard. Please try again.");
  }
}

/**
 * Analyzes an image to verify if an environmental hazard has been cleaned.
 * @param imageFile The File object submitted by the user.
 * @returns A structured analysis indicating if the area is clean.
 */
export async function verifyParkCleanup(imageFile: File): Promise<CleanupAnalysis> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const base64Data = await fileToGenerativePart(imageFile);

    const prompt = `
      You are an environmental verification AI for a park stewardship app.
      Analyze this image and determine if the area shown appears to have been recently cleaned, or if it is free of obvious trash, damage, or environmental hazards.
      
      Provide your analysis in the following strict JSON format:
      {
        "isClean": true or false,
        "confidence": a number from 0 to 100 representing your confidence,
        "summary": "1-2 short sentences summarizing what you see and why you made this determination",
        "hypeMessage": "If isClean is true, generate a very enthusiastic, specific compliment about the hard work done, in an upbeat, civic-minded community champion persona. If false, provide an encouraging message to keep trying."
      }
      
      Only return the JSON object, NO markdown formatting and NO backticks.
    `;

    const result = await model.generateContent([prompt, base64Data]);
    const responseText = result.response.text();
    
    // Parse the JSON response
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis: CleanupAnalysis = JSON.parse(cleanedText);
    
    return analysis;
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    throw new Error("Failed to verify cleanup. Please try again.");
  }
}

/**
 * Validates whether an uploaded photo seems authentic (not a photo of a screen, not AI generated).
 * @param imageFile The File object submitted by the user.
 * @returns A structured analysis indicating if the photo is authentic.
 */
export async function analyzeFraud(imageFile: File): Promise<FraudAnalysis> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const base64Data = await fileToGenerativePart(imageFile);

    const prompt = `
      You are an anti-fraud AI for a park stewardship app.
      Analyze this image to ensure it is a genuine, naturally taken photo of a physical park or outdoor space.
      Look out for:
      - Photos of computer monitors or screens (look for moiré patterns, monitor bezels)
      - Blatant AI-generated images
      - Images that are completely irrelevant to a park or civic cleanup context
      
      Provide your analysis in the following strict JSON format:
      {
        "isAuthentic": true or false,
        "confidence": a number from 0 to 100 representing your confidence,
        "fraudReason": "If isAuthentic is false, explain why (e.g. 'This is a photo of a computer screen'). If true, return null"
      }
      
      Only return the JSON object, NO markdown formatting and NO backticks.
    `;

    const result = await model.generateContent([prompt, base64Data]);
    const responseText = result.response.text();
    
    // Parse the JSON response
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis: FraudAnalysis = JSON.parse(cleanedText);
    
    return analysis;
  } catch (error) {
    console.error("Gemini Fraud Verification Error:", error);
    // Fail open if AI check fails
    return { isAuthentic: true, confidence: 50, fraudReason: null };
  }
}

/**
 * Automates the drafting of an engaging mission briefing for a Park Cleanup Rally.
 */
export async function generateMissionBriefing(
  parkName: string, 
  hazardSummary?: string, 
  tools?: string[]
): Promise<string> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      You are an enthusiastic community organizer writing a "mission briefing" for a local park cleanup event.
      Write an engaging, persuasive, and fun 2-3 paragraph call-to-arms for volunteers to help clean up the park.
      
      Details to include:
      - Park Name: ${parkName}
      - Issue: ${hazardSummary || 'General maintenance and cleanup'}
      - Recommended Gear: ${tools?.length ? tools.join(', ') : 'Just bring yourselves!'}
      
      Make it sound like a fun, high-energy civic rally — enthusiastic and community-driven.
      DO NOT use any markdown formatting like bold, just plain text with line breaks.
    `;

    const result = await model.generateContent([prompt]);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini Mission Briefing Error:", error);
    return `Join us to clean up ${parkName} and restore its integrity!`;
  }
}

// Helper function to convert File to Gemini's required InlineData format
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract the raw base64 data (remove the data:image/jpeg;base64, prefix)
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
