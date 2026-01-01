import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testGroqAPI() {
  console.log('🔍 Testing Groq API directly...');
  
  const apiUrl = process.env.GROQ_API_URL;
  const apiKey = process.env.GROQ_API_KEY;
  
  console.log('API URL:', apiUrl);
  console.log('API Key exists:', !!apiKey);
  console.log('API Key preview:', apiKey?.substring(0, 10) + '...');
  
  if (!apiUrl || !apiKey) {
    console.error('❌ Missing API URL or Key');
    return;
  }
  
  const testPayload = {
    "model": "llama-3.1-8b-instant",
    "messages": [
      {
        "role": "user",
        "content": "Hello, just testing. Respond with: {\"type\": \"general\", \"response\": \"Test successful\"}"
      }
    ],
    "temperature": 0.1,
    "max_tokens": 200,
    "top_p": 0.8
  };
  
  try {
    console.log('📤 Sending request...');
    const startTime = Date.now();
    
    const result = await axios.post(apiUrl, testPayload, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    console.log(`⏱️ Response time: ${endTime - startTime}ms`);
    console.log('✅ API Response Status:', result.status);
    console.log('✅ API Response Data:', JSON.stringify(result.data, null, 2));
    
    if (result.data?.choices?.[0]?.message?.content) {
      const responseText = result.data.choices[0].message.content;
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

testGroqAPI();