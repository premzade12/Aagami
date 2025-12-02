// Test the fallback system for self-introduction commands
const testFallback = () => {
  const command = "tell me about you";
  const assistantName = "Assistant";
  const lower = command.toLowerCase();
  
  console.log("Testing command:", command);
  console.log("Lowercase:", lower);
  
  let gemResult;
  
  if (lower.includes('tell me about you') || lower.includes('about you') || lower.includes('who are you') || 
      lower.includes('introduce yourself') || lower.includes('what are you') || lower.includes('your introduction') ||
      lower.includes('तुम कौन हो') || lower.includes('आप कौन हैं') || lower.includes('अपना परिचय') ||
      lower.includes('tum kaun ho') || lower.includes('aap kaun hain') || lower.includes('apna parichay')) {
    const introResponse = `Hello! I'm ${assistantName}, your intelligent virtual assistant created by Prem Zade. I'm here to help you with various tasks like searching Google, playing YouTube videos, opening applications, taking screenshots, managing your camera, and much more. I can understand both English and Hindi, and I'm always ready to assist you. What would you like me to help you with today?`;
    gemResult = { type: 'general', response: introResponse };
  } else {
    gemResult = { type: 'general', response: 'Command not recognized' };
  }
  
  console.log("Result:", gemResult);
};

testFallback();