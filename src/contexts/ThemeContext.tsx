import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, PaletteMode } from '@mui/material';
import { lightThemeOptions, darkThemeOptions } from '../theme';

interface ThemeContextType {
  toggleTheme: () => void;
  mode: PaletteMode;
}

const ThemeContext = createContext<ThemeContextType>({
  toggleTheme: () => {},
  mode: 'light',
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      const storedMode = localStorage.getItem('themeMode') as PaletteMode;
      return storedMode || 'dark';
    } catch (error) {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error("Failed to save theme mode to localStorage", error);
    }
  }, [mode]);

  // Mirror the mode onto <html> so plain CSS (e.g. src/index.css) can react to
  // it via `color-scheme` and CSS variables. MUI's sx props cannot reach the
  // document element, and CssBaseline only styles `body`.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme-mode', mode);
    root.style.setProperty('--focus-ring-color', mode === 'dark' ? '#60a5fa' : '#2563eb');
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => 
    createTheme(mode === 'light' ? lightThemeOptions : darkThemeOptions), 
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
