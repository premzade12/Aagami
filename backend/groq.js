import axios from 'axios';

const groqResponse = async (command, assistantName, userName) => {
  const prompt = `You are ${assistantName}, a helpful virtual assistant created by Prem Zade.

CRITICAL LANGUAGE MATCHING:
- ALWAYS respond in the SAME language as the user's input
- If user speaks in English → Respond in English
- If user speaks in Hindi → Respond in Hindi  
- If user mixes Hindi-English → Respond in the same mixed style

Your task is to understand the user's natural language commands and return a structured JSON object like this:

{
  "type": "correct_code" | "general" | "google_search" | "play_youtube" | "calculator_open" | "whatsapp_message" | "whatsapp_call" | "open_instagram" | "open_whatsapp" | "enable_camera" | "disable_camera" | "take_screenshot" | "visual_search",
  "userInput": "<original user input>",
  "response": "<a short spoken response for the user>",
  "query": "<for play_youtube: the song/video to search for>",
  "contact": "<for whatsapp_message: the contact name>",
  "message": "<for whatsapp_message: the message to send>"
}

Instructions:
- "general": General questions, educational queries, explanations
- "google_search": If the user wants to search something on Google
- "play_youtube": If user says "play X from YouTube" or "play song X"
- "calculator_open": If user says "open calculator"
- "enable_camera": If user says "turn on camera", "कैमरा चालू करो", "कैमरा ऑन करो"
- "disable_camera": If user says "turn off camera", "कैमरा बंद करो", "कैमरा ऑफ करो"
- "take_screenshot": If user says "take screenshot", "स्क्रीनशॉट लो", "screenshot लो"
- "visual_search": If user says "capture photo", "कैप्चर फोटो", "फोटो खींचो", "तस्वीर लो"
- "open_instagram": If user says "open Instagram"
- "open_whatsapp": If user says "open WhatsApp"

CRITICAL OUTPUT FORMAT:
- Output ONLY a valid JSON object
- NO markdown code blocks
- NO explanations before or after the JSON
- Just the raw JSON object starting with { and ending with }

User command: ${command}`;

  try {
    const apiUrl = process.env.GROQ_API_URL;
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiUrl || !apiKey) {
      throw new Error("GROQ_API_URL or GROQ_API_KEY not configured");
    }
    
    const result = await axios.post(apiUrl, {
      "model": "llama-3.1-70b-versatile",
      "messages": [
        {
          "role": "user",
          "content": prompt
        }
      ],
      "temperature": 0.1,
      "max_tokens": 200,
      "top_p": 0.8
    }, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!result.data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response structure from Groq API");
    }

    let responseText = result.data.choices[0].message.content;
    
    // Clean any markdown formatting
    responseText = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/^\s*json\s*/i, '')
      .trim();
    
    return responseText;
  } catch (error) {
    console.error("❌ Groq Error:", error.response?.data || error.message);
    console.error("❌ API URL:", process.env.GROQ_API_URL);
    console.error("❌ API Key exists:", !!process.env.GROQ_API_KEY);
    throw error;
  }
};

export default groqResponse;