import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ChefsList from './pages/ChefsList';
import ChefProfile from './pages/ChefProfile';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'chef')  return <Navigate to="/dashboard" replace />;
    return <Navigate to="/my" replace />;
  }
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/login"     element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"  element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/chefs"     element={<ChefsList />} />
      <Route path="/chefs/:id" element={<ChefProfile />} />
      <Route path="/recipes"   element={<Recipes />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
      <Route path="/dashboard" element={<ProtectedRoute roles={['chef']}><Dashboard /></ProtectedRoute>} />
      <Route path="/my"        element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
      <Route path="/admin"     element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute roles={['admin']}><UserProfile /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

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
