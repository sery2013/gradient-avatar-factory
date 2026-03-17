// api/generate.js
export const config = { runtime: 'edge' };
export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { prompt, imageBase64, style } = await req.json();
  const apiKey = process.env.LEONARDO_API_KEY;
  // ... логика запроса к Leonardo ...
}
