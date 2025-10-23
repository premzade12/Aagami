import axios from "axios";
import dotenv from "dotenv";
dotenv.config(); 

const geminiResponse = async (command, assistantName, userName) => {
  const prompt = `
You are a smart AI assistant named ${assistantName}, created by Prem Zade.
You need to remember the history of the user upto 100 prompts and provide the stored data if the user ask you to remember something.
Your task is to understand the user's natural language commands and return a structured JSON object like this:

{
  "type": "correct_code" | "general" | "google_search" | "youtube_search" | "play_youtube" | "youtube_close" | "sing_song" |
          "get_time" | "get_date" | "get_day" | "get_month" | "calculator_open" | "whatsapp_message" | "change_voice" |
          "open_instagram" | "open_whatsapp" | "facebook_open" | "weather-show",

  "userInput": "<original user input, with assistant name removed if present>",
  "response": "<a short spoken response for the user>",
  "query": "<for play_youtube: the song/video to search for>"
}

Instructions:
- type:
  - "correct_code": If user says something like "Jarvis, correct this code" or "fix my code" or similar.
  - "general": General questions like "What is the capital of India?"
  - "google_search": If the user wants to search something on Google.
  - "play_youtube": If user says "play X from YouTube" or "play song X" or "search X on YouTube".
  - "calculator_open": If user says "open calculator".
  - "whatsapp_message": If user wants to send message via WhatsApp.
  - "open_instagram": If user says "open Instagram" or "launch Instagram".
  - "open_whatsapp": If user says "open WhatsApp" or "launch WhatsApp".
  - "facebook_open", "weather-show" → as named.
  - "get_time", "get_date", "get_day", "get_month" → for basic queries.

- For "play_youtube":
  - Include "query" field with the song/video name to search for.
  - Example: {"type": "play_youtube", "query": "Shape of You Ed Sheeran", "response": "Playing Shape of You on YouTube"}

- For "correct_code":
  - Do not include any code from the voice command.
  - Set "userInput" to an empty string "".
  - The actual code will be handled separately in the frontend.
- response: short and voice-friendly like "Okay, correcting the code."

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