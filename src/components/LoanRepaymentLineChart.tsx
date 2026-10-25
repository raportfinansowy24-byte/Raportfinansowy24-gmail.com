import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine 
} from 'recharts';
import { TrendingDown, TrendingUp, Calendar, Coins, Percent, Layers } from 'lucide-react';

export interface RepaymentPoint {
  month: number;
  label: string;
  balance: number;         // Pozostały kapitał do spłaty
  paidPrincipal: number;   // Skumulowany spłacony kapitał
  paidInterest: number;    // Skumulowane spłacone odsetki
  installment: number;     // Rata w danym miesiącu
  principalPart: number;   // Część kapitałowa raty
  interestPart: number;    // Część odsetkowa raty
}

export interface LoanRepaymentLineChartProps {
  principal: number;
  annualRate: number;      // np. 0.098 dla 9.8%
  months: number;
  currencySymbol?: string;
  currencyRate?: number;
}

export function generateRepaymentSchedule(
  principal: number,
  annualRate: number,
  months: number,
  currencyRate: number = 1.0
): RepaymentPoint[] {
  const points: RepaymentPoint[] = [];
  const r = annualRate / 12;
  const payment = r > 0 && months > 0
    ? (principal * r) / (1 - Math.pow(1 + r, -months))
    : principal / (months || 1);

  let currentBalance = principal;
  let totalInterest = 0;
  let totalPrincipal = 0;

  // Punkt początkowy (miesiąc 0)
  points.push({
    month: 0,
    label: 'Start',
    balance: Math.round(principal * currencyRate),
    paidPrincipal: 0,
    paidInterest: 0,
    installment: Math.round(payment * currencyRate),
    principalPart: 0,
    interestPart: 0,
  });

  // Jeżeli miesięcy jest bardzo dużo (> 60), próbkujemy punkty co 2 lub 3 miesiące dla płynności renderowania,
  // zachowując zawsze pierwszy, ostatni i pełne lata.
  const step = months > 84 ? 3 : months > 48 ? 2 : 1;

  for (let m = 1; m <= months; m++) {
    const interestPart = currentBalance * r;
    const principalPart = Math.min(currentBalance, payment - interestPart);
    totalInterest += interestPart;
    totalPrincipal += principalPart;
    currentBalance = Math.max(0, currentBalance - principalPart);

    if (m === months || m % step === 0 || m % 12 === 0) {
      points.push({
        month: m,
        label: m % 12 === 0 ? `${m / 12} r.` : `${m} m.`,
        balance: Math.round(currentBalance * currencyRate),
        paidPrincipal: Math.round(totalPrincipal * currencyRate),
        paidInterest: Math.round(totalInterest * currencyRate),
        installment: Math.round(payment * currencyRate),
        principalPart: Math.round(principalPart * currencyRate),
        interestPart: Math.round(interestPart * currencyRate),
      });
    }
  }

  return points;
}

