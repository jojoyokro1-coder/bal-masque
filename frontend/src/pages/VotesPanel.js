import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const pad = (value) => String(value).padStart(2, '0');
const EMPTY_COUPLE_FORM = {
  roi_name: '',
  reine_name: '',
  roi_photo: '',
  reine_photo: '',
  description: ''
};

function CrownIcon() {
  return (
    <svg className="royal-vote-crown" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 44 L14 22 L26 34 L32 16 L38 34 L50 22 L56 44 Z" />
      <rect x="8" y="44" width="48" height="6" />
    </svg>
  );
}

export default function VotesPanel({ mode = 'client' }) {
  const isAdminMode = mode === 'admin';
  const [categories, setCategories] = useState([]);
  const [myVotes, setMyVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingKey, setSubmittingKey] = useState('');
  const [coupleForm, setCoupleForm] = useState(EMPTY_COUPLE_FORM);
  const [coupleLoading, setCoupleLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const targetDate = useMemo(() => {
    const target = new Date();
    target.setDate(target.getDate() + 5);
    target.setHours(target.getHours() + 14);
    target.setMinutes(target.getMinutes() + 37);
    return target;
  }, []);

  useEffect(() => {
    chargerVotes();
  }, [mode]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    let diff = Math.max(0, targetDate.getTime() - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff %= 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff %= 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff %= 1000 * 60;
    const seconds = Math.floor(diff / 1000);
    return { days, hours, minutes, seconds };
  }, [now, targetDate]);

  const chargerVotes = async () => {
    setLoading(true);
    try {
      const endpoint = isAdminMode ? '/votes/results' : '/votes';
      const res = await api.get(endpoint);
      setCategories(res.data.results || res.data.categories || []);
      setMyVotes(res.data.my_votes || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur chargement des votes');
    } finally {
      setLoading(false);
    }
  };

  const enregistrerVote = async (category, candidate) => {
    setSubmittingKey(`${category}:${candidate}`);
    try {
      const res = await api.post('/votes', { category, candidate });
      setMyVotes((votes) => ({ ...votes, [category]: candidate }));
      toast.success(res.data.message || 'Vote enregistre');
      await chargerVotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du vote');
    } finally {
      setSubmittingKey('');
    }
  };

  const ajouterCouple = async (e) => {
    e.preventDefault();
    if (!coupleForm.roi_name.trim() || !coupleForm.reine_name.trim()) {
      toast.error('Le roi et la reine sont obligatoires.');
      return;
    }

    setCoupleLoading(true);
    try {
      const res = await api.post('/votes/couples', coupleForm);
      toast.success(res.data.message || 'Couple ajoute aux votes');
      setCoupleForm(EMPTY_COUPLE_FORM);
      await chargerVotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur ajout du couple');
    } finally {
      setCoupleLoading(false);
    }
  };

  const chargerPhoto = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez choisir une image.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde. Maximum 2 Mo par photo.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoupleForm((form) => ({ ...form, [field]: String(reader.result || '') }));
    };
    reader.onerror = () => toast.error('Impossible de lire cette image.');
    reader.readAsDataURL(file);
  };

  const supprimerCouple = async (coupleId, label) => {
    if (!window.confirm(`Supprimer le couple ${label} ? Les votes associes seront aussi supprimes.`)) return;

    try {
      const res = await api.delete(`/votes/couples/${coupleId}`);
      toast.success(res.data.message || 'Couple supprime');
      await chargerVotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression du couple');
    }
  };

  if (loading) {
    return <p className="empty-state">Chargement des votes...</p>;
  }

  return (
    <div className="royal-vote">
      <header className="royal-vote-header">
        <div className="royal-vote-brand">Le Bal<span> - Edition 2026</span></div>
        <div className="royal-vote-nav">
          <span>Billets</span>
          <span>Programme</span>
          <span>Vote</span>
        </div>
      </header>

      <section className="royal-vote-hero">
        <CrownIcon />
        <div className="royal-vote-eyebrow">Vote officiel du bal</div>
        <h1>Roi <em>&</em> Reine<br />du Bal</h1>
        <p>
          Chaque annee, une couronne. Votez pour le duo qui incarnera l'elegance et l'esprit du bal de cette edition.
          Un vote, un instant, un regne d'une soiree.
        </p>

        <div className="royal-vote-divider" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <div className="royal-vote-countdown">
          <div><strong>{pad(countdown.days)}</strong><span>Jours</span></div>
          <div><strong>{pad(countdown.hours)}</strong><span>Heures</span></div>
          <div><strong>{pad(countdown.minutes)}</strong><span>Minutes</span></div>
          <div><strong>{pad(countdown.seconds)}</strong><span>Secondes</span></div>
        </div>
        <div className="royal-vote-live">
          <span />
          {isAdminMode ? 'Classement en direct' : 'Votes ouverts'}
        </div>
      </section>

      {isAdminMode && (
        <div className="royal-vote-admin-panel">
          <div className="royal-vote-admin-head">
            <div>
              <h2>Ajouter un couple</h2>
              <p>Le roi et la reine sont obligatoires : chaque option de vote est un duo complet.</p>
            </div>
            <button type="button" className="btn-primary-sm" onClick={chargerVotes}>Actualiser les resultats</button>
          </div>

          <form className="royal-vote-couple-form" onSubmit={ajouterCouple}>
            <div className="form-group">
              <label>Nom du roi</label>
              <input
                type="text"
                value={coupleForm.roi_name}
                onChange={(e) => setCoupleForm({ ...coupleForm, roi_name: e.target.value })}
                placeholder="Ex: Yannick Koffi"
                required
              />
            </div>
            <div className="form-group">
              <label>Nom de la reine</label>
              <input
                type="text"
                value={coupleForm.reine_name}
                onChange={(e) => setCoupleForm({ ...coupleForm, reine_name: e.target.value })}
                placeholder="Ex: Aicha Bamba"
                required
              />
            </div>
            <div className="form-group">
              <label>Photo du roi</label>
              <input type="file" accept="image/*" onChange={chargerPhoto('roi_photo')} />
            </div>
            <div className="form-group">
              <label>Photo de la reine</label>
              <input type="file" accept="image/*" onChange={chargerPhoto('reine_photo')} />
            </div>
            {(coupleForm.roi_photo || coupleForm.reine_photo) && (
              <div className="royal-vote-photo-preview">
                {coupleForm.roi_photo && (
                  <figure>
                    <img src={coupleForm.roi_photo} alt="Apercu roi" />
                    <figcaption>Roi</figcaption>
                  </figure>
                )}
                {coupleForm.reine_photo && (
                  <figure>
                    <img src={coupleForm.reine_photo} alt="Apercu reine" />
                    <figcaption>Reine</figcaption>
                  </figure>
                )}
              </div>
            )}
            <div className="form-group royal-vote-couple-desc">
              <label>Description du couple</label>
              <input
                type="text"
                value={coupleForm.description}
                onChange={(e) => setCoupleForm({ ...coupleForm, description: e.target.value })}
                placeholder="Ex: Un duo elegant, energique et charismatique"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={coupleLoading}>
              {coupleLoading ? 'Ajout...' : 'Ajouter le couple'}
            </button>
          </form>
        </div>
      )}

      {categories.map((category) => (
        <section className={`royal-vote-category ${category.tone || 'king'}`} key={category.id}>
          <div className="royal-vote-title">
            <div>Categorie</div>
            <h2>{category.label}</h2>
          </div>

          <div className="royal-vote-grid">
            {category.candidates.map((candidate, index) => {
              const selected = myVotes[category.id] === candidate.id;
              const submitting = submittingKey === `${category.id}:${candidate.id}`;
              return (
                <article className={selected ? 'royal-vote-card selected' : 'royal-vote-card'} key={candidate.id}>
                  <div className={index === 0 ? 'royal-vote-rank' : 'royal-vote-rank second'}>
                    {index === 0 ? '1er' : `${index + 1}e`}
                  </div>
                  <div className="royal-vote-photo-duo">
                    <div className="royal-vote-person">
                      {candidate.roi_photo ? (
                        <img src={candidate.roi_photo} alt={candidate.roi_name} />
                      ) : (
                        <span>{candidate.roi_name?.charAt(0) || 'R'}</span>
                      )}
                      <small>Roi</small>
                    </div>
                    <div className="royal-vote-person">
                      {candidate.reine_photo ? (
                        <img src={candidate.reine_photo} alt={candidate.reine_name} />
                      ) : (
                        <span>{candidate.reine_name?.charAt(0) || 'R'}</span>
                      )}
                      <small>Reine</small>
                    </div>
                  </div>
                  <div className="royal-vote-name">{candidate.name}</div>
                  <div className="royal-vote-meta">{candidate.meta}</div>
                  <p className="royal-vote-desc">{candidate.description}</p>

                  {isAdminMode ? (
                    <>
                      <div className="royal-vote-progress-row">
                        <span>{candidate.total || 0} vote(s)</span>
                        <span>{candidate.percent || 0} %</span>
                      </div>
                      <div className="royal-vote-progress">
                        <span style={{ width: `${candidate.percent || 0}%` }} />
                      </div>
                      <button
                        type="button"
                        className="royal-vote-delete-btn"
                        onClick={() => supprimerCouple(candidate.id, candidate.name)}
                      >
                        Supprimer ce couple
                      </button>
                    </>
                  ) : (
                    <div className="royal-vote-client-status">
                      {selected ? 'Votre vote est enregistre pour cette categorie.' : 'Choisissez votre favori pour cette categorie.'}
                    </div>
                  )}

                  {!isAdminMode && (
                    <button
                      type="button"
                      className="royal-vote-btn"
                      onClick={() => enregistrerVote(category.id, candidate.id)}
                      disabled={submitting}
                    >
                      {submitting ? 'Enregistrement...' : selected ? 'Vote choisi' : `Voter pour ${candidate.name.split(' ')[0]}`}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="royal-vote-payments">
        <div>Paiements acceptes</div>
        <p>
          <span>Wave</span>
          <span>Orange Money</span>
          <span>MTN Money</span>
          <span>Moov Money</span>
        </p>
      </section>

      <footer className="royal-vote-footer">
        Billetterie et votes propulses par <span>votre plateforme</span> - 2026
      </footer>
    </div>
  );
}
