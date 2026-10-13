import React, { useState, useRef, useEffect } from 'react';
import { EVENT_FULL_LABEL, EVENT_LOCATION } from '../utils/eventInfo';

// ─── Base de connaissance FAQ ───────────────────────────────────────────────
const FAQ_RULES = [
  {
    keywords: ['date', 'quand', 'jour', 'soirée', 'soir', 'heure', 'horaire'],
    answer: `📅 L'événement aura lieu le ${EVENT_FULL_LABEL}.`,
  },
  {
    keywords: ['lieu', 'où', 'endroit', 'salle', 'adresse', 'palais', 'location'],
    answer: `📍 Le bal aura lieu à ${EVENT_LOCATION}.`,
  },
  {
    keywords: ['tarif', 'prix', 'coût', 'combien', 'ticket', 'billet', 'place', 'solo', 'couple', 'fcfa'],
    answer: "🎟️ Les tarifs sont :\n\n• **Solo** : 8 000 FCFA\n• **Couple** : 12 000 FCFA\n\nLes places sont limitées — ne tarde pas !",
  },
  {
    keywords: ['acheter', 'achat', 'commander', 'réserver', 'réservation', 'comment', 'inscrire'],
    answer: "🛒 Pour acheter ton billet :\n1. Crée un compte sur ce site\n2. Connecte-toi\n3. Choisis ta catégorie (Solo ou Couple)\n4. Procède au paiement\n5. Reçois ton billet par email avec QR Code !",
  },
  {
    keywords: ['paiement', 'payer', 'orange', 'mtn', 'moov', 'wave', 'mobile money', 'moyens'],
    answer: "💳 Nous acceptons les moyens de paiement suivants :\n\n• Orange Money\n• MTN Mobile Money\n• Moov Money\n• Wave\n\nEn cas d'échec, aucun montant n'est prélevé et tu peux réessayer sans souci.",
  },
  {
    keywords: ['remboursement', 'remboursable', 'annulation', 'rembourser', 'annuler'],
    answer: "ℹ️ Les billets ne sont pas remboursables, sauf en cas d'annulation officielle de l'événement. Choisis bien ta catégorie avant de valider !",
  },
  {
    keywords: ['compte', 'créer', 'inscription', 'mot de passe', 'email', 'connexion', 'login'],
    answer: "👤 Tu dois créer un compte pour acheter ton billet. C'est rapide !\n\nSi tu as oublié ton mot de passe, une récupération par email est disponible sur la page de connexion.",
  },
  {
    keywords: ['qr', 'qr code', 'téléphone', 'imprimer', 'entrée', 'accès', 'présenter'],
    answer: "📱 Ton billet te sera envoyé par email après confirmation du paiement. Tu peux le présenter :\n\n• Sur ton téléphone (QR Code)\n• Imprimé sur papier\n\nLes deux sont acceptés à l'entrée.",
  },
  {
    keywords: ['masque', 'tenue', 'dress code', 'costume', 'vêtement', 'obligatoire', 'élégant'],
    answer: "🎭 C'est un Bal Masqué — le masque est obligatoire et fait partie de l'âme de la soirée !\n\n✨ Tenue de soirée élégante et mystérieuse : robes de gala, masques vénitiens, loups, dominos… Couleurs recommandées : noir, or, bordeaux, violet. 🌙",
  },
  {
    keywords: ['invité', 'ami', 'externe', 'pigier', 'ouvert', 'qui peut'],
    answer: "🎉 L'événement est ouvert aux étudiants de Pigier CI et à leurs invités. Vous êtes tous les bienvenus pour cette soirée inoubliable !",
  },
  {
    keywords: ['plusieurs', 'multiple', 'deux', 'trois', 'billets'],
    answer: "✅ Oui, il est possible d'acheter plusieurs billets en une seule commande. Idéal pour réserver pour toute ta promo !",
  },
  {
    keywords: ['contact', 'joindre', 'aide', 'support', 'problème', 'question', 'whatsapp'],
    answer: "📞 Pour toute question ou assistance, contacte-nous via :\n\n• **WhatsApp** : +225 01 51 17 15 46\n• **Email** : jojoyokro1@gmail.com\n\nNous sommes disponibles du Lundi au Vendredi, de 8h à 17h.",
  },
  {
    keywords: ['limité', 'stock', 'places', 'combien de places', 'disponible'],
    answer: "⚠️ Les places sont **limitées** ! Il n'y a qu'un nombre restreint de tickets disponibles par catégorie. Plus tu t'inscris tôt, meilleur est ton tarif. N'attends pas !",
  },
];

