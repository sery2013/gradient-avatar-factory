import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, style, checkId } = req.body;
    
    // === ВСТАВЬТЕ ВАШ КЛЮЧ МЕЖДУ КАВЫЧКАМИ ===
    const apiKey = "f5174bf5-a782-4460-a04e-586b1d048fc3"; 

    // ШАГ 2: ПРОВЕРКА СТАТУСА
    if (checkId) {
      const checkRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await checkRes.json();
      
      // Логируем ответ в консоль Vercel для отладки
      console.log('Polling Status:', data.generations_by_pk?.status);

      return res.status(200).json({ 
        status: data.generations_by_pk?.status || 'PENDING', 
        imageUrl: data.generations_by_pk?.generated_images?.[0]?.url || null 
      });
    }

    // ШАГ 1: СОЗДАНИЕ (Используем самую стабильную модель v1.5)
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${style} style, high quality`,
        // Это ID модели Leonardo Diffusion (v1.5) — самая совместимая модель
        modelId: "6bef9f1b-29cb-40c7-b75d-327233fb5f55", 
        width: 512,
        height: 512,
        num_images: 1,
        promptMagic: true // Улучшает понимание промпта на старых моделях
      })
    });

    const data = await response.json();
    
    if (data.sdGenerationJob) {
      return res.status(200).json({ 
        success: true, 
        generationId: data.sdGenerationJob.generationId 
      });
    } else {
      // Если снова ошибка, мы увидим её текст прямо на сайте
      const errorDetail = data.error || JSON.stringify(data);
      return res.status(400).json({ 
        success: false, 
        error: `Leonardo Error: ${errorDetail}`
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
