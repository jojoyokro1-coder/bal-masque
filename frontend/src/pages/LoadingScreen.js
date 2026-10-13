import React, { useEffect, useState, useRef } from 'react';
import './LoadingScreen.css';
import { EVENT_FULL_LABEL, EVENT_LOCATION } from '../utils/eventInfo';

const STATUS_MESSAGES = [
  'Préparation de la soirée',
  'Ajustement des masques',
  'Allumage des chandelles',
  'Ouverture des portes'
];
const DURATION = 5500;

function easeProgress(raw) {
  let e = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
  if (raw > 0.55 && raw < 0.75) e = 0.65 + (raw - 0.55) * 0.1;
  return e;
}

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(STATUS_MESSAGES[0]);
  const [statusOpacity, setStatusOpacity] = useState(1);
  const [isReady, setIsReady] = useState(false);
  
  const loaderRef = useRef(null);
  const lastStatusRef = useRef(STATUS_MESSAGES[0]);
  
  // Progress animation
  useEffect(() => {
    let startTime = Date.now();
    let frameId;
    let running = true;

    const tick = () => {
      if (!running) return;
      const raw = Math.min((Date.now() - startTime) / DURATION, 1);
      const currentProgress = Math.round(easeProgress(raw) * 100);
      
      setProgress(currentProgress);

      const idx = Math.min(Math.floor((currentProgress / 100) * 3.99), 3);
      const newText = STATUS_MESSAGES[idx] + '...';
      
      if (newText !== lastStatusRef.current) {
        lastStatusRef.current = newText;
        setStatusOpacity(0);
        setTimeout(() => {
          if (running) {
            setStatusText(newText);
            setStatusOpacity(1);
          }
        }, 320);
      }

      if (currentProgress >= 100) {
        setTimeout(() => {
          if (running) {
            if (loaderRef.current) {
              loaderRef.current.style.opacity = 0;
              loaderRef.current.style.transform = 'scale(1.04)';
            }
            setIsReady(true);
          }
        }, 450);
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Particles animation
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const ptColors = [
      'radial-gradient(circle, var(--or-light), var(--or))',
      'radial-gradient(circle, var(--or-light), var(--violet))',
      'radial-gradient(circle, var(--blanc), var(--or))'
    ];

    let pts = Array.from({ length: 34 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      op: 0.2 + Math.random() * 0.55,
      speed: 0.12 + Math.random() * 0.25,
      drift: (Math.random() - 0.5) * 0.07,
      phase: Math.random() * Math.PI * 2,
      color: ptColors[i % 3]
    }));
    
    setParticles(pts);

    let t = 0;
    let frameId;
    const animParticles = () => {
      t += 0.016;
      setParticles(currentPts => currentPts.map(p => {
        let newY = p.y - p.speed * 0.28;
        let newX = p.x + Math.sin(t * 0.8 + p.phase) * p.drift;
        if (newY < -5) {
          newY = 105;
          newX = Math.random() * 100;
        }
        const newOp = p.op * (0.7 + 0.3 * Math.sin(t * 1.2 + p.phase));
        return { ...p, x: newX, y: newY, currentOp: newOp };
      }));
      frameId = requestAnimationFrame(animParticles);
    };
    frameId = requestAnimationFrame(animParticles);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Eye sparkles animation
  const [sparkleOp, setSparkleOp] = useState({ l: 1, r: 1 });
  useEffect(() => {
    let frameId;
    const animSpark = () => {
      const now = Date.now();
      setSparkleOp({
        l: 0.6 + 0.4 * Math.sin(now / 500),
        r: 0.6 + 0.4 * Math.sin(now / 500 + 1)
      });
      frameId = requestAnimationFrame(animSpark);
    };
    frameId = requestAnimationFrame(animSpark);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="ls-root">
      {/* Background */}
      <div className="ls-bg"></div>
      <div className="ls-bg-vignette"></div>
      <div className="ls-bg-blob ls-blob-gold"></div>
      <div className="ls-bg-blob ls-blob-red-l"></div>
      <div className="ls-bg-blob ls-blob-red-r"></div>
      <div className="ls-border-h top"></div>
      <div className="ls-border-h bottom"></div>

      {/* Particles */}
      <div id="ls-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="ls-pt"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.6}px`,
              background: p.color,
              opacity: p.currentOp !== undefined ? p.currentOp : p.op,
              filter: 'blur(.4px)',
              boxShadow: '0 0 4px rgba(201,168,76,.4)'
            }}
          />
        ))}
      </div>

      {/* Corner ornaments */}
      {['tl', 'tr', 'bl', 'br'].map(pos => (
        <div key={pos} className={`ls-corner ${pos}`}>
          <svg viewBox="0 0 60 60" fill="none">
            <path d="M5 5 L5 28 M5 5 L28 5 M5 5 L22 22" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="5" cy="5" r="2.5" fill="#c9a84c" />
          </svg>
        </div>
      ))}

      {/* Main Content */}
      <div className="ls-loader" id="loaderContent" ref={loaderRef} style={{ transition: 'opacity .8s ease, transform .8s ease' }}>
        <div className="ls-eyebrow">Pigier Côte d'Ivoire présente</div>

        {/* Venetian Mask */}
        <div className="ls-mask-wrap">
          <div className="ls-mask-halo"></div>
          <svg viewBox="0 0 320 200"
            style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 28px rgba(201,168,76,0.35))' }}
            aria-label="Masque vénitien doré">
            <defs>
              <radialGradient id="maskGold" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="var(--or-light)" />
                <stop offset="50%" stopColor="var(--or)" />
                <stop offset="100%" stopColor="#a6811e" />
              </radialGradient>
              <radialGradient id="maskShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--noir-light)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--noir)" stopOpacity="0.8" />
              </radialGradient>
              <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--violet)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--noir-card)" stopOpacity="1" />
              </radialGradient>
            </defs>

            {/* Mask body */}
            <path d="M 60 90 C 55 60, 70 30, 100 25 C 120 20, 140 28, 160 25 C 180 22, 200 20, 220 25 C 250 30, 265 60, 260 90 C 258 105, 250 118, 235 125 C 225 130, 215 128, 205 132 C 195 138, 188 152, 180 158 C 170 165, 150 165, 140 158 C 132 152, 125 138, 115 132 C 105 128, 95 130, 85 125 C 70 118, 62 105, 60 90 Z"
              fill="url(#maskGold)" stroke="var(--or)" strokeWidth="1.5" />

            {/* Ridge */}
            <path d="M 100 30 C 120 45, 140 50, 160 48 C 180 46, 200 45, 220 30"
              fill="none" stroke="var(--or-light)" strokeWidth=".8" strokeOpacity=".5" />

            {/* Left eye */}
            <ellipse cx="110" cy="82" rx="30" ry="20" fill="url(#eyeGlow)" />
            <ellipse cx="110" cy="82" rx="26" ry="17" fill="var(--noir-light)" />
            <ellipse cx="110" cy="82" rx="22" ry="13" fill="var(--noir-card)" />
            <ellipse cx="100" cy="77" rx="5" ry="3" fill="var(--violet)" fillOpacity=".4" />
            <circle cx="120" cy="79" r="2" fill="var(--or-light)" opacity={sparkleOp.l} />

            {/* Right eye */}
            <ellipse cx="210" cy="82" rx="30" ry="20" fill="url(#eyeGlow)" />
            <ellipse cx="210" cy="82" rx="26" ry="17" fill="var(--noir-light)" />
            <ellipse cx="210" cy="82" rx="22" ry="13" fill="var(--noir-card)" />
            <ellipse cx="200" cy="77" rx="5" ry="3" fill="var(--violet)" fillOpacity=".4" />
            <circle cx="220" cy="79" r="2" fill="var(--or-light)" opacity={sparkleOp.r} />

            {/* Nose bridge */}
            <path d="M 148 92 C 145 105, 143 115, 145 125 C 147 132, 155 135, 160 133 C 165 131, 173 128, 175 121 C 177 113, 175 105, 172 92"
              fill="var(--or)" stroke="var(--or)" strokeWidth="1" />

            {/* Forehead gem */}
            <path d="M 155 32 L 160 22 L 165 32" fill="none" stroke="var(--or-light)" strokeWidth="1.5" />
            <circle cx="160" cy="20" r="4" fill="var(--or-light)" />
            <circle cx="160" cy="20" r="2" fill="var(--or)" />

            {/* Left flourish */}
            <path d="M 65 75 C 45 65, 30 50, 35 35 C 38 25, 50 22, 58 30 C 48 35, 45 48, 55 58 C 58 62, 63 68, 65 75 Z"
              fill="var(--or)" stroke="var(--or-light)" strokeWidth=".8" />
            <circle cx="36" cy="33" r="5" fill="var(--or-light)" />
            <circle cx="36" cy="33" r="2.5" fill="var(--violet)" />

            {/* Right flourish */}
            <path d="M 255 75 C 275 65, 290 50, 285 35 C 282 25, 270 22, 262 30 C 272 35, 275 48, 265 58 C 262 62, 257 68, 255 75 Z"
              fill="var(--or)" stroke="var(--or-light)" strokeWidth=".8" />
            <circle cx="284" cy="33" r="5" fill="var(--or-light)" />
            <circle cx="284" cy="33" r="2.5" fill="var(--violet)" />

            {/* Dot row */}
            <circle cx="80" cy="26" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="100" cy="22" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="120" cy="20" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="140" cy="22" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="160" cy="23" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="180" cy="22" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="200" cy="20" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="220" cy="22" r="1.5" fill="var(--or-light)" fillOpacity=".7" />
            <circle cx="240" cy="26" r="1.5" fill="var(--or-light)" fillOpacity=".7" />

            {/* Filigree */}
            <path d="M 85 95 C 95 88, 100 80, 85 72" fill="none" stroke="var(--or-light)" strokeWidth=".6" strokeOpacity=".5" />
            <path d="M 235 95 C 225 88, 220 80, 235 72" fill="none" stroke="var(--or-light)" strokeWidth=".6" strokeOpacity=".5" />

            {/* Shadow overlay */}
            <path d="M 60 90 C 55 60, 70 30, 100 25 C 120 20, 140 28, 160 25 C 180 22, 200 20, 220 25 C 250 30, 265 60, 260 90 C 258 105, 250 118, 235 125 C 225 130, 215 128, 205 132 C 195 138, 188 152, 180 158 C 170 165, 150 165, 140 158 C 132 152, 125 138, 115 132 C 105 128, 95 130, 85 125 C 70 118, 62 105, 60 90 Z"
              fill="url(#maskShadow)" />
          </svg>
        </div>

        {/* Title */}
        <div className="ls-title-block">
          <div className="ls-title-main">BAL MASQUÉ</div>
          <div className="ls-title-sub">BalFest 2026 &mdash; Une nuit d'élégance &amp; de mystère</div>
        </div>

        {/* Divider */}
        <div className="ls-divider">
          <div className="ls-div-line l"></div>
          <svg viewBox="0 0 32 16" style={{ width: '28px', height: '14px', flexShrink: 0 }}>
            <path d="M16 2 L18 7 L24 7 L19 11 L21 16 L16 12 L11 16 L13 11 L8 7 L14 7 Z" fill="#c9a84c" opacity=".9" />
          </svg>
          <div className="ls-div-line r"></div>
        </div>

        {/* Progress */}
        <div className="ls-progress-area">
          <div className="ls-status-text" style={{ opacity: statusOpacity }}>{statusText}</div>
          <div className="ls-track">
            <div className="ls-fill" style={{ width: `${progress}%` }}></div>
            <div className="ls-shimmer" style={{ left: `${Math.max(0, progress - 10)}%` }}></div>
          </div>
          <div className="ls-percent">{progress}%</div>
        </div>

        <div className="ls-date-label">{EVENT_FULL_LABEL}</div>
        <div className="ls-pigier-tag">{EVENT_LOCATION}</div>
      </div>

      {/* Enter Screen */}
      <div className={`ls-enter-screen ${isReady ? 'active' : ''}`}>
        <div className="ls-divider">
          <div className="ls-div-line l"></div>
          <svg viewBox="0 0 32 16" style={{ width: '28px', height: '14px', flexShrink: 0 }}>
            <path d="M16 2 L18 7 L24 7 L19 11 L21 16 L16 12 L11 16 L13 11 L8 7 L14 7 Z" fill="#c9a84c" />
          </svg>
          <div className="ls-div-line r"></div>
        </div>

        <div className="ls-enter-title">Les portes s'ouvrent&hellip;</div>

        <button className="ls-enter-btn" onClick={onComplete}>Entrer</button>

        <div className="ls-divider">
          <div className="ls-div-line l"></div>
          <svg viewBox="0 0 32 16" style={{ width: '28px', height: '14px', flexShrink: 0 }}>
            <path d="M16 2 L18 7 L24 7 L19 11 L21 16 L16 12 L11 16 L13 11 L8 7 L14 7 Z" fill="#c9a84c" />
          </svg>
          <div className="ls-div-line r"></div>
        </div>
      </div>
    </div>
  );
}
