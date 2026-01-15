
import Papa from 'papaparse';
import { StudentData, Rank, Semester } from '../types';
import { getRank } from '../constants';

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
};

export const normalizeStudentData = (raw: any, semester: 'HK1' | 'HK2'): StudentData => {
  const txKeys = Object.keys(raw).filter(k => /^TX\d+$/i.test(k));
  
  // Mapping logic based on your requirement
  // HK1 usage: ĐBQtx, CK1, ĐTBhk1
  // HK2 usage: ĐBQtx, CK2, ĐTBhk2
  const avgTX = Number(raw['ĐBQtx'] || 0);
  const gk = Number(raw[semester === 'HK1' ? 'GK1' : 'GK2'] || 0);
  const ck = Number(raw[semester === 'HK1' ? 'CK1' : 'CK2'] || 0);
  const dtb = Number(raw[semester === 'HK1' ? 'ĐTBhk1' : 'ĐTBhk2'] || 0);

  return {
    id: String(raw['ID'] || ''),
    name: String(raw['Họ và tên'] || ''),
    className: String(raw['Lớp'] || ''),
    grade: String(raw['Lớp'] || '').match(/\d+/)?.[0] || 'Unknown',
    birthday: String(raw['Ngày sinh'] || ''),
    avgTX,
    gk,
    ck,
    dtb,
    rank: getRank(dtb)
  };
};

export const mergeSemesters = (hk1: StudentData[], hk2: StudentData[], rawHk2: any[]) => {
  const hk2Map = new Map(hk2.map(s => [s.id, s]));
  const rawHk2Map = new Map(rawHk2.map(r => [String(r['ID']), r]));

  return hk1.map(s1 => {
    const s2 = hk2Map.get(s1.id);
    const raw2 = rawHk2Map.get(s1.id);
    const tbcn = raw2 ? Number(raw2['TBcn'] || 0) : undefined;
    
    return {
      ...s1,
      tbcn,
      rank: tbcn !== undefined ? getRank(tbcn) : s1.rank,
      isMissingHK2: !s2
    };
  });
};
