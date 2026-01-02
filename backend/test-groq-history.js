import groqResponse from "./groq.js";
import dotenv from "dotenv";
dotenv.config();

const testGroqWithHistory = async () => {
  console.log("🧪 Testing Groq with conversation history...");
  
  // Simulate conversation history
  const historyContext = `User: Hello, my name is John
Assistant: Hi there John! I'm absolutely thrilled to meet you! How can I help you today?
User: My father's name is David
Assistant: That's wonderful! I'll remember that your father's name is David. Thank you for sharing that with me!`;
  
  const testCommands = [
    "What is my name?",
    "What is my father's name?",
    "Tell me about JavaScript"
  ];
  
  for (const command of testCommands) {
    console.log(`\n📝 Testing: "${command}"`);
    console.log(`📚 History context length: ${historyContext.length} characters`);
    
    try {
      const result = await groqResponse(command, "Assistant", "User", historyContext);
      
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

testGroqWithHistory();