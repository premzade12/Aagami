import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const listModels = async () => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    console.log("Listing available models...");
    const result = await axios.get(listUrl);
    
    console.log("✅ Available models:");
    result.data.models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
      console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

listModels();