import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RiskScore } from '../types';

interface DashboardChartProps {
  topRisk: RiskScore | null;
}

const DashboardChart: React.FC<DashboardChartProps> = ({ topRisk }) => {
  // Generate data for the chart using actual consumption data
  const data = React.useMemo(() => {
    if (!topRisk || !topRisk.consumption) return [];
    
    const c = topRisk.consumption;
    
    return [
      { name: 'Oca', sm3: c.jan },
      { name: 'Şub', sm3: c.feb },
      { name: 'Mar', sm3: c.mar },
      { name: 'Nis', sm3: c.apr },
      { name: 'May', sm3: c.may },
      { name: 'Haz', sm3: c.jun },
      { name: 'Tem', sm3: c.jul },
      { name: 'Ağu', sm3: c.aug },
      { name: 'Eyl', sm3: c.sep },
      { name: 'Eki', sm3: c.oct },
      { name: 'Kas', sm3: c.nov },
      { name: 'Ara', sm3: c.dec },
    ];
  }, [topRisk]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow-lg ring-1 ring-black/5">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</p>
          <p className="text-xl font-bold text-[#1D1D1F] flex items-center gap-1">
            {payload[0].value} <span className="text-sm font-medium text-slate-500">m³</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!topRisk) return (
      <div className="h-full flex items-center justify-center text-slate-400 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/60">
          <span className="text-sm font-medium">Veri Yok</span>
      </div>
  );

  return (
    <div className="h-full flex flex-col p-8 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/60">
      <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xl tracking-tight">Tüketim Trendi (En Riskli Abone)</h3>
            <p className="text-slate-500 text-xs font-medium mt-1">Tesisat: <span className="text-[#007AFF] bg-blue-50 px-1.5 py-0.5 rounded font-mono">{topRisk.tesisatNo}</span></p>
          </div>
          <div className="flex items-center gap-3 bg-white/50 px-3 py-1.5 rounded-full border border-white/40 shadow-sm">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#32ADE6] shadow-[0_0_8px_rgba(50,173,230,0.6)]"></div>
                <span className="text-[11px] font-semibold text-slate-600">Tüketim (m³)</span>
             </div>
          </div>
      </div>
      
      <div className="flex-1 w-full min-h-0 min-w-0 relative">
        <div className="absolute inset-0 w-full h-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSm3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#32ADE6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#32ADE6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} strokeOpacity={0.5} />
              <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{fill: '#86868b', fontSize: 11, fontWeight: 500}} 
                  axisLine={false}
                  tickLine={false}
                  dy={15}
              />
              <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#86868b', fontSize: 11, fontWeight: 500}} 
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#32ADE6', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                  type="monotone" 
                  dataKey="sm3" 
                  stroke="#32ADE6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSm3)" 
                  animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardChart;