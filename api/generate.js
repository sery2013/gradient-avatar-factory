import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Настройка CORS для работы браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, style, checkId, imageUrl, mode } = req.body;
    
    // Используем переменную окружения или вставь ключ строкой для теста
    const apiKey = process.env.LEONARDO_API_KEY; 

    // ШАГ 2: ПРОВЕРКА СТАТУСА ГЕНЕРАЦИИ
    if (checkId) {
      const checkRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await checkRes.json();
      const gen = data.generations_by_pk;
      
      return res.status(200).json({ 
        status: gen?.status || 'PENDING', 
        imageUrl: gen?.generated_images?.[0]?.url || null 
      });
    }

    // ШАГ 1: СОЗДАНИЕ ЗАДАЧИ
    // Используем модель Leonardo Kino XL, которая гарантированно работает через API
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${style} style, high quality, highly detailed`,
        modelId: "aa77f04e-3e3d-429c-8292-692348545892", 
        width: 512,
        height: 512,
        num_images: 1,
        alchemy: true,
        highResolution: true
      })
    });

    const data = await response.json();
    
    if (data.sdGenerationJob) {
      return res.status(200).json({ 
        success: true, 
        generationId: data.sdGenerationJob.generationId 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: data.error || 'Leonardo API Rejected Request' 
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