export const LoanRepaymentLineChart: React.FC<LoanRepaymentLineChartProps> = ({
  principal,
  annualRate,
  months,
  currencySymbol = 'zł',
  currencyRate = 1.0,
}) => {
  const [chartMode, setChartMode] = useState<'balance' | 'installment'>('balance');

  const scheduleData = useMemo(() => {
    return generateRepaymentSchedule(principal, annualRate, months, currencyRate);
  }, [principal, annualRate, months, currencyRate]);

  // Wyliczamy punkt przecięcia kapitału i odsetek (half-way)
  const halfwayMonth = Math.round(months / 2);

  return (
    <div className="w-full bg-[#121216] rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-2xl relative overflow-hidden group hover:border-[#DC143C]/40 transition-all duration-300">
      {/* Tło atmosferyczne */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#DC143C]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Górny pasek nagłówka i przełącznik widoku */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-white/[0.08] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#DC143C]/15 text-[#DC143C] border border-[#DC143C]/30">
              <TrendingDown size={14} />
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#DC143C] uppercase tracking-wider font-mono">
              Recharts • Harmonogram Liniowy Live
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            Dynamiczny wykres spłaty kredytu
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Czas rzeczywisty
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Wykres aktualizuje się natychmiast przy zmianie suwaków kwoty, okresu oraz stopy RRSO.
          </p>
        </div>

        {/* Przełącznik trybu wykresu */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto shrink-0">
          <button
            onClick={() => setChartMode('balance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              chartMode === 'balance'
                ? 'bg-[#DC143C] text-white shadow-md shadow-[#DC143C]/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Coins size={13} />
            <span>Spłata długu</span>
          </button>
          <button
            onClick={() => setChartMode('installment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              chartMode === 'installment'
                ? 'bg-[#DC143C] text-white shadow-md shadow-[#DC143C]/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Layers size={13} />
            <span>Struktura raty</span>
          </button>
        </div>
      </div>

      {/* Szybkie wskaźniki podsumowania wykresu */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 relative z-10 text-xs">
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Kapitał startowy</span>
          <span className="font-bold font-mono text-white text-sm sm:text-base">
            {Math.round(principal * currencyRate).toLocaleString('pl-PL')} {currencySymbol}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Okres spłaty</span>
          <span className="font-bold font-mono text-white text-sm sm:text-base">
            {months} mies. ({(months / 12).toFixed(1)} lat)
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] text-[#DC143C] block uppercase font-medium">Oprocentowanie</span>
          <span className="font-bold font-mono text-white text-sm sm:text-base">
            {(annualRate * 100).toFixed(1)}% RRSO
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] text-emerald-400 block uppercase font-medium">Saldo końcowe</span>
          <span className="font-bold font-mono text-emerald-400 text-sm sm:text-base">
            0 {currencySymbol} (Spłacone)
          </span>
        </div>
      </div>

      {/* Kontener Recharts LineChart */}
      <div className="h-64 sm:h-72 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={scheduleData}
            margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="month" 
              stroke="#ffffff50" 
              fontSize={10} 
              tickLine={false}
              tickFormatter={(m) => m === 0 ? '0' : m % 12 === 0 ? `${m/12}r` : `${m}m`}
            />
            <YAxis 
              stroke="#ffffff50" 
              fontSize={10} 
              tickLine={false} 
              width={55}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${Math.round(val / 1000)}k`;
                return val;
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as RepaymentPoint;
                return (
                  <div className="bg-[#0e0e12] border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[210px]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold text-white">
                      <span>Miesiąc {point.month}</span>
                      <span className="text-zinc-400 font-mono">({(point.month / 12).toFixed(1)} roku)</span>
                    </div>

                    {chartMode === 'balance' ? (
                      <>
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-[#DC143C]" />
                            Pozostały dług:
                          </span>
                          <strong className="text-white font-mono">
                            {point.balance.toLocaleString('pl-PL')} {currencySymbol}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Spłacony kapitał:
                          </span>
                          <strong className="text-emerald-400 font-mono">
                            {point.paidPrincipal.toLocaleString('pl-PL')} {currencySymbol}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Zapłacone odsetki:
                          </span>
                          <strong className="text-amber-400 font-mono">
                            {point.paidInterest.toLocaleString('pl-PL')} {currencySymbol}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            Rata miesięczna:
                          </span>
                          <strong className="text-white font-mono">
                            {point.installment.toLocaleString('pl-PL')} {currencySymbol}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Część kapitałowa:
                          </span>
                          <strong className="text-emerald-400 font-mono">
                            {point.principalPart.toLocaleString('pl-PL')} {currencySymbol}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-[#DC143C]" />
                            Część odsetkowa:
                          </span>
                          <strong className="text-[#DC143C] font-mono">
                            {point.interestPart.toLocaleString('pl-PL')} {currencySymbol}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
              formatter={(val) => <span className="text-zinc-300">{val}</span>}
            />

            {chartMode === 'balance' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Pozostały kapitał do spłaty"
                  stroke="#DC143C"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#DC143C', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Line
                  type="monotone"
                  dataKey="paidPrincipal"
                  name="Spłacony kapitał łącznie"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981' }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Line
                  type="monotone"
                  dataKey="paidInterest"
                  name="Suma odsetek"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 5, fill: '#f59e0b' }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="installment"
                  name="Rata łączna"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#fff' }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Line
                  type="monotone"
                  dataKey="principalPart"
                  name="Część kapitałowa"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981' }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Line
                  type="monotone"
                  dataKey="interestPart"
                  name="Część odsetkowa"
                  stroke="#DC143C"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#DC143C' }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </>
            )}

            <ReferenceLine 
              x={halfwayMonth} 
              stroke="#ffffff25" 
              strokeDasharray="3 3" 
              label={{ value: '50% czasu', position: 'top', fill: '#ffffff50', fontSize: 9 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dolna stopka informacyjna */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 mt-2 border-t border-white/[0.06] text-[10px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Wykres wyliczany w czasie rzeczywistym z uwzględnieniem równych rat annuitetowych</span>
        </span>
        <span className="font-mono text-zinc-400">
          Recharts SVG Engine
        </span>
      </div>
    </div>
  );
};
