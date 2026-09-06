import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { AiOfferRecommendations } from './AiOfferRecommendations';
import { fetchOffersFromApi } from '../services/apiClient';
import { Zap, TrendingUp } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import * as d3 from 'd3';
function AnimatedNumber({ value }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString('pl-PL'));
    useEffect(() => {
        const controls = animate(count, value, { duration: 1, ease: 'easeOut' });
        return () => controls.stop();
    }, [value, count]);
    return _jsx(motion.span, { children: rounded });
}
const SavingsChart = ({ currentSavings, monthlyContribution, years, rateOfReturn, targetAmount }) => {
    const data = useMemo(() => {
        const points = [];
        const r = rateOfReturn / 100 / 12;
        let balance = currentSavings;
        points.push({ month: 0, balance, target: targetAmount });
        for (let i = 1; i <= years * 12; i++) {
            balance = balance * (1 + r) + monthlyContribution;
            points.push({ month: i, balance, target: targetAmount });
        }
        return points;
    }, [currentSavings, monthlyContribution, years, rateOfReturn, targetAmount]);
    const width = 600;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const xScale = d3.scaleLinear()
        .domain([0, years * 12])
        .range([0, innerWidth]);
    const yMax = Math.max(targetAmount, data[data.length - 1]?.balance || 0) * 1.1; // Add 10% padding
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([innerHeight, 0]);
    const lineGenerator = d3.line()
        .x(d => xScale(d.month))
        .y(d => yScale(d.balance))
        .curve(d3.curveMonotoneX);
    const targetLineGenerator = d3.line()
        .x(d => xScale(d.month))
        .y(d => yScale(d.target));
    const areaGenerator = d3.area()
        .x(d => xScale(d.month))
        .y0(innerHeight)
        .y1(d => yScale(d.balance))
        .curve(d3.curveMonotoneX);
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "w-full bg-black/40 border border-[#DC143C]/20 rounded-3xl p-5 mb-6 overflow-hidden", children: [_jsx("h3", { className: "text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 pl-4 text-center", children: "Symulacja Wzrostu Kapita\u0142u" }), _jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full h-auto drop-shadow-xl", preserveAspectRatio: "xMidYMid meet", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "chart-gradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#DC143C", stopOpacity: "0.4" }), _jsx("stop", { offset: "100%", stopColor: "#DC143C", stopOpacity: "0" })] }) }), _jsxs("g", { transform: `translate(${margin.left},${margin.top})`, children: [_jsx("g", { className: "grid-lines opacity-20", children: yScale.ticks(5).map((tick, i) => (_jsxs("g", { transform: `translate(0, ${yScale(tick)})`, children: [_jsx("line", { x1: 0, x2: innerWidth, stroke: "url(#chart-gradient)", strokeWidth: 0.5 }), _jsx("text", { x: -10, y: 4, fill: "rgba(255,255,255,0.6)", fontSize: "10", textAnchor: "end", className: "font-mono", children: tick > 1000 ? (tick / 1000).toFixed(0) + 'k' : tick })] }, `y-${i}`))) }), _jsx("path", { d: areaGenerator(data) || undefined, fill: "url(#chart-gradient)" }), _jsx("path", { d: targetLineGenerator(data) || undefined, fill: "none", stroke: "rgba(255,255,255,0.4)", strokeWidth: "1.5", strokeDasharray: "4 4" }), _jsx("path", { d: lineGenerator(data) || undefined, fill: "none", stroke: "#DC143C", strokeWidth: "3", strokeLinecap: "round" }), _jsx("g", { transform: `translate(0, ${innerHeight})`, children: xScale.ticks(Math.min(years, 8)).map((tick, i) => {
                                    if (tick === 0)
                                        return null;
                                    return (_jsxs("g", { transform: `translate(${xScale(tick)}, 0)`, children: [_jsx("line", { y1: 0, y2: 5, stroke: "rgba(255,255,255,0.2)" }), _jsxs("text", { y: 18, fill: "rgba(255,255,255,0.6)", fontSize: "9", textAnchor: "middle", className: "font-mono uppercase tracking-widest", children: [tick / 12, " ", tick / 12 === 1 ? 'rok' : 'lat'] })] }, `x-${i}`));
                                }) })] })] }), _jsxs("div", { className: "flex items-center justify-center gap-6 mt-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-0.5 bg-[#DC143C]" }), _jsx("span", { className: "text-[9px] text-white/50 uppercase tracking-widest", children: "Kapita\u0142" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-0.5 bg-white/40 border-t border-dashed" }), _jsx("span", { className: "text-[9px] text-white/50 uppercase tracking-widest", children: "Cel" })] })] })] }));
};
export function SavingsGoal() {
    const [targetAmount, setTargetAmount] = useState(50000);
    const [currentSavings, setCurrentSavings] = useState(5000);
    const [years, setYears] = useState(5);
    const [rateOfReturn, setRateOfReturn] = useState(5);
    const [offers, setOffers] = useState([]);
    const [isLoadingOffers, setIsLoadingOffers] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const targetError = targetAmount <= 0 ? 'Kwota musi być większa od 0' : '';
    const currentError = currentSavings < 0 ? 'Kwota nie może być ujemna' : '';
    const yearsError = years <= 0 ? 'Okres musi być większy od 0' : '';
    const rateError = rateOfReturn < 0 ? 'Stopa zwrotu nie może być ujemna' : '';
    const isInputValid = !targetError && !currentError && !yearsError && !rateError;
    const { monthlyContribution, totalInvested, interestEarned } = useMemo(() => {
        if (!isInputValid)
            return { monthlyContribution: 0, totalInvested: 0, interestEarned: 0 };
        const r = rateOfReturn / 100 / 12;
        const n = years * 12;
        const futureValueOfCurrent = currentSavings * Math.pow(1 + r, n);
        const amountToSave = targetAmount - futureValueOfCurrent;
        let monthly = 0;
        if (r === 0) {
            monthly = amountToSave / n;
        }
        else {
            monthly = (amountToSave * r) / (Math.pow(1 + r, n) - 1);
        }
        monthly = Math.max(0, monthly);
        const invested = currentSavings + (monthly * n);
        const interest = targetAmount - invested;
        return {
            monthlyContribution: monthly,
            totalInvested: invested,
            interestEarned: Math.max(0, interest)
        };
    }, [targetAmount, currentSavings, years, rateOfReturn, isInputValid]);
    const fetchOffers = async (type) => {
        setIsLoadingOffers(true);
        setSelectedCategory(type);
        setOffers([]);
        try {
            const data = await fetchOffersFromApi({
                goal: 'savings',
                savingsType: type === 'all' ? undefined : type
            });
            if (Array.isArray(data)) {
                setOffers(data);
            }
        }
        catch (error) {
            console.error("Błąd pobierania ofert:", error);
        }
        finally {
            setIsLoadingOffers(false);
        }
    };
    return (_jsxs("div", { className: "w-full h-full flex flex-col items-center font-sans relative overflow-hidden px-2 pb-2", children: [_jsx("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#DC143C]/10 blur-[80px] pointer-events-none" }), _jsxs("div", { className: "text-center pt-2 pb-1 w-full flex-shrink-0", children: [_jsx("div", { className: "flex justify-center mb-1.5", children: _jsx("div", { className: "w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm", children: _jsx("span", { className: "text-white/80 font-bold text-[9px] tracking-widest", children: "FF" }) }) }), _jsxs("h1", { className: "flex flex-col gap-1.5 mb-3 tracking-tight", children: [_jsx("span", { className: "text-2xl sm:text-3xl font-light text-white/90 uppercase tracking-[0.15em] leading-none", children: "FINANCIAL FREEDOM" }), _jsx("span", { className: "text-xs sm:text-sm font-medium text-[#DC143C] tracking-widest uppercase leading-none", children: "Zbuduj sw\u00F3j kapita\u0142" })] }), _jsx("p", { className: "text-white/40 text-xs sm:text-sm max-w-[320px] mx-auto leading-tight mt-2 font-light mb-6", children: "Oblicz, ile musisz odk\u0142ada\u0107, aby osi\u0105gn\u0105\u0107 sw\u00F3j cel finansowy." })] }), _jsxs("div", { className: "flex-1 w-full flex flex-col min-h-0 px-4 overflow-y-auto custom-scrollbar", children: [_jsxs("div", { className: "flex flex-row gap-3 mb-6", children: [_jsxs("div", { className: "flex-[2] flex flex-col gap-3", children: [_jsxs("div", { className: "space-y-1.5 text-left", children: [_jsx("label", { className: "text-[10px] font-medium text-white/50 uppercase tracking-widest", children: "Kwota docelowa (PLN)" }), _jsx("input", { type: "number", placeholder: "np. 50000", value: targetAmount, onChange: (e) => setTargetAmount(Number(e.target.value)), className: `w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${targetError ? 'border-[#DC143C]' : 'border-white/10'}` }), targetError && _jsx("p", { className: "text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest", children: targetError })] }), _jsxs("div", { className: "space-y-1.5 text-left", children: [_jsx("label", { className: "text-[10px] font-medium text-white/50 uppercase tracking-widest", children: "Obecne oszcz\u0119dno\u015Bci (PLN)" }), _jsx("input", { type: "number", placeholder: "np. 5000", value: currentSavings, onChange: (e) => setCurrentSavings(Number(e.target.value)), className: `w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${currentError ? 'border-[#DC143C]' : 'border-white/10'}` }), currentError && _jsx("p", { className: "text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest", children: currentError })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5 text-left", children: [_jsx("label", { className: "text-[10px] font-medium text-white/50 uppercase tracking-widest", children: "Okres (lata)" }), _jsx("input", { type: "number", placeholder: "np. 5", value: years, onChange: (e) => setYears(Number(e.target.value)), className: `w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${yearsError ? 'border-[#DC143C]' : 'border-white/10'}` }), yearsError && _jsx("p", { className: "text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest", children: yearsError })] }), _jsxs("div", { className: "space-y-1.5 text-left", children: [_jsx("label", { className: "text-[10px] font-medium text-white/50 uppercase tracking-widest", children: "Zysk (%)" }), _jsx("input", { type: "number", placeholder: "np. 5", value: rateOfReturn, onChange: (e) => setRateOfReturn(Number(e.target.value)), className: `w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${rateError ? 'border-[#DC143C]' : 'border-white/10'}` }), rateError && _jsx("p", { className: "text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest", children: rateError })] })] })] }), _jsx("div", { className: "flex-[1] flex flex-col gap-3", children: isInputValid ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center", children: [_jsx("p", { className: "text-white/50 text-[9px] uppercase tracking-widest mb-1", children: "Wp\u0142acone" }), _jsxs("p", { className: "text-sm font-bold text-white flex items-center justify-center gap-1", children: [_jsx(TrendingUp, { className: "w-3 h-3 text-green-500" }), _jsx(AnimatedNumber, { value: totalInvested }), " PLN"] })] }), _jsxs("div", { className: "flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center", children: [_jsx("p", { className: "text-white/50 text-[9px] uppercase tracking-widest mb-1", children: "Odsetki" }), _jsxs("p", { className: "text-sm font-bold text-[#DC143C] flex items-center justify-center gap-1", children: [_jsx(TrendingUp, { className: "w-3 h-3" }), _jsx(AnimatedNumber, { value: interestEarned }), " PLN"] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center opacity-50", children: [_jsx("p", { className: "text-white/50 text-[9px] uppercase tracking-widest mb-1", children: "Wp\u0142acone" }), _jsx("p", { className: "text-sm font-bold text-white", children: "-" })] }), _jsxs("div", { className: "flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center opacity-50", children: [_jsx("p", { className: "text-white/50 text-[9px] uppercase tracking-widest mb-1", children: "Odsetki" }), _jsx("p", { className: "text-sm font-bold text-[#DC143C]", children: "-" })] })] })) })] }), isInputValid && (_jsx(SavingsChart, { currentSavings: currentSavings, monthlyContribution: monthlyContribution, years: years, rateOfReturn: rateOfReturn, targetAmount: targetAmount })), _jsxs("div", { className: "bg-[#DC143C]/10 rounded-3xl p-6 mb-6 border border-[#DC143C]/20 flex flex-col items-center gap-6", children: [_jsxs("div", { className: "text-center w-full", children: [_jsx("p", { className: "text-[#DC143C] text-[10px] uppercase font-black tracking-[0.2em] mb-2", children: "Twoja miesi\u0119czna wp\u0142ata powinna wynosi\u0107:" }), isInputValid ? (_jsxs("p", { className: "text-4xl sm:text-5xl font-black text-white tracking-tighter", children: [monthlyContribution.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), " ", _jsx("span", { className: "text-xl text-white/40", children: "PLN" })] })) : (_jsx("p", { className: "text-lg font-medium text-[#DC143C] tracking-tight py-2", children: "Wprowad\u017A poprawne dane" }))] }), _jsx("button", { onClick: () => fetchOffers('all'), disabled: isLoadingOffers || !isInputValid, className: "w-full flex items-center justify-center gap-3 bg-[#DC143C] hover:bg-[#FF0000] text-white px-8 py-5 rounded-2xl font-black uppercase tracking-tighter shadow-[0_10px_20px_rgba(220,20,60,0.3)] transition-all disabled:opacity-50 active:scale-95", children: isLoadingOffers ? (_jsx("div", { className: "w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(Zap, { size: 20 }), " Dopasuj Ofert\u0119"] })) })] }), isLoadingOffers && (_jsxs("div", { className: "flex flex-col items-center justify-center py-8", children: [_jsx("div", { className: "w-8 h-8 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin mb-4" }), _jsx("p", { className: "text-white/50 text-xs uppercase tracking-widest", children: "Szukam najlepszych ofert..." })] })), !isLoadingOffers && offers.length > 0 && (_jsxs("div", { className: "w-full pb-8", children: [_jsx("h3", { className: "text-sm font-bold text-white uppercase tracking-widest text-center mb-4", children: "Najlepsze oferty dla Ciebie" }), _jsx(AiOfferRecommendations, { offers: offers })] })), _jsx("div", { className: "text-center mt-auto pb-4", children: _jsx("p", { className: "text-white/30 text-[10px] font-light italic uppercase tracking-widest", children: "\"Oszcz\u0119dzanie to inwestowanie w swoj\u0105 przysz\u0142o\u015B\u0107.\"" }) })] })] }));
}
