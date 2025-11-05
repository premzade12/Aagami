import axios from "axios";

const testFlash = async () => {
  const apiKey = "AIzaSyCenZyoGjgZgvi_qUgzOr5x5OMbDmuJVeM";
  
  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Respond with JSON: {\"type\": \"general\", \"response\": \"Hello! I'm working perfectly!\"}"
          }]
        }]
      }
    );
    
    console.log("✅ Gemini 1.5 Flash works!");
    console.log("Response:", result.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testFlash();