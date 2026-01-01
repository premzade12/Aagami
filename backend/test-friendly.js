import groqResponse from "./groq.js";
import dotenv from "dotenv";
dotenv.config();

const testFriendlyPersonality = async () => {
  console.log("🧪 Testing new friendly personality...");
  
  const testCommands = [
    "How are you?",
    "What is JavaScript?",
    "हेलो कैसे हो?",
    "Tell me about yourself",
    "search google for weather"
  ];
  
  for (const command of testCommands) {
    console.log(`\n📝 Testing: "${command}"`);
    
    try {
      const result = await groqResponse(command, "Assistant", "User");
      
      let jsonString = result.trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      
      const jsonMatch = jsonString.match(/({[\s\S]*})/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }
      
      const parsed = JSON.parse(jsonString);
      console.log("✅ Type:", parsed.type);
      console.log("✅ Response:", parsed.response);
      console.log("📏 Response length:", parsed.response.length, "characters");
      
    } catch (error) {
      console.log("❌ Failed:", error.message);
    }
  }
};

testFriendlyPersonality();