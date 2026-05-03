import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize the Next Gen SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 1. Method Validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model = 'gemini-1.5-flash' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  try {
    // Call the correct method for @google/genai
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });

    // The response structure in this SDK is direct
    // response.candidates[0].content.parts[0].text
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate content', 
      details: error.message 
    });
  }
}
