import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CLIENT_AUTH_DISABLED_FALLBACK = process.env.REACT_APP_CLIENT_AUTH_DISABLED === 'true';

function MaskIcon() {
  return (
    <svg className="register-mask" viewBox="0 0 96 72" role="img" aria-label="Masque de bal">
      <defs>
        <linearGradient id="maskGold" x1="18" y1="10" x2="78" y2="62">
          <stop stopColor="#FDE68A" />
          <stop offset="0.48" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <filter id="maskGlow" x="-30%" y="-40%" width="160%" height="180%">
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
        stroke="url(#maskGold)"
        strokeWidth="2.4"
        filter="url(#maskGlow)"
      />
      <path d="M25 29C32 24 39 25 43 31C35 35 30 35 25 29Z" fill="#0d0015" />
      <path d="M53 31C57 25 64 24 71 29C66 35 61 35 53 31Z" fill="#0d0015" />
      <path d="M43 43C46 45 50 45 53 43" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Register() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [clientAuthDisabled, setClientAuthDisabled] = useState(CLIENT_AUTH_DISABLED_FALLBACK);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    if (clientAuthDisabled) {
      toast.error('Les inscriptions client sont temporairement suspendues.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      toast.success(`Bienvenue, ${res.data.user.prenom} !`);
      navigate('/client');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Link to="/" className="back-home-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Retour
      </Link>
      <div className="register-stage-light register-stage-light-violet register-stage-light-one" />
      <div className="register-stage-light register-stage-light-gold register-stage-light-two" />
      <div className="register-stage-light register-stage-light-violet register-stage-light-three" />
      <div className="register-stage-light register-stage-light-gold register-stage-light-four" />

      <div className="register-card">
        <div className="register-mask-wrap">
          <MaskIcon />
        </div>
        <h1>Bal Masqué 2026</h1>
        <p className="auth-subtitle">Créer un compte</p>
        {clientAuthDisabled && (
          <p className="auth-notice">
            Les inscriptions client sont temporairement suspendues.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input type="text" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Jean" required disabled={clientAuthDisabled} />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input type="text" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Dupont" required disabled={clientAuthDisabled} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" required disabled={clientAuthDisabled} />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 caractères" minLength="6" required disabled={clientAuthDisabled} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || clientAuthDisabled}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="auth-link">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
