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

// Главная функция генерации
async function generate() {
    const prompt = promptInput.value.trim();
    if (!prompt) return alert('Please enter a description');

    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Generating...';

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
        if (data.success) {
            resultImg.src = data.imageUrl;
            document.getElementById('nftId').textContent = generateNFTId();
            resultPlaceholder.hidden = true;
            resultContent.hidden = false;
        } else {
            alert('Error: ' + data.error);
        }
    } catch (e) {
        alert('Failed to connect to server');
    } finally {
        btnGenerate.disabled = false;
        btnGenerate.textContent = 'Generate Avatar';
    }
}

btnGenerate.onclick = generate;

// Скачивание
document.getElementById('downloadBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = resultImg.src;
    a.download = 'my-avatar.png';
    a.click();
};
