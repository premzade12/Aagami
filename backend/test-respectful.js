import groqResponse from "./groq.js";
import dotenv from "dotenv";
dotenv.config();

const testRespectfulResponses = async () => {
  console.log("🧪 Testing respectful and varied responses...");
  
  const testCommands = [
    "What is JavaScript?",
    "How are you?", 
    "What can you do?",
    "Time batao",
    "Search google for weather",
    "Play music",
    "Open calculator"
  ];
  
  for (const command of testCommands) {
    console.log(`\n📝 Testing: "${command}"`);
    
    try {
      const result = await groqResponse(command, "Assistant", "User", "");
      
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
      console.log("📊 Starts with repetitive phrase?", 
        parsed.response.startsWith("Oh my goodness") || 
        parsed.response.startsWith("That's such a") ? "❌ YES" : "✅ NO");
      
    } catch (error) {
      console.log("❌ Failed:", error.message);
    }
  }
};

testRespectfulResponses();