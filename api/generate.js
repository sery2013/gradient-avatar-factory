export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { prompt, mode, style, generationId } = await req.json();
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!apiKey) return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });

    // ЭТАП 2: Если фронтенд прислал generationId, проверяем статус
    if (generationId) {
      const check = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const resData = await check.json();
      const status = resData.generations_by_pk?.status;

      if (status === 'COMPLETE') {
        return new Response(JSON.stringify({ 
          status: 'completed', 
          imageUrl: resData.generations_by_pk.generated_images[0].url 
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ status: 'pending' }), { status: 200 });
    }

    // ЭТАП 1: Создание новой задачи
    const requestBody = {
      prompt: `${prompt}, ${style} style, high quality, detailed`,
      modelId: "b24e0221-817d-459d-a0db-75394336d3c0",
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
    if (!data.sdGenerationJob) throw new Error('Leonardo failed to start job');

    return new Response(JSON.stringify({ 
      success: true, 
      generationId: data.sdGenerationJob.generationId 
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
