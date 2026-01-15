
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, // Tăng thời gian chờ cho các phân tích dữ liệu lớn
};

export default async function handler(req: any, res: any) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemInstruction } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Sử dụng GEMINI_API_KEY từ biến môi trường Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction || "Bạn là một chuyên gia phân tích dữ liệu giáo dục chuyên sâu.",
        temperature: 0.7,
      },
    });

    // Trả về định dạng { text: string } theo yêu cầu
    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ 
      error: 'Lỗi máy chủ AI', 
      details: error.message 
    });
  }
}
