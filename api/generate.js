import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, style, checkId } = req.body;
    
    // === ВСТАВЬ СВОЙ КЛЮЧ ТУТ ===
    const apiKey = "f5174bf5-a782-4460-a04e-586b1d048fc3"; 

    // ШАГ 2: ПРОВЕРКА СТАТУСА (Остается асинхронной, чтобы не было ошибки 504)
    if (checkId) {
      const checkRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await checkRes.json();
      
      return res.status(200).json({ 
        status: data.generations_by_pk?.status || 'PENDING', 
        imageUrl: data.generations_by_pk?.generated_images?.[0]?.url || null 
      });
    }

    // ШАГ 1: СОЗДАНИЕ (Минималистичный запрос)
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Добавляем стиль прямо в текст промпта, чтобы не зависеть от параметров
        prompt: `${prompt}, ${style} style, high resolution`,
        width: 512,
        height: 512,
        num_images: 1,
        // Мы НЕ указываем modelId вообще. 
        // Leonardo сам использует твою модель по умолчанию, которая точно поддерживается.
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
        error: `Leonardo Error: ${JSON.stringify(data)}`
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
