import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'soft-dark' | 'high-contrast';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || 'high-contrast'; // default to high-contrast as previously styled
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    // Apply theme class to body/html for styling hook
    const root = window.document.documentElement;
    root.classList.remove('soft-dark', 'high-contrast');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'soft-dark' ? 'high-contrast' : 'soft-dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
