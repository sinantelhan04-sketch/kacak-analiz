import { GoogleGenAI } from "@google/genai";
import { RiskScore } from "../types";

export const generateExecutiveSummary = async (topRisks: RiskScore[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Anahtarı bulunamadı. Lütfen Gemini özelliklerini kullanmak için ortamı yapılandırın.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format the data for the prompt
  const dataSummary = topRisks.slice(0, 5).map(r => 
    `- ID: ${r.tesisatNo}, Puan: ${r.totalScore}, Risk: ${r.riskLevel}, Nedenler: ${r.reason}`
  ).join('\n');

  const prompt = `
    Bir Doğalgaz Dağıtım Şirketi için Kıdemli Dolandırıcılık Analistisiniz.
    Algoritmik motorumuz tarafından tespit edilen aşağıdaki en yüksek riskli 5 aboneyi analiz edin.
    
    Veri:
    ${dataSummary}
    
    Saha inceleme ekibine tavsiyede bulunan kısa bir yönetici özeti (maksimum 200 kelime) yazın.
    Gözlemlenen kalıplara (örn. düz çizgi, mevsimsel terslik) odaklanın ve öncelikli eylemler önerin.
    Profesyonel, acil bir ton kullanın ve yanıtı TÜRKÇE olarak verin.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Yanıt oluşturulamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Rapor oluşturulamadı. Lütfen API yapılandırmasını kontrol edin.";
  }
};