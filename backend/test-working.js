import axios from "axios";

const testWorking = async () => {
  const apiKey = "AIzaSyDD3V6pASxoN_VOkHxhCHWeVlE6RYczTd8";
  
  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "You are Jarvis, an AI assistant. Respond with JSON: {\"type\": \"general\", \"response\": \"Hello! I'm Jarvis and I'm working perfectly with Gemini!\"}"
          }]
        }]
      }
    );
    
    console.log("✅ Gemini 2.5 Flash works!");
    console.log("Response:", result.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testWorking();