import groqResponse from "./groq.js";
import geminiResponse from "./gemini.js";
import dotenv from "dotenv";
dotenv.config();

const testAPIs = async () => {
  console.log("🧪 Testing API responses...");
  
  const testCommands = [
    "What is JavaScript?",
    "Tell me about yourself",
    "How are you?",
    "What can you do?"
  ];
  
  for (const command of testCommands) {
    console.log(`\n📝 Testing: "${command}"`);
    
    // Test Groq API
    try {
      console.log("🔍 Testing Groq API...");
      const groqResult = await groqResponse(command, "Assistant", "User");
      console.log("✅ Groq Raw Response:", groqResult.substring(0, 200));
      
      // Try to parse
      try {
        const parsed = JSON.parse(groqResult);
        console.log("✅ Groq Parsed - Type:", parsed.type, "Response:", parsed.response?.substring(0, 50));
      } catch (e) {
        console.log("❌ Groq Parse Failed:", e.message);
      }
    } catch (error) {
      console.log("❌ Groq API Failed:", error.message);
    }
    
    // Test Gemini API
    try {
      console.log("🔍 Testing Gemini API...");
      const geminiResult = await geminiResponse(command, "Assistant", "User");
      console.log("✅ Gemini Raw Response:", geminiResult.substring(0, 200));
      
      // Try to parse
      try {
        const parsed = JSON.parse(geminiResult);
        console.log("✅ Gemini Parsed - Type:", parsed.type, "Response:", parsed.response?.substring(0, 50));
      } catch (e) {
        console.log("❌ Gemini Parse Failed:", e.message);
      }
    } catch (error) {
      console.log("❌ Gemini API Failed:", error.message);
    }
  }
};

testAPIs();