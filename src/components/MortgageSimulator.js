import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { saveToLocalStorage, loadFromLocalStorage } from '../lib/storage';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, ArrowLeft, Home, Zap, Clock, ShieldCheck, Bookmark, ArrowLeftRight, X } from 'lucide-react';
import { getAiRecommendedOffers } from '../services/aiOfferService';
import { AiOfferRecommendations } from './AiOfferRecommendations';
export function MortgageSimulator() {
    const navigate = useNavigate();
    const [propertyValue, setPropertyValue] = useState(500000);
    const [downPayment, setDownPayment] = useState(100000);
    const [years, setYears] = useState(25);
    const [interestRate, setInterestRate] = useState(7.5);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [matchedOffer, setMatchedOffer] = useState(null);
    const [isMatching, setIsMatching] = useState(false);
    const [savedSimulation, setSavedSimulation] = useState(() => loadFromLocalStorage('savedMortgageSimulation') || null);
    const [showSavedComparison, setShowSavedComparison] = useState(false);
    // Pobieranie lub tworzenie ID urządzenia
    const getDeviceId = () => {
        let id = localStorage.getItem('device_id');
        if (!id) {
            id = uuidv4();
            localStorage.setItem('device_id', id);
        }
        return id;
    };
    // Ładowanie preferencji przy starcie
    useEffect(() => {
        const fetchPreferences = async () => {
            if (!isSupabaseConfigured) {
                setIsLoaded(true);
                return;
            }
            try {
                const deviceId = getDeviceId();
                const { data, error } = await supabase
                    .from('user_preferences')
                    .select('interest_rate, years, property_value, down_payment')
                    .eq('device_id', deviceId)
                    .maybeSingle();
                if (data && !error) {
                    if (data.interest_rate)
                        setInterestRate(data.interest_rate);
                    if (data.years)
                        setYears(data.years);
                    if (data.property_value)
                        setPropertyValue(data.property_value);
                    if (data.down_payment)
                        setDownPayment(data.down_payment);
                }
            }
            catch (err) {
                console.error("Błąd pobierania preferencji:", err);
            }
            finally {
                setIsLoaded(true);
            }
        };
        fetchPreferences();
    }, []);
    // Automatyczny zapis preferencji (debounced)
    useEffect(() => {
        if (!isLoaded || !isSupabaseConfigured)
            return;
        const savePreferences = async () => {
            try {
                const deviceId = getDeviceId();
                const { data: existing } = await supabase
                    .from('user_preferences')
                    .select('id')
                    .eq('device_id', deviceId)
                    .maybeSingle();
                if (existing) {
                    await supabase
                        .from('user_preferences')
                        .update({
                        interest_rate: interestRate,
                        years: years,
                        property_value: propertyValue,
                        down_payment: downPayment,
                        updated_at: new Date().toISOString()
                    })
                        .eq('device_id', deviceId);
                }
                else {
                    await supabase
                        .from('user_preferences')
                        .insert([{
                            device_id: deviceId,
                            interest_rate: interestRate,
                            years: years,
                            property_value: propertyValue,
                            down_payment: downPayment,
                            updated_at: new Date().toISOString()
                        }]);
                }
            }
            catch (err) {
                console.error("Błąd zapisu preferencji:", err);
            }
        };
        const timeoutId = setTimeout(() => {
            savePreferences();
        }, 1500);
        return () => clearTimeout(timeoutId);
    }, [interestRate, years, propertyValue, downPayment, isLoaded]);
    const loanAmount = propertyValue - downPayment;
    const monthlyPayment = loanAmount > 0 && years > 0 && interestRate > 0
        ? (loanAmount * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, years * 12)) / (Math.pow(1 + interestRate / 100 / 12, years * 12) - 1)
        : 0;
    const getPropertyValueTip = () => {
        if (propertyValue <= 50000)
            return null;
        const newValue = propertyValue - 50000;
        const newLoan = Math.max(0, newValue - downPayment);
        const newRate = newLoan > 0 ? (newLoan * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, years * 12)) / (Math.pow(1 + interestRate / 100 / 12, years * 12) - 1) : 0;
        const diff = monthlyPayment - newRate;
        if (diff <= 0)
            return null;
        return `Zmniejszenie wartości o 50 tys. zł obniży ratę o ok. ${Math.round(diff)} zł/mc.`;
    };
    const getDownPaymentTip = () => {
        const newDownPayment = downPayment + 10000;
        if (newDownPayment >= propertyValue)
            return null;
        const newLoan = propertyValue - newDownPayment;
        const newRate = (newLoan * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, years * 12)) / (Math.pow(1 + interestRate / 100 / 12, years * 12) - 1);
        const diff = monthlyPayment - newRate;
        if (diff <= 0)
            return null;
        return `Zwiększenie wkładu o 10 tys. zł obniży ratę o ok. ${Math.round(diff)} zł/mc.`;
    };
    const getYearsTip = () => {
        if (years <= 5)
            return null;
        const newYears = years - 5;
        const newRate = (loanAmount * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, newYears * 12)) / (Math.pow(1 + interestRate / 100 / 12, newYears * 12) - 1);
        const diffRate = newRate - monthlyPayment;
        const diffTotal = (monthlyPayment * years * 12) - (newRate * newYears * 12);
        if (diffRate <= 0 || diffTotal <= 0)
            return null;
        return `Skrócenie o 5 lat: rata wzrośnie o ${Math.round(diffRate)} zł/mc, ale zaoszczędzisz ${Math.round(diffTotal).toLocaleString('pl-PL')} zł na odsetkach.`;
    };
    const schedule = useMemo(() => {
        if (loanAmount <= 0 || years <= 0 || interestRate <= 0)
            return [];
        const p = loanAmount;
        const r = interestRate / 100 / 12;
        const n = years * 12;
        let balance = p;
        const result = [];
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        for (let month = 1; month <= n; month++) {
            const interest = balance * r;
            const principal = monthlyPayment - interest;
            yearlyPrincipal += principal;
            yearlyInterest += interest;
            balance -= principal;
            if (month % 12 === 0 || month === n) {
                result.push({
                    year: Math.ceil(month / 12),
                    kapital: Math.round(yearlyPrincipal),
                    odsetki: Math.round(yearlyInterest),
                    saldo: Math.max(0, Math.round(balance)),
                });
                yearlyPrincipal = 0;
                yearlyInterest = 0;
            }
        }
        return result;
    }, [loanAmount, years, interestRate, monthlyPayment]);
    const totalInterest = schedule.reduce((sum, year) => sum + year.odsetki, 0);
    const totalCost = loanAmount + totalInterest;
    const [isChartReady, setIsChartReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsChartReady(true), 500);
        return () => clearTimeout(timer);
    }, []);
    const saveSimulation = () => {
        const simulationData = {
            propertyValue,
            downPayment,
            years,
            interestRate,
            monthlyPayment,
            totalInterest,
            totalCost,
            date: new Date().toISOString()
        };
        setSavedSimulation(simulationData);
        saveToLocalStorage('savedMortgageSimulation', simulationData);
    };
    const handleMatchOffer = async () => {
        setIsMatching(true);
        setMatchedOffer(null);
        try {
            const quizData = {
                goal: 'house',
                amount: loanAmount.toString(),
                propertyValue: propertyValue.toString(),
                downPayment: downPayment.toString(),
                years: years.toString(),
                score: 'good'
            };
            const recommendation = await getAiRecommendedOffers(quizData);
            setMatchedOffer(recommendation);
            if (recommendation?.rrso) {
                const rate = parseFloat(recommendation.rrso.replace(/[^0-9.,]/g, '').replace(',', '.'));
                if (!isNaN(rate) && rate > 0) {
                    setInterestRate(rate);
                }
            }
            setTimeout(() => {
                const element = document.getElementById('matched-offer-section');
                if (element)
                    element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
        catch (err) {
            console.error("Błąd dopasowania oferty:", err);
        }
        finally {
            setIsMatching(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-6 w-full pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [_jsxs("div", { className: "flex flex-col items-center text-center space-y-2 mb-4", children: [_jsxs("div", { className: "w-full flex justify-between items-center mb-4", children: [_jsxs("button", { onClick: () => navigate('/loan'), className: "flex items-center gap-2 text-white/30 hover:text-[#DC143C] transition-colors text-[10px] font-bold uppercase tracking-widest group", children: [_jsx(ArrowLeft, { size: 14, className: "group-hover:-translate-x-1 transition-transform" }), "Wr\u00F3\u0107 do analizy"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: saveSimulation, className: "flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-white hover:text-[#DC143C] transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/10", children: [_jsx(Bookmark, { className: "w-3 h-3" }), " Zapisz"] }), savedSimulation && (_jsxs("button", { onClick: () => setShowSavedComparison(true), className: "flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-[#DC143C] hover:text-white transition-colors bg-[#DC143C]/10 px-3 py-1.5 rounded-full border border-[#DC143C]/20", children: [_jsx(ArrowLeftRight, { className: "w-3 h-3" }), " Por\u00F3wnaj"] }))] })] }), _jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/20 text-[#DC143C] text-[10px] font-bold uppercase tracking-widest mb-2", children: [_jsx(Calculator, { size: 12 }), "Wylicz Swoja Rate"] }), _jsx("h2", { className: "text-3xl font-black text-white leading-none tracking-tighter uppercase italic", children: "Wylicz Swoja Rate" })] }), _jsxs("div", { className: "relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/10 shadow-2xl", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#DC143C]/5 via-transparent to-transparent opacity-50" }), _jsxs("div", { className: "p-6 space-y-6 relative z-10", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-4 group bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-[#DC143C]/30 transition-colors sm:col-span-2 relative", children: [getPropertyValueTip() && (_jsx("div", { className: "absolute -top-8 left-1/2 -translate-x-1/2 bg-[#111] border border-[#DC143C]/30 text-white/90 text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-[0_4px_12px_rgba(220,20,60,0.2)]", children: getPropertyValueTip() })), _jsxs("div", { className: "flex justify-between items-end", children: [_jsxs("label", { className: "text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2", children: [_jsx(Home, { size: 12, className: "group-hover:text-[#DC143C] transition-colors" }), " Warto\u015B\u0107 Nieruchomo\u015Bci"] }), _jsxs("div", { className: "text-2xl font-black text-white group-hover:text-[#DC143C] transition-colors group-hover:drop-shadow-[0_0_12px_rgba(220,20,60,0.8)]", children: [propertyValue.toLocaleString('pl-PL'), " ", _jsx("span", { className: "text-sm text-white/40", children: "PLN" })] })] }), _jsx("div", { className: "relative pt-2 pb-2", children: _jsx("input", { type: "range", min: "50000", max: "5000000", step: "10000", value: propertyValue, onChange: (e) => {
                                                        const val = Number(e.target.value);
                                                        setPropertyValue(val);
                                                        if (downPayment > val)
                                                            setDownPayment(val);
                                                    }, className: "w-full h-2 bg-white/10 rounded-lg glow-slider", style: {
                                                        background: `linear-gradient(to right, #DC143C ${(propertyValue - 50000) / (5000000 - 50000) * 100}%, rgba(255,255,255,0.1) ${(propertyValue - 50000) / (5000000 - 50000) * 100}%)`
                                                    } }) })] }), _jsxs("div", { className: "space-y-4 group bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-[#DC143C]/30 transition-colors relative", children: [getDownPaymentTip() && (_jsx("div", { className: "absolute -top-8 left-1/2 -translate-x-1/2 bg-[#111] border border-[#DC143C]/30 text-white/90 text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-[0_4px_12px_rgba(220,20,60,0.2)]", children: getDownPaymentTip() })), _jsxs("div", { className: "flex justify-between items-end", children: [_jsxs("label", { className: "text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2", children: [_jsx(Zap, { size: 12, className: "group-hover:text-[#DC143C] transition-colors" }), " Wk\u0142ad W\u0142asny"] }), _jsxs("div", { className: "text-2xl font-black text-white group-hover:text-[#DC143C] transition-colors group-hover:drop-shadow-[0_0_12px_rgba(220,20,60,0.8)]", children: [downPayment.toLocaleString('pl-PL'), " ", _jsx("span", { className: "text-sm text-white/40", children: "PLN" })] })] }), _jsx("div", { className: "relative pt-2 pb-2", children: _jsx("input", { type: "range", min: "0", max: propertyValue, step: "5000", value: downPayment, onChange: (e) => setDownPayment(Number(e.target.value)), className: "w-full h-2 bg-white/10 rounded-lg glow-slider", style: {
                                                        background: `linear-gradient(to right, #DC143C ${(downPayment) / (propertyValue || 1) * 100}%, rgba(255,255,255,0.1) ${(downPayment) / (propertyValue || 1) * 100}%)`
                                                    } }) })] }), _jsxs("div", { className: "space-y-4 group bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-[#DC143C]/30 transition-colors relative", children: [getYearsTip() && (_jsx("div", { className: "absolute -top-8 left-1/2 -translate-x-1/2 bg-[#111] border border-[#DC143C]/30 text-white/90 text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-[0_4px_12px_rgba(220,20,60,0.2)]", children: getYearsTip() })), _jsxs("div", { className: "flex justify-between items-end", children: [_jsxs("label", { className: "text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2", children: [_jsx(Clock, { size: 12, className: "group-hover:text-[#DC143C] transition-colors" }), " Okres Sp\u0142aty"] }), _jsxs("div", { className: "text-2xl font-black text-white group-hover:text-[#DC143C] transition-colors group-hover:drop-shadow-[0_0_12px_rgba(220,20,60,0.8)]", children: [years, " ", _jsx("span", { className: "text-sm text-white/40", children: "LATA" })] })] }), _jsx("div", { className: "relative pt-2 pb-2", children: _jsx("input", { type: "range", min: "1", max: "35", step: "1", value: years, onChange: (e) => setYears(Number(e.target.value)), className: "w-full h-2 bg-white/10 rounded-lg glow-slider", style: {
                                                        background: `linear-gradient(to right, #DC143C ${(years - 1) / (35 - 1) * 100}%, rgba(255,255,255,0.1) ${(years - 1) / (35 - 1) * 100}%)`
                                                    } }) })] }), _jsx("div", { className: "space-y-4 group bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-[#DC143C]/30 transition-colors sm:col-span-2", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("label", { className: "text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2", children: [_jsx(Calculator, { size: 12, className: "group-hover:text-[#DC143C] transition-colors" }), " Kwota Kredytu"] }), _jsxs("div", { className: "text-2xl font-black text-white group-hover:text-[#DC143C] transition-colors group-hover:drop-shadow-[0_0_12px_rgba(220,20,60,0.8)]", children: [loanAmount.toLocaleString('pl-PL'), " ", _jsx("span", { className: "text-sm text-white/40", children: "PLN" })] })] }) })] }), _jsxs("div", { className: "bg-[#DC143C]/10 rounded-3xl p-6 border border-[#DC143C]/20 flex flex-col sm:flex-row items-center justify-between gap-6", children: [_jsxs("div", { className: "text-center sm:text-left", children: [_jsx("span", { className: "text-[10px] text-[#DC143C] uppercase font-black tracking-[0.2em] block mb-1", children: "Miesi\u0119czna Rata" }), _jsxs("p", { className: "text-4xl font-black text-white tracking-tighter", children: [Math.round(monthlyPayment).toLocaleString('pl-PL'), " ", _jsx("span", { className: "text-xl text-white/40", children: "z\u0142" })] })] }), _jsx("button", { onClick: handleMatchOffer, disabled: isMatching, className: "w-full sm:w-auto flex items-center justify-center gap-3 bg-[#DC143C] hover:bg-[#FF0000] text-white px-8 py-5 rounded-2xl font-black uppercase tracking-tighter shadow-[0_10px_20px_rgba(220,20,60,0.3)] transition-all disabled:opacity-50 active:scale-95", children: isMatching ? (_jsx("div", { className: "w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(Zap, { size: 20 }), " Dopasuj Ofert\u0119"] })) })] })] })] }), matchedOffer && (_jsx("div", { id: "matched-offer-section", className: "mt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000", children: _jsx(AiOfferRecommendations, { offers: [matchedOffer] }) })), schedule.length > 0 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-[#DC143C]/10 flex items-center justify-center text-[#DC143C]", children: _jsx(TrendingUp, { size: 20 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-black text-white uppercase tracking-tight", children: "Struktura Raty" }), _jsx("p", { className: "text-[10px] text-white/40 uppercase font-bold tracking-widest", children: "Podzia\u0142 na kapita\u0142 i odsetki" })] })] }), _jsx("div", { className: "h-[250px] w-full text-[10px] font-bold", children: isChartReady && (_jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: _jsxs(BarChart, { data: schedule, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff05", vertical: false }), _jsx(XAxis, { dataKey: "year", stroke: "#ffffff20", tick: { fill: '#ffffff30' } }), _jsx(YAxis, { stroke: "#ffffff20", tick: { fill: '#ffffff30' }, tickFormatter: (val) => `${val / 1000}k` }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }, itemStyle: { color: '#fff', fontSize: '12px', fontWeight: 'bold' }, cursor: { fill: 'rgba(220,20,60,0.05)' }, formatter: (value) => [`${value.toLocaleString('pl-PL')} zł`, ''] }), _jsx(Legend, { iconType: "circle", wrapperStyle: { paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '9px' } }), _jsx(Bar, { dataKey: "kapital", name: "Kapita\u0142", stackId: "a", fill: "#ffffff", radius: [0, 0, 4, 4] }), _jsx(Bar, { dataKey: "odsetki", name: "Odsetki", stackId: "a", fill: "#DC143C", radius: [4, 4, 0, 0] })] }) })) })] }), _jsxs("div", { className: "relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-[#DC143C]/10 flex items-center justify-center text-[#DC143C]", children: _jsx(ShieldCheck, { size: 20 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-black text-white uppercase tracking-tight", children: "Spadek Zad\u0142u\u017Cenia" }), _jsx("p", { className: "text-[10px] text-white/40 uppercase font-bold tracking-widest", children: "Progresja sp\u0142aty kapita\u0142u" })] })] }), _jsx("div", { className: "h-[250px] w-full text-[10px] font-bold", children: isChartReady && (_jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: _jsxs(LineChart, { data: schedule, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff05", vertical: false }), _jsx(XAxis, { dataKey: "year", stroke: "#ffffff20", tick: { fill: '#ffffff30' } }), _jsx(YAxis, { stroke: "#ffffff20", tick: { fill: '#ffffff30' }, tickFormatter: (val) => `${val / 1000}k` }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }, itemStyle: { color: '#fff', fontSize: '12px', fontWeight: 'bold' }, formatter: (value) => [`${value.toLocaleString('pl-PL')} zł`, 'Saldo'] }), _jsx(Line, { type: "monotone", dataKey: "saldo", stroke: "#DC143C", strokeWidth: 4, dot: false, activeDot: { r: 6, fill: '#DC143C', stroke: '#fff', strokeWidth: 2 } })] }) })) })] })] })), showSavedComparison && savedSimulation && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-40", onClick: () => setShowSavedComparison(false) }), _jsxs("div", { className: "fixed inset-y-0 right-0 w-full max-w-md bg-[#0A0A0A] border-l border-[#DC143C]/30 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-black/50", children: [_jsxs("h3", { className: "text-white font-bold uppercase tracking-widest flex items-center gap-2", children: [_jsx(ArrowLeftRight, { className: "w-5 h-5 text-[#DC143C]" }), "Por\u00F3wnanie"] }), _jsx("button", { onClick: () => setShowSavedComparison(false), className: "text-white/50 hover:text-white transition-colors", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4 custom-scrollbar", children: _jsxs("div", { className: "flex flex-col gap-6 h-full", children: [_jsxs("div", { className: "bg-white/5 p-4 rounded-xl border border-[#DC143C]/30 flex flex-col space-y-4", children: [_jsx("h4", { className: "text-white font-bold text-center uppercase tracking-widest mb-2 border-b border-white/10 pb-2 text-[#DC143C]", children: "Bie\u017C\u0105ca Symulacja" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { className: "text-white/70 flex justify-between", children: ["Warto\u015B\u0107: ", _jsxs("span", { className: "text-white font-bold", children: [propertyValue.toLocaleString('pl-PL'), " PLN"] })] }), _jsxs("p", { className: "text-white/70 flex justify-between", children: ["Wk\u0142ad: ", _jsxs("span", { className: "text-white font-bold", children: [downPayment.toLocaleString('pl-PL'), " PLN"] })] }), _jsxs("p", { className: "text-white/70 flex justify-between", children: ["Okres: ", _jsxs("span", { className: "text-white font-bold", children: [years, " lat"] })] }), _jsxs("p", { className: "text-white/70 flex justify-between", children: ["RRSO: ", _jsxs("span", { className: "text-white font-bold", children: [interestRate, "%"] })] })] }), _jsxs("div", { className: "bg-[#111] p-3 rounded-lg border border-white/10 mt-2", children: [_jsx("p", { className: "text-[10px] text-[#DC143C] font-bold uppercase tracking-widest mb-1", children: "Rata miesi\u0119czna" }), _jsxs("p", { className: "text-xl font-black text-white", children: [Math.round(monthlyPayment).toLocaleString('pl-PL'), " PLN"] })] })] }), _jsxs("div", { className: "bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2 border-b border-white/10 pb-2", children: [_jsx("h4", { className: "text-white font-bold uppercase tracking-widest text-white/70", children: "Zapisana Symulacja" }), _jsx("span", { className: "text-[10px] text-white/40", children: new Date(savedSimulation.date).toLocaleDateString() })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { className: "text-white/70 flex justify-between", children: ["Warto\u015B\u0107: ", _jsxs("span", { className: "text-white font-bold", children: [savedSimulation.propertyValue.toLocaleString('pl-PL'), " PLN"] })] }), _jsxs("p", { className: "text-white/70 flex justify-between", children: ["Wk\u0142ad: ", _jsxs("span", { className: "text-white font-bold", children: [savedSimulation.downPayment.toLocaleString('pl-PL'), " PLN"] })] }), _jsxs("p", { className: "text-white/70 flex justify-between", children: ["Okres: ", _jsxs("span", { className: "text-white font-bold", children: [savedSimulation.years, " lat"] })] }), _jsxs("p", { className: "text-white/70 flex justify-between", children: ["RRSO: ", _jsxs("span", { className: "text-white font-bold", children: [savedSimulation.interestRate, "%"] })] })] }), _jsxs("div", { className: "bg-[#111] p-3 rounded-lg border border-white/10 mt-2", children: [_jsx("p", { className: "text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1", children: "Rata miesi\u0119czna" }), _jsxs("p", { className: "text-xl font-black text-white", children: [Math.round(savedSimulation.monthlyPayment).toLocaleString('pl-PL'), " PLN"] })] })] })] }) })] })] }))] }));
}
