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
  role ENUM('admin', 'client', 'inspecteur') NOT NULL DEFAULT 'client',
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

-- Index pour les performances
CREATE INDEX idx_tickets_code ON tickets(code_unique);
CREATE INDEX idx_tickets_client ON tickets(client_id);
CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);

-- Insertion d'un admin par défaut (password: Admin@123)
INSERT INTO users (nom, prenom, email, password, role)
VALUES ('Admin', 'Système', 'admin@balmasque.ci', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insertion d'un événement de démonstration
INSERT INTO evenements (nom, description, date_evenement, lieu, prix_ticket, quantite_totale, quantite_disponible)
VALUES (
  'Bal Masqué 2026 - Soirée des Mystères',
  'La grande soirée de fin d''année de l''université. Venez masqués et prêts à danser !',
  '2026-12-20 20:00:00',
  'Grand Hall de Pigier CI',
  7000.00,
  300,
  300
);
