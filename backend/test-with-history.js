import geminiResponse from "./gemini.js";
import dotenv from "dotenv";
dotenv.config();

const testWithHistory = async () => {
  try {
    console.log("🧪 Testing Gemini with conversation history...");
    
    const command = "tell me about you";
    const assistantName = "Assistant";
    const userName = "John";
    const historyContext = `User: Hello, my name is John
Assistant: Nice to meet you, John! I'm Assistant, your virtual helper.
User: What can you do?
Assistant: I can help with searches, play music, open apps, and much more!`;
    
    console.log("📝 Input with history:", { command, assistantName, userName, historyLength: historyContext.length });
    
    const result = await geminiResponse(`${historyContext}\nUser: ${command}`, assistantName, userName);
    console.log("🤖 Raw Gemini response:", result);
    
    // Test parsing
    let jsonString = null;
    const markdownMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonString = markdownMatch[1].trim();
    } else {
      const directMatch = result.match(/({[\s\S]*})/);
      if (directMatch) {
        jsonString = directMatch[1];
      }
    }
    
    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        console.log("✅ Parsed response:", parsed.response);
      } catch (e) {
        console.log("❌ Parse failed:", e.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testWithHistory();