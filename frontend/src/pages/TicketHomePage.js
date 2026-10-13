import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from './Footer';
import ChatBot from './ChatBot';
import { EVENT_DATE_LABEL, EVENT_TIME_LABEL, EVENT_LOCATION } from '../utils/eventInfo';

const PARTICLE_COLORS = ['#c084fc', '#ec4899', '#7dd3fc', '#fcd34d', '#86efac'];

export default function TicketHomePage() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, index) => ({
        id: index,
        size: 2 + ((index * 7) % 5),
        left: (index * 37) % 100,
        color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
        duration: 8 + ((index * 5) % 12),
        delay: (index * 1.7) % 10,
      })),
    []
  );

  const barcodeLines = useMemo(() => Array.from({ length: 35 }, (_, index) => index), []);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Scroll vers les tarifs si redirigé depuis le footer
  useEffect(() => {
    if (searchParams.get('scroll') === 'tarifs') {
      const el = document.getElementById('infos-bal');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        // Nettoyer le paramètre de l'URL
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  const scrollToInfos = (e) => {
    e.preventDefault();
    const el = document.getElementById('infos-bal');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
    <main className="home-hero">
      <div className="home-particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="home-particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              background: particle.color,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="home-orb home-orb-1" aria-hidden="true" />
      <div className="home-orb home-orb-2" aria-hidden="true" />
      <div className="home-orb home-orb-3" aria-hidden="true" />

      <nav className="home-navbar">
        <Link className="home-logo" to="/">
          <span className="home-logo-icon" aria-hidden="true">🎭</span>
          <span>
            <span className="home-logo-text">BalFest</span>
            <span className="home-logo-sub">Pigier CI</span>
          </span>
        </Link>
        <div className="home-nav-actions">
          <Link className="home-btn-login" to="/login">Se connecter</Link>
          <Link className="home-btn-register" to="/register"><span>S'inscrire</span></Link>
        </div>
      </nav>

      <section className="home-hero-content">
        <div className="home-badge">
          <span className="home-badge-dot" aria-hidden="true" />
          Billetterie officielle 2026
        </div>
        <h1 className="home-hero-title">
          La Nuit Inoubliable de{' '}
          <span>Pigier CI</span>
        </h1>
        <p className="home-hero-subtitle">
          Réservez vos tickets pour le grand bal de fin d'année. Une soirée de prestige,
          de musique et de souvenirs inoubliables avec toute votre promotion.
        </p>
        <div className="home-cta-group">
          <Link className="home-cta-primary" to="/login">🎟️ Acheter mon ticket</Link>
          <a className="home-cta-secondary" href="#infos-bal" onClick={scrollToInfos}>ℹ️ En savoir plus</a>
        </div>
      </section>

      <section className="home-stats-bar" aria-label="Statistiques du bal">
        <div className="home-stat-item">
          <span className="home-stat-number">04/09</span>
          <span className="home-stat-label">Date du bal</span>
        </div>
        <div className="home-stat-item">
          <span className="home-stat-number">2</span>
          <span className="home-stat-label">Catégories</span>
        </div>
        <div className="home-stat-item">
          <span className="home-stat-number">100%</span>
          <span className="home-stat-label">Sécurisé</span>
        </div>
      </section>

      <section className="home-ticket-preview" id="infos-bal">
        <div className="home-ticket-card">
          <div className="home-ticket-card-header">
            <div>
              <div className="home-ticket-event-name">Grand Bal 2026 ✨</div>
              <div className="home-ticket-year">Pigier CI</div>
            </div>
            <div className="home-ticket-price-tag">
              <span className="home-ticket-currency">A partir de</span>
              <span className="home-ticket-amount">8 000</span>
              <span className="home-ticket-currency">FCFA</span>
            </div>
          </div>

          <div className="home-ticket-divider" aria-hidden="true">
            <span />
            <i />
            <span />
            <i />
            <span />
          </div>

          <div className="home-ticket-info-grid">
            <div className="home-ticket-info-item">
              <div className="home-ticket-label">Date</div>
              <div className="home-ticket-value">{EVENT_DATE_LABEL}</div>
            </div>
            <div className="home-ticket-info-item">
              <div className="home-ticket-label">Heure</div>
              <div className="home-ticket-value">{EVENT_TIME_LABEL}</div>
            </div>
            <div className="home-ticket-info-item">
              <div className="home-ticket-label">Lieu</div>
              <div className="home-ticket-value">{EVENT_LOCATION}</div>
            </div>
            <div className="home-ticket-info-item">
              <div className="home-ticket-label">Type</div>
              <div className="home-ticket-value">Solo & Couple</div>
            </div>
          </div>

          <div className="home-ticket-categories" aria-label="Categories de tickets">
            <div
              className={`home-ticket-category ${selectedCategory === 'solo' ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'solo' ? '' : 'solo')}
            >
              <span>Solo</span>
              <strong>8 000 FCFA</strong>
            </div>
            <div
              className={`home-ticket-category ${selectedCategory === 'couple' ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'couple' ? '' : 'couple')}
            >
              <span>Couple</span>
              <strong>12 000 FCFA</strong>
            </div>
          </div>

          <div className="home-ticket-barcode">
            <div className="home-barcode-lines" aria-hidden="true">
              {barcodeLines.map((line) => <span key={line} />)}
            </div>
            <div className="home-ticket-status">
              <span className="home-status-dot" aria-hidden="true" />
              Disponible à l'achat
            </div>
          </div>
        </div>
      </section>

      <section className="home-features" aria-label="Avantages">
        <article className="home-feature-card">
          <div className="home-feature-icon home-icon-purple">✓</div>
          <h2 className="home-feature-title">Paiement sécurisé</h2>
          <p className="home-feature-desc">Mobile Money, carte bancaire et paiement en ligne 100% protégé.</p>
        </article>
        <article className="home-feature-card">
          <div className="home-feature-icon home-icon-pink">QR</div>
          <h2 className="home-feature-title">Ticket QR Code</h2>
          <p className="home-feature-desc">Reçois ton ticket numérique instantanément sur ton téléphone.</p>
        </article>
        <article className="home-feature-card">
          <div className="home-feature-icon home-icon-blue">24</div>
          <h2 className="home-feature-title">Disponible 24h/24</h2>
          <p className="home-feature-desc">Achetez votre ticket à tout moment, depuis n'importe où.</p>
        </article>
      </section>

      <footer className="home-footer-bar" aria-hidden="true" />
    </main>
    <Footer />
    <ChatBot />
    </>
  );
}
