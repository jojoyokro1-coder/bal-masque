import React, { useEffect, useRef } from 'react';
import { EVENT_FULL_LABEL, EVENT_LOCATION } from '../utils/eventInfo';

const STAR_COLORS = [
  '117, 190, 232',
  '190, 132, 255',
  '233, 82, 155',
  '238, 199, 73',
  '111, 219, 167',
];

export default function HomePage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let stars = [];

    const createStars = () => {
      const area = window.innerWidth * window.innerHeight;
      const total = Math.max(26, Math.min(48, Math.round(area / 42000)));

      stars = Array.from({ length: total }, (_, index) => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: index % 11 === 0 ? 2.7 : Math.random() * 1.4 + 0.7,
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

    const drawBackground = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const base = ctx.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, '#090918');
      base.addColorStop(0.45, '#070817');
      base.addColorStop(1, '#061526');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const violetGlow = ctx.createRadialGradient(
        width * 0.82,
        height * 0.48,
        0,
        width * 0.82,
        height * 0.48,
        width * 0.55
      );
      violetGlow.addColorStop(0, 'rgba(87, 17, 83, 0.42)');
      violetGlow.addColorStop(0.45, 'rgba(44, 9, 55, 0.18)');
      violetGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = violetGlow;
      ctx.fillRect(0, 0, width, height);

      const topPurple = ctx.createRadialGradient(
        width * 0.26,
        0,
        0,
        width * 0.26,
        0,
        width * 0.52
      );
      topPurple.addColorStop(0, 'rgba(38, 18, 77, 0.52)');
      topPurple.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topPurple;
      ctx.fillRect(0, 0, width, height);

      const tealGlow = ctx.createRadialGradient(
        width * 0.48,
        height * 0.98,
        0,
        width * 0.48,
        height * 0.98,
        width * 0.34
      );
      tealGlow.addColorStop(0, 'rgba(5, 66, 91, 0.34)');
      tealGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = tealGlow;
      ctx.fillRect(0, 0, width, height);
    };

    const draw = () => {
      drawBackground();

      stars.forEach((star) => {
        star.pulse += star.speed;
        const alpha = Math.max(0.18, star.alpha + Math.sin(star.pulse) * 0.22);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color}, ${alpha})`;
        ctx.shadowColor = `rgba(${star.color}, 0.75)`;
        ctx.shadowBlur = star.radius * 5;
        ctx.fill();
      });

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <main className="landing-page" aria-label="Accueil BalFest">
      <canvas ref={canvasRef} className="landing-canvas" aria-hidden="true" />
      <footer className="landing-footer">
        {EVENT_FULL_LABEL} · {EVENT_LOCATION}
      </footer>
    </main>
  );
}
