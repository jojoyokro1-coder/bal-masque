import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CLIENT_AUTH_DISABLED = process.env.REACT_APP_CLIENT_AUTH_DISABLED === 'true';

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

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [clientAuthDisabled, setClientAuthDisabled] = useState(CLIENT_AUTH_DISABLED);
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

  useEffect(() => {
    const chargerStatutAuthClients = async () => {
      try {
        const res = await api.get('/auth/client-auth-status');
        setClientAuthDisabled(Boolean(res.data.disabled));
      } catch (err) { }
    };

    chargerStatutAuthClients();
  }, []);

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
        {clientAuthDisabled && (
          <p className="auth-notice">
            Connexion client temporairement suspendue. Accès admin maintenu.
          </p>
        )}
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
        </form>
        <p className="auth-link">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
