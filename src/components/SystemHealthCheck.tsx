import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Database, Sparkles, CheckCircle2, AlertTriangle, 
  XCircle, RefreshCw, X, Shield, Server, Clock 
} from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  totalLatencyMs: number;
  environment: string;
  supabase: {
    configured: boolean;
    reachable: boolean;
    latencyMs: number;
    urlPreview: string;
    message: string;
  };
  gemini: {
    configured: boolean;
    reachable: boolean;
    latencyMs: number;
    model: string;
    message: string;
  };
}

interface SystemHealthCheckProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHealthCheck: React.FC<SystemHealthCheckProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const runHealthCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json: HealthData = await res.json();
      setData(json);
      setLastCheckTime(new Date().toLocaleTimeString('pl-PL'));
    } catch (err: any) {
      setError(err?.message || 'Nie udało się połączyć z endpointem /api/health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen, runHealthCheck]);

  if (!isOpen) return null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#0e0e12] border-2 border-[#DC143C]/40 rounded-2xl shadow-2xl p-5 text-zinc-200 font-sans backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#DC143C]/15 border border-[#DC143C]/40 flex items-center justify-center text-[#DC143C]">
              <Activity size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>System Health Check</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-normal">
                  Prywatny Admin
                </span>
              </h4>
              <p className="text-[10px] text-zinc-500 font-mono">
                {lastCheckTime ? `Ostatni test: ${lastCheckTime}` : 'Testowanie połączeń...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Uruchom test ponownie"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#DC143C]' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Ukryj panel diagnostyczny"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-3 flex items-start gap-2">
            <XCircle size={15} className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">{error}</p>
          </div>
        )}

        {/* Supabase Status Card */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-emerald-400" />
                <span className="text-xs font-bold text-white font-mono">Supabase API</span>
              </div>
              {data ? (
                data.supabase.reachable ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                    <CheckCircle2 size={11} />
                    <span>Połączono ({data.supabase.latencyMs} ms)</span>
                  </span>
                ) : data.supabase.configured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold">
                    <AlertTriangle size={11} />
                    <span>Niedostępny</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 font-semibold">
                    <XCircle size={11} />
                    <span>Brak klucza</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] text-zinc-500 animate-pulse">Sprawdzanie...</span>
              )}
            </div>

            <div className="text-[11px] text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Adres URL:</span>
                <span className="font-mono text-zinc-300 text-[10px] truncate max-w-[200px]">
                  {data?.supabase.urlPreview || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Komunikat:</span>
                <span className="text-zinc-300 text-[10px] text-right">
                  {data?.supabase.message || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Gemini AI Status Card */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#DC143C]" />
                <span className="text-xs font-bold text-white font-mono">Gemini AI API</span>
              </div>
              {data ? (
                data.gemini.reachable ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                    <CheckCircle2 size={11} />
                    <span>Aktywne ({data.gemini.latencyMs} ms)</span>
                  </span>
                ) : data.gemini.configured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-semibold">
                    <XCircle size={11} />
                    <span>Błąd wywołania</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 font-semibold">
                    <XCircle size={11} />
                    <span>Brak GEMINI_API_KEY</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] text-zinc-500 animate-pulse">Sprawdzanie...</span>
              )}
            </div>

            <div className="text-[11px] text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Testowany model:</span>
                <span className="font-mono text-zinc-300 text-[10px]">
                  {data?.gemini.model || 'gemini-2.5-flash'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status modułu:</span>
                <span className="text-zinc-300 text-[10px] text-right truncate max-w-[200px]">
                  {data?.gemini.message || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Environment & Node Runtime */}
          {data && (
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Server size={11} />
                <span>Env: {data.environment}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} />
                <span>Uptime: {formatUptime(data.uptimeSeconds)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500">
          <span>Widok diagnostyczny (niewidoczny dla gości)</span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white underline cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
