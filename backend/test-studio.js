import axios from "axios";

const testStudio = async () => {
  const apiKey = "AIzaSyBZyHPHZHHM-G0P8SnyhZLSUeF6fwpYKwk";
  
  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Say hello and respond with JSON: {\"type\": \"general\", \"response\": \"Hello! I'm working perfectly!\"}"
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("✅ Success!");
    console.log("Response:", result.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testStudio();