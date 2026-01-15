
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { ClassStats, Rank } from '../types';
import { RANK_COLORS } from '../constants';

interface DashboardProps {
  stats: ClassStats[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const chartData = useMemo(() => {
    return stats.map(s => ({
      name: s.className,
      [Rank.XuấtSắc]: s.ranks[Rank.XuấtSắc],
      [Rank.Tốt]: s.ranks[Rank.Tốt],
      [Rank.Khá]: s.ranks[Rank.Khá],
      [Rank.Đạt]: s.ranks[Rank.Đạt],
      [Rank.Yếu]: s.ranks[Rank.Yếu],
      [Rank.Kém]: s.ranks[Rank.Kém],
      avg: s.avgDTB
    }));
  }, [stats]);

  const rankingData = useMemo(() => {
    return [...stats].sort((a, b) => b.avgDTB - a.avgDTB);
  }, [stats]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Rank Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Cơ cấu xếp loại theo Lớp</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.values(Rank).map(rank => (
                  <Bar key={rank} dataKey={rank} stackId="a" fill={RANK_COLORS[rank]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Score Comparison */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">So sánh Điểm Trung Bình</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Điểm TB" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Bảng Tổng Hợp Chi Tiết</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-semibold text-slate-600">Lớp</th>
                <th className="p-3 font-semibold text-slate-600">Sĩ số</th>
                <th className="p-3 font-semibold text-slate-600">Điểm TB</th>
                <th className="p-3 font-semibold text-slate-600 text-blue-700">Xuất sắc</th>
                <th className="p-3 font-semibold text-slate-600 text-emerald-600">Tốt</th>
                <th className="p-3 font-semibold text-slate-600 text-amber-600">Khá</th>
                <th className="p-3 font-semibold text-slate-600 text-indigo-500">Đạt</th>
                <th className="p-3 font-semibold text-slate-600 text-orange-600">Yếu</th>
                <th className="p-3 font-semibold text-slate-600 text-red-600">Kém</th>
              </tr>
            </thead>
            <tbody>
              {rankingData.map((s, idx) => (
                <tr key={s.className} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="p-3 font-medium">{s.className}</td>
                  <td className="p-3">{s.studentCount}</td>
                  <td className="p-3 font-bold text-slate-900">{s.avgDTB.toFixed(2)}</td>
                  <td className="p-3">{s.ranksPercentage[Rank.XuấtSắc]}</td>
                  <td className="p-3">{s.ranksPercentage[Rank.Tốt]}</td>
                  <td className="p-3">{s.ranksPercentage[Rank.Khá]}</td>
                  <td className="p-3">{s.ranksPercentage[Rank.Đạt]}</td>
                  <td className="p-3">{s.ranksPercentage[Rank.Yếu]}</td>
                  <td className="p-3 font-semibold text-red-600">{s.ranksPercentage[Rank.Kém]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
