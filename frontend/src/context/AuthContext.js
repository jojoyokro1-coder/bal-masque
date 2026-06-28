import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE   =  1 * 60 * 1000; // avertissement 1 minute avant

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutTimerRef  = useRef(null);
  const warningTimerRef = useRef(null);
  const warningToastRef = useRef(null);

  // ── Déconnexion ────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warningTimerRef.current);
    if (warningToastRef.current) toast.dismiss(warningToastRef.current);
  }, []);

  // ── Démarrage / réinitialisation des timers ─────────────────────────────────
  const resetTimers = useCallback(() => {
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warningTimerRef.current);
    if (warningToastRef.current) {
      toast.dismiss(warningToastRef.current);
      warningToastRef.current = null;
    }

    // Avertissement à 9 min d'inactivité
    warningTimerRef.current = setTimeout(() => {
      warningToastRef.current = toast(
        '⚠️ Vous serez déconnecté dans 1 minute pour inactivité.',
        { duration: 60000, icon: '⏱️' }
      );
    }, INACTIVITY_LIMIT - WARNING_BEFORE);

    // Déconnexion à 10 min d'inactivité
    logoutTimerRef.current = setTimeout(() => {
      toast.error('🔒 Déconnecté pour inactivité (10 min).');
      logout();
    }, INACTIVITY_LIMIT);
  }, [logout]);

  // ── Écoute les événements utilisateur ──────────────────────────────────────
  useEffect(() => {
    if (!user) return; // pas connecté → pas de timer

    const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetTimers();

    EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimers(); // démarrage initial

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      clearTimeout(logoutTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [user, resetTimers]);

  // ── Restauration session ───────────────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser  = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
