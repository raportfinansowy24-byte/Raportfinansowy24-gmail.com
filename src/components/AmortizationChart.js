import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
export const AmortizationChart = ({ principal, annualRate, months }) => {
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
    return (_jsxs("div", { className: "h-64 w-full bg-[#111111] p-4 rounded-[24px] border border-white/5", children: [_jsx("h4", { className: "text-white text-xs font-bold uppercase tracking-widest mb-4", children: "Plan Sp\u0142aty (Amortyzacja)" }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: data, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10" }), _jsx(XAxis, { dataKey: "month", stroke: "#ffffff50", fontSize: 10 }), _jsx(YAxis, { stroke: "#ffffff50", fontSize: 10 }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }, itemStyle: { color: '#fff', fontSize: '10px' } }), _jsx(Area, { type: "monotone", dataKey: "principalRemaining", stroke: "#DC143C", fill: "#DC143C", fillOpacity: 0.2 })] }) })] }));
};
