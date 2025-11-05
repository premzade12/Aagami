import axios from "axios";

const listModels = async () => {
  const apiKey = "AIzaSyDD3V6pASxoN_VOkHxhCHWeVlE6RYczTd8";
  
  try {
    const result = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    console.log("Available models that support generateContent:");
    result.data.models.forEach(model => {
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`✅ ${model.name.replace('models/', '')}`);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

listModels();