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

  // 2. Authentication Validation
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const { apiKey } = require('../firebase-applet-config.json');
    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Firebase token' });
    }
  } catch (authError) {
    console.error('Auth verification failed:', authError);
    return res.status(500).json({ error: 'Failed to verify authentication' });
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
