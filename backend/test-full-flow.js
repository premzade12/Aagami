import geminiResponse from "./gemini.js";
import dotenv from "dotenv";
dotenv.config();

const testFullFlow = async () => {
  try {
    console.log("🧪 Testing full Gemini flow...");
    
    const command = "tell me about you";
    const assistantName = "Assistant";
    const userName = "User";
    const historyContext = "";
    
    console.log("📝 Input:", { command, assistantName, userName });
    
    const result = await geminiResponse(`${historyContext}\nUser: ${command}`, assistantName, userName);
    console.log("🤖 Raw Gemini response:", result);
    
    // Test parsing
    let jsonString = null;
    const markdownMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonString = markdownMatch[1].trim();
      console.log("✅ Found JSON in markdown:", jsonString);
    } else {
      const directMatch = result.match(/({[\s\S]*})/);
      if (directMatch) {
        jsonString = directMatch[1];
        console.log("✅ Found direct JSON:", jsonString);
      }
    }
    
    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        console.log("✅ Parsed successfully:", parsed);
      } catch (e) {
        console.log("❌ Parse failed:", e.message);
      }
    } else {
      console.log("❌ No JSON found in response");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testFullFlow();