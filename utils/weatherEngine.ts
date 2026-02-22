

import { Subscriber, WeatherRiskResult } from '../types';
import { ISTANBUL_DISTRICTS, isPointInPolygon } from './fraudEngine';

// --- TURKEY CITIES & DISTRICTS DATA ---
export const TURKEY_CITIES: Record<string, string[]> = {
  "ADANA": ["SEYHAN", "YÜREĞİR", "ÇUKUROVA", "SARIÇAM", "CEYHAN", "KOZAN", "İMAMOĞLU", "KARATAŞ", "KARAISALI", "POZANTI", "SAİMBEYLİ", "TUFANBEYLİ", "YUMURTALIK", "ALADAĞ", "FEKE"],
  "ADIYAMAN": ["MERKEZ", "KAHTA", "BESNİ", "GÖLBAŞI", "GERGER", "SİNCİK", "ÇELİKHAN", "TUT", "SAMSAT"],
  "AFYONKARAHİSAR": ["MERKEZ", "SANDIKLI", "DİNAR", "BOLVADİN", "SİNANPAŞA", "EMİRDAĞ", "ŞUHUT", "ÇAY", "İHSANİYE", "İSCEHİSAR", "SULTANDAĞI", "ÇOBANLAR", "DAZKIRI", "BAŞMAKÇI", "EVCİLER", "BAYAT", "HOCALAR", "KIZILÖREN"],
  "AĞRI": ["MERKEZ", "PATNOS", "DOĞUBAYAZIT", "DİYADİN", "ELEŞKİRT", "TUTAK", "TAŞLIÇAY", "HAMUR"],
  "AMASYA": ["MERKEZ", "MERZİFON", "SULUOVA", "TAŞOVA", "GÜMÜŞHACIKÖY", "GÖYNÜCEK", "HAMAMÖZÜ"],
  "ANKARA": ["ÇANKAYA", "KEÇİÖREN", "YENİMAHALLE", "MAMAK", "ETİMESGUT", "SİNCAN", "ALTINDAĞ", "PURSAKLAR", "GÖLBAŞI", "POLATLI", "ÇUBUK", "KAHRAMANKAZAN", "BEYPAZARI", "ELMADAĞ", "ŞEREFLİKOÇHİSAR", "AKYURT", "NALLIHAN", "HAYMANA", "KIZILCAHAMAM", "BALA", "KALECİK", "AYAŞ", "GÜDÜL", "ÇAMLIDERE", "EVREN"],
  "ANTALYA": ["KEPEZ", "MURATPAŞA", "ALANYA", "MANAVGAT", "KONYAALTI", "SERİK", "AKSU", "KUMLUCA", "DÖŞEMEALTI", "KAŞ", "KORKUTELİ", "GAZİPAŞA", "FİNİKE", "KEMER", "ELMALI", "DEMRE", "AKSEKİ", "GÜNDOĞMUŞ", "İBRADI"],
  "ARTVİN": ["MERKEZ", "HOPA", "BORÇKA", "YUSUFELİ", "ARHAVİ", "ŞAVŞAT", "ARDANUÇ", "MURGUL", "KEMALPAŞA"],
  "AYDIN": ["EFELER", "NAZİLLİ", "SÖKE", "KUŞADASI", "DİDİM", "İNCİRLİOVA", "ÇİNE", "GERMENCİK", "BOZDOĞAN", "KÖŞK", "KUYUCAK", "SULTANHİSAR", "KARACASU", "YENİPAZAR", "BUHARKENT", "KARPUZLU"],
  "BALIKESİR": ["KARESİ", "ALTIEYLÜL", "EDREMİT", "BANDIRMA", "GÖNEN", "AYVALIK", "BURHANİYE", "BİGADİÇ", "SUSURLUK", "DURSUNBEY", "SINDIRGI", "İVRİNDİ", "ERDEK", "HAVRAN", "KEPSUT", "MANYAS", "SAVAŞTEPE", "BALYA", "GÖMEÇ", "MARMARA"],
  "BİLECİK": ["MERKEZ", "BOZÜYÜK", "OSMANELİ", "SÖĞÜT", "GÖLPAZARI", "PAZARYERİ", "İNHİSAR", "YENİPAZAR"],
  "BİNGÖL": ["MERKEZ", "GENÇ", "SOLHAN", "KARLIOVA", "ADAKLI", "KİĞI", "YEDİSU", "YAYLADERE"],
  "BİTLİS": ["TATVAN", "MERKEZ", "GÜROYMAK", "AHLAT", "HİZAN", "MUTKİ", "ADİLCEVAZ"],
  "BOLU": ["MERKEZ", "GEREDE", "MUDURNU", "GÖYNÜK", "MENGEN", "YENİÇAĞA", "DÖRTDİVAN", "SEBEN", "KIBRISCIK"],
  "BURDUR": ["MERKEZ", "BUCAK", "GÖLHİSAR", "YEŞİLOVA", "ÇAVDIR", "TEFENNİ", "AĞLASUN", "KARAMANLI", "ALTINYAYLA", "ÇELTİKÇİ", "KEMER"],
  "BURSA": ["OSMANGAZİ", "YILDIRIM", "NİLÜFER", "İNEGÖL", "GEMLİK", "MUSTAFAKEMALPAŞA", "MUDANYA", "GÜRSU", "KARACABEY", "ORHANGAZİ", "KESTEL", "YENİŞEHİR", "İZNİK", "ORHANELİ", "KELES", "BÜYÜKORHAN", "HARMANCIK"],
  "ÇANAKKALE": ["MERKEZ", "BİGA", "ÇAN", "GELİBOLU", "AYVACIK", "YENİCE", "EZİNE", "BAYRAMİÇ", "LAPSEKİ", "ECEABAT", "GÖKÇEADA", "BOZCAADA"],
  "ÇANKIRI": ["MERKEZ", "ÇERKEŞ", "ILGAZ", "ORTA", "ŞABANÖZÜ", "KURŞUNLU", "YAPRAKLI", "KIZILIRMAK", "ELDİVAN", "ATKARACALAR", "KORGUN", "BAYRAMÖREN"],
  "ÇORUM": ["MERKEZ", "SUNGURLU", "OSMANCIK", "İSKİLİP", "ALACA", "BAYAT", "MECİTÖZÜ", "KARGI", "ORTAKÖY", "UĞURLUDAĞ", "DODURGA", "OĞUZLAR", "LAÇİN", "BOĞAZKALE"],
  "DENİZLİ": ["PAMUKKALE", "MERKEZEFENDİ", "ÇİVRİL", "ACIPAYAM", "TAVAS", "HONAZ", "SARAYKÖY", "BULDAN", "KALE", "ÇAL", "ÇAMELİ", "SERİNHİSAR", "BOZKURT", "GÜNEY", "ÇARDAK", "BEKİLLİ", "BEYAĞAÇ", "BABADAĞ", "BAKLAN"],
  "DİYARBAKIR": ["BAĞLAR", "KAYAPINAR", "YENİŞEHİR", "SUR", "ERGANİ", "BİSMİL", "SİLVAN", "ÇINAR", "ÇERMİK", "DİCLE", "KULP", "HANİ", "LİCE", "EĞİL", "HAZRO", "KOCAKÖY", "ÇÜNGÜŞ"],
  "EDİRNE": ["MERKEZ", "KEŞAN", "UZUNKÖPRÜ", "İPSALA", "HAVSA", "MERİÇ", "ENEZ", "SÜLOĞLU", "LALAPAŞA"],
  "ELAZIĞ": ["MERKEZ", "KOVANCILAR", "KARAKOÇAN", "PALU", "ARICAK", "BASKİL", "MADEN", "SİVRİCE", "ALACAKAYA", "KEBAN", "AĞIN"],
  "ERZİNCAN": ["MERKEZ", "TERCAN", "ÜZÜMLÜ", "ÇAYIRLI", "İLİÇ", "KEMAH", "KEMALİYE", "OTLUKBELİ", "REFAHİYE"],
  "ERZURUM": ["YAKUTİYE", "PALANDÖKEN", "AZİZİYE", "HORASAN", "OLTU", "PASİNLER", "KARAYAZI", "HINIS", "TEKMAN", "KARAÇOBAN", "AŞKALE", "ŞENKAYA", "ÇAT", "KÖPRÜKÖY", "İSPİR", "TORTUM", "NARMAN", "UZUNDERE", "OLUR", "PAZARYOLU"],
  "ESKİŞEHİR": ["ODUNPAZARI", "TEPEBAŞI", "SİVRİHİSAR", "ÇİFTELER", "SEYİTGAZİ", "ALPU", "MİHALIÇÇIK", "MAHMUDİYE", "BEYLİKOVA", "İNÖNÜ", "GÜNYÜZÜ", "HAN", "SARICAKAYA", "MİHALGAZİ"],
  "GAZİANTEP": ["ŞAHİNBEY", "ŞEHİTKAMİL", "NİZİP", "İSLAHİYE", "NURDAĞI", "ARABAN", "OĞUZELİ", "YAVUZELİ", "KARKAMIŞ"],
  "GİRESUN": ["MERKEZ", "BULANCAK", "ESPİYE", "GÖRELE", "TİREBOLU", "DERELİ", "ŞEBİNKARAHİSAR", "KEŞAP", "YAĞLIDERE", "ALUCRA", "PİRAZİZ", "EYNESİL", "GÜCE", "ÇANAKÇI", "DOĞANKENT", "ÇAMOLUK"],
  "GÜMÜŞHANE": ["MERKEZ", "KELKİT", "ŞİRAN", "KÜRTÜN", "TORUL", "KÖSE"],
  "HAKKARİ": ["YÜKSEKOVA", "MERKEZ", "ŞEMDİNLİ", "ÇUKURCA", "DERECİK"],
  "HATAY": ["ANTAKYA", "İSKENDERUN", "DEFNE", "DÖRTYOL", "SAMANDAĞ", "KIRIKHAN", "REYHANLI", "ARSUZ", "ALTINÖZÜ", "HASSA", "PAYAS", "ERZİN", "YAYLADAĞI", "BELEN", "KUMLU"],
  "ISPARTA": ["MERKEZ", "YALVAÇ", "EĞİRDİR", "ŞARKİKARAAĞAÇ", "GELENDOST", "KEÇİBORLU", "SENİRKENT", "SÜTÇÜLER", "GÖNEN", "ULUBORLU", "ATABEY", "AKSU", "YENİŞARBADEMLİ"],
  "MERSİN": ["TARSUS", "TOROSLAR", "YENİŞEHİR", "AKDENİZ", "MEZİTLİ", "ERDEMLİ", "SİLİFKE", "ANAMUR", "MUT", "BOZYAZI", "GÜLNAR", "AYDINCIK", "ÇAMLIYAYLA"],
  "İSTANBUL": ["ESENYURT", "KÜÇÜKÇEKMECE", "BAĞCILAR", "ÜMRANİYE", "PENDİK", "BAHÇELİEVLER", "SULTANGAZİ", "ÜSKÜDAR", "MALTEPE", "GAZİOSMANPAŞA", "KADIKÖY", "KARTAL", "BAŞAKŞEHİR", "ESENLER", "AVCILAR", "KAĞITHANE", "FATİH", "SANCAKTEPE", "ATAŞEHİR", "EYÜPSULTAN", "BEYLİKDÜZÜ", "SARIYER", "SULTANBEYLİ", "ZEYTİNBURNU", "GÜNGÖREN", "ARNAVUTKÖY", "ŞİŞLİ", "BAYRAMPAŞA", "TUZLA", "ÇEKMEKÖY", "BÜYÜKÇEKMECE", "BEYKOZ", "BEYOĞLU", "BAKIRKÖY", "SİLİVRİ", "BEŞİKTAŞ", "ÇATALCA", "ŞİLE", "ADALAR"],
  "İZMİR": ["BUCA", "KARABAĞLAR", "BORNOVA", "KARŞIYAKA", "KONAK", "BAYRAKLI", "ÇİĞLİ", "TORBALI", "MENEMEN", "GAZİEMİR", "ÖDEMİŞ", "KEMALPAŞA", "BERGAMA", "ALİAĞA", "MENDERES", "TİRE", "BALÇOVA", "NARLIDERE", "URLA", "KİRAZ", "DİKİLİ", "BAYINDIR", "SEFERİHİSAR", "SELÇUK", "GÜZELBAHÇE", "FOÇA", "KINIK", "BEYDAĞ", "ÇEŞME", "KARABURUN"],
  "KARS": ["MERKEZ", "KAĞIZMAN", "SARIKAMIŞ", "SELİM", "DİGOR", "ARPAÇAY", "AKYAKA", "SUSUZ"],
  "KASTAMONU": ["MERKEZ", "TOSYA", "TAŞKÖPRÜ", "CİDE", "İNEBOLU", "ARAÇ", "DEVREKANİ", "BOZKURT", "DADAY", "AZDAVAY", "ÇATALZEYTİN", "KÜRE", "DOĞANYURT", "İHSANGAZİ", "PINARBAŞI", "ŞENPAZAR", "ABANA", "SEYDİLER", "HANÖNÜ", "AĞLI"],
  "KAYSERİ": ["MELİKGAZİ", "KOCASİNAN", "TALAS", "DEVELİ", "YAHYALI", "BÜNYAN", "İNCESU", "PINARBAŞI", "TOMARZA", "YEŞİLHİSAR", "SARIOĞLAN", "HACILAR", "SARIZ", "AKKIŞLA", "FELAHİYE", "ÖZVATAN"],
  "KIRKLARELİ": ["LÜLEBURGAZ", "MERKEZ", "BABAESKİ", "VİZE", "PINARHİSAR", "DEMİRKÖY", "PEHLİVANKÖY", "KOFÇAZ"],
  "KIRŞEHİR": ["MERKEZ", "KAMAN", "MUCUR", "ÇİÇEKDAĞI", "AKPINAR", "BOZTEPE", "AKÇAKENT"],
  "KOCAELİ": ["GEBZE", "İZMİT", "DARICA", "KÖRFEZ", "GÖLCÜK", "DERİNCE", "ÇAYIROVA", "KARTEPE", "BAŞİSKELE", "KARAMÜRSEL", "DİLOVASI", "KANDIRA"],
  "KONYA": ["SELÇUKLU", "MERAM", "KARATAY", "EREĞLİ", "AKŞEHİR", "BEYŞEHİR", "ÇUMRA", "SEYDİŞEHİR", "ILGIN", "CİHANBEYLİ", "KULU", "KARAPINAR", "KADINHANI", "SARAYÖNÜ", "BOZKIR", "YUNAK", "DOĞANHİSAR", "HÜYÜK", "ALTINEKİN", "HADİM", "ÇELTİK", "EMİRGAZİ", "TUZLUKÇU", "DEREBUCAK", "AKÖREN", "TAŞKENT", "GÜNEYSINIR", "DERBENT", "HALKAPINAR", "YALIHÜYÜK", "AHIRLI"],
  "KÜTAHYA": ["MERKEZ", "TAVŞANLI", "SİMAV", "GEDİZ", "EMET", "ALTINTAŞ", "DOMANİÇ", "HİSARCIK", "ASLANAPA", "ÇAVDARHİSAR", "ŞAPHANE", "PAZARLAR", "DUMLUPINAR"],
  "MALATYA": ["BATTALGAZİ", "YEŞİLYURT", "DOĞANŞEHİR", "AKÇADAĞ", "DARENDE", "HEKİMHAN", "PÜTÜRGE", "YAZIHAN", "ARAPGİR", "ARGUVAN", "KULUNCAK", "KALE", "DOĞANYOL"],
  "MANİSA": ["YUNUSEMRE", "ŞEHZADELER", "AKHİSAR", "TURGUTLU", "SALİHLİ", "SOMA", "ALAŞEHİR", "SARUHANLI", "KULA", "KIRKAĞAÇ", "DEMİRCİ", "SARIGÖL", "GÖRDES", "SELENDİ", "AHMETLİ", "GÖLMARMARA", "KÖPRÜBAŞI"],
  "KAHRAMANMARAŞ": ["ONİKİŞUBAT", "DULKADİROĞLU", "ELBİSTAN", "AFŞİN", "TÜRKOĞLU", "PAZARCIK", "GÖKSUN", "ANDIRIN", "ÇAĞLAYANCERİT", "EKİNÖZÜ", "NURHAK"],
  "MARDİN": ["KIZILTEPE", "ARTUKLU", "MİDYAT", "NUSAYBİN", "DERİK", "MAZIDAĞI", "DARGEÇİT", "SAVUR", "YEŞİLLİ", "ÖMERLİ"],
  "MUĞLA": ["BODRUM", "FETHİYE", "MİLAS", "MENTEŞE", "MARMARİS", "SEYDİKEMER", "ORTACA", "YATAĞAN", "DALAMAN", "KÖYCEĞİZ", "ULA", "DATÇA", "KAVAKLIDERE"],
  "MUŞ": ["MERKEZ", "BULANIK", "MALAZGİRT", "VARTO", "HASKÖY", "KORKUT"],
  "NEVŞEHİR": ["MERKEZ", "ÜRGÜP", "AVANOS", "GÜLŞEHİR", "DERİNKUYU", "ACIGÖL", "KOZAKLI", "HACIBEKTAŞ"],
  "NİĞDE": ["MERKEZ", "BOR", "ÇİFTLİK", "ULUKIŞLA", "ALTUNHİSAR", "ÇAMARDI"],
  "ORDU": ["ALTINORDU", "ÜNYE", "FATSA", "GÖLKÖY", "PERŞEMBE", "KUMRU", "KORGAN", "AKKUŞ", "AYBASTI", "İKİZCE", "ULUBEY", "GÜRGENTEPE", "ÇATALPINAR", "ÇAYBAŞI", "MESUDİYE", "KABATAŞ", "ÇAMAŞ", "GÜLYALI", "KABADÜZ"],
  "RİZE": ["MERKEZ", "ÇAYELİ", "ARDEŞEN", "PAZAR", "FINDIKLI", "GÜNEYSU", "KALKANDERE", "İYİDERE", "DEREPAZARI", "ÇAMLIHEMŞİN", "İKİZDERE", "HEMŞİN"],
  "SAKARYA": ["ADAPAZARI", "SERDİVAN", "AKYAZI", "ERENLER", "HENDEK", "KARASU", "GEYVE", "ARİFİYE", "SAPANCA", "PAMUKOVA", "FERİZLİ", "KAYNARCA", "KOCAALİ", "SÖĞÜTLÜ", "KARAPÜRÇEK", "TARAKLI"],
  "SAMSUN": ["İLKADIM", "ATAKUM", "BAFRA", "ÇARŞAMBA", "CANİK", "VEZİRKÖPRÜ", "TERME", "TEKKEKÖY", "HAVZA", "ALAÇAM", "19 MAYIS", "KAVAK", "SALIPAZARI", "AYVACIK", "ASARCIK", "LADİK", "YAKAKENT"],
  "SİİRT": ["MERKEZ", "KURTALAN", "PERVARİ", "BAYKAN", "ŞİRVAN", "ERUH", "TİLLO"],
  "SİNOP": ["MERKEZ", "BOYABAT", "GERZE", "AYANCIK", "TÜRKELİ", "DURAĞAN", "ERFELEK", "DİKMEN", "SARAYDÜZÜ"],
  "SİVAS": ["MERKEZ", "ŞARKIŞLA", "YILDIZELİ", "SUŞEHRİ", "GEMEREK", "ZARA", "KANGAL", "GÜRÜN", "DİVRİĞİ", "KOYULHİSAR", "ALTINYAYLA", "HAFİK", "ULAŞ", "İMRANLI", "AKINCILAR", "GÖLOVA", "DOĞANŞAR"],
  "TEKİRDAĞ": ["ÇORLU", "SÜLEYMANPAŞA", "ÇERKEZKÖY", "KAPAKLI", "ERGENE", "MALKARA", "SARAY", "HAYRABOLU", "ŞARKÖY", "MURATLI", "MARMARAEREĞLİSİ"],
  "TOKAT": ["MERKEZ", "ERBAA", "TURHAL", "NİKSAR", "ZİLE", "REŞADİYE", "ALMUS", "PAZAR", "BAŞÇİFTLİK", "YEŞİLYURT", "ARTOVA", "SULUSARAY"],
  "TRABZON": ["ORTAHİSAR", "AKÇAABAT", "ARAKLI", "OF", "YOMRA", "ARSİN", "VAKFIKEBİR", "SÜRMENE", "MAÇKA", "BEŞİKDÜZÜ", "ÇARŞIBAŞI", "TONYA", "DÜZKÖY", "ŞALPAZARI", "HAYRAT", "KÖPRÜBAŞI", "ÇAYKARA", "DERNEKPAZARI"],
  "TUNCELİ": ["MERKEZ", "PERTEK", "MAZGİRT", "ÇEMİŞGEZEK", "HOZAT", "OVACIK", "PÜLÜMÜR", "NAZIMİYE"],
  "ŞANLIURFA": ["EYYÜBİYE", "HALİLİYE", "SİVEREK", "VİRANŞEHİR", "KARAKÖPRÜ", "AKÇAKALE", "SURUÇ", "BİRECİK", "CEYLANPINAR", "HARRAN", "BOZOVA", "HİLVAN", "HALFETİ"],
  "UŞAK": ["MERKEZ", "BANAZ", "EŞME", "SİVASLI", "ULUBEY", "KARAHALLI"],
  "VAN": ["İPEKYOLU", "ERCİŞ", "TUŞBA", "EDREMİT", "ÖZALP", "ÇALDIRAN", "BAŞKALE", "MURADİYE", "GÜRPINAR", "GEVAŞ", "SARAY", "ÇATAK", "BAHÇESARAY"],
  "YOZGAT": ["MERKEZ", "SORGUN", "AKDAĞMADENİ", "YERKÖY", "BOĞAZLIYAN", "SARIKAYA", "ÇEKEREK", "ŞEFAATLİ", "SARAYKENT", "KADIŞEHRİ", "AYDINCIK", "YENİFAKILI", "ÇANDIR"],
  "ZONGULDAK": ["EREĞLİ", "MERKEZ", "ÇAYCUMA", "DEVREK", "KOZLU", "ALAPLI", "KİLİMLİ", "GÖKÇEBEY"],
  "AKSARAY": ["MERKEZ", "ORTAKÖY", "ESKİL", "GÜLAĞAÇ", "GÜZELYURT", "AĞAÇÖREN", "SARIYAHŞİ"],
  "BAYBURT": ["MERKEZ", "DEMİRÖZÜ", "AYDINTEPE"],
  "KARAMAN": ["MERKEZ", "ERMENEK", "SARIVELİLER", "AYRANCI", "KAZIMKARABEKİR", "BAŞYAYLA"],
  "KIRIKKALE": ["MERKEZ", "YAHŞİHAN", "KESKİN", "DELİCE", "BAHŞILI", "SULAKYURT", "BALIŞEYH", "KARAKEÇİLİ", "ÇELEBİ"],
  "BATMAN": ["MERKEZ", "KOZLUK", "SASON", "BEŞİRİ", "GERCÜŞ", "HASANKEYF"],
  "ŞIRNAK": ["CİZRE", "SİLOPİ", "MERKEZ", "İDİL", "ULUDERE", "BEYTÜŞŞEBAP", "GÜÇLÜKONAK"],
  "BARTIN": ["MERKEZ", "ULUS", "AMASRA", "KURUCAŞİLE"],
  "ARDAHAN": ["MERKEZ", "GÖLE", "ÇILDIR", "HANAK", "POSOF", "DAMAL"],
  "IĞDIR": ["MERKEZ", "TUZLUCA", "ARALIK", "KARAKOYUNLU"],
  "YALOVA": ["MERKEZ", "ÇİFTLİKKÖY", "ÇINARCIK", "ALTINOVA", "ARMUTLU", "TERMAL"],
  "KARABÜK": ["MERKEZ", "SAFRANBOLU", "YENİCE", "ESKİPAZAR", "EFLANİ", "OVACIK"],
  "KİLİS": ["MERKEZ", "MUSABEYLİ", "ELBEYLİ", "POLATELİ"],
  "OSMANİYE": ["MERKEZ", "KADİRLİ", "DÜZİÇİ", "BAHÇE", "TOPRAKKALE", "SUMBAS", "HASANBEYLİ"],
  "DÜZCE": ["MERKEZ", "AKÇAKOCA", "KAYNAŞLI", "GÖLYAKA", "ÇİLİMLİ", "YIĞILCA", "GÜMÜŞOVA", "CUMAYERİ"]
};

