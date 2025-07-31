import axios from "axios";
import dotenv from "dotenv";
dotenv.config(); 

const geminiResponse = async (command, assistantName, userName) => {
  const prompt = `
You are a smart AI assistant named ${assistantName}, created by Prem Zade.
Your task is to understand the user's natural language commands and return a structured JSON object like this:

{
  "type": "correct_code" | "general" | "google_search" | "youtube_search" | "youtube_play" | "youtube_close" | "sing_song" |
          "get_time" | "get_date" | "get_day" | "get_month" | "calculator_open" | "whatsapp_message" | "change_voice" |
          "instagram_open" | "facebook_open" | "weather-show",

  "userInput": "<original user input, with assistant name removed if present>",
  "response": "<a short spoken response for the user>"
}

Instructions:
- type:
  - "correct_code": If user says something like "Jarvis, correct this code" or "fix my code" or similar.
  - "general": General questions like “What is the capital of India?”
  - "google_search": If the user wants to search something on Google.
  - "youtube_play": If user says “play X from YouTube”.
  - "calculator_open": If user says “open calculator”.
  - "whatsapp_message": If user wants to send message via WhatsApp.
  - "instagram_open", "facebook_open", "weather-show" → as named.
  - "get_time", "get_date", "get_day", "get_month" → for basic queries.

- For "correct_code":
  - Do not include any code from the voice command.
  - Set "userInput" to an empty string "".
  - The actual code will be handled separately in the frontend.
- response: short and voice-friendly like “Okay, correcting the code.”

Important:
- Use "${userName}" if user asks who created you.
- Only output a pure JSON object. No markdown, no explanation, just JSON.

Now, here is the user command: ${command}
  `;

  try {
    const apiUrl = process.env.GEMINI_API_URL;
    
    const result = await axios.post(apiUrl, {
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

    return result.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.log("❌ Gemini Error:", error.message);
  }
};

export default geminiResponse;
