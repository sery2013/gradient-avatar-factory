import { generateNFTId } from './utils.js';

const state = {
    currentTab: 'create',
    selectedStyle: 'cyberpunk',
    uploadedImage: null
};

// Элементы
const btnGenerate = document.getElementById('generateBtn');
const promptInput = document.getElementById('avatarPrompt');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const resultContent = document.getElementById('resultContent');
const resultImg = document.getElementById('generatedAvatar');

// Переключение табов
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.currentTab = btn.dataset.tab;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    });
});

// Выбор стиля
document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.selectedStyle = btn.dataset.style;
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Загрузка фото (превью)
document.getElementById('uploadZone').onclick = () => document.getElementById('imageInput').click();
document.getElementById('imageInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        state.uploadedImage = ev.target.result;
        const prev = document.getElementById('previewImage');
        prev.src = ev.target.result;
        prev.hidden = false;
        document.querySelector('.upload-placeholder').hidden = true;
    };
    reader.readAsDataURL(e.target.files[0]);
};

// Опрос сервера (ждем картинку)
async function pollStatus(generationId) {
    let attempts = 0;
    const maxAttempts = 30;

    const check = async () => {
        attempts++;
        btnGenerate.textContent = `Processing... (${attempts * 3}s)`;

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkId: generationId })
            });

            const data = await res.json();

            if (data.status === 'COMPLETE' && data.imageUrl) {
                resultImg.src = data.imageUrl;
                document.getElementById('nftId').textContent = generateNFTId();
                resultPlaceholder.hidden = true;
                resultContent.hidden = false;
                resetButton();
            } else if (data.status === 'FAILED') {
                alert('Generation failed');
                resetButton();
            } else if (attempts >= maxAttempts) {
                alert('Timeout. Image might still be generating, check later.');
                resetButton();
            } else {
                setTimeout(check, 3000);
            }
        } catch (e) {
            console.error(e);
            setTimeout(check, 3000);
        }
    };
    check();
}

function resetButton() {
    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Avatar';
}

// Генерация
async function generate() {
    const prompt = promptInput.value.trim();
    if (!prompt) return alert('Please enter a description');

    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Starting...';

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                style: state.selectedStyle,
                mode: state.currentTab === 'photo' ? 'img2img' : 'text2img',
                imageUrl: state.uploadedImage
            })
        });

        const data = await res.json();
        if (data.success && data.generationId) {
            pollStatus(data.generationId);
        } else {
            alert('Error: ' + (data.error || 'Check API key'));
            resetButton();
        }
    } catch (e) {
        alert('Server connection failed');
        resetButton();
    }
}

btnGenerate.onclick = generate;

// --- СКАЧИВАНИЕ ЧЕРЕЗ СЕРВЕРНЫЙ ПРОКСИ (ИСПРАВЛЕНО) ---
document.getElementById('downloadBtn').onclick = () => {
    const imageUrl = resultImg.src;
    
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl === window.location.href) {
        return alert('No image to download yet');
    }

    // Вместо fetch напрямую, используем наш API как посредника, чтобы обойти CORS
    // Это заставит браузер именно СКАЧАТЬ файл
    const downloadUrl = `/api/generate?proxyUrl=${encodeURIComponent(imageUrl)}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `avatar-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
