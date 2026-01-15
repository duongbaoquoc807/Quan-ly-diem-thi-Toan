
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Rank, DeltaGroup } from '../types';

export const exportExcel = (data: any, fileName: string) => {
  const { statsByClass, deltaByClass, globalDeltaStats } = data;
  const wb = XLSX.utils.book_new();
  
  // 1. Thống kê mô tả (Cũ)
  const descData = statsByClass.map((s: any) => ({
    'Lớp': s.name,
    'Sĩ số': s.scores.length,
    'Min': s.stats?.min,
    'Q1': s.stats?.q1,
    'Median': s.stats?.median,
    'Q3': s.stats?.q3,
    'Max': s.stats?.max,
    'Mean': s.stats?.mean,
    'StdDev': s.stats?.stdDev,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(descData), 'Thống kê mô tả');

  // 2. Phân phối 6 mức (Cũ)
  const distData = statsByClass.map((s: any) => ({
    'Lớp': s.name,
    ...s.dist.counts,
    ...Object.fromEntries(Object.entries(s.dist.percentages).map(([k, v]) => [`% ${k}`, v]))
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distData), 'Phân phối 6 mức');

  // 3. Độ lệch lớp (Mới)
  if (deltaByClass && deltaByClass.length > 0) {
    const deltaLopData = deltaByClass.map((d: any) => ({
      'Lớp': d.name,
      'n (Hợp lệ)': d.n,
      'Mean(TX)': d.meanTX.toFixed(2),
      'Mean(CK)': d.meanCK.toFixed(2),
      'Delta (TX-CK)': d.delta.toFixed(2),
      'SL Thi thấp hơn': d.distribution.counts[DeltaGroup.ThapHon],
      '% Thi thấp hơn': d.distribution.percentages[DeltaGroup.ThapHon],
      'SL Phù hợp': d.distribution.counts[DeltaGroup.PhuHop],
      '% Phù hợp': d.distribution.percentages[DeltaGroup.PhuHop],
      'SL Thi cao hơn': d.distribution.counts[DeltaGroup.CaoHon],
      '% Thi cao hơn': d.distribution.percentages[DeltaGroup.CaoHon],
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(deltaLopData), 'Độ lệch Trung bình Lớp');
  }

  // 4. Tổng hợp Khối Delta (Mới)
  if (globalDeltaStats) {
     const khoiData = [{
       'Đối tượng': globalDeltaStats.name,
       'n': globalDeltaStats.n,
       'Mean(TX)': globalDeltaStats.meanTX.toFixed(2),
       'Mean(CK)': globalDeltaStats.meanCK.toFixed(2),
       'Delta': globalDeltaStats.delta.toFixed(2),
       ...globalDeltaStats.distribution.percentages
     }];
     XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(khoiData), 'Tổng hợp Khối Delta');
  }

  XLSX.writeFile(wb, `${fileName}_${new Date().getTime()}.xlsx`);
};

export const exportPDF = (title: string, data: any) => {
  const { statsByClass, deltaByClass } = data;
  const doc = new jsPDF('landscape');
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Table 1: General Stats
  const body1 = statsByClass.map((s: any) => [
    s.name, s.scores.length, s.stats?.mean.toFixed(2),
    s.dist.percentages['Xuất sắc'], s.dist.percentages['Tốt'], s.dist.percentages['Khá'],
    s.dist.percentages['Đạt'], s.dist.percentages['Yếu'], s.dist.percentages['Kém'],
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Lớp', 'SL', 'Mean', 'XS%', 'Tốt%', 'Khá%', 'Đạt%', 'Yếu%', 'Kém%']],
    body: body1,
    theme: 'grid',
    styles: { fontSize: 8 }
  });

  // Table 2: Delta Stats
  if (deltaByClass && deltaByClass.length > 0) {
    doc.addPage();
    doc.text("Phân tích Độ lệch Delta (Δ = TX - CK)", 14, 20);
    const body2 = deltaByClass.map((d: any) => [
      d.name, d.n, d.meanTX.toFixed(2), d.meanCK.toFixed(2), d.delta.toFixed(2),
      d.distribution.percentages[DeltaGroup.ThapHon],
      d.distribution.percentages[DeltaGroup.PhuHop],
      d.distribution.percentages[DeltaGroup.CaoHon],
    ]);
    autoTable(doc, {
      startY: 30,
      head: [['Lớp', 'n', 'Mean TX', 'Mean CK', 'Delta', 'Thấp hơn%', 'Phù hợp%', 'Cao hơn%']],
      body: body2,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
  }

  doc.save(`${title}.pdf`);
};
