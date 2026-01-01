import groqResponse from "./groq.js";
import dotenv from "dotenv";
dotenv.config();

const testGroqOnly = async () => {
  console.log("🧪 Testing Groq-only setup...");
  
  const testCommands = [
    "What is JavaScript?",
    "Tell me about yourself", 
    "How are you?",
    "What can you do?",
    "search google for weather",
    "play music on youtube",
    "open calculator",
    "time batao",
    "camera on karo"
  ];
  
  for (const command of testCommands) {
    console.log(`\n📝 Testing: "${command}"`);
    
    try {
      const result = await groqResponse(command, "Assistant", "User");
      
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
      console.log("✅ SUCCESS:");
      console.log("   Type:", parsed.type);
      console.log("   Response:", parsed.response);
      if (parsed.query) console.log("   Query:", parsed.query);
      
    } catch (error) {
      console.log("❌ FAILED:", error.message);
    }
  }
  
  console.log("\n🎉 Groq-only setup test completed!");
};

testGroqOnly();