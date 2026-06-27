import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import TicketHomePage from './pages/TicketHomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import InspecteurDashboard from './pages/InspecteurDashboard';
import './App.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">⏳ Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">⏳ Chargement...</div>;
  if (!user) return <LandingPage />;
  if (user.role === 'admin' || user.role === 'sous_admin') return <Navigate to="/admin" />;
  if (user.role === 'inspecteur') return <Navigate to="/inspecteur" />;
  return <Navigate to="/client" />;
}

function LoginRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">⏳ Chargement...</div>;
  if (!user) return <Login />;
  if (user.role === 'admin' || user.role === 'sous_admin') return <Navigate to="/admin" />;
  if (user.role === 'inspecteur') return <Navigate to="/inspecteur" />;
  return <Navigate to="/client" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/" element={<TicketHomePage />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={
            <PrivateRoute roles={['admin', 'sous_admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/client" element={
            <PrivateRoute roles={['client']}>
              <ClientDashboard />
            </PrivateRoute>
          } />
          <Route path="/inspecteur" element={
            <PrivateRoute roles={['inspecteur']}>
              <InspecteurDashboard />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
