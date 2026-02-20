import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RiskScore } from '../types';

interface DashboardChartProps {
  topRisk: RiskScore | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg">
        <p className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</p>
        <p className="text-lg font-bold text-slate-800 flex items-center gap-1">
          {payload[0].value} <span className="text-xs font-medium text-slate-500">m³</span>
        </p>
      </div>
    );
  }
  return null;
};

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

  if (!topRisk) return (
      <div className="h-full flex items-center justify-center text-slate-400 bg-white">
          Veri Yok
      </div>
  );

  return (
    <div className="h-full flex flex-col p-6 bg-white">
      <div className="flex justify-between items-center mb-4 shrink-0">
          <div>
            <h3 className="text-slate-800 font-bold text-lg">Tüketim Trendi (En Riskli Abone)</h3>
            <p className="text-slate-500 text-xs mt-1">Tesisat: <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-mono">{topRisk.tesisatNo}</span></p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
             <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
             <span className="text-xs font-medium text-slate-600">Tüketim (m³)</span>
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
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{fill: '#64748b', fontSize: 11}} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
              />
              <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#64748b', fontSize: 11}} 
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                  type="monotone" 
                  dataKey="sm3" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSm3)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardChart;