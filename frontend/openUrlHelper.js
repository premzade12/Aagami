// Helper to open URLs in new tab with user gesture
export const openInNewTab = (url) => {
  // Create invisible button and trigger click
  const button = document.createElement('button');
  button.style.display = 'none';
  button.onclick = () => window.open(url, '_blank');
  
  document.body.appendChild(button);
  button.click();
  document.body.removeChild(button);
};