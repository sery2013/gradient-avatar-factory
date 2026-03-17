export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { prompt, style, checkId } = await req.json();
    const apiKey = process.env.LEONARDO_API_KEY;

    // ПРОВЕРКА СТАТУСА (Занимает 0.5 сек)
    if (checkId) {
      const res = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      const gen = data.generations_by_pk;
      return new Response(JSON.stringify({ 
        status: gen?.status || 'PENDING', 
        imageUrl: gen?.generated_images?.[0]?.url 
      }), { status: 200, headers });
    }

    // СОЗДАНИЕ (Занимает 1 сек)
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${style} style, high quality`,
        modelId: "b24e0221-817d-459d-a0db-75394336d3c0",
        width: 512, height: 512, num_images: 1
      })
    });

    const data = await response.json();
    if (!data.sdGenerationJob) throw new Error(data.error || 'Leonardo Error');

    return new Response(JSON.stringify({ 
      success: true, 
      generationId: data.sdGenerationJob.generationId 
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
  }
}
