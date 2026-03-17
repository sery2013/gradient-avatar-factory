// api/generate.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt, style, imageBase64, width = 512, height = 512 } = await req.json();

    // Получаем ключ из переменных окружения Vercel
    const apiKey = process.env.LEONARDO_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API key not configured in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🎨 Starting generation via Leonardo.ai...');
    console.log('Style:', style);
    console.log('Prompt:', prompt);

    // Leonardo.ai API endpoint
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: 'ugly, deformed, noisy, blurry, low quality, distorted, out of focus, bad anatomy',
        modelId: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // Leonardo Phoenix
        width: width,
        height: height,
        num_images: 1,
        init_strength: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Leonardo API error:', errorData);
      return new Response(
        JSON.stringify({ error: `Leonardo API error: ${response.status}` }),
        { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    const generationId = data.sdGenerationJob.generationId;

    // Polling for completion
    const imageUrl = await pollGenerationStatus(generationId, apiKey);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: imageUrl,
        generationId: generationId
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Generation failed' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

async function pollGenerationStatus(generationId, apiKey, attempts = 0) {
  if (attempts > 30) {
    throw new Error('Generation timeout');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const data = await response.json();
  const status = data.generations_by_pk.status;

  console.log('Status:', status, 'Attempt:', attempts);

  if (status === 'COMPLETE') {
    return data.generations_by_pk.generated_images[0].url;
  } else if (status === 'FAILED') {
    throw new Error('Generation failed');
  } else {
    return await pollGenerationStatus(generationId, apiKey, attempts + 1);
  }
}
