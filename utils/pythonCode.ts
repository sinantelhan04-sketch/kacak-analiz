export const PYTHON_LOGIC_CODE = `import pandas as pd
import numpy as np

def run_gas_fraud_analytics(file_a_path, file_b_path):
    # --- 1. REFERANS LİSTESİNİ AYRIŞTIRMA ---
    # Dosya A'dan sabıkalı Muhatapları ve Tesisatları ayrı ayrı okuyoruz.
    # Muhatap = Kişi (Taşınabilir Risk)
    # Tesisat = Mekan (Sabit Uyarı)
    ref_df = pd.read_excel(file_a_path, sheet_name='sheet')
    
    fraud_muhatap_ids = set(ref_df['Muhatap'].astype(str))
    fraud_tesisat_ids = set(ref_df['Tesisat No'].astype(str))
    
    # ... Veri Yükleme ve Birleştirme Adımları (Aynı) ...
    # ... Özellik Mühendisliği (120 Kuralı, Düz Çizgi vb.) ...

    # --- 4. GELİŞMİŞ PUANLAMA MOTORU ---
    
    def calculate_score(row):
        score = 0
        reasons = []
        
        # Kriter 1A: RİSKLİ ABONE (Kritik)
        # Eğer kişinin kendisi (Muhatap) kara listedeyse, bu doğrudan kaçak riskidir.
        if str(row['Muhatap']) in fraud_muhatap_ids:
            score += 50
            reasons.append("RİSKLİ ABONE (Kara Liste)")

        # Kriter 1B: TESİSAT UYARISI (Bilgilendirme)
        # Eğer kişi temiz ama Tesisat kara listedeyse, bu "Geçmiş Müdahale" uyarısıdır.
        # Tek başına suçlu ilan etmez ama puanı artırır.
        if str(row['Tesisat No']) in fraud_tesisat_ids:
            score += 20
            reasons.append("UYARI: Tesisatta Geçmiş Müdahale")
            
        # Kriter 2: Tüketim Anomalisi (30 p)
        anomaly_score = 0
        if row['rule_120_count'] == 3:
            anomaly_score += 20
            reasons.append("Kış < 120")
        if row['winter_avg'] <= row['summer_avg']:
            anomaly_score += 10
            reasons.append("Ters Mevsimsellik")
        score += min(30, anomaly_score)
        
        # Kriter 3: Trend Tutarsızlığı (20 p)
        if row['is_flatline']:
            score += 25
            reasons.append("Düz Çizgi")
        elif row['winter_avg'] > 0 and (row['sm3_dec'] / (row['winter_avg'] + 1)) < 0.5:
             score += 20
             reasons.append("Ani Düşüş")
             
        # Kriter 4: Coğrafi Risk (10 p)
        if "Karanfil Sk" in str(row['Adres']):
            score += 10
            reasons.append("Bölgesel Risk")
            
        return pd.Series([score, ", ".join(reasons)])

    active_df[['Score', 'Reasons']] = active_df.apply(calculate_score, axis=1)
    
    # ... Sıralama ve Raporlama ...
    return top_50
`;