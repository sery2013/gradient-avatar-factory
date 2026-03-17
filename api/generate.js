const fetch = require('node-fetch'); // Используем стандартный require

module.exports = async (req, res) => {
  // Настройка заголовков для обхода CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { prompt, style, checkId } = req.body;
    
    // ВСТАВЬ ТВОЙ КЛЮЧ СЮДА
    const apiKey = "f5174bf5-a782-4460-a04e-586b1d048fc3"; 

    if (checkId) {
      const check = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await check.json();
      return res.status(200).json({ 
        status: data.generations_by_pk?.status || 'PENDING', 
        imageUrl: data.generations_by_pk?.generated_images?.[0]?.url 
      });
    }

    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${style} style`,
        modelId: "b24e0221-817d-459d-a0db-75394336d3c0",
        width: 512, height: 512, num_images: 1
      })
    });

    const data = await response.json();
    
    if (data.sdGenerationJob) {
      res.status(200).json({ success: true, generationId: data.sdGenerationJob.generationId });
    } else {
      res.status(400).json({ success: false, error: data.error || 'Leonardo Error' });
    }

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
