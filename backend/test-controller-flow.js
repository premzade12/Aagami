import groqResponse from "./groq.js";
import dotenv from "dotenv";
dotenv.config();

const simulateControllerFlow = async () => {
  console.log("🧪 Simulating complete controller flow...");
  
  const testCommands = [
    "व्हाट इस जावा",
    "What is JavaScript?",
    "search google for weather",
    "play music on youtube"
  ];
  
  for (const command of testCommands) {
    console.log(`\n📝 Testing: "${command}"`);
    
    try {
      console.log('🔍 Calling Groq API with command:', command);
      const result = await groqResponse(command, "Assistant", "User");
      console.log('🤖 Groq raw response:', result.substring(0, 200));
      
      // Parse Groq response (same logic as controller)
      let jsonString = result.trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/^\s*json\s*/i, '')
        .trim();
      
      const jsonMatch = jsonString.match(/({[\s\S]*})/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }
      
      jsonString = jsonString
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      const gemResult = JSON.parse(jsonString);
      console.log('✅ Controller would return:');
      console.log('   Type:', gemResult.type);
      console.log('   Response:', gemResult.response);
      if (gemResult.query) console.log('   Query:', gemResult.query);\n      \n    } catch (err) {\n      console.log('❌ Controller flow failed:', err.message);\n    }\n  }\n};\n\nsimulateControllerFlow();