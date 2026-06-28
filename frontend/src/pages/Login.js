import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function MaskIcon() {
  return (
    <svg className="register-mask" viewBox="0 0 96 72" role="img" aria-label="Masque de bal">
      <defs>
        <linearGradient id="loginMaskGold" x1="18" y1="10" x2="78" y2="62">
          <stop stopColor="#FDE68A" />
          <stop offset="0.48" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <filter id="loginMaskGlow" x="-30%" y="-40%" width="160%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M10 17C22 9 34 10 48 18C62 10 74 9 86 17C84 43 71 62 55 55C51 53 49 50 48 48C47 50 45 53 41 55C25 62 12 43 10 17Z"
        fill="rgba(255,255,255,0.06)"
        stroke="url(#loginMaskGold)"
        strokeWidth="2.4"
        filter="url(#loginMaskGlow)"
      />
      <path d="M25 29C32 24 39 25 43 31C35 35 30 35 25 29Z" fill="#0d0015" />
      <path d="M53 31C57 25 64 24 71 29C66 35 61 35 53 31Z" fill="#0d0015" />
      <path d="M43 43C46 45 50 45 53 43" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      <path fill="#fff" d="M16.67 15.56l.53-3.49h-3.33V9.8c0-.96.47-1.89 1.96-1.89h1.51V4.95s-1.37-.24-2.68-.24c-2.74 0-4.53 1.68-4.53 4.7v2.66H7.08v3.49h3.05V24a12.35 12.35 0 0 0 3.74 0v-8.44h2.8z" />
    </svg>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const oauthError = params.get('oauth_error');

    if (oauthError) {
      toast.error('Connexion sociale impossible. Veuillez réessayer.');
      window.history.replaceState({}, '', '/login');
      return;
    }

    if (!token || !userParam) return;

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      login(user, token);
      toast.success(`Bienvenue, ${user.prenom || user.nom || 'invité'} !`);
      window.history.replaceState({}, '', '/login');

      if (user.role === 'admin' || user.role === 'sous_admin') navigate('/admin', { replace: true });
      else if (user.role === 'inspecteur') navigate('/inspecteur', { replace: true });
      else navigate('/client', { replace: true });
    } catch (err) {
      toast.error('Connexion sociale impossible. Veuillez réessayer.');
      window.history.replaceState({}, '', '/login');
    }
  }, [login, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      toast.success(`Bienvenue, ${res.data.user.prenom} !`);
      const role = res.data.user.role;
      if (role === 'admin' || role === 'sous_admin') navigate('/admin');
      else if (role === 'inspecteur') navigate('/inspecteur');
      else navigate('/client');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page login-page">
      <Link to="/" className="back-home-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Retour
      </Link>
      <div className="register-stage-light register-stage-light-violet register-stage-light-one" />
      <div className="register-stage-light register-stage-light-gold register-stage-light-two" />
      <div className="register-stage-light register-stage-light-violet register-stage-light-three" />
      <div className="register-stage-light register-stage-light-gold register-stage-light-four" />

      <div className="register-card login-card">
        <div className="register-mask-wrap">
          <MaskIcon />
        </div>
        <span className="login-kicker">Espace invite</span>
        <h1>Bal Masqué 2026</h1>
        <p className="auth-subtitle">Connexion à votre espace</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="votre@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Votre mot de passe"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <div className="social-auth">
            <a href={`${BACKEND_URL}/api/auth/google`} className="btn-secondary google-btn">
              <GoogleIcon />
              <span>Google</span>
            </a>
            <a href={`${BACKEND_URL}/api/auth/facebook`} className="btn-secondary facebook-btn">
              <FacebookIcon />
              <span>Facebook</span>
            </a>
          </div>
        </form>
        <p className="auth-link">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
