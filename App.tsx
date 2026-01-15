
import React, { useState, useMemo } from 'react';
import { parseCSV, normalizeStudentData, mergeSemesters } from './services/dataProcessor';
import { calculateDescriptiveStats, getDistribution, calculateDeltaStats, getDeltaGroup } from './services/statsUtils';
import { exportExcel, exportPDF } from './services/exportService';
import { Semester, StudentData, Rank, DeltaGroup } from './types';
import PlotlyCharts from './components/PlotlyCharts';

interface GradeData {
  hk1: StudentData[];
  hk2: StudentData[];
  rawHk2: any[];
}

const App: React.FC = () => {
  const [dataByGrade, setDataByGrade] = useState<Record<string, GradeData>>({
    '10': { hk1: [], hk2: [], rawHk2: [] },
    '11': { hk1: [], hk2: [], rawHk2: [] },
    '12': { hk1: [], hk2: [], rawHk2: [] }
  });
  
  const [filterSem, setFilterSem] = useState<Semester>(Semester.HK1);
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterColumn, setFilterColumn] = useState<'avgTX' | 'ck' | 'dtb'>('dtb');
  
  const [activeTab, setActiveTab] = useState<'general' | 'delta'>('general');
  const [showChart, setShowChart] = useState<'distribution' | 'boxplot' | 'histogram' | 'comparison' | 'delta_scatter' | 'delta_bar' | 'above_average' | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, grade: string, type: 'HK1' | 'HK2') => {
    if (!e.target.files?.length) return;
    try {
      const files = Array.from(e.target.files) as File[];
      const allRows = (await Promise.all(files.map(f => parseCSV(f)))).flat();
      const normalized = allRows.map(row => normalizeStudentData(row, type));
      
      setDataByGrade(prev => ({
        ...prev,
        [grade]: {
          ...prev[grade],
          [type.toLowerCase()]: normalized,
          ...(type === 'HK2' ? { rawHk2: allRows } : {})
        }
      }));
    } catch (err) {
      alert('Lỗi import file. Vui lòng kiểm tra định dạng CSV.');
    }
  };

  const allStudents = useMemo(() => {
    let combined: StudentData[] = [];
    Object.entries(dataByGrade).forEach(([grade, data]: [string, GradeData]) => {
      let semesterData: StudentData[] = [];
      if (filterSem === Semester.HK1) semesterData = data.hk1;
      else if (filterSem === Semester.HK2) semesterData = data.hk2;
      else semesterData = mergeSemesters(data.hk1, data.hk2, data.rawHk2);
      
      combined = combined.concat(semesterData);
    });
    return combined;
  }, [dataByGrade, filterSem]);

  const filteredData = useMemo(() => {
    return allStudents.filter(s => {
      const gMatch = filterGrade === 'All' || s.grade === filterGrade;
      const cMatch = filterClass === 'All' || s.className === filterClass;
      return gMatch && cMatch;
    });
  }, [allStudents, filterGrade, filterClass]);

  const gradesList = ['10', '11', '12'];
  const classesByGrade = useMemo(() => {
    const filtered = filterGrade === 'All' ? allStudents : allStudents.filter(s => s.grade === filterGrade);
    return Array.from(new Set(filtered.map(s => s.className))).sort();
  }, [allStudents, filterGrade]);

  const statsByClass = useMemo(() => {
    const classGroups: Record<string, number[]> = {};
    filteredData.forEach(s => {
      if (!classGroups[s.className]) classGroups[s.className] = [];
      const val = filterSem === Semester.FullYear && filterColumn === 'dtb' ? s.tbcn : s[filterColumn];
      if (typeof val === 'number') classGroups[s.className].push(val);
    });

    return Object.entries(classGroups).map(([name, scores]) => ({
      name,
      scores,
      stats: calculateDescriptiveStats(scores),
      dist: getDistribution(scores)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData, filterColumn, filterSem]);

  const globalStats = useMemo(() => {
    const allScores = filteredData.map(s => (filterSem === Semester.FullYear && filterColumn === 'dtb' ? s.tbcn : s[filterColumn]) as number).filter(v => typeof v === 'number');
    return {
      descriptive: calculateDescriptiveStats(allScores),
      distribution: getDistribution(allScores)
    };
  }, [filteredData, filterColumn, filterSem]);

  // Delta Analysis Calculations
  const deltaByClass = useMemo(() => {
    if (filterSem === Semester.FullYear) return [];
    const classGroups: Record<string, StudentData[]> = {};
    filteredData.forEach(s => {
      if (!classGroups[s.className]) classGroups[s.className] = [];
      classGroups[s.className].push(s);
    });
    return Object.entries(classGroups).map(([name, students]) => calculateDeltaStats(students, name))
      .sort((a, b) => b.delta - a.delta);
  }, [filteredData, filterSem]);

  const globalDeltaStats = useMemo(() => {
    if (filterSem === Semester.FullYear) return null;
    return calculateDeltaStats(filteredData, filterGrade === 'All' ? 'Toàn trường' : `Khối ${filterGrade}`);
  }, [filteredData, filterSem, filterGrade]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        exportExcel({ statsByClass, deltaByClass, globalDeltaStats }, `Bao_cao_${filterSem}`);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        exportPDF(`Báo cáo ${filterSem}`, { statsByClass, deltaByClass });
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const getColumnLabel = (col: string) => {
    switch(col) {
      case 'dtb': return filterSem === Semester.FullYear ? 'ĐTB Cả Năm' : 'ĐTB Học kỳ';
      case 'ck': return filterSem === Semester.FullYear ? 'Điểm CK (Trung bình)' : 'Điểm Cuối kỳ';
      case 'avgTX': return 'ĐBQ Thường xuyên';
      default: return col;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-700">
          <span className="bg-blue-700 text-white p-1 rounded shadow-sm">TTCM</span> Phân Tích & Báo Cáo Pro
        </h1>
        <div className="flex gap-3">
          <button 
            disabled={filteredData.length === 0 || isExporting}
            onClick={handleExportExcel} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:bg-slate-300 flex items-center gap-2"
          >
            {isExporting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            Xuất Excel
          </button>
          <button 
            disabled={filteredData.length === 0 || isExporting}
            onClick={handleExportPDF} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:bg-slate-300 flex items-center gap-2"
          >
            {isExporting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            Xuất PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Import Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gradesList.map(grade => (
            <div key={grade} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${grade === '10' ? 'bg-blue-500' : grade === '11' ? 'bg-purple-500' : 'bg-orange-500'}`}></span>
                  Khối {grade}
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">CSV</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Học Kỳ 1</label>
                  <input type="file" multiple accept=".csv" onChange={e => handleImport(e, grade, 'HK1')} className="text-xs block w-full file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer" />
                </div>
                <div className="pt-2 border-t border-slate-50">
                  <label className="block text-[10px] font-bold text-purple-600 uppercase mb-1">Học Kỳ 2</label>
                  <input type="file" multiple accept=".csv" onChange={e => handleImport(e, grade, 'HK2')} className="text-xs block w-full file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-purple-50 file:text-purple-700 cursor-pointer" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button onClick={() => setActiveTab('general')} className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>THỐNG KÊ TỔNG HỢP</button>
          <button onClick={() => setActiveTab('delta')} className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'delta' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>PHÂN TÍCH ĐỘ LỆCH (DELTA)</button>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Học kỳ</label>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value as Semester)} className="w-full border-slate-200 rounded-lg p-2 text-sm">
              <option value={Semester.HK1}>Học kỳ 1</option>
              <option value={Semester.HK2}>Học kỳ 2</option>
              <option value={Semester.FullYear}>Cả năm</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Khối</label>
            <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterClass('All'); }} className="w-full border-slate-200 rounded-lg p-2 text-sm">
              <option value="All">Tất cả</option>
              {gradesList.map(g => <option key={g} value={g}>Khối {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Lớp</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full border-slate-200 rounded-lg p-2 text-sm">
              <option value="All">Tất cả</option>
              {classesByGrade.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {activeTab === 'general' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Cột phân tích</label>
              <select value={filterColumn} onChange={e => setFilterColumn(e.target.value as any)} className="w-full border-slate-200 rounded-lg p-2 text-sm">
                <option value="dtb">ĐTB Học kỳ / Cả năm</option>
                <option value="ck">Điểm Cuối kỳ</option>
                <option value="avgTX">ĐBQ Thường xuyên</option>
              </select>
            </div>
          )}
        </div>

        {filteredData.length > 0 ? (
          <>
            {activeTab === 'general' ? (
              <div className="space-y-8">
                {/* Statistics Cards & General Charts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">Sĩ số</p>
                    <p className="text-3xl font-black mt-1">{globalStats.descriptive?.count || 0}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">Trung bình chung</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{globalStats.descriptive?.mean.toFixed(2) || 0}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowChart('distribution')} className={`px-5 py-2 rounded-xl text-sm font-bold ${showChart === 'distribution' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>📊 Phân loại 6 mức</button>
                  <button onClick={() => setShowChart('boxplot')} className={`px-5 py-2 rounded-xl text-sm font-bold ${showChart === 'boxplot' ? 'bg-orange-600 text-white' : 'bg-white border'}`}>📦 Biểu đồ hộp</button>
                  <button onClick={() => setShowChart('histogram')} className={`px-5 py-2 rounded-xl text-sm font-bold ${showChart === 'histogram' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>📈 Phổ điểm</button>
                  <button onClick={() => setShowChart('above_average')} className={`px-5 py-2 rounded-xl text-sm font-bold ${showChart === 'above_average' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>📊 Tỉ lệ Trên Trung bình</button>
                </div>

                {showChart && <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                  <PlotlyCharts 
                    type={showChart as any} 
                    data={showChart === 'histogram' ? filteredData.map(s => (filterSem === Semester.FullYear && filterColumn === 'dtb' ? s.tbcn : s[filterColumn])) : statsByClass} 
                    title={`${showChart === 'boxplot' ? 'BIỂU ĐỒ HỘP' : showChart === 'histogram' ? 'PHỔ ĐIỂM' : showChart === 'above_average' ? 'TỈ LỆ TRÊN TRUNG BÌNH' : 'PHÂN LOẠI'} - ${getColumnLabel(filterColumn).toUpperCase()}`} 
                  />
                </div>}

                {/* General Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                     <h3 className="font-bold text-slate-700 uppercase">Thống kê chi tiết theo lớp</h3>
                     <span className="text-[10px] text-slate-400">Dữ liệu tính trên cột: {getColumnLabel(filterColumn)}</span>
                   </div>
                   <table className="w-full text-xs text-left">
                     <thead><tr className="bg-slate-50 border-b">
                       <th className="p-4">Lớp</th><th className="p-4 text-center">Sĩ số</th><th className="p-4 text-center">Trung bình</th>
                       {Object.values(Rank).map(r => <th key={r} className="p-4 text-center">{r}</th>)}
                     </tr></thead>
                     <tbody>{statsByClass.map(s => (
                       <tr key={s.name} className="border-b hover:bg-slate-50/50 transition-colors">
                         <td className="p-4 font-bold">{s.name}</td><td className="p-4 text-center">{s.scores.length}</td><td className="p-4 text-center font-semibold">{s.stats?.mean.toFixed(2)}</td>
                         {Object.values(Rank).map(r => <td key={r} className="p-4 text-center">{s.dist.percentages[r]}</td>)}
                       </tr>
                     ))}</tbody>
                   </table>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {filterSem === Semester.FullYear ? (
                  <div className="bg-amber-50 p-10 rounded-3xl border border-amber-200 text-center">
                    <p className="text-amber-800 font-bold">Phân tích Delta chỉ áp dụng cho từng Học kỳ riêng biệt.</p>
                  </div>
                ) : (
                  <>
                    {/* Delta Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-2xl border-l-4 border-slate-400 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase">Độ lệch $\Delta$ {globalDeltaStats?.name}</p>
                        <p className={`text-3xl font-black mt-1 ${globalDeltaStats!.delta >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {globalDeltaStats?.delta.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Δ = Mean(TX) - Mean(CK)</p>
                      </div>
                      {Object.values(DeltaGroup).map(group => (
                        <div key={group} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-slate-200">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{group}</p>
                          <p className="text-2xl font-black mt-1">{globalDeltaStats?.distribution.percentages[group]}</p>
                          <p className="text-[10px] text-slate-400">{globalDeltaStats?.distribution.counts[group]} học sinh</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setShowChart('delta_scatter')} className={`px-5 py-2 rounded-xl text-sm font-bold ${showChart === 'delta_scatter' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>🎯 Biểu đồ phân tán: Quá trình vs Thi</button>
                      <button onClick={() => setShowChart('delta_bar')} className={`px-5 py-2 rounded-xl text-sm font-bold ${showChart === 'delta_bar' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>📊 Δ Trung bình theo lớp</button>
                    </div>

                    {showChart && (showChart.startsWith('delta')) && (
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                        <PlotlyCharts type={showChart as any} data={showChart === 'delta_scatter' ? filteredData : deltaByClass} title={`PHÂN TÍCH ĐỘ LỆCH - ${filterSem}`} />
                      </div>
                    )}

                    {/* Delta Table By Class */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b bg-slate-50"><h3 className="font-black text-slate-800 uppercase">Độ lệch Trung bình Lớp</h3></div>
                      <table className="w-full text-xs text-left">
                        <thead><tr className="bg-slate-100 font-bold border-b">
                          <th className="p-4">Lớp</th><th className="p-4 text-center">Sĩ số hợp lệ</th>
                          <th className="p-4 text-center">Mean(TX)</th><th className="p-4 text-center">Mean(CK)</th>
                          <th className="p-4 text-center bg-slate-200">Δ Lớp</th>
                          <th className="p-4 text-center text-red-600">Thi thấp hơn (%)</th>
                          <th className="p-4 text-center text-emerald-600">Phù hợp (%)</th>
                          <th className="p-4 text-center text-blue-600">Thi cao hơn (%)</th>
                        </tr></thead>
                        <tbody>{deltaByClass.map(d => (
                          <tr key={d.name} className="border-b hover:bg-slate-50">
                            <td className="p-4 font-bold">{d.name}</td><td className="p-4 text-center">{d.n}</td>
                            <td className="p-4 text-center">{d.meanTX.toFixed(2)}</td><td className="p-4 text-center">{d.meanCK.toFixed(2)}</td>
                            <td className={`p-4 text-center font-black ${d.delta >= 0 ? 'text-red-600' : 'text-blue-600'}`}>{d.delta.toFixed(2)}</td>
                            <td className="p-4 text-center">{d.distribution.percentages[DeltaGroup.ThapHon]}</td>
                            <td className="p-4 text-center">{d.distribution.percentages[DeltaGroup.PhuHop]}</td>
                            <td className="p-4 text-center">{d.distribution.percentages[DeltaGroup.CaoHon]}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>

                    {/* Student Detail Delta Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="font-black text-slate-800 uppercase">Chi tiết Độ lệch Học sinh</h3>
                        <span className="text-[10px] text-slate-400">Chỉ hiển thị HS có đủ điểm TX và CK</span>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="sticky top-0 bg-slate-100 z-10"><tr>
                            <th className="p-3">Mã HS</th><th className="p-3">Họ và tên</th><th className="p-3">Lớp</th>
                            <th className="p-3 text-center">ĐBQtx</th><th className="p-3 text-center">Điểm thi</th>
                            <th className="p-3 text-center bg-slate-200">Δ</th><th className="p-3">Nhóm độ lệch</th>
                          </tr></thead>
                          <tbody>{filteredData.filter(s => s.avgTX !== null && s.ck !== null).map(s => {
                            const d = s.avgTX - s.ck;
                            const g = getDeltaGroup(d);
                            return (
                              <tr key={s.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 text-slate-400">{s.id}</td><td className="p-3 font-medium">{s.name}</td><td className="p-3">{s.className}</td>
                                <td className="p-3 text-center">{s.avgTX.toFixed(2)}</td><td className="p-3 text-center">{s.ck.toFixed(2)}</td>
                                <td className={`p-3 text-center font-bold ${d >= 0 ? 'text-red-600' : 'text-blue-600'}`}>{d.toFixed(2)}</td>
                                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${g === DeltaGroup.ThapHon ? 'bg-red-50 text-red-600' : g === DeltaGroup.CaoHon ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{g}</span></td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <h3 className="text-lg font-black text-slate-800 uppercase">Hệ thống đang chờ tải dữ liệu CSV</h3>
            <p className="text-slate-400 text-sm mt-2">Vui lòng chọn tệp CSV tương ứng với từng khối lớp phía trên</p>
          </div>
        )}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-8 text-[10px] text-center text-slate-400 z-50">
        Công thức Độ lệch: Δ = ĐBQtx - Điểm Thi (Thi thấp hơn quá trình nếu Δ > 0) | Hệ thống Thống kê TTCM Pro v2.5
      </footer>
    </div>
  );
};

export default App;
