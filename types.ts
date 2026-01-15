
export enum Semester {
  HK1 = 'HK1',
  HK2 = 'HK2',
  FullYear = 'CN'
}

export enum Rank {
  XuấtSắc = 'Xuất sắc',
  Tốt = 'Tốt',
  Khá = 'Khá',
  Đạt = 'Đạt',
  Yếu = 'Yếu',
  Kém = 'Kém'
}

export enum DeltaGroup {
  ThapHon = 'Thi thấp hơn quá trình',
  PhuHop = 'Phù hợp',
  CaoHon = 'Thi cao hơn quá trình'
}

export interface StudentData {
  id: string;
  name: string;
  className: string;
  grade: string;
  birthday: string;
  avgTX: number;
  gk: number;
  ck: number;
  dtb: number;
  rank: Rank;
  tbcn?: number;
  delta?: number | null;
  deltaGroup?: DeltaGroup | null;
  isMissingHK2?: boolean;
}

export interface DescriptiveStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  stdDev: number;
}

export interface Distribution {
  counts: Record<string, number>;
  percentages: Record<string, string>;
}

export interface ClassStats {
  className: string;
  studentCount: number;
  avgDTB: number;
  ranks: Record<Rank, number>;
  ranksPercentage: Record<Rank, string>;
}

export interface DeltaStats {
  name: string; // Tên lớp hoặc khối
  n: number;
  meanTX: number;
  meanCK: number;
  delta: number;
  distribution: {
    counts: Record<DeltaGroup, number>;
    percentages: Record<DeltaGroup, string>;
  };
}
