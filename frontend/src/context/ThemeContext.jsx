/**
 * @file ThemeContext.jsx
 * @description Global light/dark mode state for the React app.
 *
 * Reads the user's saved preference from localStorage on mount and applies
 * the `dark` class to the document root so Tailwind's `darkMode: 'class'`
 * and the CSS variable overrides in index.css take effect.
 *
 * The preference is persisted to localStorage so it survives page refreshes
 * and browser restarts (unlike the auth session which uses sessionStorage).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

/**
 * ThemeProvider
 *
 * Wraps the application and makes the current theme and toggle function
 * available to all child components via the `useTheme` hook.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const ThemeProvider = ({ children }) => {
  // Initialise from localStorage — default to light mode if no preference is saved
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  /**
   * Sync the `dark` class on <html> and persist the preference whenever
   * the `dark` state changes.
   */
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist the preference so it survives page refreshes
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  /**
   * Toggle between light and dark mode.
   */
  const toggle = () => setDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme hook
 *
 * Convenience hook for consuming the ThemeContext in any component.
 *
 * @returns {{ dark: boolean, toggle: () => void }}
 */
export const useTheme = () => useContext(ThemeContext);
