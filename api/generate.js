export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { prompt, style, checkId } = await req.json();

    // ВСТАВЬТЕ ВАШ КЛЮЧ СЮДА НАПРЯМУЮ ДЛЯ ТЕСТА
    const apiKey = "f5174bf5-a782-4460-a04e-586b1d048fc3"; 

    if (checkId) {
      const res = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      return new Response(JSON.stringify({ 
        status: data.generations_by_pk?.status || 'PENDING', 
        imageUrl: data.generations_by_pk?.generated_images?.[0]?.url 
      }), { status: 200, headers });
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
    
    // Если здесь ошибка, мы её увидим в консоли сайта
    if (!data.sdGenerationJob) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: data.error || 'Leonardo API Error',
            fullDetails: data // Пробросим весь ответ для отладки
        }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      generationId: data.sdGenerationJob.generationId 
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
  }
}
