/**
 * @file AuthContext.jsx
 * @description Global authentication state for the React app.
 *
 * Provides login, register, logout, and updateUser functions to all
 * components via the `useAuth` hook. The authenticated user object is
 * persisted in sessionStorage so it survives page refreshes but is
 * automatically cleared when the browser tab or window is closed.
 */

import React, { createContext, useContext, useState } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

// ---------------------------------------------------------------------------
// sessionStorage helpers
// Using sessionStorage (not localStorage) means the session is tied to the
// browser tab — closing the tab/browser logs the user out automatically.
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'recipenest_user';
const store = {
  /** Read the stored user object, or null if nothing is stored. */
  get:    ()      => JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'),
  /** Persist the user object as a JSON string. */
  set:    (value) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
  /** Remove the stored user object (logout). */
  remove: ()      => sessionStorage.removeItem(STORAGE_KEY),
};

/**
 * AuthProvider
 *
 * Wraps the application and makes auth state available to all child components.
 * Initialises `user` from sessionStorage so the UI is correct on page refresh.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  // Initialise from sessionStorage so the user stays logged in on refresh
  const [user, setUser] = useState(() => store.get());

  /**
   * Log in with email and password.
   * Stores the returned user+token object and updates React state.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} The authenticated user object (includes role and token).
   */
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    store.set(data);
    setUser(data);
    return data;
  };

  /**
   * Register a new account.
   * Stores the returned user+token object and updates React state.
   *
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} role - 'user' or 'chef'
   * @returns {Promise<object>} The newly created user object.
   */
  const register = async (name, email, password, role) => {
    const { data } = await API.post('/auth/register', { name, email, password, role });
    store.set(data);
    setUser(data);
    return data;
  };

  /**
   * Log out the current user.
   * Clears sessionStorage and resets React state to null.
   */
  const logout = () => {
    store.remove();
    setUser(null);
  };

  /**
   * Merge updated profile fields into the stored user object.
   * Called after profile edits or avatar uploads so the UI reflects
   * the latest data without requiring a full re-login.
   *
   * @param {object} updated - Partial user object with updated fields.
   */
  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    store.set(merged);
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth hook
 *
 * Convenience hook for consuming the AuthContext in any component.
 *
 * @returns {{ user, login, register, logout, updateUser }}
 */
export const useAuth = () => useContext(AuthContext);
