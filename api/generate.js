// api/generate.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Разрешаем CORS
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, style, width = 512, height = 512 } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.LEONARDO_API_KEY || process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      console.error('❌ API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎨 Generating image via serverless API...');
    console.log('Prompt:', prompt);
    console.log('Style:', style);

    // Используем Pollinations AI (бесплатно, без ключа)
    const seed = Math.floor(Math.random() * 10000);
    const fullPrompt = encodeURIComponent(`${prompt}, ${style || 'digital art'}, high quality, detailed`);
    const imageUrl = `https://image.pollinations.ai/prompt/${fullPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    // Скачиваем изображение
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image');
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    console.log('✅ Image generated successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        image: `data:${contentType};base64,${base64Image}`,
        prompt: prompt,
        style: style,
        seed: seed
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Generation failed' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
