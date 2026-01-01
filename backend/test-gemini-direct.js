import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API directly...');
  
  const apiUrl = process.env.GEMINI_API_URL;
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('API URL:', apiUrl);
  console.log('API Key exists:', !!apiKey);
  console.log('API Key preview:', apiKey?.substring(0, 10) + '...');
  
  if (!apiUrl || !apiKey) {
    console.error('❌ Missing API URL or Key');
    return;
  }
  
  const testPayload = {
    "contents": [{
      "parts": [{
        "text": "Hello, just testing. Respond with: {\"type\": \"general\", \"response\": \"Test successful\"}"
      }]
    }],
    "generationConfig": {
      "temperature": 0.1,
      "topK": 1,
      "topP": 0.8,
      "maxOutputTokens": 200
    }
  };
  
  try {
    console.log('📤 Sending request...');
    const startTime = Date.now();
    
    const result = await axios.post(`${apiUrl}?key=${apiKey}`, testPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    console.log(`⏱️ Response time: ${endTime - startTime}ms`);
    console.log('✅ API Response Status:', result.status);
    console.log('✅ API Response Data:', JSON.stringify(result.data, null, 2));
    
    if (result.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const responseText = result.data.candidates[0].content.parts[0].text;
      console.log('📝 Generated Text:', responseText);
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(responseText.replace(/```json/gi, '').replace(/```/g, '').trim());
        console.log('✅ JSON Parse Success:', parsed);
      } catch (e) {
        console.log('⚠️ JSON Parse Failed:', e.message);
        console.log('Raw text:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('🕐 Request timed out');
    }
  }
}

testGeminiAPI();