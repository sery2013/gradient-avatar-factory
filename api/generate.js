export default async function handler(req) {
  // Добавляем заголовки CORS, чтобы браузер не блокировал запросы
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers });
  }

  try {
    const { prompt, imageUrl, mode, style, checkId } = await req.json();
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key missing in Vercel' }), { status: 500, headers });
    }

    // ЛОГИКА ПРОВЕРКИ СТАТУСА (STEP 2)
    if (checkId) {
      const check = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const resData = await check.json();
      const gen = resData.generations_by_pk;
      
      return new Response(JSON.stringify({ 
        status: gen?.status || 'PENDING', 
        imageUrl: gen?.generated_images?.[0]?.url 
      }), { status: 200, headers });
    }

    // ЛОГИКА СОЗДАНИЯ (STEP 1)
    const requestBody = {
      prompt: `${prompt}, ${style} style, high quality`,
      modelId: "b24e0221-817d-459d-a0db-75394336d3c0", // Leonardo Vision XL
      width: 512,
      height: 512,
      num_images: 1
    };

    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!data.sdGenerationJob) {
       // Если Leonardo вернул ошибку, пробрасываем её в лог
       return new Response(JSON.stringify({ success: false, error: data.error || 'Leonardo API Rejected Request' }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      generationId: data.sdGenerationJob.generationId 
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
  }
}
