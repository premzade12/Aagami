import groqResponse from './groq.js';
import dotenv from 'dotenv';

dotenv.config();

async function testGroqWithCommand() {
  console.log('🔍 Testing Groq with real command...');
  
  try {
    const result = await groqResponse('कैमरा ऑन करो', 'Ravi', 'Prem');
    console.log('✅ Groq Response:', result);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(result);
      console.log('✅ Parsed JSON:', parsed);
      console.log('Type:', parsed.type);
      console.log('Response:', parsed.response);
    } catch (e) {
      console.log('⚠️ JSON Parse Failed:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Groq Test Failed:', error.message);
  }
}

testGroqWithCommand();