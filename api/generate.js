import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, style, checkId } = req.body;
    const apiKey = process.env.LEONARDO_API_KEY; 

    // ШАГ 2: ПРОВЕРКА СТАТУСА
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

    // ШАГ 1: СОЗДАНИЕ (Используем Leonardo Phoenix)
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${style} style, high quality`,
        // Phoenix — это самая новая и стабильная модель для API
        modelId: "6b77c30e-2049-43a3-baad-d647efc4644a", 
        width: 512,
        height: 512,
        num_images: 1,
        // Phoenix требует эти параметры для работы в режиме V2
        alchemy: true,
        presetStyle: "DYNAMIC"
      })
    });

    const data = await response.json();
    
    if (data.sdGenerationJob) {
      return res.status(200).json({ 
        success: true, 
        generationId: data.sdGenerationJob.generationId 
      });
    } else {
      // Выводим детальную ошибку от Leonardo, чтобы понять, в чем дело
      return res.status(400).json({ 
        success: false, 
        error: data.error || 'API Error: ' + JSON.stringify(data)
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
