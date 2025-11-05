import axios from "axios";

const listModels = async () => {
  const apiKey = "AIzaSyCenZyoGjgZgvi_qUgzOr5x5OMbDmuJVeM";
  
  try {
    const result = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    console.log("Available models:");
    result.data.models.forEach(model => {
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`✅ ${model.name}`);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

listModels();