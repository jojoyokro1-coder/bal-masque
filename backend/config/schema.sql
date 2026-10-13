-- ============================================
-- SCHÉMA BASE DE DONNÉES - BAL MASQUÉ
-- ============================================

CREATE DATABASE IF NOT EXISTS bal_masque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bal_masque;

-- Table des utilisateurs (admin, client, inspecteur)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'sous_admin', 'client', 'inspecteur') NOT NULL DEFAULT 'client',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table de l'événement (bal)
CREATE TABLE evenements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  description TEXT,
  date_evenement DATETIME NOT NULL,
  lieu VARCHAR(255) NOT NULL,
  prix_ticket DECIMAL(10,2) NOT NULL,
  quantite_totale INT NOT NULL,
  quantite_disponible INT NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE commandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  evenement_id INT NOT NULL,
  quantite INT NOT NULL,
  ticket_type VARCHAR(20) NOT NULL DEFAULT 'solo',
  prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 7000,
  montant_total DECIMAL(10,2) NOT NULL,
  promotion_details JSON NULL,
  statut ENUM('en_attente', 'payee', 'annulee') NOT NULL DEFAULT 'en_attente',
  reference_paiement VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (evenement_id) REFERENCES evenements(id)
);

-- Table des tickets (un ticket = un QR code)
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commande_id INT NOT NULL,
  client_id INT NOT NULL,
  evenement_id INT NOT NULL,
  code_unique VARCHAR(36) UNIQUE NOT NULL,
  qr_code_data TEXT NOT NULL,
  ticket_type VARCHAR(20) NOT NULL DEFAULT 'solo',
  prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 7000,
  rang_acheteur INT NULL,
  promotion_badge VARCHAR(120) NULL,
  statut ENUM('actif', 'utilise', 'annule') NOT NULL DEFAULT 'actif',
  scanne_par INT NULL,
  scanne_le TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commande_id) REFERENCES commandes(id),
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (evenement_id) REFERENCES evenements(id),
  FOREIGN KEY (scanne_par) REFERENCES users(id)
);

-- Paramètres applicatifs pilotés depuis l'administration
CREATE TABLE app_settings (
  `key` VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO app_settings (`key`, value)
VALUES ('vote_tab_visible', 'true');

CREATE TABLE vote_couples (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roi_name VARCHAR(150) NOT NULL,
  reine_name VARCHAR(150) NOT NULL,
  roi_photo LONGTEXT,
  reine_photo LONGTEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  category VARCHAR(80) NOT NULL,
  candidate VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote_client_category (client_id, category),
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX idx_tickets_code ON tickets(code_unique);
CREATE INDEX idx_tickets_client ON tickets(client_id);
CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);

-- Insertion d'un admin par défaut (password: Admin@@123)
INSERT INTO users (nom, prenom, email, password, role)
VALUES ('Admin', 'Système', 'admin@balmasque.ci', '$2a$10$/27JdxWzY.OGd9XXUDH6pety2i0STGUzjFHai0ZqN2Sfqb.lCfJBa', 'admin');

-- Insertion d'un événement de démonstration
INSERT INTO evenements (nom, description, date_evenement, lieu, prix_ticket, quantite_totale, quantite_disponible)
VALUES (
  'Bal Masqué 2026 - Soirée des Mystères',
  'La grande soirée de fin d''année de l''université. Venez masqués et prêts à danser !',
  '2026-09-04 19:00:00',
  'Espace Le Villier, Yopougon Chambéry',
  7000.00,
  300,
  300
);
