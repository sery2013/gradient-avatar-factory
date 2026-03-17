import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- НОВЫЙ БЛОК ДЛЯ СКАЧИВАНИЯ ---
  if (req.method === 'GET' && req.query.proxyUrl) {
    try {
      const response = await fetch(req.query.proxyUrl);
      const buffer = await response.buffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="avatar.png"');
      return res.send(buffer);
    } catch (e) {
      return res.status(500).send('Proxy error');
    }
  }
  // ---------------------------------

  try {
    const { prompt, style, checkId } = req.body || {};
    const apiKey = "f5174bf5-a782-4460-a04e-586b1d048fc3"; 

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

    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `${prompt}, ${style} style, 2d vector character, centered`,
        width: 512, height: 512, num_images: 1,
        modelId: "6bef9f1b-29cb-40c7-b75d-327233fb5f55" 
      })
    });

    const data = await response.json();
    if (data.sdGenerationJob) {
      return res.status(200).json({ success: true, generationId: data.sdGenerationJob.generationId });
    } else {
      return res.status(400).json({ success: false, error: JSON.stringify(data) });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
