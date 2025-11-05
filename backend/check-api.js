import axios from "axios";

const checkAPI = async () => {
  const apiKey = "AIzaSyBZyHPHZHHM-G0P8SnyhZLSUeF6fwpYKwk";
  
  // Test different model names
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-pro", 
    "gemini-pro",
    "gemini-1.0-pro"
  ];
  
  for (const model of models) {
    try {
      console.log(`\nTesting model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const result = await axios.post(url, {
        contents: [{
          parts: [{ text: "Hello" }]
        }]
      });
      
      console.log(`✅ ${model} works!`);
      console.log("Response:", result.data.candidates[0].content.parts[0].text);
      break;
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.response?.data?.error?.message || error.message);
    }
  }
};

checkAPI();