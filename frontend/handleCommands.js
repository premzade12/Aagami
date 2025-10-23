// Handle different command types from the assistant
export const handleAssistantResponse = (response) => {
  const { type, action, url, response: message } = response;

  // Display the response message
  displayMessage(message);

  // Handle specific actions
  if (action === "open_url" && url) {
    openUrl(url);
  }

  // Handle specific command types
  switch (type) {
    case "play_youtube":
      if (url) {
        openUrl(url);
        speakText("Opening YouTube to play your requested song");
      }
      break;
    
    case "open_instagram":
      openUrl("https://www.instagram.com");
      speakText("Opening Instagram");
      break;
    
    case "open_whatsapp":
      openUrl("https://web.whatsapp.com");
      speakText("Opening WhatsApp Web");
      break;
    
    default:
      // Handle other command types as before
      break;
  }
};

// Function to open URLs
const openUrl = (url) => {
  try {
    // Method 1: Direct window.open with user gesture
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
      // Method 2: Create anchor element if popup blocked
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      
      document.body.appendChild(link);
      link.dispatchEvent(clickEvent);
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
    // Method 3: Fallback - navigate current tab
    window.location.href = url;
  }
};

// Function to display messages (implement based on your UI)
const displayMessage = (message) => {
  // Add your message display logic here
  console.log("Assistant:", message);
};

// Function to speak text (implement based on your TTS setup)
const speakText = (text) => {
  // Add your text-to-speech logic here
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  }
};