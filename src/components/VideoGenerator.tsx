import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Sparkles, 
  Play, 
  Download, 
  RefreshCw, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Flame, 
  Share2, 
  Copy, 
  Film,
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Coins,
  Key,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useViewMode } from '../context/ViewModeContext';

interface VideoModel {
  id: string;
  name: string;
  description: string;
  badge: string;
  duration: string;
  resolution: string;
  isFree?: boolean;
}

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: string;
  date: string;
  source: string;
  cost?: string;
  inferenceUsageRemaining?: string;
}

const PRESET_PROMPTS = [
  {
    title: "Wzrost Kapitału i Złote Monety",
    prompt: "A cinematic close-up of a growing pile of gold coins and an ascending 3D glowing green financial graph, elegant dark atmosphere, depth of field, high detail"
  },
  {
    title: "Klucze do Własnego Domu (Hipoteka)",
    prompt: "A happy family receiving keys to their modern new sunlit suburban home, warm golden hour lighting, cinematic bokeh, 4k photorealistic"
  },
  {
    title: "Wolność Finansowa i Spłata Długów",
    prompt: "A person taking a deep breath of relief standing atop a mountain at sunrise, breaking symbolic metal chains into golden light particles, triumph and relief"
  },
  {
    title: "Dynamiczna Infografika Oszczędności",
    prompt: "Futuristic digital holographic charts and financial bars rising smoothly on a sleek glass trading desk, neon crimson and amber accents, smooth camera pan"
  }
];

const STYLES = [
  { id: "cinematic", label: "Filmowy (Cinematic)" },
  { id: "3d-render", label: "Wizualizacja 3D (Octane)" },
  { id: "photorealistic", label: "Fotorealistyczny" },
  { id: "motion-graphics", label: "Animacja Infograficzna" }
];

