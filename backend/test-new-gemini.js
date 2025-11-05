import axios from "axios";

const testGemini = async () => {
  const apiKey = "AIzaSyDD3V6pASxoN_VOkHxhCHWeVlE6RYczTd8";
  
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-pro", 
    "gemini-pro",
    "gemini-1.0-pro"
  ];
  
  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const result = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: "Respond with JSON: {\"type\": \"general\", \"response\": \"Hello! Gemini is working!\"}"
            }]
          }]
        }
      );
      
      console.log(`✅ ${model} works!`);
      console.log("Response:", result.data.candidates[0].content.parts[0].text);
      return model;
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.response?.data?.error?.message || error.message);
    }
  }
};

testGemini();