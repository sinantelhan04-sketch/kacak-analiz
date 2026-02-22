
import * as XLSX from 'xlsx';
import type { Subscriber, ReferenceLocation, MonthlyData } from '../types';

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

const getMonthKey = (val: any): keyof MonthlyData | null => {
      if (!val) return null;
      let s = String(val).trim();
      if (/^0?1(\.0)?$/.test(s)) return 'jan';
      if (/^0?2(\.0)?$/.test(s)) return 'feb';
      if (/^0?3(\.0)?$/.test(s)) return 'mar';
      if (/^0?4(\.0)?$/.test(s)) return 'apr';
      if (/^0?5(\.0)?$/.test(s)) return 'may';
      if (/^0?6(\.0)?$/.test(s)) return 'jun';
      if (/^0?7(\.0)?$/.test(s)) return 'jul';
      if (/^0?8(\.0)?$/.test(s)) return 'aug';
      if (/^0?9(\.0)?$/.test(s)) return 'sep';
      if (/^10(\.0)?$/.test(s)) return 'oct';
      if (/^11(\.0)?$/.test(s)) return 'nov';
      if (/^12(\.0)?$/.test(s)) return 'dec';
      s = normalizeTrChars(s);
      if (s.includes('oca') || s.includes('jan')) return 'jan';
      if (s.includes('sub') || s.includes('feb')) return 'feb';
      if (s.includes('mar')) return 'mar';
      if (s.includes('nis') || s.includes('apr')) return 'apr';
      if (s.includes('may')) return 'may';
      if (s.includes('haz') || s.includes('jun')) return 'jun';
      if (s.includes('tem') || s.includes('jul')) return 'jul';
      if (s.includes('agu') || s.includes('aug')) return 'aug';
      if (s.includes('eyl') || s.includes('sep')) return 'sep';
      if (s.includes('eki') || s.includes('oct')) return 'oct';
      if (s.includes('kas') || s.includes('nov')) return 'nov';
      if (s.includes('ara') || s.includes('dec')) return 'dec';
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
        const idxCity = getColIndex(headers, ['il', 'sehir', 'city', 'vilayet']);
        const idxDistrict = getColIndex(headers, ['ilce', 'district', 'bolge']);
        const idxAddress = getColIndex(headers, ['adres', 'address', 'tam adres', 'acik adres']);
        const idxMonth = getColIndex(headers, ['ay', 'month', 'donem']);
        const idxCons = getColIndex(headers, ['sm3', 'tuketim', 'm3', 'sarfiyat']);
        
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

                subscriberMap.set(id, {
                    tesisatNo: rawId, muhatapNo: initMuhatap, 
                    baglantiNesnesi: baglantiVal,
                    relatedMuhatapNos: [initMuhatap],
                    address: idxAddress !== -1 ? cleanVal(row[idxAddress]) : '', 
                    location: { lat: idxLat !== -1 ? parseNum(row[idxLat]) : 0, lng: idxLng !== -1 ? parseNum(row[idxLng]) : 0 },
                    city: idxCity !== -1 ? cleanVal(row[idxCity]) : '',
                    district: idxDistrict !== -1 ? cleanVal(row[idxDistrict]) : '',
                    aboneTipi: isCommercial ? 'Commercial' : 'Residential',
                    rawAboneTipi: rawTypeStr,
                    consumption: {jan:0, feb:0, mar:0, apr:0, may:0, jun:0, jul:0, aug:0, sep:0, oct:0, nov:0, dec:0},
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

            if(idxMonth !== -1 && idxCons !== -1) {
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
