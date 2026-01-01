import groqResponse from "./groq.js";
import dotenv from "dotenv";
dotenv.config();

const testHindiInput = async () => {
  console.log("🧪 Testing Hindi input specifically...");
  
  const hindiCommand = "व्हाट इस जावा";
  console.log(`📝 Testing: "${hindiCommand}"`);
  
  try {
    console.log("🔍 Calling Groq API...");
    const result = await groqResponse(hindiCommand, "Assistant", "User");
    console.log("✅ Groq Raw Response:", result);
    
    // Try to parse
    let jsonString = result.trim()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    
    const jsonMatch = jsonString.match(/({[\s\S]*})/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
    
    console.log("📄 JSON String to parse:", jsonString);
    
    const parsed = JSON.parse(jsonString);
    console.log("✅ Parsed Successfully:");
    console.log("   Type:", parsed.type);
    console.log("   Response:", parsed.response);
    
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("❌ Stack:", error.stack);
  }
};

testHindiInput();