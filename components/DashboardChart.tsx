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

  if (!topRisk) return (
      <div className="bg-white rounded-[30px] p-8 border border-slate-200 h-full flex items-center justify-center text-slate-400">
          Veri Yok
      </div>
  );

  return (
    <div className="bg-white rounded-[30px] p-6 border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-slate-800 font-bold text-lg">Tüketim Trendi (En Riskli Abone)</h3>
            <p className="text-slate-500 text-xs">Tesisat: <span className="text-accent-purple font-mono">{topRisk.tesisatNo}</span></p>
          </div>
          <div className="flex items-center gap-2">
             <span className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-full bg-accent-cyan"></div> Tüketim (m³)</span>
          </div>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSm3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false}
                tickLine={false}
                dy={10}
            />
            <YAxis 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false}
                tickLine={false}
                dx={-10}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#0f172a' }}
                cursor={{ stroke: '#a855f7', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
                type="monotone" 
                dataKey="sm3" 
                stroke="#06b6d4" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSm3)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardChart;