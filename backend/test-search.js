// Test search query extraction
const testSearchExtraction = (command) => {
  const lower = command.toLowerCase();
  
  if (lower.includes('search')) {
    let searchTerm = command.replace(/search|google|on google|for/gi, '').trim();
    if (!searchTerm) searchTerm = "search query";
    console.log(`Command: "${command}" → Search: "${searchTerm}"`);
  }
};

// Test cases
testSearchExtraction("Jarvis search cars on Google");
testSearchExtraction("search for pizza recipes");
testSearchExtraction("Google search JavaScript tutorials");
testSearchExtraction("search cars");
testSearchExtraction("search");