// --- APPROXIMATE DISTRICT BOUNDING BOXES (MinLat, MaxLat, MinLng, MaxLng) ---
// Used when text matching fails but coordinate data is reliable.
export const DISTRICT_BOUNDS: Record<string, Record<string, [number, number, number, number]>> = {
  "AĞRI": {
    "DOĞUBAYAZIT": [39.3000, 39.7500, 43.8000, 44.5000],
    "MERKEZ": [39.6000, 39.8500, 42.9000, 43.2000],
    "PATNOS": [39.1000, 39.3500, 42.7000, 43.0000]
  },
  "İSTANBUL": {
    "MALTEPE": [40.9000, 41.0000, 29.0800, 29.2500],
    "KADIKÖY": [40.9600, 41.0300, 29.0000, 29.1000],
    "ATAŞEHİR": [40.9600, 41.0200, 29.0700, 29.1800],
    "ÜMRANİYE": [40.9800, 41.0700, 29.0800, 29.2200],
    "PENDİK": [40.8500, 41.0200, 29.2000, 29.4000],
    "KARTAL": [40.8800, 40.9600, 29.1500, 29.2500],
    "SULTANBEYLİ": [40.9400, 40.9900, 29.2300, 29.3000],
    "SANCAKTEPE": [40.9500, 41.0500, 29.1800, 29.3000],
    "TUZLA": [40.8000, 40.9500, 29.2800, 29.4500],
    "FATİH": [40.9900, 41.0400, 28.9100, 28.9900],
    "ŞİŞLİ": [41.0300, 41.0900, 28.9600, 29.0200],
    "BEŞİKTAŞ": [41.0300, 41.1000, 28.9900, 29.0600],
    "BEYOĞLU": [41.0200, 41.0600, 28.9400, 28.9900],
    "ZEYTİNBURNU": [40.9800, 41.0200, 28.8800, 28.9300],
    "BAKIRKÖY": [40.9500, 41.0100, 28.8000, 28.8900],
    "BAHÇELİEVLER": [40.9800, 41.0300, 28.8100, 28.8800],
    "GÜNGÖREN": [41.0000, 41.0400, 28.8500, 28.8900],
    "BAĞCILAR": [41.0100, 41.0700, 28.8000, 28.8700],
    "ESENLER": [41.0200, 41.0800, 28.8400, 28.9000],
    "KÜÇÜKÇEKMECE": [40.9700, 41.0600, 28.7400, 28.8200],
    "AVCILAR": [40.9600, 41.0800, 28.6700, 28.7600],
    "BEYLİKDÜZÜ": [40.9600, 41.0300, 28.6000, 28.6800],
    "ESENYURT": [41.0000, 41.0800, 28.6200, 28.7200],
    "BÜYÜKÇEKMECE": [40.9600, 41.1000, 28.5000, 28.6300],
    "BAŞAKŞEHİR": [41.0400, 41.1500, 28.7000, 28.8500],
    "ARNAVUTKÖY": [41.1000, 41.3500, 28.6000, 28.9000],
    "SARIYER": [41.0800, 41.2500, 28.9800, 29.1000],
    "BEYKOZ": [41.0600, 41.2200, 29.0500, 29.2500],
    "ÇEKMEKÖY": [41.0000, 41.1000, 29.1500, 29.3500],
    "ŞİLE": [41.0500, 41.1800, 29.3500, 29.7000],
    "ÇATALCA": [41.0500, 41.4000, 28.3000, 28.6500],
    "SİLİVRİ": [41.0300, 41.2000, 28.1000, 28.4000]
  }
};


