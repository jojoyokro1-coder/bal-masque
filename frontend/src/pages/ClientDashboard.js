import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [onglet, setOnglet] = useState('acheter');
  const [evenement, setEvenement] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [categorieTicket, setCategorieTicket] = useState('solo');
  const [tickets, setTickets] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [resteSecondes, setResteSecondes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ticketSelectionne, setTicketSelectionne] = useState(null);

  useEffect(() => {
    chargerEvenement();
    chargerTickets();
    chargerCommandes();
  }, []);

  // Compte à rebours
  useEffect(() => {
    if (resteSecondes <= 0) return;
    const timer = setInterval(() => {
      setResteSecondes(s => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resteSecondes]);

  const chargerEvenement = async () => {
    try {
      const res = await api.get('/tickets/evenement');
      setEvenement(res.data);
    } catch (err) { }
  };

  const chargerTickets = async () => {
    try {
      const res = await api.get('/tickets/mes-tickets');
      setTickets(res.data);
    } catch (err) { }
  };

  const chargerCommandes = async () => {
    try {
      const res = await api.get('/tickets/mes-commandes');
      setCommandes(res.data.commandes);
      setResteSecondes(res.data.resteSecondes);
    } catch (err) { }
  };

  const acheterTickets = async () => {
    if (resteSecondes > 0) {
      toast.error(`Attendez encore ${resteSecondes}s avant une nouvelle commande.`);
      return;
    }
    if (!evenement) return;
    setLoading(true);
    try {
      const res = await api.post('/tickets/acheter', { evenement_id: evenement.id, quantite, ticket_type: categorieTicket });
      const paymentUrl = res.data?.payment_url;

      if (!paymentUrl) {
        toast.error('Lien de paiement indisponible.');
        return;
      }

      toast.success('Redirection vers le paiement...');
      setQuantite(1);
      window.location.assign(paymentUrl);
    } catch (err) {
      const data = err.response?.data;
      if (data?.resteSecondes) setResteSecondes(data.resteSecondes);
      toast.error(data?.message || 'Erreur lors de l\'achat');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const categoriesTickets = evenement?.categories_tickets || {
    solo: { label: 'Solo', prix: 8000 },
    couple: { label: 'Couple', prix: 12000 }
  };
  const categorieActive = categoriesTickets[categorieTicket] || categoriesTickets.solo;
  const prixTicket = Number(categorieActive?.prix || 0);
  const labelCategorie = (type) => categoriesTickets[type]?.label || type || 'Solo';
  const promotionSolo = evenement?.promotion_lancement?.solo || null;
  const calculerPrixSolo = (rang) => {
    if (rang === 1) return { prix: 0, badge: '🎉 Ticket Offert · Premier acheteur' };
    if (rang >= 2 && rang <= 5) return { prix: 5000, badge: '🔥 Offre Early Bird · -28%' };
    return { prix: 8000, badge: null };
  };
  const promotionSelection = (() => {
    if (categorieTicket !== 'solo' || !promotionSolo) return null;
    const ticketsPromo = Array.from({ length: quantite }, (_, index) => {
      const rang = Number(promotionSolo.next_rank || 1) + index;
      return { rang, ...calculerPrixSolo(rang) };
    });

    return {
      originalPrice: Number(promotionSolo.original_price || 8000),
      earlyBirdRemaining: Number(promotionSolo.early_bird_remaining || 0),
      limitedRemaining: Number(promotionSolo.limited_stock_remaining || 0),
      tickets: ticketsPromo,
      total: ticketsPromo.reduce((sum, ticket) => sum + ticket.prix, 0),
      nextTicket: ticketsPromo[0]
    };
  })();
  const totalAchat = promotionSelection?.total ?? quantite * prixTicket;

  const copierCodeTicket = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code du ticket copie');
    } catch {
      toast.error('Impossible de copier le code');
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <span className="navbar-brand">🎭 Bal Masqué 2026</span>
        <div className="navbar-user">
          <span>Bonjour, {user?.prenom} !</span>
          <button onClick={logout} className="btn-logout">Déconnexion</button>
        </div>
      </nav>

      <div className="dashboard-tabs">
        <button className={onglet === 'acheter' ? 'tab active' : 'tab'} onClick={() => setOnglet('acheter')}>🎟️ Acheter</button>
        <button className={onglet === 'tickets' ? 'tab active' : 'tab'} onClick={() => setOnglet('tickets')}>🎫 Mes tickets ({tickets.length})</button>
        <button className={onglet === 'commandes' ? 'tab active' : 'tab'} onClick={() => setOnglet('commandes')}>📋 Historique</button>
      </div>

      <div className="dashboard-content">

        {onglet === 'acheter' && (
          <div className="achat-section">
            {evenement ? (
              <div className="event-card-client">
                <div className="event-header">
                  <h2>🎭 {evenement.nom}</h2>
                  <p className="event-desc">{evenement.description}</p>
                </div>
                <div className="event-details">
                  <div className="event-detail"><span>📅</span> {formatDate(evenement.date_evenement)}</div>
                  <div className="event-detail"><span>📍</span> {evenement.lieu}</div>
                  <div className="event-detail">
                    <span>🎟️</span>
                    {Object.values(categoriesTickets).map((cat, i, arr) => (
                      <span key={cat.label}>
                        {cat.label} {Number(cat.prix).toLocaleString()} FCFA{i < arr.length - 1 ? ' / ' : ''}
                      </span>
                    ))}
                  </div>

                </div>

                {resteSecondes > 0 && (
                  <div className="cooldown-banner">
                    ⏳ Prochaine commande dans <strong>{resteSecondes}s</strong>
                  </div>
                )}

                <div className="achat-form">
                  <label>Categorie de ticket</label>
                  <div className="ticket-category-control">
                    {Object.entries(categoriesTickets).map(([key, categorie]) => (
                      <button
                        key={key}
                        type="button"
                        className={categorieTicket === key ? 'category-option active' : 'category-option'}
                        onClick={() => setCategorieTicket(key)}
                      >
                        <span>{categorie.label}</span>
                        <strong>{Number(categorie.prix).toLocaleString()} FCFA</strong>
                      </button>
                    ))}
                  </div>
                  {promotionSelection && (
                    <div className="launch-promo-panel">
                      <div className="launch-promo-header">
                        <span className="launch-promo-kicker">Stock limité</span>
                        <strong>{promotionSelection.nextTicket.badge || 'Prix normal'}</strong>
                      </div>
                      <div className="launch-promo-prices">
                        <span className="price-original">{promotionSelection.originalPrice.toLocaleString()} FCFA</span>
                        <span className="price-promo">{promotionSelection.nextTicket.prix.toLocaleString()} FCFA</span>
                      </div>
                      <div className="launch-promo-stock">
                        <span>{promotionSelection.earlyBirdRemaining} places Early Bird restantes</span>
                        <strong>{promotionSelection.limitedRemaining} offres de lancement restantes</strong>
                      </div>
                      <div className="stock-meter" aria-hidden="true">
                        <span style={{ width: `${Math.min(100, (promotionSelection.limitedRemaining / 5) * 100)}%` }} />
                      </div>
                      {quantite > 1 && (
                        <div className="launch-promo-breakdown">
                          {promotionSelection.tickets.map(ticket => (
                            <span key={ticket.rang}>Rang {ticket.rang} : {ticket.prix.toLocaleString()} FCFA</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <label>Nombre de tickets</label>
                  <div className="qty-control">
                    <button onClick={() => setQuantite(q => Math.max(1, q - 1))}>−</button>
                    <span>{quantite}</span>
                    <button onClick={() => setQuantite(q => Math.min(evenement.quantite_disponible, q + 1))}>+</button>
                  </div>
                  <div className="achat-total">
                    Total : <strong>{totalAchat.toLocaleString()} FCFA</strong>
                  </div>
                  <button
                    className="btn-primary btn-large"
                    onClick={acheterTickets}
                    disabled={loading || resteSecondes > 0 || evenement.quantite_disponible === 0}
                  >
                    {loading ? 'Traitement...' : evenement.quantite_disponible === 0 ? 'Complet' : '💳 Payer maintenant'}
                  </button>
                  <p className="paiement-note">🔒 Paiement sécurisé</p>
                </div>
              </div>
            ) : (
              <p className="empty-state">Aucun événement disponible pour le moment.</p>
            )}
          </div>
        )}

        {onglet === 'tickets' && (
          <div>
            <h2>Mes tickets</h2>
            {tickets.length === 0 ? (
              <p className="empty-state">Vous n'avez pas encore de tickets.</p>
            ) : (
              <div className="tickets-grid">
                {tickets.map(t => (
                  <div key={t.id} className={`ticket-card ${t.statut === 'utilise' ? 'ticket-used' : ''}`} onClick={() => setTicketSelectionne(t)}>
                    <div className="ticket-top">
                      <span>🎭 {t.evenement_nom}</span>
                      <span className={`badge ${t.statut === 'actif' ? 'badge-active' : 'badge-used'}`}>{t.statut}</span>
                    </div>
                    <img src={t.qr_code_data} alt="QR Code" className="qr-preview" />
                    <div className="ticket-code">
                      <span>{labelCategorie(t.ticket_type)}</span>
                      <code>{Number(t.prix_unitaire || 0).toLocaleString()} FCFA</code>
                    </div>
                    {t.promotion_badge && (
                      <div className="ticket-promo-badge">{t.promotion_badge}</div>
                    )}
                    <div className="ticket-code">
                      <span>Code UUID</span>
                      <code>{t.code_unique}</code>
                    </div>
                    <div className="ticket-bottom">
                      <small>📍 {t.lieu}</small>
                      <small>📅 {formatDate(t.date_evenement)}</small>
                    </div>
                    <p className="ticket-tap">Appuyer pour agrandir</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'commandes' && (
          <div>
            <h2>Historique des commandes</h2>
            {commandes.length === 0 ? (
              <p className="empty-state">Aucune commande effectuée.</p>
            ) : (
              <div className="commandes-list">
                {commandes.map(c => (
                  <div key={c.id} className="commande-card">
                    <div className="commande-header">
                      <span>{c.evenement_nom}</span>
                      <span className={`badge ${c.statut === 'payee' ? 'badge-active' : 'badge-cancelled'}`}>{c.statut}</span>
                    </div>
                    <div className="commande-details">
                      <span>🎫 {c.quantite} ticket(s)</span>
                      <span>{labelCategorie(c.ticket_type)}</span>
                      <span>💰 {Number(c.montant_total).toLocaleString()} FCFA</span>
                      <span>📅 {formatDate(c.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      {ticketSelectionne && (
        <div className="modal-overlay" onClick={() => setTicketSelectionne(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🎭 {ticketSelectionne.evenement_nom}</h3>
            <img src={ticketSelectionne.qr_code_data} alt="QR Code" className="qr-large" />
            <p>Présentez ce QR code à l'entrée</p>
            <p>{labelCategorie(ticketSelectionne.ticket_type)} - {Number(ticketSelectionne.prix_unitaire || 0).toLocaleString()} FCFA</p>
            <div className="modal-ticket-code">
              <span>Code UUID du ticket</span>
              <code>{ticketSelectionne.code_unique}</code>
              <button
                type="button"
                className="btn-secondary btn-copy-code"
                onClick={() => copierCodeTicket(ticketSelectionne.code_unique)}
              >
                Copier le code
              </button>
            </div>
            <span className={`badge ${ticketSelectionne.statut === 'actif' ? 'badge-active' : 'badge-used'}`}>
              {ticketSelectionne.statut}
            </span>
            <button className="btn-secondary" onClick={() => setTicketSelectionne(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