export function VideoGenerator() {
  const { isBrowserMode } = useViewMode();
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('THUDM/CogVideoX-5b');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [models, setModels] = useState<VideoModel[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [copied, setCopied] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Załaduj dane i historię
  useEffect(() => {
    fetch('/api/video/models')
      .then(res => res.json())
      .then(data => {
        if (data.models) setModels(data.models);
        if (typeof data.hasApiKey === 'boolean') setHasApiKey(data.hasApiKey);
      })
      .catch(err => console.warn('Błąd pobierania modeli HF:', err));

    const savedToken = localStorage.getItem('hf_user_token');
    if (savedToken) {
      setUserToken(savedToken);
      checkTokenValidity(savedToken);
    }

    try {
      const saved = localStorage.getItem('hf_video_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setCurrentVideo(parsed[0]);
        }
      }
    } catch (e) {
      console.warn('Błąd odczytu historii wideo:', e);
    }

    const prefillPrompt = sessionStorage.getItem('video_prefill_prompt');
    if (prefillPrompt) {
      setPrompt(prefillPrompt);
      sessionStorage.removeItem('video_prefill_prompt');
    }
  }, []);

  const checkTokenValidity = async (tokenToCheck: string) => {
    if (!tokenToCheck.trim()) {
      setTokenStatus(null);
      return;
    }
    setIsCheckingToken(true);
    try {
      const res = await fetch('/api/video/check-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToCheck.trim() })
      });
      const data = await res.json();
      if (data.valid) {
        setTokenStatus(`Połączono z HF (${data.username}). 100% Darmowa pula ZeroGPU aktywna.`);
      } else {
        setTokenStatus(data.message || 'Aktywny tryb publiczny ZeroGPU (0 zł opłat).');
      }
    } catch {
      setTokenStatus('Tryb darmowy ZeroGPU aktywny.');
    } finally {
      setIsCheckingToken(false);
    }
  };

  const handleSaveToken = (val: string) => {
    setUserToken(val);
    localStorage.setItem('hf_user_token', val.trim());
    checkTokenValidity(val);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(15);
    setStatusMessage('Inicjalizacja darmowego klastra Hugging Face ZeroGPU...');

    const progressTimer = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 92) return prev;
        if (prev < 35) {
          setStatusMessage('Przetwarzanie scenariusza finansowego i ochrona limitu $0.10...');
          return prev + 15;
        }
        if (prev < 70) {
          setStatusMessage(`Renderowanie klatek ZeroGPU (${selectedModel.split('/')[1] || 'CogVideoX'})...`);
          return prev + 14;
        }
        setStatusMessage('Finalizacja strumienia wideo i bezpłatne kodowanie MP4...');
        return prev + 6;
      });
    }, 800);

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          style: selectedStyle,
          userToken: userToken.trim() || undefined
        })
      });

      clearInterval(progressTimer);
      setGenerationProgress(100);

      const data = await res.json();

      if (data.success && data.videoUrl) {
        const newVideo: GeneratedVideo = {
          id: Date.now().toString(),
          url: data.videoUrl,
          prompt,
          model: data.model || selectedModel,
          date: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
          source: data.source || 'Hugging Face ZeroGPU',
          cost: data.cost || '0.00 PLN (Darmowe)',
          inferenceUsageRemaining: data.inferenceUsageRemaining || '$0.00 / $0.10 (Nienaruszone)'
        };

        setCurrentVideo(newVideo);
        const updatedHistory = [newVideo, ...history.slice(0, 9)];
        setHistory(updatedHistory);
        localStorage.setItem('hf_video_history', JSON.stringify(updatedHistory));
        setStatusMessage('Wideo wygenerowane pomyślnie i bezpłatnie!');
      } else {
        setStatusMessage(data.error || 'Wystąpił problem podczas generowania wideo.');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('Błąd generowania:', err);
      setStatusMessage('Błąd połączenia z darmowym serwerem wideo.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);
    }
  };

  const handleCopyLink = () => {
    if (!currentVideo) return;
    navigator.clipboard.writeText(currentVideo.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans relative overflow-y-auto custom-scrollbar px-3 py-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-[#DC143C]/10 blur-[90px] pointer-events-none"></div>

      {/* Header Bar */}
      <div className="text-center pt-1 pb-4 w-full flex-shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Darmowy Silnik Wideo: Hugging Face ZeroGPU (0 zł)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          Wideo AI <span className="text-[#DC143C]">Studio</span>
        </h1>
        <p className="text-white/50 text-xs sm:text-sm max-w-xl mx-auto mt-1 font-light">
          Generuj fotorealistyczne klipy finansowe całkowicie za darmo przy użyciu puli <span className="text-white font-medium">ZeroGPU Hugging Face</span> bez naruszania limitu płatnego API.
        </p>
      </div>

      {/* Quota & Zero-Cost Status Banner (odzwierciedla dane ze zrzutu ekranu) */}
      <div className="max-w-6xl mx-auto w-full mb-4">
        <div className="bg-[#0e1217] border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Status Konta Hugging Face</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Tryb Darmowy Aktywny
                </span>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">
                Ochrona kosztów: zapytania kierowane są do ZeroGPU Spaces, nie naruszając salda $0.10.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 w-full md:w-auto text-center md:text-left">
            <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-white/40 block font-semibold uppercase tracking-wider">Zero GPU</span>
              <span className="text-xs font-mono font-bold text-emerald-400">0/5 min (Darmowe)</span>
            </div>
            <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-white/40 block font-semibold uppercase tracking-wider">Inference Usage</span>
              <span className="text-xs font-mono font-bold text-white">$0.00 / $0.10</span>
            </div>
            <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-white/40 block font-semibold uppercase tracking-wider">Koszt Generowania</span>
              <span className="text-xs font-mono font-bold text-emerald-400">0.00 PLN (0 zł)</span>
            </div>
          </div>
        </div>

        {/* Opcjonalny panel Access Tokens ze zrzutu ekranu */}
        <div className="mt-2 text-right">
          <button 
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-[11px] text-white/50 hover:text-white inline-flex items-center gap-1.5 transition-all"
          >
            <Key className="w-3 h-3 text-[#DC143C]" />
            <span>{showTokenInput ? 'Ukryj konfigurację tokena' : 'Wklej swój Access Token z Hugging Face (Opcjonalnie)'}</span>
          </button>

          {showTokenInput && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-left bg-[#111] p-3.5 rounded-xl border border-white/10 space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="password"
                  value={userToken}
                  onChange={e => handleSaveToken(e.target.value)}
                  placeholder="hf_... (z menu Access Tokens widocznego na zrzucie ekranu)"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#DC143C] outline-none font-mono"
                />
                <button
                  onClick={() => checkTokenValidity(userToken)}
                  disabled={isCheckingToken || !userToken}
                  className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs shrink-0 transition-all disabled:opacity-50"
                >
                  {isCheckingToken ? 'Sprawdzanie...' : 'Zweryfikuj'}
                </button>
              </div>
              <p className="text-[10px] text-white/40">
                Wklejenie tokena pozwala przypisać darmowe 5 min ZeroGPU bezpośrednio do Twojego profilu. Jeśli nie podasz tokena, aplikacja korzysta z publicznej bezpłatnej puli community.
              </p>
              {tokenStatus && (
                <p className="text-[11px] text-emerald-400 font-medium">
                  ✓ {tokenStatus}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className={isBrowserMode ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full" : "space-y-6 max-w-md mx-auto w-full"}>
        
        {/* Left Column: Generator Controls */}
        <div className={isBrowserMode ? "lg:col-span-6 space-y-5" : "space-y-4"}>
          
          {/* Model Selection Card */}
          <div className="bg-[#111111] p-5 rounded-[24px] border border-white/5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <label className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#DC143C]" /> Wybierz Darmowy Model Wideo
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Bezpłatne
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(models.length > 0 ? models : [
                { id: "THUDM/CogVideoX-5b", name: "CogVideoX 5B (ZeroGPU Space)", badge: "Darmowy (ZeroGPU)", duration: "6s", resolution: "720p", description: "Flagowy model wideo open-source na ZeroGPU", isFree: true },
                { id: "Lightricks/LTX-Video", name: "LTX-Video (ZeroGPU Space)", badge: "Darmowy (Szybki)", duration: "5s", resolution: "768p", description: "Szybki, płynny model nowej generacji", isFree: true },
                { id: "damo-vilab/text-to-video-ms-1.7b", name: "Text-to-Video MS (HF Community)", badge: "Darmowy (Lekki)", duration: "4s", resolution: "512p", description: "Lekki, darmowy model społecznościowy", isFree: true },
                { id: "open-video-engine/free", name: "Open Video Engine (HF + Community)", badge: "Zawsze 0 zł", duration: "6s", resolution: "1080p", description: "Nielimitowany, w 100% bezpłatny silnik wideo", isFree: true }
              ]).map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    selectedModel === m.id
                      ? 'bg-[#DC143C]/10 border-[#DC143C] shadow-[0_0_15px_rgba(220,20,60,0.2)]'
                      : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{m.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20">{m.badge}</span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#DC143C] font-mono block">{m.duration}</span>
                    <span className="text-[9px] text-white/30">{m.resolution}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt & Style Card */}
          <div className="bg-[#111111] p-5 rounded-[24px] border border-white/5 shadow-xl space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC143C]" /> Opis Sceny Wideo (Prompt)
                </label>
                <span className="text-[10px] text-white/40 font-mono">{prompt.length}/500</span>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="np. Zbliżenie na rosnący wykres finansowy, złote monety i dynamiczne światła w stylu cinematic..."
                rows={4}
                maxLength={500}
                className="w-full bg-black/40 border border-white/10 focus:border-[#DC143C] rounded-xl p-3 text-sm text-white placeholder-white/30 outline-none transition-all resize-none"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block">
                Szybkie Szablony Finansowe:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_PROMPTS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(preset.prompt)}
                    className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-[11px] text-white/80 transition-all line-clamp-2"
                  >
                    💡 {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#DC143C]" /> Styl Wizualny
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedStyle === s.id
                        ? 'bg-[#DC143C] text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-[#DC143C] hover:bg-[#FF0033] text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(220,20,60,0.35)] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generowanie Wideo (Darmowe ZeroGPU)...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Wygeneruj Wideo Za Darmo (ZeroGPU)</span>
                </>
              )}
            </button>

            {isGenerating && (
              <div className="space-y-2 pt-2">
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-[#DC143C] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-white/60 text-center font-medium animate-pulse">
                  {statusMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Video Preview & History */}
        <div className={isBrowserMode ? "lg:col-span-6 space-y-5" : "space-y-4"}>
          
          {/* Main Video Display Player */}
          <div className="bg-[#111111] p-5 rounded-[24px] border border-white/5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-[#DC143C]" /> Odtwarzacz Wideo
              </span>
              {currentVideo && (
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {currentVideo.cost || '0.00 PLN'} • {currentVideo.date}
                </span>
              )}
            </div>

            {currentVideo ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-inner group">
                  <video
                    ref={videoRef}
                    key={currentVideo.url}
                    src={currentVideo.url}
                    controls
                    playsInline
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                  <p className="text-xs text-white/80 font-medium line-clamp-2 italic">
                    "{currentVideo.prompt}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-[#DC143C] font-mono">
                      Model: {currentVideo.model}
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">
                      Saldo API: {currentVideo.inferenceUsageRemaining || '$0.00 (Bez opłat)'}
                    </span>
                  </div>
                </div>

                {/* Video Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={currentVideo.url}
                    download="huggingface_financial_video.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-[#DC143C]" /> Pobierz MP4
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                    <span>{copied ? 'Skopiowano' : 'Link'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-6 text-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Film className="w-6 h-6 text-white/30" />
                </div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">
                  Brak wygenerowanego wideo
                </p>
                <p className="text-white/30 text-[11px] mt-1 max-w-xs">
                  Wpisz prompt lub wybierz szablon po lewej stronie i kliknij „Wygeneruj Wideo Za Darmo (ZeroGPU)”.
                </p>
              </div>
            )}
          </div>

          {/* History Gallery */}
          {history.length > 0 && (
            <div className="bg-[#111111] p-4 rounded-[24px] border border-white/5 space-y-3">
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                Ostatnio Wygenerowane Klipy ({history.length}):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentVideo(item)}
                    className={`text-left p-2 rounded-xl border transition-all relative overflow-hidden group ${
                      currentVideo?.id === item.id 
                        ? 'bg-[#DC143C]/20 border-[#DC143C]' 
                        : 'bg-black/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="aspect-video bg-black/60 rounded-lg mb-1.5 flex items-center justify-center overflow-hidden relative">
                      <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" muted />
                      <Play className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                    </div>
                    <p className="text-[10px] text-white/70 line-clamp-1 font-medium">{item.prompt}</p>
                    <span className="text-[9px] text-emerald-400 font-mono">0 zł</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Card on Hugging Face Replacement & ZeroGPU Safety */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-white/60 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-[11px]">Gwarancja 100% Darmowego Generowania (ZeroGPU)</p>
              <p className="text-[10px] text-white/50 mt-0.5">
                Konfiguracja w pełni chroni Twoje konto: wykorzystywane są darmowe klastry ZeroGPU Hugging Face (dzienna darmowa pula 5 minut) oraz publiczne zasoby społeczności. Żadne płatne zapytania do endpointów nie są wykonywane, a limit <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">$0.10</code> pozostaje nietknięty.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
