import groqResponse from "./groq.js";
import dotenv from "dotenv";
dotenv.config();

const testCompleteFlow = async () => {
  console.log("🧪 Testing complete API flow...");
  
  const testCommands = [
    "What is JavaScript?",
    "search google for weather",
    "play music on youtube", 
    "open calculator",
    "tell me about yourself"
  ];
  
  for (const command of testCommands) {
    console.log(`\n📝 Testing: "${command}"`);
    
    try {
      const result = await groqResponse(command, "Assistant", "User");
      console.log("✅ Raw Response:", result.substring(0, 150) + "...");
      
      // Parse the response
      let jsonString = result.trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      
      const jsonMatch = jsonString.match(/({[\s\S]*})/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }
      
      const parsed = JSON.parse(jsonString);
      console.log("✅ Parsed Successfully:");
      console.log("   Type:", parsed.type);
      console.log("   Response:", parsed.response?.substring(0, 80) + "...");
      if (parsed.query) console.log("   Query:", parsed.query);
      
    } catch (error) {
      console.log("❌ Failed:", error.message);
    }
  }
};

testCompleteFlow();