import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const testIntroCommand = async () => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;
    const apiKey = process.env.GEMINI_API_KEY;
    
    const prompt = `
You are a smart female AI assistant named Assistant, created by Prem Zade.
For SELF-INTRODUCTION commands ("tell me about you", "who are you", "introduce yourself"):
- ALWAYS respond with: "Hello! I'm Assistant, your intelligent virtual assistant created by Prem Zade. I'm here to help you with various tasks like searching Google, playing YouTube videos, opening applications, taking screenshots, managing your camera, and much more. I can understand both English and Hindi, and I'm always ready to assist you. What would you like me to help you with today?"
- Use type: "general" for these responses

Only output a pure JSON object. No markdown, no explanation, just JSON.

User command: tell me about you
    `;
    
    const result = await axios.post(`${apiUrl}?key=${apiKey}`, {
      "contents": [
        {
          "parts": [
            {
              "text": prompt
            }
          ]
        }
      ]
    });

    console.log("✅ Gemini Response:");
    console.log(result.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testIntroCommand();