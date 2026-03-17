// api/generate.js
export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { prompt, imageUrl, mode, style } = await req.json();
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Ключ API не найден в переменных Vercel' }), { status: 500 });
    }

    // ТЕПЕРЬ ВСЁ ИДЕТ ЧЕРЕЗ LEONARDO
    const isImg2Img = mode === 'img2img' && imageUrl;
    
    const requestBody = {
      prompt: `${prompt}, ${style} style, high quality, detailed`,
      modelId: "b24e0221-817d-459d-a0db-75394336d3c0", // Leonardo Vision XL
      width: 512,
      height: 512,
      num_images: 1
    };

    // Если это img2img, добавляем параметры инициализации
    if (isImg2Img) {
      // Здесь должна быть логика загрузки initImageId, 
      // но для простоты предположим, что мы используем prompt-only или базовый фото-референс
    }

    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const genId = data.sdGenerationJob.generationId;

    // Ожидание (Polling)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const check = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const resData = await check.json();
      if (resData.generations_by_pk?.status === 'COMPLETE') {
        return new Response(JSON.stringify({ 
          success: true, 
          imageUrl: resData.generations_by_pk.generated_images[0].url 
        }), { status: 200 });
      }
    }
    
    throw new Error('Timeout waiting for Leonardo');

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
