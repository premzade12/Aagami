import axios from "axios";

const testNewKey = async () => {
  const apiKey = "AIzaSyCenZyoGjgZgvi_qUgzOr5x5OMbDmuJVeM";
  
  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Respond with JSON: {\"type\": \"general\", \"response\": \"Hello! I'm working perfectly!\"}"
          }]
        }]
      }
    );
    
    console.log("✅ New API key works!");
    console.log("Response:", result.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testNewKey();