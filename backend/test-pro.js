import axios from "axios";

const testPro = async () => {
  const apiKey = "AIzaSyBZyHPHZHHM-G0P8SnyhZLSUeF6fwpYKwk";
  
  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Respond with JSON: {\"type\": \"general\", \"response\": \"Hello! Gemini is working!\"}"
          }]
        }]
      }
    );
    
    console.log("✅ Gemini Pro works!");
    console.log("Response:", result.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testPro();