const QUICK_QUESTIONS = [
  { label: '🎟️ Tarifs', query: 'Quels sont les tarifs ?' },
  { label: '💳 Paiement', query: 'Comment payer ?' },
  { label: '📅 Date', query: 'Quelle est la date ?' },
  { label: '🎭 Dress code', query: 'Quel est le dress code ?' },
  { label: '📍 Lieu', query: 'Où se passe l\'événement ?' },
];

const FALLBACK = "Je n'ai pas cette information pour le moment. Contacte-nous directement via WhatsApp (+225 01 51 17 15 46) ou par email à jojoyokro1@gmail.com 😊";

const GREETING = "Bonjour ! 🎭 Je suis l'assistant FAQ du **Bal Masqué BalFest 2026**.\n\nJe peux répondre à tes questions sur les billets, tarifs, paiements, le soir de l'événement et plus encore.\n\nQue veux-tu savoir ?";

function getBotResponse(input) {
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const rule of FAQ_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return rule.answer;
    }
  }
  return FALLBACK;
}

function formatMessage(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: GREETING, id: 0 },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const idRef = useRef(1);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, typing]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Écoute l'événement dispatché par le lien FAQ du footer
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-faq-chat', handleOpen);
    return () => window.removeEventListener('open-faq-chat', handleOpen);
  }, []);

  const sendMessage = (text) => {
    const userMsg = { from: 'user', text, id: idRef.current++ };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const botResponse = getBotResponse(text);
      setMessages((prev) => [...prev, { from: 'bot', text: botResponse, id: idRef.current++ }]);
      setTyping(false);
    }, 700 + Math.random() * 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  return (
    <>
      {/* ── Fenêtre de chat ── */}
      <div className={`chatbot-window ${open ? 'chatbot-window-open' : ''}`} role="dialog" aria-label="Assistant FAQ BalFest 2026">
        <div className="chatbot-header">
          <div className="chatbot-header-avatar" aria-hidden="true">🎭</div>
          <div className="chatbot-header-info">
            <span className="chatbot-header-name">Assistant BalFest</span>
            <span className="chatbot-header-status">
              <span className="chatbot-status-dot" aria-hidden="true" />
              En ligne
            </span>
          </div>
          <button className="chatbot-close-btn" onClick={() => setOpen(false)} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="chatbot-messages" aria-live="polite">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbot-msg chatbot-msg-${msg.from}`}>
              {msg.from === 'bot' && (
                <span className="chatbot-msg-avatar" aria-hidden="true">🎭</span>
              )}
              <div className="chatbot-msg-bubble">
                {formatMessage(msg.text)}
              </div>
            </div>
          ))}

          {typing && (
            <div className="chatbot-msg chatbot-msg-bot">
              <span className="chatbot-msg-avatar" aria-hidden="true">🎭</span>
              <div className="chatbot-msg-bubble chatbot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chatbot-quick-questions" aria-label="Questions fréquentes">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q.label}
              className="chatbot-quick-btn"
              onClick={() => sendMessage(q.query)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <form className="chatbot-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="chatbot-input"
            type="text"
            placeholder="Pose ta question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Ta question"
            maxLength={300}
          />
          <button
            type="submit"
            className="chatbot-send-btn"
            aria-label="Envoyer"
            disabled={!input.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>

      <button
        className={`chatbot-fab ${open ? 'chatbot-fab-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Fermer l’assistant FAQ' : 'Ouvrir l’assistant FAQ'}
      >
        <span aria-hidden="true">{open ? '✕' : '💬'}</span>
        {!open && <span className="chatbot-fab-label">FAQ</span>}
      </button>
    </>
  );
}
