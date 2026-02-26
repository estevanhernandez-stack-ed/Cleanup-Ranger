import { test } from '@playwright/test';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();

test.use({ 
  permissions: ['geolocation', 'camera'],
  geolocation: { latitude: 39.7392, longitude: -104.9903 } // Defaulting to Denver for the map
});

test('AI Explorer Agent: The Parks & Rec Persona', async ({ page }) => {
  test.setTimeout(120000); // Give the agent 2 minutes total to explore
  
  // Setup Gemini
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No Gemini API key found. Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY.');
    test.skip();
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });  

  // Navigate to app
  console.log("Navigating to local app...");
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  const personaPrompt = `
You are a top-level software tester and coder who loves nature and the show Parks and Recreation. 
However, you don't want to make this app into a Parks and Rec ripoff, you just want it to be so, soooo, sooooo good. 
Your goal is to explore the Cleanup Ranger app, find bugs, evaluate its UX/UI, and suggest improvements.

I will provide you with a screenshot of the current page.

Please respond with ONE of the following precise JSON actions, and nothing else (no markdown blocks, just the JSON):
1. {"action": "CLICK", "selector": "text-to-click"} 
   // Replace "text-to-click" with exact visible text of button/link.
2. {"action": "TYPE", "selector": "text-to-click", "value": "text to type"}
   // Replace "text-to-click" with label or placeholder.
3. {"action": "UPLOAD", "target": "hazard" | "cleanup"}
   // Use this if a camera scanner modal is open and you want to upload test evidence. target should be "hazard" for DriftScanner and "cleanup" for CleanupScanner.
4. {"action": "REPORT", "message": "your final review, summary, or bug report with full Parks & Rec persona flair!"}
   // Use this when you are done exploring or found something important.
`;

  let stepCount = 0;
  const maxSteps = 10;
  
  // Track history manually
  let history: string = "Conversation History:\n";

  while (stepCount < maxSteps) {
    console.log(`\n--- Agent Step ${stepCount + 1} ---`);
    const screenshotBuffer = await page.screenshot();
    const screenshotBase64 = screenshotBuffer.toString('base64');
    
    const imagePart = {
      inlineData: {
        data: screenshotBase64,
        mimeType: 'image/png'
      }
    };

    const promptText = `
${personaPrompt}

${history}

Here is the current state of the page. What is your next move? Remember to return only a JSON object.`;

    try {
      const result = await model.generateContent([promptText, imagePart]);
      const responseText = result.response.text().trim();
      
      console.log("Raw Agent Response:", responseText);
      history += `Step ${stepCount + 1} Action Taken: ${responseText}\n`;
      
      const cleanJsonStr = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsedCommand = JSON.parse(cleanJsonStr);
      console.log("Parsed Command:", parsedCommand);

      if (parsedCommand.action === 'REPORT') {
        console.log("Agent Report:", parsedCommand.message);
        break;
      } else if (parsedCommand.action === 'CLICK') {
        if (!parsedCommand.selector) throw new Error("Missing selector for CLICK");
        console.log(`Clicking: "${parsedCommand.selector}"`);
        await page.getByText(parsedCommand.selector, { exact: false }).first().click({ timeout: 4000 }).catch(async () => {
          console.log(`Failed by text. Trying general locator for CSS or role...`);
          await page.locator(parsedCommand.selector).first().click({ timeout: 4000 });
        });
      } else if (parsedCommand.action === 'TYPE') {
        if (!parsedCommand.selector || !parsedCommand.value) throw new Error("Missing selector or value for TYPE");
        console.log(`Typing "${parsedCommand.value}" into "${parsedCommand.selector}"`);
        await page.getByPlaceholder(parsedCommand.selector).first().fill(parsedCommand.value, { timeout: 4000 }).catch(async () => {
            await page.getByLabel(parsedCommand.selector).first().fill(parsedCommand.value, { timeout: 4000 }).catch(async () => {
                await page.locator(parsedCommand.selector).first().fill(parsedCommand.value, { timeout: 4000 });
            });
        });
      } else if (parsedCommand.action === 'UPLOAD') {
        console.log(`Uploading test data for ${parsedCommand.target}...`);
        const fileName = parsedCommand.target === 'hazard' ? 'litter_park_1.png' : 'cleanup_bags_1.png';
        const filePath = path.join(__dirname, 'fixtures', fileName);
        await page.locator('input[type="file"]').setInputFiles(filePath).catch(() => {
             console.log("Failed to find file input. Is the scanner open?");
        });
      } else {
        console.log("Unknown action. Ending test.");
        break;
      }
      
      await page.waitForTimeout(2000);
      
    } catch (e: unknown) {
      const error = e as Error;
      console.error("Agent encountered an error executing step:", error?.message || e);
      break;  
    }

    stepCount++;
  }
  
  console.log("\nAgent finished exploration!");
});
