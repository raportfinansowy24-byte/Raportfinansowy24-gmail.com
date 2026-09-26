import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AmortizationChartProps {
  principal: number;
  annualRate: number;
  months: number;
  currencySymbol?: string;
  currencyRate?: number;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({ 
  principal, 
  annualRate, 
  months,
  currencySymbol = 'zł',
  currencyRate = 1.0 
}) => {
  const data = [];
  const monthlyRate = annualRate / 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  
  let principalRemaining = principal;
  for (let i = 0; i <= months; i++) {
    const interest = principalRemaining * monthlyRate;
    const principalPaid = payment - interest;
    
    data.push({
      month: i,
      principalRemaining: Math.round(Math.max(0, principalRemaining) * currencyRate),
      interestPaid: Math.round((i === 0 ? 0 : interest) * currencyRate),
    });
    
    if (i > 0) {
      principalRemaining -= principalPaid;
    }
  }

  return (
    <div className="h-64 w-full bg-[#121216] p-4 rounded-2xl border border-white/[0.08] shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white text-xs font-bold uppercase tracking-widest">Plan Spłaty Kapitału ({currencySymbol})</h4>
        <span className="text-[10px] text-zinc-400 font-mono">Okres: {months} mies.</span>
      </div>
      <ResponsiveContainer width="100%" height="82%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="month" stroke="#ffffff50" fontSize={10} tickLine={false} />
          <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} width={45} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff', fontSize: '11px' }}
            formatter={(value: number) => [`${value.toLocaleString('pl-PL')} ${currencySymbol}`, 'Pozostały kapitał']}
            labelFormatter={(label) => `Miesiąc ${label}`}
          />
          <Area type="monotone" dataKey="principalRemaining" stroke="#DC143C" fill="#DC143C" fillOpacity={0.2} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

