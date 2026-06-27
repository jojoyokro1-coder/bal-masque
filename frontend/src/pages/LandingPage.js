import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const STAR_COLORS = [
  '117, 190, 232',
  '190, 132, 255',
  '233, 82, 155',
  '238, 199, 73',
  '111, 219, 167',
];

export default function LandingPage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animFrameId;
    let stars = [];

    const createStars = () => {
      const area = window.innerWidth * window.innerHeight;
      const total = Math.max(26, Math.min(48, Math.round(area / 42000)));

      stars = Array.from({ length: total }, (_, index) => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: index % 11 === 0 ? 2.7 : Math.random() * 1.4 + 0.7,
        alpha: Math.random() * 0.5 + 0.35,
        pulse: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.018 + 0.008,
        color: STAR_COLORS[index % STAR_COLORS.length],
      }));
    };

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      createStars();
    };
    resize();
    window.addEventListener('resize', resize);

    // Génération des étoiles
    stars = stars.length ? stars : Array.from({ length: 0 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.003,
      color: ['#ffffff', '#c8b6ff', '#ffd6a5', '#a0c4ff'][Math.floor(Math.random() * 4)],
    }));

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Fond dégradé nuit
      const bg = ctx.createRadialGradient(
        width * 0.75, height * 0.55, 0,
        width * 0.75, height * 0.55, width * 0.8
      );
      bg.addColorStop(0, '#2d0a4e');
      bg.addColorStop(0.4, '#150828');
      bg.addColorStop(0.7, '#0a0a1a');
      bg.addColorStop(1, '#060612');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Lueur violette en bas à droite
      const glow = ctx.createRadialGradient(
        width * 0.82, height * 0.48, 0,
        width * 0.82, height * 0.48, width * 0.55
      );
      glow.addColorStop(0, 'rgba(87, 17, 83, 0.42)');
      glow.addColorStop(0.5, 'rgba(44, 9, 55, 0.18)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Lueur teal en bas
      const teal = ctx.createRadialGradient(
        width * 0.48, height * 0.98, 0,
        width * 0.48, height * 0.98, width * 0.34
      );
      teal.addColorStop(0, 'rgba(5, 66, 91, 0.34)');
      teal.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = teal;
      ctx.fillRect(0, 0, width, height);

      // Étoiles scintillantes
      stars.forEach(s => {
        s.pulse += s.speed;
        const alpha = Math.max(0.18, s.alpha + Math.sin(s.pulse) * 0.22);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color}, ${alpha})`;
        ctx.shadowColor = `rgba(${s.color}, 0.75)`;
        ctx.shadowBlur = s.r * 5;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      animFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="landing-page">
      <canvas ref={canvasRef} className="landing-canvas" />

      <div className="landing-content">
        <div className="landing-logo">🎭</div>
        <h1 className="landing-title">BAL MASQUÉ</h1>
        <p className="landing-subtitle">Pigier CI · 2026</p>
        <p className="landing-desc">
          Une soirée inoubliable vous attend.<br />
          Procurez-vous vos billets dès maintenant.
        </p>

        <div className="landing-actions">
          <Link to="/login" className="landing-btn-primary">
            Se connecter
          </Link>
          <Link to="/register" className="landing-btn-secondary">
            Créer un compte
          </Link>
        </div>

        <div className="landing-footer">
          © 2026 Bal'est · Pigier CI · Tous droits réservés
        </div>
      </div>
    </div>
  );
}
