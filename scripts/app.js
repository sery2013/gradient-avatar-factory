// scripts/app.js

// === State ===
const state = {
  currentTab: 'create',
  selectedStyle: 'cyberpunk',
  uploadedImage: null,
  generatedAvatar: null,
  walletConnected: false,
  network: 'base-sepolia'
};

// === DOM Elements ===
const elements = {
  tabs: document.querySelectorAll('.nav-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  uploadZone: document.getElementById('uploadZone'),
  imageInput: document.getElementById('imageInput'),
  previewImage: document.getElementById('previewImage'),
  styleBtns: document.querySelectorAll('.style-btn'),
  generateBtn: document.getElementById('generateBtn'),
  resultPlaceholder: document.getElementById('resultPlaceholder'),
  resultContent: document.getElementById('resultContent'),
  generatedAvatar: document.getElementById('generatedAvatar'),
  nftId: document.getElementById('nftId'),
  statusMessage: document.getElementById('statusMessage'),
  connectWallet: document.getElementById('connectWallet'),
  downloadBtn: document.getElementById('downloadBtn'),
  copyProofBtn: document.getElementById('copyProofBtn'),
  mintBtn: document.getElementById('mintBtn'),
  proofHash: document.getElementById('proofHash'),
  proofLink: document.getElementById('proofLink')
};

// === Tab Navigation ===
elements.tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    // Update buttons
    elements.tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update panels
    elements.tabPanels.forEach(panel => {
      panel.classList.remove('active');
      if (panel.id === `tab-${tab}`) {
        panel.classList.add('active');
      }
    });
    
    state.currentTab = tab;
  });
});

// === Image Upload ===
elements.uploadZone.addEventListener('click', () => {
  elements.imageInput.click();
});

elements.uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.uploadZone.classList.add('dragover');
});

elements.uploadZone.addEventListener('dragleave', () => {
  elements.uploadZone.classList.remove('dragover');
});

elements.uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  handleImageFile(file);
});

elements.imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  handleImageFile(file);
});

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showStatus('Please select a valid image file', 'error');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    showStatus('Image must be under 10MB', 'error');
    return;
  }
  
  state.uploadedImage = file;
  
  // Preview
  const reader = new FileReader();
  reader.onload = (e) => {
    elements.previewImage.src = e.target.result;
    elements.uploadZone.classList.add('has-image');
  };
  reader.readAsDataURL(file);
  
  showStatus('Image loaded! Ready to generate ✨', 'success');
}

// === Style Selection ===
elements.styleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    elements.styleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedStyle = btn.dataset.style;
  });
});

// === Generate Avatar ===
elements.generateBtn.addEventListener('click', async () => {
  if (!state.uploadedImage) {
    showStatus('Please upload an image first', 'error');
    return;
  }
  
  if (!state.walletConnected) {
    showStatus('Please connect wallet for x402 payment', 'warning');
    return;
  }
  
  // UI loading state
  elements.generateBtn.disabled = true;
  elements.generateBtn.querySelector('.btn-spinner').hidden = false;
  elements.generateBtn.querySelector('.btn-text').textContent = 'Generating...';
  
  try {
    // Simulate API call to OpenGradient
    const result = await mockGenerateAvatar({
      image: state.uploadedImage,
      style: state.selectedStyle,
      prompt: document.getElementById('promptInput').value,
      network: state.network
    });
    
    // Display result
    state.generatedAvatar = result;
    elements.generatedAvatar.src = result.imageUrl;
    elements.nftId.textContent = result.nftId;
    elements.proofHash.textContent = result.proofHash.slice(0, 10) + '...';
    elements.proofLink.href = `https://explorer.opengradient.ai/tx/${result.proofHash}`;
    
    elements.resultPlaceholder.hidden = true;
    elements.resultContent.hidden = false;
    
    showStatus('Avatar generated successfully! 🎉', 'success');
    
  } catch (error) {
    console.error('Generation error:', error);
    showStatus('Failed to generate avatar. Please try again.', 'error');
  } finally {
    // Reset button
    elements.generateBtn.disabled = false;
    elements.generateBtn.querySelector('.btn-spinner').hidden = true;
    elements.generateBtn.querySelector('.btn-text').textContent = '✨ Generate Avatar';
  }
});

// === Download ===
elements.downloadBtn.addEventListener('click', () => {
  if (!state.generatedAvatar) return;
  
  const link = document.createElement('a');
  link.download = `gradient-avatar-${state.generatedAvatar.nftId}.png`;
  link.href = state.generatedAvatar.imageUrl;
  link.click();
  
  showStatus('Download started! 📥', 'success');
});

// === Copy Proof ===
elements.copyProofBtn.addEventListener('click', async () => {
  if (!state.generatedAvatar) return;
  
  try {
    await navigator.clipboard.writeText(state.generatedAvatar.proofHash);
    showStatus('Proof hash copied! 🔗', 'success');
  } catch {
    showStatus('Failed to copy. Select and copy manually.', 'error');
  }
});

// === Wallet Connect (mock) ===
elements.connectWallet.addEventListener('click', async () => {
  // In real app: connect via Web3Modal/Wagmi
  state.walletConnected = true;
  elements.connectWallet.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Connected</span>';
  elements.connectWallet.classList.add('btn-primary');
  elements.connectWallet.classList.remove('btn-outline');
  
  showStatus('Wallet connected! Ready for x402 payments 🔗', 'success');
});

// === Status Messages ===
function showStatus(message, type = 'info') {
  elements.statusMessage.hidden = false;
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message status-${type}`;
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    elements.statusMessage.hidden = true;
  }, 4000);
}

// === Mock API for Development ===
async function mockGenerateAvatar({ style, prompt }) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock NFT ID (#0001 - #9999)
  const nftNum = Math.floor(Math.random() * 9000) + 1000;
  const nftId = `#${nftNum.toString().padStart(4, '0')}`;
  
  // Mock proof hash
  const proofHash = '0x' + Array(64).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Placeholder image (replace with real API response)
  const colors = {
    cyberpunk: 'ff00ff',
    anime: 'ff6b9d',
    pixel: '00ff9d',
    minimal: 'a0a0a0'
  };
  const imageUrl = `https://placehold.co/512x512/${colors[style]}/ffffff?text=Avatar+${nftId}`;
  
  return {
    imageUrl,
    nftId,
    proofHash,
    model: 'IDM-VTON',
    style,
    timestamp: new Date().toISOString()
  };
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 GradientAvatar Factory loaded');
  console.log('🔗 OpenGradient SDK: Ready (mock mode)');
  console.log('🌐 Network:', state.network);
});
