import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AmortizationChartProps {
  principal: number;
  annualRate: number;
  months: number;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({ principal, annualRate, months }) => {
  const data = [];
  const monthlyRate = annualRate / 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  
  let principalRemaining = principal;
  for (let i = 0; i <= months; i++) {
    const interest = principalRemaining * monthlyRate;
    const principalPaid = payment - interest;
    
    data.push({
      month: i,
      principalRemaining: Math.max(0, principalRemaining),
      interestPaid: i === 0 ? 0 : interest,
    });
    
    if (i > 0) {
        principalRemaining -= principalPaid;
    }
  }

  return (
    <div className="h-64 w-full bg-[#111111] p-4 rounded-[24px] border border-white/5">
      <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Plan Spłaty (Amortyzacja)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="month" stroke="#ffffff50" fontSize={10} />
          <YAxis stroke="#ffffff50" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff', fontSize: '10px' }}
          />
          <Area type="monotone" dataKey="principalRemaining" stroke="#DC143C" fill="#DC143C" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
