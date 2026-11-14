import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, systemInstruction, model: modelName = 'gemini-2.0-flash', config } = req.body || {};

    const apiKey = req.body?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      console.error('GEMINI_API_KEY is missing.');
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set it in Vercel Environment Variables.',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction || undefined,
      generationConfig: config || undefined,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Model returned an empty response.');
    }

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const isQuotaError = error.message?.includes('429') || error.status === 429;
    const errorMessage = isQuotaError
      ? 'AI Rate Limit reached. Please wait a moment before trying again.'
      : error.message || 'Internal Server Error';

    return res.status(isQuotaError ? 429 : 500).json({
      error: errorMessage,
    });
  }
}
