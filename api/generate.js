// api/generate.js
export const config = {
  runtime: 'edge',
  bodyParser: {
    sizeLimit: '10mb',
  },
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt, imageUrl, mode, style } = await req.json();
    
    // Получаем ключ из Vercel Environment Variables
    const apiKey = process.env.LEONARDO_API_KEY;

    if (mode === 'text2img') {
      // Text-to-Image через Pollinations (бесплатно)
      const seed = Math.floor(Math.random() * 10000);
      const fullPrompt = encodeURIComponent(prompt + ', ' + style + ', high quality, detailed');
      const genUrl = `https://image.pollinations.ai/prompt/${fullPrompt}?width=512&height=512&seed=${seed}&nologo=true`;
      
      return new Response(JSON.stringify({ 
        success: true, 
        imageUrl: genUrl,
        mode: 'text2img'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (mode === 'img2img' && apiKey) {
      // Image-to-Image через Leonardo.ai
      const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt + ', ' + style + ', high quality, detailed',
          negative_prompt: 'ugly, deformed, noisy, blurry, low quality',
          modelId: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3',
          width: 512,
          height: 512,
          num_images: 1,
          init_strength: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Leonardo API error: ' + response.status);
      }

      const data = await response.json();
      const generationId = data.sdGenerationJob.generationId;

      // Polling status
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        
        const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        const statusData = await statusRes.json();
        const status = statusData.generations_by_pk.status;

        if (status === 'COMPLETE') {
          const imgUrl = statusData.generations_by_pk.generated_images[0].url;
          return new Response(JSON.stringify({ 
            success: true, 
            imageUrl: imgUrl,
            mode: 'img2img'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else if (status === 'FAILED') {
          throw new Error('Generation failed');
        }
      }

      throw new Error('Timeout');

    } else {
      return new Response(JSON.stringify({ 
        error: 'No API key or invalid mode' 
      }), { status: 400 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
