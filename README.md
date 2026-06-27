# 🎭 Bal Masqué — Système de Gestion de Tickets

Application complète de vente et validation de tickets pour le bal de fin d'année universitaire.

---

## 🗂️ Structure du projet

```
bal-masque/
├── backend/
│   ├── config/
│   │   ├── db.js            # Connexion MySQL
│   │   └── schema.sql       # Schéma de la base de données
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   └── ticketController.js
│   ├── middleware/
│   │   └── auth.js          # JWT + vérification des rôles
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── tickets.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── AdminDashboard.js
    │   │   ├── ClientDashboard.js
    │   │   └── InspecteurDashboard.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json
```

---

## ⚙️ Installation

### Prérequis
- Node.js >= 16
- MySQL >= 8

### 1. Base de données

```bash
mysql -u root -p < backend/config/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Modifier .env avec vos paramètres MySQL
npm install
npm run dev
```

Le serveur tourne sur `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

L'app tourne sur `http://localhost:3000`

---

## 👤 Accès par défaut

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@balmasque.ci | Admin@123 |

---

## 🔌 API Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription client |
| POST | `/api/auth/login` | Connexion |

### Admin (token admin requis)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/statistiques` | Stats globales |
| GET | `/api/admin/tickets` | Tous les tickets |
| POST | `/api/admin/inspecteurs` | Créer inspecteur |
| GET | `/api/admin/inspecteurs` | Liste inspecteurs |
| DELETE | `/api/admin/inspecteurs/:id` | Supprimer inspecteur |
| GET | `/api/admin/evenement` | Détails événement |
| PUT | `/api/admin/evenement` | Modifier événement |

### Tickets
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/tickets/evenement` | Infos événement (public) |
| POST | `/api/tickets/acheter` | Acheter tickets (client) |
| GET | `/api/tickets/mes-tickets` | Mes tickets (client) |
| GET | `/api/tickets/mes-commandes` | Mes commandes (client) |
| POST | `/api/tickets/scanner` | Scanner QR code (inspecteur) |

---

## 💳 Intégration paiement

Pour intégrer un agrégateur (CinetPay, PayDunya, etc.) :

1. Dans `ticketController.js`, remplacer la ligne :
   ```js
   await db.query('UPDATE commandes SET statut = "payee" WHERE id = ?', [commande_id]);
   ```
2. Par un appel à l'API de l'agrégateur avec le `montant_total` et `commande_id`
3. Implémenter un webhook pour confirmer le paiement et mettre à jour la commande

---

## 🛡️ Règles métier

- **QR Code unique** : chaque ticket a un UUID unique non réutilisable
- **Un scan = une entrée** : après scan, le ticket est marqué `utilise`
- **Délai 2 minutes** : entre deux commandes pour le même client
- **Rôles stricts** : admin crée les inspecteurs, les clients ne peuvent qu'acheter
