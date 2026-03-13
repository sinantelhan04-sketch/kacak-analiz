
import * as XLSX from 'xlsx';
import proj4 from 'proj4';
import type { Subscriber, ReferenceLocation, MonthlyData, MonthKey } from '../types';

// --- HGM PROJECTION DEFINITION ---
// Lambert Conformal Conic TC1M (Turkey)
const HGM_PROJ = '+proj=lcc +lat_1=35 +lat_2=41 +lat_0=0 +lon_0=35 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs';
const WGS84_PROJ = 'WGS84';

const convertHgmToWgs84 = (x: number, y: number): { lat: number, lng: number } => {
    try {
        const [lng, lat] = proj4(HGM_PROJ, WGS84_PROJ, [x, y]);
        return { lat, lng };
    } catch (err) {
        console.error("Coordinate conversion error:", err);
        return { lat: 0, lng: 0 };
    }
};

// --- HELPER FUNCTIONS ---

const normalizeTrChars = (str: string) => {
    if (!str) return "";
    return String(str).toLocaleLowerCase('tr')
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i')
        .replace(/i/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
        .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
};

const getColIndex = (headers: any[], candidates: string[]): number => {
    if (!headers || !Array.isArray(headers)) return -1;
    const normalizedCandidates = candidates.map(c => normalizeTrChars(c));
    for (let i = 0; i < headers.length; i++) {
        const h = normalizeTrChars(String(headers[i]));
        if (normalizedCandidates.some(c => h.includes(c) || h === c)) return i;
    }
    return -1;
};

const normalizeRowData = (row: any[]): any[] => {
    if (row.length === 1 && typeof row[0] === 'string') {
        if (row[0].includes(',')) return row[0].split(',');
        if (row[0].includes(';')) return row[0].split(';');
        if (row[0].includes('\t')) return row[0].split('\t');
    }
    return row;
};

const getMonthBase = (val: any): string | null => {
    if (!val) return null;
    let s = normalizeTrChars(String(val).trim());
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const trMonths = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
    const trShortMonths = ['oca', 'sub', 'mar', 'nis', 'may', 'haz', 'tem', 'agu', 'eyl', 'eki', 'kas', 'ara'];
    
    for (let i = 0; i < 12; i++) {
        if (s.includes(months[i]) || s.includes(trMonths[i]) || s.includes(trShortMonths[i])) {
            return months[i];
        }
    }
    return null;
};

const getMonthKey = (val: any): MonthKey | null => {
      if (!val) return null;
      let s = normalizeTrChars(String(val).trim());
      
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const trMonths = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
      const trShortMonths = ['oca', 'sub', 'mar', 'nis', 'may', 'haz', 'tem', 'agu', 'eyl', 'eki', 'kas', 'ara'];
      
      let monthIdx = -1;
      let year = '';

      // Try to find year in the string
      const rawS = String(val).toLowerCase();
      if (rawS.includes('23') || rawS.includes('2023')) year = '23';
      else if (rawS.includes('24') || rawS.includes('2024')) year = '24';
      else year = '24'; // Default to 24 if not specified

      // Try numeric format (e.g., 01.2023 or 1)
      const numericMatch = s.match(/^0?(\d{1,2})(\.202[34])?(\.0)?$/);
      if (numericMatch) {
          monthIdx = parseInt(numericMatch[1]) - 1;
          if (numericMatch[2]) {
              year = numericMatch[2].includes('23') ? '23' : '24';
          }
      } else {
          // Try text format
          for (let i = 0; i < 12; i++) {
              if (s.includes(months[i]) || s.includes(trMonths[i]) || s.includes(trShortMonths[i])) {
                  monthIdx = i;
                  break;
              }
          }
      }

      if (monthIdx >= 0 && monthIdx < 12) {
          return `${months[monthIdx]}_${year}` as MonthKey;
      }
      
      return null;
}

const cleanVal = (val: any): string => {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    str = str.replace(/['"]/g, '');
    if (str.endsWith('.0')) str = str.slice(0, -2);
    return str;
};

const parseNum = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        let s = val.trim().replace(/['"]/g, '');
        if (s === '') return 0;
        if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
        return parseFloat(s) || 0;
    }
    return 0;
};

const normalizeId = (id: any): string => {
    if (id === null || id === undefined) return "";
    return String(id).trim().toUpperCase();
};

const readWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
    const buffer = await file.arrayBuffer();
    if (file.name.toLowerCase().endsWith('.csv')) {
        const uint8Array = new Uint8Array(buffer);
        // UTF-8 BOM Check
        if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
             const text = new TextDecoder('utf-8').decode(buffer);
             return XLSX.read(text, { type: 'string', dense: true });
        }
        // Try UTF-8
        try {
             const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
             return XLSX.read(text, { type: 'string', dense: true });
        } catch {
             // Fallback to Turkish Windows-1254
             const text = new TextDecoder('windows-1254').decode(buffer);
             return XLSX.read(text, { type: 'string', dense: true });
        }
    }
    return XLSX.read(buffer, { dense: true });
};

// --- MAIN PROCESSING FUNCTION (Replaces Worker) ---
export const processFiles = async (
    fileA: File, 
    fileB: File,
    onProgress: (percent: number, status: string) => void
): Promise<{ 
    subscribers: Subscriber[], 
    refMuhatapIds: Set<string>, 
    refTesisatIds: Set<string>, 
    refLocations: ReferenceLocation[], 
    rawCount: number
}> => {

    // --- 1. PROCESS FILE A (Reference) ---
    onProgress(10, 'Referans dosyası okunuyor...');
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));

    const wbA = await readWorkbook(fileA);
    const sheetA = wbA.Sheets[wbA.SheetNames[0]];
    const rawDataA = XLSX.utils.sheet_to_json<any[]>(sheetA, { header: 1 });
    
    const refMuhatapIds = new Set<string>();
    const refTesisatIds = new Set<string>();
    const refLocations: ReferenceLocation[] = [];

    if(rawDataA.length > 1) {
            const headersA = normalizeRowData(rawDataA[0]);
            const idxRefTesisat = getColIndex(headersA, ['tesisat', 'tesisatno', 'tesisat no']);
            const idxRefMuhatap = getColIndex(headersA, ['muhatap', 'muhatapno', 'muhatap no']);
            const idxRefLat = getColIndex(headersA, ['enlem', 'lat', 'latitude']);
            const idxRefLng = getColIndex(headersA, ['boylam', 'lng', 'long', 'longitude']);
            
            for(let i=1; i<rawDataA.length; i++){
                const row = normalizeRowData(rawDataA[i]);
                if(idxRefTesisat !== -1 && row[idxRefTesisat]) {
                    const tesisatId = normalizeId(row[idxRefTesisat]);
                    refTesisatIds.add(tesisatId);
                    if (idxRefLat !== -1 && idxRefLng !== -1) {
                    const lat = parseNum(row[idxRefLat]);
                    const lng = parseNum(row[idxRefLng]);
                    if (lat !== 0 && lng !== 0) {
                        refLocations.push({ id: cleanVal(row[idxRefTesisat]), lat, lng, type: 'Reference' });
                    }
                    }
                }
                if(idxRefMuhatap !== -1 && row[idxRefMuhatap]) {
                    refMuhatapIds.add(normalizeId(row[idxRefMuhatap]));
                }
            }
    }

    // --- 2. PROCESS FILE B (Subscribers) ---
    onProgress(30, 'Tüketim verileri okunuyor...');
    await new Promise(resolve => setTimeout(resolve, 0));

    const wbB = await readWorkbook(fileB);
    const subscriberMap = new Map<string, Subscriber>();
    let totalRows = 0;

    // Count total rows for better progress estimation
    let totalSheetsRows = 0;
    wbB.SheetNames.forEach(name => {
        const range = XLSX.utils.decode_range(wbB.Sheets[name]['!ref'] || "A1:A1");
        totalSheetsRows += (range.e.r - range.s.r);
    });

    let processedRows = 0;

    for (const sheetName of wbB.SheetNames) {
        const sheet = wbB.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if(rows.length < 2) continue;
        
        const headers = normalizeRowData(rows[0]);
        const idxId = getColIndex(headers, ['tesisat no', 'tesisat', 'tesisatno']);
        const idxMuhatap = getColIndex(headers, ['muhatap no', 'muhatap', 'muhatapno']);
        const idxBaglanti = getColIndex(headers, ['baglanti nesnesi', 'bağlantı nesnesi', 'baglanti', 'bağlantı', 'baglanti_nesnesi', 'bağlantı_nesnesi', 'baglantinesnesi', 'bağlantınesnesi']);
        const idxType = getColIndex(headers, ['abone tipi', 'tip', 'abone', 'abonetipi']);
        const idxLat = getColIndex(headers, ['enlem', 'lat', 'latitude']);
        const idxLng = getColIndex(headers, ['boylam', 'lng', 'long', 'longitude']);
        const idxX = getColIndex(headers, ['hgm_x', 'x_coord', 'x']);
        const idxY = getColIndex(headers, ['hgm_y', 'y_coord', 'y']);
        const idxCity = getColIndex(headers, ['il', 'sehir', 'city', 'vilayet']);
        const idxDistrict = getColIndex(headers, ['ilce', 'district', 'bolge']);
        const idxAddress = getColIndex(headers, ['adres', 'address', 'tam adres', 'acik adres']);
        const idxMonth = getColIndex(headers, ['ay', 'month', 'donem']);
        const idxCons = getColIndex(headers, ['sm3', 'tuketim', 'm3', 'sarfiyat']);
        
        // Refine idxCons to avoid matching 'gecmis yil tuketim' or 'simdiki yil tuketim'
        // if those specific columns are already identified.
        const idxPastYear = getColIndex(headers, ['gecmis yil tuketim', 'gecmis_yil_tuketim', 'gecmis yil', 'past year']);
        const idxCurrentYear = getColIndex(headers, ['simdiki yil tuketim', 'simdiki_yil_tuketim', 'simdiki yil', 'current year', 'guncel tuketim']);

        const isSimplifiedHeader = idxPastYear !== -1 || idxCurrentYear !== -1;
        
        // Contract No Detection
        const idxPastContract = getColIndex(headers, ['onceki yil sozlesme no', 'onceki_yil_sozlesme_no', 'gecmis yil sozlesme', 'past year contract']);
        const idxCurrentContract = getColIndex(headers, ['simdiki yil sozlesme no', 'simdiki_yil_sozlesme_no', 'guncel sozlesme', 'current year contract']);

        const wideFormatMap: Partial<Record<keyof MonthlyData, number>> = {};
        if (idxMonth === -1 || idxCons === -1) {
            headers.forEach((h, i) => {
                const key = getMonthKey(h);
                if (key) wideFormatMap[key] = i;
            });
        }
        
        if(idxId === -1) continue;

        for(let i=1; i<rows.length; i++){
            // Progress Reporting & Yielding
            processedRows++;
            if (processedRows % 1000 === 0) {
                    const pct = 30 + Math.floor((processedRows / totalSheetsRows) * 50); // Map to 30-80%
                    onProgress(pct, `Veriler işleniyor (${processedRows.toLocaleString()} satır)...`);
                    // Yield to main thread to keep UI responsive
                    await new Promise(resolve => setTimeout(resolve, 0));
            }

            const row = normalizeRowData(rows[i]);
            const rawId = cleanVal(row[idxId]);
            if(!rawId) continue;
            const id = normalizeId(rawId); 
            totalRows++;

            if(!subscriberMap.has(id)){
                const rawTypeStr = idxType !== -1 ? String(row[idxType]) : 'Mesken';
                let typeStr = rawTypeStr.toLowerCase();
                const isCommercial = typeStr.includes('ticar') || typeStr.includes('resmi') || typeStr.includes('sanayi');
                const initMuhatap = idxMuhatap !== -1 ? cleanVal(row[idxMuhatap]) : `M-${rawId}`;
                const baglantiVal = idxBaglanti !== -1 ? cleanVal(row[idxBaglanti]) : '';

                let lat = idxLat !== -1 ? parseNum(row[idxLat]) : 0;
                let lng = idxLng !== -1 ? parseNum(row[idxLng]) : 0;

                // If lat/lng are missing but X/Y are present, convert from HGM
                if (lat === 0 && lng === 0 && idxX !== -1 && idxY !== -1) {
                    const x = parseNum(row[idxX]);
                    const y = parseNum(row[idxY]);
                    if (x !== 0 && y !== 0) {
                        const converted = convertHgmToWgs84(x, y);
                        lat = converted.lat;
                        lng = converted.lng;
                    }
                }

                subscriberMap.set(id, {
                    tesisatNo: rawId, muhatapNo: initMuhatap, 
                    pastYearContractNo: idxPastContract !== -1 ? cleanVal(row[idxPastContract]) : '',
                    currentYearContractNo: idxCurrentContract !== -1 ? cleanVal(row[idxCurrentContract]) : '',
                    baglantiNesnesi: baglantiVal,
                    relatedMuhatapNos: [initMuhatap],
                    address: idxAddress !== -1 ? cleanVal(row[idxAddress]) : '', 
                    location: { lat, lng },
                    city: idxCity !== -1 ? cleanVal(row[idxCity]) : '',
                    district: idxDistrict !== -1 ? cleanVal(row[idxDistrict]) : '',
                    aboneTipi: isCommercial ? 'Commercial' : 'Residential',
                    rawAboneTipi: rawTypeStr,
                    consumption: {
                        jan_23:0, feb_23:0, mar_23:0, apr_23:0, may_23:0, jun_23:0, jul_23:0, aug_23:0, sep_23:0, oct_23:0, nov_23:0, dec_23:0,
                        jan_24:0, feb_24:0, mar_24:0, apr_24:0, may_24:0, jun_24:0, jul_24:0, aug_24:0, sep_24:0, oct_24:0, nov_24:0, dec_24:0,
                        pastYearTotal: 0, currentYearTotal: 0, isSimplified: false
                    },
                    monthsPresent: [],
                    monthsWithMuhatap: [],
                    isVacant: false
                });
            }
            const sub = subscriberMap.get(id)!;
            const currentMuhatap = idxMuhatap !== -1 ? cleanVal(row[idxMuhatap]) : '';
            
            if (idxMuhatap !== -1) {
                if (currentMuhatap) {
                        const normCurrent = normalizeId(currentMuhatap);
                        const exists = sub.relatedMuhatapNos.some(m => normalizeId(m) === normCurrent);
                        if (!exists) sub.relatedMuhatapNos.push(currentMuhatap);
                }
            }

            if (isSimplifiedHeader) {
                // Simplified Format (Yearly Totals or Monthly Comparison)
                const pastVal = parseNum(row[idxPastYear]);
                const currVal = parseNum(row[idxCurrentYear]);

                if (idxMonth !== -1) {
                    // Monthly Comparison Format (User's 10-column format)
                    const monthBase = getMonthBase(row[idxMonth]);
                    if (monthBase) {
                        const m23 = `${monthBase}_23` as keyof MonthlyData;
                        const m24 = `${monthBase}_24` as keyof MonthlyData;
                        
                        sub.consumption[m23] = pastVal as any;
                        sub.consumption[m24] = currVal as any;
                        
                        if (!sub.monthsPresent.includes(m23 as MonthKey)) sub.monthsPresent.push(m23 as MonthKey);
                        if (!sub.monthsPresent.includes(m24 as MonthKey)) sub.monthsPresent.push(m24 as MonthKey);
                        
                        // Accumulate totals
                        sub.consumption.pastYearTotal += pastVal;
                        sub.consumption.currentYearTotal += currVal;
                    }
                } else {
                    // Pure Simplified Format (Yearly Totals only)
                    sub.consumption.isSimplified = true;
                    sub.consumption.pastYearTotal = pastVal;
                    sub.consumption.currentYearTotal = currVal;
                    
                    // Fallback distribution to keep monthly rules from crashing
                    const pastAvg = pastVal / 12;
                    const currAvg = currVal / 12;
                    
                    ['jan_23', 'feb_23', 'mar_23', 'apr_23', 'may_23', 'jun_23', 'jul_23', 'aug_23', 'sep_23', 'oct_23', 'nov_23', 'dec_23'].forEach(m => {
                        sub.consumption[m as keyof MonthlyData] = pastAvg as any;
                    });
                    ['jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24'].forEach(m => {
                        sub.consumption[m as keyof MonthlyData] = currAvg as any;
                    });
                }
            } else if(idxMonth !== -1 && idxCons !== -1) {
                const monthKey = getMonthKey(row[idxMonth]);
                if (monthKey) {
                    sub.consumption[monthKey] = parseNum(row[idxCons]);
                    if (!sub.monthsPresent.includes(monthKey)) sub.monthsPresent.push(monthKey);
                    if (currentMuhatap && !sub.monthsWithMuhatap.includes(monthKey)) {
                        sub.monthsWithMuhatap.push(monthKey);
                    }
                }
            } else {
                    (Object.keys(wideFormatMap) as Array<keyof MonthlyData>).forEach(mKey => {
                        const colIdx = wideFormatMap[mKey];
                        if (colIdx !== undefined && row[colIdx] !== undefined) {
                            sub.consumption[mKey] = parseNum(row[colIdx]);
                            if (!sub.monthsPresent.includes(mKey)) sub.monthsPresent.push(mKey);
                            if (currentMuhatap && !sub.monthsWithMuhatap.includes(mKey)) {
                                sub.monthsWithMuhatap.push(mKey);
                            }
                        }
                    });
            }
        }
    }
    
    onProgress(90, 'Veri seti hazırlanıyor...');
    await new Promise(resolve => setTimeout(resolve, 0));
    
    return { 
        subscribers: Array.from(subscriberMap.values()), 
        refMuhatapIds, 
        refTesisatIds, 
        refLocations, 
        rawCount: totalRows
    };
};
