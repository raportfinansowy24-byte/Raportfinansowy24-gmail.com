import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewMode = 'mobile' | 'browser';

interface ViewModeContextType {
  viewMode: ViewMode;
  isBrowserMode: boolean;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('app-view-mode');
      if (saved === 'browser' || saved === 'mobile') {
        return saved;
      }
      // Auto-detect: if wide screen (>= 1024px), default to browser mode
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        return 'browser';
      }
    } catch {
      // ignore
    }
    return 'browser'; // Defaulting to browser mode gives desktop users the rich experience right away, while mobile users can easily toggle or responsive CSS adapts
  });

  useEffect(() => {
    try {
      localStorage.setItem('app-view-mode', viewMode);
    } catch {
      // ignore
    }
    const root = window.document.documentElement;
    root.classList.remove('view-mobile', 'view-browser');
    root.classList.add(`view-${viewMode}`);
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewModeState(prev => (prev === 'mobile' ? 'browser' : 'mobile'));
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        isBrowserMode: viewMode === 'browser',
        toggleViewMode,
        setViewMode
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
