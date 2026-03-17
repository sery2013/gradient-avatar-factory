// scripts/utils.js

// Generate unique NFT ID (#0001 format)
export const generateNFTId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `#${num.toString().padStart(4, '0')}`;
};

// Format hash for display
export const formatHash = (hash, length = 10) => {
  if (!hash) return 'N/A';
  return hash.slice(0, length) + '...';
};

// Copy to clipboard with feedback
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
