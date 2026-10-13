import React, { useEffect } from 'react';
import './Programme.css';
import Footer from './Footer';
import { EVENT_FULL_LABEL, EVENT_LOCATION } from '../utils/eventInfo';

export default function Programme() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
    <section id="programme" className="programme-container">
      <div className="programme-header">
        <p className="programme-eyebrow">Pigier Côte d'Ivoire</p>
        <h2>Le <span>Programme</span></h2>
        <div className="programme-divider"><div className="programme-divider-gem"></div></div>
        <p className="programme-sub">Bal Masqué 2026</p>
        <p className="programme-footnote">{EVENT_FULL_LABEL} · {EVENT_LOCATION}</p>
      </div>

      <div className="programme-timeline">
        <div className="programme-item">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Accueil</span>
            <p className="programme-label">Mots de bienvenue, présentation de l'administration et des membres du bureau</p>
          </div>
        </div>

        <div className="programme-item">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Partenaires</span>
            <p className="programme-label">Présentation des différents partenaires</p>
          </div>
        </div>

        <div className="programme-item programme-highlight">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Récompenses</span>
            <p className="programme-label">Jeux & remises de récompenses</p>
          </div>
        </div>

        <div className="programme-item">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Défilé</span>
            <p className="programme-label">Défilé des membres du bureau</p>
          </div>
        </div>

        <div className="programme-item">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Gastronomie</span>
            <p className="programme-label">Service de la nourriture</p>
          </div>
        </div>

        <div className="programme-item">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Mystère</span>
            <p className="programme-label">Messages anonymes</p>
          </div>
        </div>

        <div className="programme-item programme-special">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Cérémonie</span>
            <p className="programme-label">Ouverture du bal — prise de parole de la présidente</p>
          </div>
        </div>

        <div className="programme-midnight-sep" style={{ paddingLeft: '44px', gap: '14px' }}>
          <div className="programme-ms-line"></div>
          <span className="programme-ms-text">✦ Minuit ✦</span>
          <div className="programme-ms-line programme-r"></div>
        </div>

        <div className="programme-item programme-highlight">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Grand Défilé</span>
            <p className="programme-label">Défilé des étudiants avec leurs cavalières — bal masqué</p>
          </div>
        </div>

        <div className="programme-item">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Danse</span>
            <p className="programme-label">Zouk sur la piste — ouvert à tous</p>
          </div>
        </div>

        <div className="programme-item programme-highlight">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Scène</span>
            <p className="programme-label">Prestation des artistes</p>
          </div>
        </div>

        <div className="programme-item programme-special">
          <div className="programme-dot-wrap"><div className="programme-dot"></div></div>
          <div className="programme-content">
            <span className="programme-tag">Clôture</span>
            <p className="programme-label">Ambiance à gogo 🎉</p>
          </div>
        </div>

      </div>

      <p className="programme-footnote">✦ &nbsp; La nuit vous appartient &nbsp; ✦</p>
    </section>
    <Footer />
    </>
  );
}