// --- SIMULATED MGM DATA SERVICE ---

const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    if (values.length % 2) return values[half];
    return (values[half - 1] + values[half]) / 2.0;
};

// Helper to determine climate zone (Simple approximation)
const getClimateFactor = (city: string): number => {
    const coldCities = ["ERZURUM", "KARS", "ARDAHAN", "AĞRI", "SİVAS", "YOZGAT", "KAYSERİ", "GÜMÜŞHANE", "BAYBURT", "BİTLİS", "MUŞ", "HAKKARİ", "VAN"];
    const warmCities = ["ANTALYA", "ADANA", "MERSİN", "HATAY", "İZMİR", "AYDIN", "MUĞLA", "OSMANİYE", "KİLİS", "ŞANLIURFA"];
    
    if (coldCities.includes(city)) return 1.4; // %40 higher HDD
    if (warmCities.includes(city)) return 0.6; // %40 lower HDD
    return 1.0; // Moderate (Istanbul/Ankara baseline approx)
};

export const getMGMHeatingDegreeDays = async (
    city: string
): Promise<{ jan: number, feb: number, mar: number }> => {
    
    // Simulate API latency for MGM Service
    await new Promise(resolve => setTimeout(resolve, 800));

    // Base HDD values (approximate for moderate climate)
    const baseHDD = { jan: 300, feb: 280, mar: 230 };
    
    // Apply climate factor
    const factor = getClimateFactor(city);
    
    // Add some random variance to simulate real data per district/year
    const variance = 0.9 + Math.random() * 0.2; 
    
    return {
        jan: Math.round(baseHDD.jan * factor * variance),
        feb: Math.round(baseHDD.feb * factor * variance),
        mar: Math.round(baseHDD.mar * factor * variance)
    };
};

