/**
 * @file App.jsx
 * @description Root application component.
 *
 * Sets up the React Router, wraps the app in the ThemeProvider and
 * AuthProvider context providers, and defines all application routes.
 *
 * Route protection is handled by two wrapper components:
 *  - ProtectedRoute — redirects unauthenticated users to /login and
 *    optionally enforces a role allowlist.
 *  - GuestRoute    — redirects already-authenticated users to their
 *    role-appropriate dashboard so they can't visit /login or /register.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar         from './components/Navbar';
import Home           from './pages/Home';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ChefsList      from './pages/ChefsList';
import ChefProfile    from './pages/ChefProfile';
import Recipes        from './pages/Recipes';
import RecipeDetail   from './pages/RecipeDetail';
import Dashboard      from './pages/Dashboard';
import UserDashboard  from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile    from './pages/UserProfile';

// ---------------------------------------------------------------------------
// Route Guards
// ---------------------------------------------------------------------------

/**
 * ProtectedRoute
 *
 * Renders `children` only when the user is authenticated.
 * If a `roles` array is provided, also checks that the user's role is included.
 * Unauthenticated users are redirected to /login.
 * Authenticated users with the wrong role are redirected to the home page.
 *
 * @param {{ children: React.ReactNode, roles?: string[] }} props
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

/**
 * GuestRoute
 *
 * Renders `children` only when the user is NOT authenticated.
 * Authenticated users are redirected to their role-appropriate dashboard
 * so they don't land on the login or register pages after already signing in.
 *
 * @param {{ children: React.ReactNode }} props
 */
const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin"     replace />;
    if (user.role === 'chef')  return <Navigate to="/dashboard" replace />;
    return <Navigate to="/my" replace />;
  }
  return children;
};

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

/**
 * AppRoutes
 *
 * Renders the Navbar (always visible) and the route-matched page component.
 * Defined as a separate component so it can consume AuthContext (which is
 * provided by AuthProvider in the App wrapper below).
 */
const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      {/* Public pages */}
      <Route path="/"          element={<Home />} />
      <Route path="/chefs"     element={<ChefsList />} />
      <Route path="/chefs/:id" element={<ChefProfile />} />
      <Route path="/recipes"   element={<Recipes />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />

      {/* Auth pages — redirect logged-in users away */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Role-protected dashboards */}
      <Route path="/dashboard" element={<ProtectedRoute roles={['chef']}><Dashboard /></ProtectedRoute>} />
      <Route path="/my"        element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
      <Route path="/admin"     element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      {/* Admin-only user profile view */}
      <Route path="/admin/users/:id" element={<ProtectedRoute roles={['admin']}><UserProfile /></ProtectedRoute>} />

      {/* Catch-all — redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

// ---------------------------------------------------------------------------
// App Root
// ---------------------------------------------------------------------------

/**
 * App
 *
 * The top-level component. Wraps everything in BrowserRouter, ThemeProvider,
 * and AuthProvider so all child components have access to routing, theme, and
 * auth context.
 */
const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
