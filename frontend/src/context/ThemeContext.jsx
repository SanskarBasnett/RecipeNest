import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Read saved preference or default to light
  const [dark, setDark] = useState(() => localStorage.getItem('rn_theme') === 'dark');

  useEffect(() => {
    // Toggle .dark class on <html> element
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('rn_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