// Robust Turkish Text Normalizer
const normalizeTr = (text: string) => {
    if (!text) return "";
    return text.toLocaleUpperCase('tr')
        .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
        .replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
        .trim();
};

export const analyzeWeatherNormalized = (
    subscribers: Subscriber[], 
    city: string, 
    district: string,
    hddData: { jan: number, feb: number, mar: number }
): WeatherRiskResult[] => {
    
    const hdd = hddData;

    // Normalizing Input Targets
    const targetCityNorm = normalizeTr(city);
    const targetDistNorm = normalizeTr(district);
    
    // Lookup Bounds
    let targetBounds: [number, number, number, number] | null = null;
    
    // Check if we have bounds for this City/District
    // We try to match city keys in DISTRICT_BOUNDS
    const cityKey = Object.keys(DISTRICT_BOUNDS).find(k => normalizeTr(k) === targetCityNorm);
    if (cityKey) {
        const districtMap = DISTRICT_BOUNDS[cityKey];
        const distKey = Object.keys(districtMap).find(k => normalizeTr(k) === targetDistNorm);
        if (distKey) {
            targetBounds = districtMap[distKey]; // [minLat, maxLat, minLng, maxLng]
        }
    }

    // 2. Filter Subscribers by Location (Text OR Geo) & Type
    const relevantSubs = subscribers.filter(s => {
        // Type Filter: Only 'konut (kombi)'
        const type = s.rawAboneTipi ? s.rawAboneTipi.toLocaleLowerCase('tr') : '';
        const isTypeMatch = type.includes('konut') && type.includes('kombi');
        if (!isTypeMatch) return false;

        // --- HYBRID FILTERING LOGIC ---
        // A. Text Based Filtering (Legacy)
        const sCityNorm = normalizeTr(s.city || '');
        const sDistNorm = normalizeTr(s.district || '');
        let isTextMatch = false;

        if (sCityNorm && sDistNorm) {
             isTextMatch = sCityNorm.includes(targetCityNorm) && sDistNorm.includes(targetDistNorm);
        } else if (sCityNorm) {
             isTextMatch = sCityNorm.includes(targetCityNorm); 
        }

        // B. Geo Based Filtering (Bounding Box Check - Priority)
        let isGeoMatch = false;
        
        // If we have specific bounds for the selected district, use them!
        if (targetBounds && s.location.lat !== 0 && s.location.lng !== 0) {
            const [minLat, maxLat, minLng, maxLng] = targetBounds;
            if (s.location.lat >= minLat && s.location.lat <= maxLat && 
                s.location.lng >= minLng && s.location.lng <= maxLng) {
                isGeoMatch = true;
            }
        } else {
             // Fallback to Polygon check for Istanbul if no bounds found (Legacy)
             if (targetCityNorm === 'ISTANBUL' && ISTANBUL_DISTRICTS[district]) { 
                 const polyKey = Object.keys(ISTANBUL_DISTRICTS).find(k => normalizeTr(k) === targetDistNorm);
                 if (polyKey && s.location.lat !== 0 && s.location.lng !== 0) {
                     const polygon = ISTANBUL_DISTRICTS[polyKey];
                     if (isPointInPolygon(s.location.lat, s.location.lng, polygon)) {
                         isGeoMatch = true;
                     }
                 }
            }
        }

        // Include if Text Matches OR Geo Matches
        // If bounds exist, Geo Match is a very strong signal.
        return isTextMatch || isGeoMatch;
    });

    // 3. Group by BaglantiNesnesi (Building)
    const buildingMap = new Map<string, Subscriber[]>();
    relevantSubs.forEach(sub => {
        if (!sub.baglantiNesnesi || sub.baglantiNesnesi.length < 3) return;
        const key = sub.baglantiNesnesi.trim();
        if (!buildingMap.has(key)) buildingMap.set(key, []);
        buildingMap.get(key)!.push(sub);
    });

    const risks: WeatherRiskResult[] = [];

    // 4. Analyze Buildings (Normalized by HDD)
    buildingMap.forEach((subs, bn) => {
        
        // Identify "Clean" Neighbors (Consumed gas in all 3 months)
        const cleanNeighbors = subs.filter(s => {
            return s.consumption.jan > 10 && s.consumption.feb > 10 && s.consumption.mar > 10;
        });

        // Min neighbor rule (lowered to 4)
        if (cleanNeighbors.length < 4) return; 

        // Calculate Normalized Average for each clean neighbor
        // Formula: (Consumption / HDD Factor) -> Effectively "Gas per Degree Day"
        const normalizedAvgs = cleanNeighbors.map(s => {
            const jNorm = s.consumption.jan / (hdd.jan || 1);
            const fNorm = s.consumption.feb / (hdd.feb || 1);
            const mNorm = s.consumption.mar / (hdd.mar || 1);
            return (jNorm + fNorm + mNorm) / 3;
        });

        // Calculate Building Median (Normalized)
        const buildingNormMedian = calculateMedian(normalizedAvgs);

        if (buildingNormMedian <= 0.0001) return;

        // Check each subscriber in the building for anomalies
        subs.forEach(s => {
             const jan = s.consumption.jan;
             const feb = s.consumption.feb;
             const mar = s.consumption.mar;
             
             const rawAvg = (jan + feb + mar) / 3;

             // Logic Same as Building Consumption:
             // 1. Must have some consumption (not vacant)
             // 2. Must be significantly lower than median

             // Skip Vacant / Zero usage
             if (jan === 0 || feb === 0 || mar === 0) return;
             
             // Calculate this user's normalized avg
             const myNorm = ((jan/(hdd.jan || 1)) + (feb/(hdd.feb || 1)) + (mar/(hdd.mar || 1))) / 3;
             
             // Threshold: RELAXED to 70% of Normalized Median to show more results
             if (myNorm < (buildingNormMedian * 0.70)) {
                 const deviation = ((myNorm - buildingNormMedian) / buildingNormMedian) * 100;
                 
                 risks.push({
                     tesisatNo: s.tesisatNo,
                     baglantiNesnesi: bn,
                     location: s.location,
                     rawWinterAvg: parseFloat(rawAvg.toFixed(1)),
                     normWinterAvg: parseFloat(myNorm.toFixed(4)),
                     buildingNormMedian: parseFloat(buildingNormMedian.toFixed(4)),
                     deviationPercentage: parseFloat(deviation.toFixed(1)),
                     monthlyData: { jan, feb, mar },
                     hddUsed: hdd
                 });
             }
        });
    });

    // Sort by deviation (most negative first)
    risks.sort((a, b) => a.deviationPercentage - b.deviationPercentage);

    return risks;
};
