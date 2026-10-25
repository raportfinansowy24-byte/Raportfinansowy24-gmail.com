import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

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
  const safeMonths = Math.max(1, months);
  const monthlyRate = Math.max(0.0001, annualRate / 12);
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, safeMonths)) / (Math.pow(1 + monthlyRate, safeMonths) - 1);
  
  let principalRemaining = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  // Sampling step for clean display
  const step = safeMonths <= 24 ? 1 : safeMonths <= 60 ? 2 : 3;

  // Initial state (month 0)
  data.push({
    month: 0,
    label: 'Start',
    principalRemaining: Math.round(principal * currencyRate),
    principalPaid: 0,
    interestPaid: 0,
  });

  for (let i = 1; i <= safeMonths; i++) {
    const interest = principalRemaining * monthlyRate;
    const principalPart = payment - interest;
    principalRemaining = Math.max(0, principalRemaining - principalPart);
    cumulativePrincipal += principalPart;
    cumulativeInterest += interest;
    
    if (i % step === 0 || i === safeMonths) {
      data.push({
        month: i,
        label: i % 12 === 0 ? `R.${i / 12}` : `M${i}`,
        principalRemaining: Math.round(principalRemaining * currencyRate),
        principalPaid: Math.round(Math.min(principal, cumulativePrincipal) * currencyRate),
        interestPaid: Math.round(cumulativeInterest * currencyRate),
      });
    }
  }

  return (
    <div className="h-80 w-full bg-[#121216] p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC143C]"></span>
            Wykres Liniowy Harmonogramu Spłat ({currencySymbol})
          </h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">Przebieg spłaty kapitału i narastania odsetek w czasie</p>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono bg-white/[0.05] px-2 py-0.5 rounded border border-white/10">
          Okres: {months} mies.
        </span>
      </div>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
            <XAxis dataKey="label" stroke="#ffffff50" fontSize={10} tickLine={false} />
            <YAxis 
              stroke="#ffffff50" 
              fontSize={10} 
              tickLine={false} 
              width={50} 
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0d0d11', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              itemStyle={{ fontSize: '11px', padding: '1px 0' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString('pl-PL')} ${currencySymbol}`, 
                name
              ]}
              labelFormatter={(label, payload) => {
                const item = payload && payload[0]?.payload;
                return item ? `Miesiąc ${item.month}` : String(label);
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} 
              iconType="circle"
              iconSize={8}
            />
            <Line 
              type="monotone" 
              dataKey="principalRemaining" 
              name="Pozostały kapitał" 
              stroke="#DC143C" 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 5, fill: '#DC143C', stroke: '#fff', strokeWidth: 1.5 }} 
            />
            <Line 
              type="monotone" 
              dataKey="principalPaid" 
              name="Spłacony kapitał" 
              stroke="#10B981" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 1.5 }} 
            />
            <Line 
              type="monotone" 
              dataKey="interestPaid" 
              name="Skumulowane odsetki" 
              stroke="#F59E0B" 
              strokeWidth={1.5} 
              strokeDasharray="4 4" 
              dot={false}
              activeDot={{ r: 4, fill: '#F59E0B', stroke: '#fff', strokeWidth: 1.5 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

