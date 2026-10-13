import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import VotesPanel from './VotesPanel';
import { EVENT_FULL_LABEL, EVENT_LOCATION } from '../utils/eventInfo';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const isAdminPrincipal = user?.role === 'admin';

  const [stats, setStats] = useState(null);
  const [inspecteurs, setInspecteurs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [sousAdmins, setSousAdmins] = useState([]);
  const [onglet, setOnglet] = useState('stats');
  const [formInspecteur, setFormInspecteur] = useState({ nom: '', prenom: '', email: '', password: '' });
  const [formSousAdmin, setFormSousAdmin] = useState({ nom: '', prenom: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loadingSousAdmin, setLoadingSousAdmin] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [clientAuthDisabled, setClientAuthDisabled] = useState(false);
  const [clientAuthLoading, setClientAuthLoading] = useState(false);
  const [paymentsDisabled, setPaymentsDisabled] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [voteTabVisible, setVoteTabVisible] = useState(true);
  const [voteTabLoading, setVoteTabLoading] = useState(false);

  // Modal réinitialisation MDP
  const [resetModal, setResetModal] = useState({ open: false, clientId: null, clientEmail: '' });
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    chargerStats();
    chargerInspecteurs();
    chargerTickets();
    chargerCommandes();
    chargerClients();
    if (isAdminPrincipal) {
      chargerSousAdmins();
      chargerStatutAuthClients();
      chargerStatutPaiements();
      chargerStatutOngletVote();
    }
  }, [isAdminPrincipal]);

  const chargerStats = async () => {
    try {
      const res = await api.get('/admin/statistiques');
      setStats(res.data);
    } catch (err) { toast.error('Erreur chargement stats'); }
  };

  const chargerInspecteurs = async () => {
    try {
      const res = await api.get('/admin/inspecteurs');
      setInspecteurs(res.data);
    } catch (err) { }
  };

  const chargerTickets = async () => {
    try {
      const res = await api.get('/admin/tickets');
      setTickets(res.data);
    } catch (err) { }
  };

  const chargerCommandes = async () => {
    try {
      const res = await api.get('/admin/commandes');
      setCommandes(res.data);
    } catch (err) { }
  };

  const chargerClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      setClients(res.data);
    } catch (err) { }
  };

  const chargerSousAdmins = async () => {
    try {
      const res = await api.get('/admin/sous-admins');
      setSousAdmins(res.data);
    } catch (err) { }
  };

  const chargerStatutAuthClients = async () => {
    try {
      const res = await api.get('/admin/client-auth-status');
      setClientAuthDisabled(Boolean(res.data.disabled));
    } catch (err) { }
  };

  const basculerAuthClients = async () => {
    const prochainStatut = !clientAuthDisabled;
    const confirme = window.confirm(
      prochainStatut
        ? 'Bloquer les inscriptions et connexions des clients ? Les admins pourront toujours se connecter.'
        : 'Debloquer les inscriptions et connexions des clients ?'
    );
    if (!confirme) return;

    setClientAuthLoading(true);
    try {
      const res = await api.put('/admin/client-auth-status', { disabled: prochainStatut });
      setClientAuthDisabled(Boolean(res.data.disabled));
      toast.success(res.data.message || 'Statut client mis a jour.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur mise a jour du statut client');
    } finally {
      setClientAuthLoading(false);
    }
  };

  const chargerStatutPaiements = async () => {
    try {
      const res = await api.get('/admin/payments-status');
      setPaymentsDisabled(Boolean(res.data.disabled));
    } catch (err) { }
  };

  const basculerPaiements = async () => {
    const prochainStatut = !paymentsDisabled;
    const confirme = window.confirm(
      prochainStatut
        ? 'Bloquer temporairement tous les paiements sur le site ?'
        : 'Debloquer les paiements ?'
    );
    if (!confirme) return;

    setPaymentsLoading(true);
    try {
      const res = await api.put('/admin/payments-status', { disabled: prochainStatut });
      setPaymentsDisabled(Boolean(res.data.disabled));
      toast.success(res.data.message || 'Statut des paiements mis a jour.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur mise a jour du statut des paiements');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const chargerStatutOngletVote = async () => {
    try {
      const res = await api.get('/admin/vote-tab-status');
      setVoteTabVisible(Boolean(res.data.visible));
    } catch (err) { }
  };

  const basculerOngletVote = async () => {
    const prochainStatut = !voteTabVisible;

    setVoteTabLoading(true);
    try {
      const res = await api.put('/admin/vote-tab-status', { visible: prochainStatut });
      setVoteTabVisible(Boolean(res.data.visible));
      toast.success(res.data.message || 'Statut de l onglet Vote mis a jour.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur mise a jour de l onglet Vote');
    } finally {
      setVoteTabLoading(false);
    }
  };

  const creerInspecteur = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/inspecteurs', formInspecteur);
      toast.success('Inspecteur créé !');
      setFormInspecteur({ nom: '', prenom: '', email: '', password: '' });
      chargerInspecteurs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const supprimerInspecteur = async (id) => {
    if (!window.confirm('Supprimer cet inspecteur ?')) return;
    try {
      await api.delete(`/admin/inspecteurs/${id}`);
      toast.success('Inspecteur supprimé');
      chargerInspecteurs();
    } catch (err) { toast.error('Erreur suppression'); }
  };

  const validerCommande = async (id) => {
    if (!window.confirm('Valider ce paiement et generer les tickets ?')) return;

    try {
      const res = await api.post(`/admin/commandes/${id}/valider-paiement`);
      toast.success(res.data.message || 'Paiement valide.');
      await Promise.all([chargerStats(), chargerTickets(), chargerCommandes()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur validation paiement');
    }
  };
  const creerSousAdmin = async (e) => {
    e.preventDefault();
    setLoadingSousAdmin(true);
    try {
      await api.post('/admin/sous-admins', formSousAdmin);
      toast.success('Sous-admin créé !');
      setFormSousAdmin({ nom: '', prenom: '', email: '', password: '' });
      chargerSousAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setLoadingSousAdmin(false); }
  };

  const supprimerSousAdmin = async (id) => {
    if (!window.confirm('Supprimer ce sous-admin ?')) return;
    try {
      await api.delete(`/admin/sous-admins/${id}`);
      toast.success('Sous-admin supprimé');
      chargerSousAdmins();
    } catch (err) { toast.error('Erreur suppression'); }
  };

  const openResetModal = (clientId, clientEmail) => {
    setResetModal({ open: true, clientId, clientEmail });
    setResetNewPassword('');
    setResetShowPassword(false);
  };

  const closeResetModal = () => {
    setResetModal({ open: false, clientId: null, clientEmail: '' });
    setResetNewPassword('');
  };

  const handleResetPassword = async () => {
    if (!resetNewPassword || resetNewPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setResetSubmitting(true);
    try {
      await api.put(`/admin/clients/${resetModal.clientId}/reset-password`, { newPassword: resetNewPassword });
      toast.success('Mot de passe réinitialisé avec succès !');
      closeResetModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setResetSubmitting(false);
    }
  };

  const reinitialiserCompteurs = async () => {
    const confirme = window.confirm(
      'Remettre tous les compteurs a zero ? Cette action supprime les tickets, commandes et comptes clients.'
    );
    if (!confirme) return;

    setResetLoading(true);
    try {
      await api.post('/admin/reinitialiser-compteurs');
      toast.success('Compteurs remis a zero');
      await Promise.all([chargerStats(), chargerTickets()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur reinitialisation');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
    <div className="dashboard">
      <nav className="navbar">
        <span className="navbar-brand">
          🎭 Bal Masqué —{' '}
          {isAdminPrincipal ? 'Admin' : <span className="sous-admin-badge">Sous-Admin</span>}
        </span>
        <div className="navbar-user">
          <span>{user?.prenom} {user?.nom}</span>
          <button onClick={logout} className="btn-logout">Déconnexion</button>
        </div>
      </nav>

      <div className="dashboard-tabs">
        <button className={onglet === 'stats' ? 'tab active' : 'tab'} onClick={() => setOnglet('stats')}>📊 Tableau de bord</button>
        <button className={onglet === 'inspecteurs' ? 'tab active' : 'tab'} onClick={() => setOnglet('inspecteurs')}>👮 Inspecteurs</button>
        <button className={onglet === 'tickets' ? 'tab active' : 'tab'} onClick={() => setOnglet('tickets')}>🎫 Tickets</button>
        <button className={onglet === 'commandes' ? 'tab active' : 'tab'} onClick={() => setOnglet('commandes')}>Commandes</button>
        <button className={onglet === 'clients' ? 'tab active' : 'tab'} onClick={() => setOnglet('clients')}>👥 Clients</button>
        <button className={onglet === 'votes' ? 'tab active' : 'tab'} onClick={() => setOnglet('votes')}>Votes</button>
        {isAdminPrincipal && (
          <button className={onglet === 'sous-admins' ? 'tab active' : 'tab'} onClick={() => setOnglet('sous-admins')}>🛡️ Sous-Admins</button>
        )}
      </div>

      <div className="dashboard-content">

        {onglet === 'stats' && stats && (
          <div>
            <div className="section-header-actions">
              <h2>Vue d'ensemble</h2>
              {isAdminPrincipal && (
                <div className="admin-actions">
                  <button
                    type="button"
                    className={clientAuthDisabled ? 'btn-success' : 'btn-warning'}
                    onClick={basculerAuthClients}
                    disabled={clientAuthLoading}
                  >
                    {clientAuthLoading
                      ? 'Mise a jour...'
                      : clientAuthDisabled
                        ? 'Debloquer clients'
                        : 'Bloquer clients'}
                  </button>
                  <button
                    type="button"
                    className={paymentsDisabled ? 'btn-success' : 'btn-warning'}
                    onClick={basculerPaiements}
                    disabled={paymentsLoading}
                  >
                    {paymentsLoading
                      ? 'Mise a jour...'
                      : paymentsDisabled
                        ? 'Debloquer paiements'
                        : 'Bloquer paiements'}
                  </button>
                  <label className="admin-toggle-row">
                    <span>Afficher l'onglet Vote aux clients</span>
                    <button
                      type="button"
                      className={voteTabVisible ? 'admin-switch on' : 'admin-switch'}
                      onClick={basculerOngletVote}
                      disabled={voteTabLoading}
                      role="switch"
                      aria-checked={voteTabVisible}
                    >
                      <span />
                    </button>
                  </label>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={reinitialiserCompteurs}
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Reinitialisation...' : 'Remettre a zero'}
                  </button>
                </div>
              )}
            </div>
            {isAdminPrincipal && (
              <>
                <div className={clientAuthDisabled ? 'client-auth-banner blocked' : 'client-auth-banner open'}>
                  {clientAuthDisabled
                    ? 'Les clients ne peuvent pas creer de compte ni se connecter.'
                    : 'Les clients peuvent creer un compte et se connecter.'}
                </div>
                <div className={paymentsDisabled ? 'client-auth-banner blocked' : 'client-auth-banner open'} style={{ marginTop: '10px' }}>
                  {paymentsDisabled
                    ? 'Les paiements sont actuellement bloques sur tout le site.'
                    : 'Les paiements sont actifs et fonctionnels.'}
                </div>
                <div className={voteTabVisible ? 'client-auth-banner open' : 'client-auth-banner blocked'} style={{ marginTop: '10px' }}>
                  {voteTabVisible
                    ? 'L onglet Vote est visible pour les clients.'
                    : 'L onglet Vote est masque pour les clients.'}
                </div>
              </>
            )}
            <div className="stats-grid">
              <div className="stat-card purple">
                <div className="stat-number">{stats.totalTickets}</div>
                <div className="stat-label">Tickets vendus</div>
              </div>
              <div className="stat-card green">
                <div className="stat-number">{stats.ticketsScanned}</div>
                <div className="stat-label">Entrées validées</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-number">{stats.ticketsActifs}</div>
                <div className="stat-label">Tickets restants</div>
              </div>
              <div className="stat-card gold">
                <div className="stat-number">{Number(stats.totalVentes).toLocaleString()} FCFA</div>
                <div className="stat-label">Recettes totales</div>
              </div>
              <div className="stat-card pink">
                <div className="stat-number">{stats.totalClients}</div>
                <div className="stat-label">Clients inscrits</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-number">{stats.ticketsSolo ?? 0}</div>
                <div className="stat-label">🧍 Tickets Solo</div>
              </div>
              <div className="stat-card teal">
                <div className="stat-number">{stats.ticketsCouple ?? 0}</div>
                <div className="stat-label">👫 Tickets Couple</div>
              </div>
            </div>
            {stats.evenement && (
              <div className="event-info-card">
                <h3>🎭 {stats.evenement.nom}</h3>
                <p>📅 {EVENT_FULL_LABEL}</p>
                <p>📍 {EVENT_LOCATION}</p>
                <p>💰 Solo : 7000 FCFA &nbsp;|&nbsp; Couple : 12000 FCFA</p>
              </div>
            )}
          </div>
        )}

        {onglet === 'inspecteurs' && (
          <div>
            <h2>Gestion des inspecteurs</h2>
            <div className={isAdminPrincipal ? 'two-col' : ''}>
              {/* Formulaire de création visible uniquement pour l'admin principal */}
              {isAdminPrincipal && (
                <div className="card">
                  <h3>Créer un inspecteur</h3>
                  <form onSubmit={creerInspecteur}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Prénom</label>
                        <input type="text" value={formInspecteur.prenom} onChange={e => setFormInspecteur({ ...formInspecteur, prenom: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Nom</label>
                        <input type="text" value={formInspecteur.nom} onChange={e => setFormInspecteur({ ...formInspecteur, nom: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={formInspecteur.email} onChange={e => setFormInspecteur({ ...formInspecteur, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Mot de passe</label>
                      <input type="password" value={formInspecteur.password} onChange={e => setFormInspecteur({ ...formInspecteur, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Création...' : 'Créer l\'inspecteur'}
                    </button>
                  </form>
                </div>
              )}

              <div className="card">
                <h3>Liste des inspecteurs ({inspecteurs.length})</h3>
                {!isAdminPrincipal && (
                  <p className="sous-admin-notice">👁️ Consultation uniquement — seul l'admin principal peut gérer les inspecteurs.</p>
                )}
                {inspecteurs.length === 0 ? (
                  <p className="empty-state">Aucun inspecteur créé.</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Nom</th><th>Email</th>{isAdminPrincipal && <th>Action</th>}</tr>
                      </thead>
                      <tbody>
                        {inspecteurs.map(i => (
                          <tr key={i.id}>
                            <td>{i.prenom} {i.nom}</td>
                            <td>{i.email}</td>
                            {isAdminPrincipal && (
                              <td>
                                <button className="btn-danger-sm" onClick={() => supprimerInspecteur(i.id)}>Supprimer</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {onglet === 'tickets' && (
          <div>
            <h2>Tous les tickets ({tickets.length})</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Code</th><th>Client</th><th>Email</th><th>Categorie</th><th>Prix</th><th>Statut</th><th>Scanne le</th><th>Inspecteur</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id}>
                      <td><code className="ticket-code-admin">{t.code_unique}</code></td>
                      <td>{t.prenom} {t.nom}</td>
                      <td>{t.email}</td>
                      <td>{t.ticket_type === 'couple' ? 'Couple' : 'Solo'}</td>
                      <td>{Number(t.prix_unitaire || 0).toLocaleString()} FCFA</td>
                      <td>
                        <span className={`badge ${t.statut === 'utilise' ? 'badge-used' : t.statut === 'actif' ? 'badge-active' : 'badge-cancelled'}`}>
                          {t.statut}
                        </span>
                      </td>
                      <td>{t.scanne_le ? new Date(t.scanne_le).toLocaleString('fr-FR') : '—'}</td>
                      <td>{t.inspecteur_prenom ? `${t.inspecteur_prenom} ${t.inspecteur_nom}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {onglet === 'commandes' && (
          <div>
            <h2>Commandes ({commandes.length})</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Client</th><th>Email</th><th>Categorie</th><th>Quantite</th><th>Montant</th><th>Statut</th><th>Tickets</th><th>Date</th>{isAdminPrincipal && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {commandes.map(c => (
                    <tr key={c.id}>
                      <td>{c.prenom} {c.nom}</td>
                      <td>{c.email}</td>
                      <td>{c.ticket_type === 'couple' ? 'Couple' : 'Solo'}</td>
                      <td>{c.quantite}</td>
                      <td>{Number(c.montant_total || 0).toLocaleString()} FCFA</td>
                      <td>
                        <span className={`badge ${c.statut === 'payee' ? 'badge-active' : 'badge-cancelled'}`}>
                          {c.statut}
                        </span>
                      </td>
                      <td>{c.tickets_generes}</td>
                      <td>{new Date(c.created_at).toLocaleString('fr-FR')}</td>
                      {isAdminPrincipal && (
                        <td>
                          {c.statut !== 'payee' || Number(c.tickets_generes || 0) === 0 ? (
                            <button className="btn-primary-sm" onClick={() => validerCommande(c.id)}>
                              Valider paiement
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Onglet Sous-Admins — visible uniquement pour l'admin principal */}
        {onglet === 'sous-admins' && isAdminPrincipal && (
          <div>
            <h2>Gestion des sous-admins</h2>
            <div className="two-col">
              <div className="card">
                <h3>Créer un sous-admin</h3>
                <p className="sous-admin-info">
                  Un sous-admin a accès au tableau de bord, aux tickets et à la liste des inspecteurs,
                  mais ne peut pas créer ni supprimer des inspecteurs ou d'autres sous-admins.
                </p>
                <form onSubmit={creerSousAdmin}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Prénom</label>
                      <input type="text" value={formSousAdmin.prenom} onChange={e => setFormSousAdmin({ ...formSousAdmin, prenom: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Nom</label>
                      <input type="text" value={formSousAdmin.nom} onChange={e => setFormSousAdmin({ ...formSousAdmin, nom: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={formSousAdmin.email} onChange={e => setFormSousAdmin({ ...formSousAdmin, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe</label>
                    <input type="password" value={formSousAdmin.password} onChange={e => setFormSousAdmin({ ...formSousAdmin, password: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loadingSousAdmin}>
                    {loadingSousAdmin ? 'Création...' : '🛡️ Créer le sous-admin'}
                  </button>
                </form>
              </div>

              <div className="card">
                <h3>Liste des sous-admins ({sousAdmins.length})</h3>
                {sousAdmins.length === 0 ? (
                  <p className="empty-state">Aucun sous-admin créé.</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Nom</th><th>Email</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {sousAdmins.map(sa => (
                          <tr key={sa.id}>
                            <td>{sa.prenom} {sa.nom}</td>
                            <td>{sa.email}</td>
                            <td>
                              <button className="btn-danger-sm" onClick={() => supprimerSousAdmin(sa.id)}>Supprimer</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Clients — visible pour admin et sous-admin */}
        {onglet === 'clients' && (
          <div>
            <div className="section-header-actions">
              <h2>Liste des clients inscrits</h2>
            </div>
            <div className="card full-width">
              <h3>Clients ({clients.length})</h3>
              {clients.length === 0 ? (
                <p className="empty-state">Aucun client trouvé.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom Complet</th>
                        <th>Email</th>
                        <th>Date d'inscription</th>
                        {isAdminPrincipal && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(c => (
                        <tr key={c.id}>
                          <td>{c.prenom} {c.nom}</td>
                          <td><strong>{c.email}</strong></td>
                          <td>{new Date(c.created_at).toLocaleString()}</td>
                          {isAdminPrincipal && (
                            <td>
                              <button 
                                className="btn-primary-sm" 
                                onClick={() => openResetModal(c.id, c.email)}
                              >
                                🔑 Réinitialiser MDP
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>
               )}
             </div>
           </div>
         )}

        {onglet === 'votes' && <VotesPanel mode="admin" />}
       </div>
    </div>

    {/* ── Modal réinitialisation mot de passe ── */}
    {resetModal.open && (
      <div className="reset-modal-overlay" onClick={closeResetModal}>
        <div className="reset-modal" onClick={e => e.stopPropagation()}>
          <div className="reset-modal-header">
            <span className="reset-modal-icon">🔑</span>
            <h3>Réinitialiser le mot de passe</h3>
            <button className="reset-modal-close" onClick={closeResetModal}>✕</button>
          </div>
          <p className="reset-modal-email">{resetModal.clientEmail}</p>
          <div className="reset-modal-field">
            <label>Nouveau mot de passe</label>
            <div className="reset-modal-input-wrap">
              <input
                type={resetShowPassword ? 'text' : 'password'}
                placeholder="Min. 6 caractères"
                value={resetNewPassword}
                onChange={e => setResetNewPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                autoFocus
              />
              <button
                className="reset-modal-toggle"
                type="button"
                onClick={() => setResetShowPassword(v => !v)}
              >
                {resetShowPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {resetNewPassword.length > 0 && resetNewPassword.length < 6 && (
              <span className="reset-modal-hint">Encore {6 - resetNewPassword.length} caractère(s)</span>
            )}
          </div>
          <div className="reset-modal-actions">
            <button className="btn-secondary" onClick={closeResetModal} disabled={resetSubmitting}>Annuler</button>
            <button
              className="btn-primary-sm reset-modal-confirm"
              onClick={handleResetPassword}
              disabled={resetSubmitting || resetNewPassword.length < 6}
            >
              {resetSubmitting ? 'Enregistrement…' : '✓ Confirmer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
