// Test JSON parsing logic
const testParsing = () => {
  const geminiResponse = '```json\n{\n  "response": "Hello! I\'m Assistant, your intelligent virtual assistant created by Prem Zade. I\'m here to help you with various tasks like searching Google, playing YouTube videos, opening applications, taking screenshots, managing your camera, and much more. I can understand both English and Hindi, and I\'m always ready to assist you. What would you like me to help you with today?",\n  "type": "general"\n}\n```';

  console.log("Testing Gemini response parsing...");
  console.log("Raw response:", geminiResponse);

  // Parse Gemini response - improved JSON extraction
  let jsonString = null;
  
  // Try to extract JSON from markdown code blocks first
  const markdownMatch = geminiResponse.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    jsonString = markdownMatch[1].trim();
    console.log("✅ Found markdown JSON:", jsonString);
  } else {
    // Try to find JSON object directly
    const directMatch = geminiResponse.match(/({[\s\S]*})/);
    if (directMatch) {
      jsonString = directMatch[1];
      console.log("✅ Found direct JSON:", jsonString);
    }
  }
  
  if (jsonString) {
    try {
      const gemResult = JSON.parse(jsonString);
      console.log('✅ Parsed result:', gemResult);
      return gemResult;
    } catch (parseError) {
      console.log('❌ JSON parse failed:', parseError.message);
      return null;
    }
  } else {
    console.log('❌ No JSON found');
    return null;
  }
};

testParsing();