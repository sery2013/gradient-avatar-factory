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
    const { mode, prompt, style, imageBase64 } = await req.json();
    
    // Получаем ключ из Vercel Environment Variables
    const apiKey = process.env.LEONARDO_API_KEY;
    
    if (!apiKey) {
      console.error('❌ LEONARDO_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured on server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎨 Leonardo API Request - Mode:', mode);

    // Формируем полный промпт
    const fullPrompt = style 
      ? `${prompt}, ${style}, high quality, detailed, digital art`
      : `${prompt}, high quality, detailed, digital art`;

    // Подготовка тела запроса
    const requestBody = {
      prompt: fullPrompt,
      negative_prompt: 'ugly, deformed, noisy, blurry, low quality, distorted, out of focus, bad anatomy',
      modelId: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // Leonardo Phoenix
      width: 512,
      height: 512,
      num_images: 1,
    };

    // Если Image-to-Image mode
    if (mode === 'img2img' && imageBase64) {
      // Сначала загружаем изображение
      const uploadResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extension: 'png',
          name: 'input-image',
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to Leonardo');
      }

      const uploadData = await uploadResponse.json();
      const uploadId = uploadData.id;
      const signedUrl = uploadData.signedUrl;

      // Загружаем изображение на S3
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: imageBuffer,
      });

      // Подтверждаем загрузку
      await fetch(`https://cloud.leonardo.ai/api/rest/v1/uploads/${uploadId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Получаем ID загруженного изображения
      const confirmResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/uploads/${uploadId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const confirmData = await confirmResponse.json();
      const imageId = confirmData.id;

      // Добавляем параметры для img2img
      requestBody.init_image_id = imageId;
      requestBody.init_strength = 0.7; // Сила влияния оригинала (0.5-0.8)
    }

    // Создаём генерацию
    const genResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!genResponse.ok) {
      const errorText = await genResponse.text();
      console.error('Leonardo API Error:', errorText);
      throw new Error(`Leonardo API error: ${genResponse.status}`);
    }

    const genData = await genResponse.json();
    const generationId = genData.sdGenerationJob.generationId;
    console.log('Generation ID:', generationId);

    // Polling status
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      );

      const statusData = await statusResponse.json();
      const status = statusData.generations_by_pk.status;

      console.log('Status:', status, 'Attempt:', attempt);

      if (status === 'COMPLETE') {
        const imageUrl = statusData.generations_by_pk.generated_images[0].url;
        return new Response(
          JSON.stringify({ 
            success: true, 
            imageUrl: imageUrl,
            mode: mode 
          }),
          {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
          }
        );
      } else if (status === 'FAILED') {
        throw new Error('Generation failed on Leonardo servers');
      }
    }

    throw new Error('Generation timeout');

  } catch (error) {
    console.error('API Error:', error);
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
