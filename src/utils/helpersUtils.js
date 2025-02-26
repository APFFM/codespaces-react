/**
 * Helper utilities for the Teacher AI application
 */

// Debounce function to limit how often a function can be called
export const debounce = (func, delay) => {
  let timeoutId;
  return function(...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
};

// Format date for message timestamps
export const formatTimestamp = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const messageDate = new Date(date);
  
  // If today, show only time
  if (now.toDateString() === messageDate.toDateString()) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If this year, show month and day
  if (now.getFullYear() === messageDate.getFullYear()) {
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // If different year, show full date
  return messageDate.toLocaleDateString();
};

// Save data to localStorage with expiration
export const saveToLocalStorageWithExpiry = (key, value, ttl) => {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

// Get data from localStorage and check if it's expired
export const getFromLocalStorageWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  
  const item = JSON.parse(itemStr);
  const now = new Date();
  
  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  
  return item.value;
};

// Truncate text to a maximum length
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Extract domain from URL
export const extractDomain = (url) => {
  try {
    const domain = new URL(url);
    return domain.hostname;
  } catch (error) {
    return url;
  }
};

// Generate a unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Check if the browser supports speech synthesis
export const supportsSpeechSynthesis = () => {
  return 'speechSynthesis' in window;
};

// Check if the browser supports speech recognition
export const supportsSpeechRecognition = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// Encode HTML entities to prevent XSS
export const encodeHTML = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Parse markdown to HTML (simplified version)
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Replace code blocks
  text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Replace inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Replace bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Replace headers
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Replace links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Replace line breaks
  text = text.replace(/\n/g, '<br>');
  
  return text;
};

// Check if API key is valid (basic check)
export const isValidApiKey = (key, provider) => {
  if (!key || typeof key !== 'string') return false;
  
  // Basic format validation
  if (provider === 'openai') {
    return key.startsWith('sk-') && key.length > 20;
  } else if (provider === 'deepseek') {
    return key.length > 20; // Adjust based on actual DeepSeek API key format
  }
  
  return key.length > 10;
};
