import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function InspecteurDashboard() {
  const { user, logout } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [codeManuel, setCodeManuel] = useState('');
  const scannerRef = useRef(null);

  const demarrerScanner = () => {
    setResultat(null);
    setScanning(true);
  };

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    }, false);

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanning(false);
        try {
          const payload = JSON.parse(decodedText);
          await validerTicket(payload.ticket);
        } catch {
          await validerTicket(decodedText);
        }
      },
      (err) => { /* ignore scan errors */ }
    );

    scannerRef.current = scanner;
    return () => { try { scanner.clear(); } catch { } };
  }, [scanning]);

  const validerTicket = async (code) => {
    const codeNettoye = code.trim();

    try {
      const res = await api.post('/tickets/scanner', { code_unique: codeNettoye });
      const entree = {
        code: codeNettoye.slice(0, 8) + '...',
        valide: res.data.valide,
        message: res.data.message,
        client: res.data.client,
        ticket: res.data.ticket,
        heure: new Date().toLocaleTimeString('fr-FR')
      };
      setResultat(entree);
      setHistorique(h => [entree, ...h.slice(0, 19)]);
      if (res.data.valide) toast.success('✅ Entrée autorisée !');
      else toast.error('❌ Ticket refusé');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de scan');
    }
  };

  const validerManuel = async (e) => {
    e.preventDefault();
    if (!codeManuel.trim()) return;
    await validerTicket(codeManuel.trim());
    setCodeManuel('');
  };

  return (
    <div className="dashboard inspecteur-dashboard">
      <nav className="navbar">
        <span className="navbar-brand">🎭 Bal Masqué — Inspecteur</span>
        <div className="navbar-user">
          <span>{user?.prenom} {user?.nom}</span>
          <button onClick={logout} className="btn-logout">Déconnexion</button>
        </div>
      </nav>

      <div className="dashboard-content inspecteur-content">
        <div className="scan-section">
          <h2>Scanner un ticket</h2>

          {!scanning && (
            <button className="btn-scan" onClick={demarrerScanner}>
              📷 Démarrer le scan
            </button>
          )}

          {scanning && (
            <div>
              <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
              <button className="btn-secondary" onClick={() => { scannerRef.current?.clear(); setScanning(false); }}>
                Annuler
              </button>
            </div>
          )}

          {resultat && (
            <div className={`scan-result ${resultat.valide ? 'result-valid' : 'result-invalid'}`}>
              <div className="result-icon">{resultat.valide ? '✅' : '❌'}</div>
              <div className="result-message">{resultat.message}</div>
              {resultat.valide && resultat.client && (
                <div className="result-client">
                  <strong>{resultat.client.prenom} {resultat.client.nom}</strong>
                  <span>{resultat.client.email}</span>
                  {resultat.ticket && (
                    <span>{resultat.ticket.ticket_type === 'couple' ? 'Couple' : 'Solo'} - {Number(resultat.ticket.prix_unitaire || 0).toLocaleString()} FCFA</span>
                  )}
                </div>
              )}
              <button className="btn-primary" onClick={demarrerScanner}>Scanner un autre</button>
            </div>
          )}

          <div className="manuel-scan">
            <p>Ou saisir le code manuellement :</p>
            <form onSubmit={validerManuel} className="form-inline">
              <input
                type="text"
                value={codeManuel}
                onChange={e => setCodeManuel(e.target.value)}
                placeholder="Code UUID du ticket..."
              />
              <button type="submit" className="btn-primary">Valider</button>
            </form>
          </div>
        </div>

        <div className="historique-section">
          <h3>Historique du scan ({historique.length})</h3>
          {historique.length === 0 ? (
            <p className="empty-state">Aucun ticket scanné pour l'instant.</p>
          ) : (
            <div className="historique-list">
              {historique.map((h, i) => (
                <div key={i} className={`historique-item ${h.valide ? 'item-valid' : 'item-invalid'}`}>
                  <span className="histo-icon">{h.valide ? '✅' : '❌'}</span>
                  <div className="histo-info">
                    <span>{h.client ? `${h.client.prenom} ${h.client.nom}` : h.code}</span>
                    <small>{h.message}</small>
                  </div>
                  <span className="histo-heure">{h.heure}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
