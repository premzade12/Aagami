import axios from "axios";

const testLatest = async () => {
  const apiKey = "AIzaSyCenZyoGjgZgvi_qUgzOr5x5OMbDmuJVeM";
  
  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Say hello and respond with: {\"type\": \"general\", \"response\": \"Hello! Gemini is now working!\"}"
          }]
        }]
      }
    );
    
    console.log("✅ Gemini 1.5 Flash Latest works!");
    console.log("Response:", result.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testLatest();