import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentReturn() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0));
    }, 1000);

    const redirect = setTimeout(() => {
      navigate('/client', { replace: true });
    }, 5000);

    return () => {
      clearInterval(countdown);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="payment-return-page">
      <div className="payment-return-panel">
        <span className="payment-return-icon">✓</span>
        <h1>Paiement terminé</h1>
        <p>Retour au dashboard dans {secondsLeft} seconde{secondsLeft > 1 ? 's' : ''}.</p>
        <button className="btn-primary" onClick={() => navigate('/client', { replace: true })}>
          Aller au dashboard
        </button>
      </div>
    </div>
  );
}
