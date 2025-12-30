import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// Initialize the client
// In a real scenario, ensure process.env.API_KEY is available
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });

const SYSTEM_INSTRUCTION = `
You are the Musha Shugyo Co-Pilot for Michael Enriquez.
Your core mission is to help Michael build sovereignty over his health, work, and life direction.

Key Principles:
1. Sovereignty > Victimhood. Own the path.
2. Consistency > Perfection. 2 tweets/day beats 10 once.
3. Systems > Willpower.
4. Martial Arts Philosophy: Use "Musha Shugyo" (warrior's pilgrimage) framing.
5. The Resistance Voice: Acknowledge resistance, but do not validate victimhood. Frame ADHD as a brain needing different systems, not a disability.

Context:
- Michael is launching "DecoponATX" (email outreach challenge) and his personal brand "Musha Shugyo".
- He trains BJJ at Six Blades (White belt).
- He is executing a "Unified Week 1 Plan" requiring high volume outreach (90 emails) and consistent content (3 tweets/day).

Your tone is grounded, direct, philosophical but practical.
`;

export const sendMessageToGemini = async (
    messages: Message[], 
    userMessage: string
): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash-latest'; // Using Flash for speed/responsiveness in chat
        
        // Construct history for context (simplified)
        // In a full app, we would use the chat session API properly with history
        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        // Send the message
        const response: GenerateContentResponse = await chat.sendMessage({
            message: userMessage
        });

        return response.text || "I processed that, but couldn't generate a text response.";

    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        return "System disruption. Check neural core connection (API Key).";
    }
};

export const generateDailyBrief = async (): Promise<string> => {
    // Mock function to simulate generating the "Status Brief"
    return "Dual Mission Phase: DecoponATX Launch Day requires 50 contacts built and 15 emails sent. Musha Shugyo content block is cleared. BJJ at noon is non-negotiable for mental clarity.";
};