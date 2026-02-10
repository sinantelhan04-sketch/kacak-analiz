import { GoogleGenAI } from "@google/genai";
import { RiskScore, EngineStats } from "../types";

// Safe access to API key for Vite environment
const API_KEY = process.env.API_KEY;

export const generateComprehensiveReport = async (
  stats: EngineStats,
  riskData: RiskScore[]
): Promise<string> => {
  if (!API_KEY) {
    return "API Anahtarı bulunamadı. Lütfen Gemini özelliklerini kullanmak için ortamı yapılandırın.";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // 1. Calculate Category Stats
  const tamperingCount = riskData.filter(r => r.isTamperingSuspect).length;
  const rule120Count = riskData.filter(r => r.is120RuleSuspect).length;
  const inconsistentCount = riskData.filter(r => r.inconsistentData.hasWinterDrop || r.inconsistentData.isSemesterSuspect).length;
  const geoRiskCount = riskData.filter(r => r.breakdown.geoRisk > 0).length;

  // 2. Get Top 5 Risky Subscribers details for context
  const topRisks = riskData.sort((a,b) => b.totalScore - a.totalScore).slice(0, 5);
  const topRiskDetails = topRisks.map(r => 
    `- Tesisat: ${r.tesisatNo}, Puan: ${r.totalScore}, Risk: ${r.riskLevel}, Neden: ${r.reason}`
  ).join('\n');

  const prompt = `
    Bir Doğalgaz Dağıtım Şirketi için Kıdemli Dolandırıcılık Analistisiniz (Fraud Analyst).
    Aşağıdaki veri seti, kaçak tespit sistemimiz tarafından analiz edilmiştir. 
    Lütfen tüm kategorileri değerlendiren kapsamlı bir yönetici raporu yazın.

    **GENEL İSTATİSTİKLER:**
    - Toplam Taranan Abone: ${stats.totalScanned}
    - Kritik Seviye (Seviye 1): ${stats.level1Count}
    - Yüksek Seviye (Seviye 2): ${stats.level2Count}

    **KATEGORİ DETAYLARI:**
    1. Müdahale/Bypass Şüphesi (Yaz/Kış Oranı Anormalliği): ${tamperingCount} abone
    2. 120 sm³ Kuralı İhlali (Sürekli Düşük Tüketim): ${rule120Count} abone
    3. Tutarsız Tüketim (Ani Düşüş/ZigZag): ${inconsistentCount} abone
    4. Coğrafi/Bölgesel Risk (Sıcak Bölgeler): ${geoRiskCount} abone

    **EN YÜKSEK RİSKLİ 5 ÖRNEK:**
    ${topRiskDetails}

    **RAPOR FORMATI:**
    Lütfen yanıtı aşağıdaki başlıklar altında Markdown formatında verin:
    1. **Yönetici Özeti:** Durumun ciddiyeti ve genel risk profili.
    2. **Kategori Analizi:** Hangi kaçak türünün (Bypass mı, Düşük tüketim mi?) daha baskın olduğu ve bunun ne anlama geldiği.
    3. **Saha Ekibi İçin Strateji:** Ekipler öncelikle hangi gruba (Müdahale şüphesi mi, 120 kuralı mı?) odaklanmalı?
    4. **Sonuç:** Kısa bir kapanış cümlesi.

    Ton: Profesyonel, analitik ve eyleme geçirici (urgent). Yanıt TÜRKÇE olmalı.
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