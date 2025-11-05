import { handleAssistantResponse } from './handleCommands.js';

// Function to send command to assistant
export const sendCommandToAssistant = async (command) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ command })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Handle the assistant response
      handleAssistantResponse(data);
      return data;
    } else {
      console.error('Error:', data.response);
      return { response: data.response || 'Error occurred' };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { response: 'Network error occurred' };
  }
};
