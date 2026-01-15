
import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Rank, DeltaGroup } from '../types';
import { RANK_COLORS } from '../constants';

interface ChartProps {
  type: 'distribution' | 'boxplot' | 'histogram' | 'comparison' | 'delta_scatter' | 'delta_bar';
  data: any;
  title: string;
}

const PlotlyCharts: React.FC<ChartProps> = ({ type, data, title }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    let traces: any[] = [];
    let layout: any = {
      title: {
        text: title,
        font: { family: 'Inter, sans-serif', size: 16, weight: 'bold' }
      },
      autosize: true,
      margin: { t: 80, b: 50, l: 60, r: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter, sans-serif' },
      hovermode: 'closest'
    };

    if (type === 'distribution') {
      const labels = Object.values(Rank);
      traces = labels.map(rank => ({
        x: data.map((d: any) => d.name),
        y: data.map((d: any) => d.dist.counts[rank] || 0),
        name: rank,
        type: 'bar',
        marker: { color: RANK_COLORS[rank] },
        hovertemplate: `<b>%{x}</b><br>${rank}: %{y} HS<br><extra></extra>`
      }));
      layout.barmode = 'stack';
      layout.yaxis = { title: 'Số lượng học sinh' };
    } else if (type === 'boxplot') {
      traces = data.map((d: any) => ({
        y: d.scores,
        name: d.name,
        type: 'box',
        boxpoints: 'outliers',
        marker: { size: 4 },
        line: { width: 1 }
      }));
      layout.yaxis = { title: 'Điểm số', range: [0, 10.5] };
    } else if (type === 'histogram') {
      traces = [{
        x: data,
        type: 'histogram',
        nbinsx: 20,
        marker: { 
          color: '#4f46e5',
          line: { color: 'white', width: 1 }
        },
        opacity: 0.8,
        hovertemplate: 'Khoảng điểm: %{x}<br>Số lượng: %{y} HS<extra></extra>'
      }];
      layout.xaxis = { title: 'Điểm số', range: [0, 10] };
      layout.yaxis = { title: 'Tần suất (HS)' };
    } else if (type === 'comparison') {
      traces = [
        { 
          x: data.map((d: any) => d.name), 
          y: data.map((d: any) => d.mean), 
          name: 'Điểm TB (Mean)', 
          type: 'bar',
          marker: { color: '#10b981' }
        },
        { 
          x: data.map((d: any) => d.name), 
          y: data.map((d: any) => d.median), 
          name: 'Trung vị (Median)', 
          type: 'scatter', 
          mode: 'lines+markers',
          line: { color: '#f59e0b', width: 3 },
          marker: { size: 8 }
        }
      ];
      layout.yaxis = { title: 'Điểm số', range: [0, 10] };
    } else if (type === 'delta_scatter') {
      traces = [{
        x: data.map((s: any) => s.avgTX),
        y: data.map((s: any) => s.ck),
        mode: 'markers',
        type: 'scatter',
        text: data.map((s: any) => `${s.name} (${s.className})<br>Δ: ${(s.avgTX - s.ck).toFixed(2)}`),
        marker: {
          size: 8,
          color: data.map((s: any) => {
            const d = s.avgTX - s.ck;
            return d >= 1 ? '#ef4444' : d <= -1 ? '#3b82f6' : '#10b981';
          }),
          opacity: 0.6
        },
        hovertemplate: '%{text}<br>TX: %{x}<br>CK: %{y}<extra></extra>'
      }, {
        x: [0, 10],
        y: [0, 10],
        mode: 'lines',
        name: 'y = x',
        line: { dash: 'dash', color: '#94a3b8', width: 1 }
      }];
      layout.xaxis = { title: 'ĐBQtx (Quá trình)', range: [0, 10] };
      layout.yaxis = { title: 'Điểm CK (Thi)', range: [0, 10] };
    } else if (type === 'delta_bar') {
      traces = [{
        x: data.map((d: any) => d.name),
        y: data.map((d: any) => d.delta),
        type: 'bar',
        marker: {
          color: data.map((d: any) => d.delta >= 0 ? '#ef4444' : '#3b82f6')
        },
        hovertemplate: 'Lớp: %{x}<br>Δ: %{y:.2f}<extra></extra>'
      }];
      layout.yaxis = { title: 'Độ lệch Δ (TX - CK)' };
    }

    const config = { 
      responsive: true, 
      displayModeBar: true, 
      modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
      displaylogo: false
    };

    Plotly.newPlot(chartRef.current, traces, layout, config);

    return () => {
      if (chartRef.current) Plotly.purge(chartRef.current);
    };
  }, [type, data, title]);

  return <div ref={chartRef} className="plotly-container" />;
};

export default PlotlyCharts;
