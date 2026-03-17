export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { prompt, imageUrl, mode, style } = req.body;
        const apiKey = process.env.LEONARDO_API_KEY;

        // 1. Обработка текстовой генерации (быстро)
        if (mode === 'text2img' || !imageUrl) {
            const seed = Math.floor(Math.random() * 1000000);
            const cleanPrompt = encodeURIComponent(`${prompt}, ${style} mascot, high quality, square avatar`);
            const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=512&height=512&seed=${seed}&nologo=true`;
            
            return res.status(200).json({ success: true, imageUrl: url });
        }

        // 2. Обработка Image-to-Image (Leonardo)
        if (mode === 'img2img' && apiKey) {
            const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `${prompt}, ${style} style mascot`,
                    modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3", // Vision XL
                    width: 512,
                    height: 512,
                    num_images: 1
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Leonardo API Error');
            
            const genId = data.sdGenerationJob.generationId;

            // Polling (ожидание результата)
            for (let i = 0; i < 15; i++) {
                await new Promise(r => setTimeout(r, 3000));
                const check = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                const checkData = await check.json();
                if (checkData.generations_by_pk.status === 'COMPLETE') {
                    return res.status(200).json({ 
                        success: true, 
                        imageUrl: checkData.generations_by_pk.generated_images[0].url 
                    });
                }
            }
            throw new Error('Generation timed out');
        }

        return res.status(400).json({ error: 'Missing API Key for Photo mode' });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
