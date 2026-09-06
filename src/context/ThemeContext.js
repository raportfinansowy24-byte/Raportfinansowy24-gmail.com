import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('app-theme');
        return saved || 'high-contrast'; // default to high-contrast as previously styled
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
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, toggleTheme, setTheme }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
