import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const isAdminPrincipal = user?.role === 'admin';

  const [stats, setStats] = useState(null);
  const [inspecteurs, setInspecteurs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sousAdmins, setSousAdmins] = useState([]);
  const [onglet, setOnglet] = useState('stats');
  const [formInspecteur, setFormInspecteur] = useState({ nom: '', prenom: '', email: '', password: '' });
  const [formSousAdmin, setFormSousAdmin] = useState({ nom: '', prenom: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loadingSousAdmin, setLoadingSousAdmin] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    chargerStats();
    chargerInspecteurs();
    chargerTickets();
    if (isAdminPrincipal) chargerSousAdmins();
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

  const chargerSousAdmins = async () => {
    try {
      const res = await api.get('/admin/sous-admins');
      setSousAdmins(res.data);
    } catch (err) { }
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
        {isAdminPrincipal && (
          <button className={onglet === 'sous-admins' ? 'tab active' : 'tab'} onClick={() => setOnglet('sous-admins')}>🛡️ Sous-Admins</button>
        )}
      </div>

      <div className="dashboard-content">

        {onglet === 'stats' && stats && (
          <div>
            <div className="section-header-actions">
              <h2>Vue d'ensemble</h2>
              <button
                type="button"
                className="btn-danger"
                onClick={reinitialiserCompteurs}
                disabled={resetLoading}
              >
                {resetLoading ? 'Reinitialisation...' : 'Remettre a zero'}
              </button>
            </div>
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
            </div>
            {stats.evenement && (
              <div className="event-info-card">
                <h3>🎭 {stats.evenement.nom}</h3>
                <p>📅 {new Date(stats.evenement.date_evenement).toLocaleString('fr-FR')}</p>
                <p>📍 {stats.evenement.lieu}</p>
                <p>💰 {stats.evenement.prix_ticket} FCFA / ticket</p>
                <p>🎫 {stats.evenement.quantite_disponible} places restantes</p>
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
      </div>
    </div>
  );
}
