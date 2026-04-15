import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

const data = [
  { date: 'Apr 06', score: 65 },
  { date: 'Apr 07', score: 42 },
  { date: 'Apr 08', score: 31 },
  { date: 'Apr 09', score: 78 },
  { date: 'Apr 10', score: 55 },
  { date: 'Apr 11', score: 82 },
  { date: 'Apr 12', score: 61 },
];

export const RiskTrendChart = () => {
  return (
    <Card className="h-full min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Risk Score Trend</h3>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">Algorand Ledger Volatility</p>
        </div>
        <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Last 7 Days</span>
      </div>
      
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#6B6890" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
              className="font-black uppercase tracking-tighter"
            />
            <YAxis 
              stroke="#6B6890" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]}
              dx={-10}
              className="font-black"
            />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: '#0A0914', 
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                color: '#8B5CF6',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: '900',
                textTransform: 'uppercase',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              cursor={{ stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '5 5' }}
              itemStyle={{ color: '#F1F0FF' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#8B5CF6" 
              strokeWidth={4} 
              dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 2, stroke: '#0A0914' }}
              activeDot={{ r: 8, fill: '#8B5CF6', stroke: '#F1F0FF', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Protocol Active</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">BlockD Analytics v3.0</span>
      </div>
    </Card>
  );
};
