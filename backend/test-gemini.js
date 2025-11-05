import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const testGemini = async () => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;
    console.log("Testing API URL:", apiUrl);
    
    const result = await axios.post(apiUrl, {
      "contents": [
        {
          "parts": [
            {
              "text": "Hello, just testing. Respond with: {\"type\": \"general\", \"response\": \"Hello, I'm working!\"}"
            }
          ]
        }
      ]
    });

    console.log("✅ Success:", result.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testGemini();