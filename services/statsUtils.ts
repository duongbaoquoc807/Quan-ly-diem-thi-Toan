
import { DescriptiveStats, Distribution, DeltaGroup, StudentData, DeltaStats } from '../types';

export const calculateDescriptiveStats = (data: number[]): DescriptiveStats | null => {
  const validData = data.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);
  const n = validData.length;
  if (n === 0) return null;

  const getPercentile = (p: number) => {
    const pos = (n - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (validData[base + 1] !== undefined) {
      return validData[base] + rest * (validData[base + 1] - validData[base]);
    } else {
      return validData[base];
    }
  };

  const mean = validData.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(validData.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (n > 1 ? n - 1 : 1));
  const q1 = getPercentile(0.25);
  const q2 = getPercentile(0.5);
  const q3 = getPercentile(0.75);

  return {
    count: n,
    min: validData[0],
    max: validData[n - 1],
    mean,
    median: q2,
    q1,
    q3,
    iqr: q3 - q1,
    stdDev
  };
};

export const getDistribution = (data: number[]): Distribution => {
  const counts: Record<string, number> = { 'Xuất sắc': 0, 'Tốt': 0, 'Khá': 0, 'Đạt': 0, 'Yếu': 0, 'Kém': 0 };
  data.forEach(v => {
    if (v >= 9) counts['Xuất sắc']++;
    else if (v >= 8) counts['Tốt']++;
    else if (v >= 6.5) counts['Khá']++;
    else if (v >= 5) counts['Đạt']++;
    else if (v >= 3.5) counts['Yếu']++;
    else counts['Kém']++;
  });
  
  const total = data.length;
  const percentages = Object.fromEntries(
    Object.entries(counts).map(([k, v]) => [k, total > 0 ? ((v / total) * 100).toFixed(1) + '%' : '0%'])
  );
  
  return { counts, percentages };
};

export const getDeltaGroup = (delta: number): DeltaGroup => {
  if (delta >= 1.0) return DeltaGroup.ThapHon;
  if (delta <= -1.0) return DeltaGroup.CaoHon;
  return DeltaGroup.PhuHop;
};

export const calculateDeltaStats = (students: StudentData[], name: string): DeltaStats => {
  const valid = students.filter(s => s.avgTX !== null && s.ck !== null);
  const n = valid.length;
  
  const meanTX = n > 0 ? valid.reduce((sum, s) => sum + s.avgTX, 0) / n : 0;
  const meanCK = n > 0 ? valid.reduce((sum, s) => sum + s.ck, 0) / n : 0;
  const delta = meanTX - meanCK; // Công thức Delta khóa cứng

  const counts = {
    [DeltaGroup.ThapHon]: 0,
    [DeltaGroup.PhuHop]: 0,
    [DeltaGroup.CaoHon]: 0,
  };

  valid.forEach(s => {
    const d = s.avgTX - s.ck;
    counts[getDeltaGroup(d)]++;
  });

  const percentages = Object.fromEntries(
    Object.entries(counts).map(([k, v]) => [k, n > 0 ? ((v / n) * 100).toFixed(1) + '%' : '0%'])
  ) as Record<DeltaGroup, string>;

  return {
    name,
    n,
    meanTX,
    meanCK,
    delta,
    distribution: { counts, percentages }
  };
};
