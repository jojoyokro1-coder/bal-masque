-- Schema Postgres/Supabase pour Bal Masque.
-- A executer dans Supabase SQL Editor.

create type user_role as enum ('admin', 'sous_admin', 'client', 'inspecteur');
create type commande_statut as enum ('en_attente', 'payee', 'annulee');
create type ticket_statut as enum ('actif', 'utilise', 'annule');

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table users (
  id integer generated always as identity primary key,
  nom varchar(100) not null,
  prenom varchar(100) not null,
  email varchar(150) unique not null,
  password varchar(255) not null,
  role user_role not null default 'client',
  created_by integer references users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table evenements (
  id integer generated always as identity primary key,
  nom varchar(200) not null,
  description text,
  date_evenement timestamp with time zone not null,
  lieu varchar(255) not null,
  prix_ticket numeric(10, 2) not null,
  quantite_totale integer not null,
  quantite_disponible integer not null,
  actif boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table commandes (
  id integer generated always as identity primary key,
  client_id integer not null references users(id),
  evenement_id integer not null references evenements(id),
  quantite integer not null,
  ticket_type varchar(20) not null default 'solo',
  prix_unitaire numeric(10, 2) not null default 7000,
  montant_total numeric(10, 2) not null,
  promotion_details jsonb,
  statut commande_statut not null default 'en_attente',
  reference_paiement varchar(255),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table tickets (
  id integer generated always as identity primary key,
  commande_id integer not null references commandes(id),
  client_id integer not null references users(id),
  evenement_id integer not null references evenements(id),
  code_unique varchar(36) unique not null,
  qr_code_data text not null,
  ticket_type varchar(20) not null default 'solo',
  prix_unitaire numeric(10, 2) not null default 7000,
  rang_acheteur integer,
  promotion_badge varchar(120),
  statut ticket_statut not null default 'actif',
  scanne_par integer references users(id),
  scanne_le timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table app_settings (
  key varchar(100) primary key,
  value text not null,
  updated_at timestamp with time zone default now()
);

insert into app_settings (key, value)
values ('vote_tab_visible', 'true')
on conflict (key) do nothing;

create table vote_couples (
  id serial primary key,
  roi_name varchar(150) not null,
  reine_name varchar(150) not null,
  roi_photo text,
  reine_photo text,
  description text,
  active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table votes (
  id serial primary key,
  client_id integer not null references users(id) on delete cascade,
  category varchar(80) not null,
  candidate varchar(150) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (client_id, category)
);

create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

create trigger evenements_set_updated_at
before update on evenements
for each row execute function set_updated_at();

create trigger commandes_set_updated_at
before update on commandes
for each row execute function set_updated_at();

create trigger vote_couples_set_updated_at
before update on vote_couples
for each row execute function set_updated_at();

create index idx_tickets_code on tickets(code_unique);
create index idx_tickets_client on tickets(client_id);
create index idx_commandes_client on commandes(client_id);
create index idx_commandes_statut on commandes(statut);

insert into users (nom, prenom, email, password, role)
values ('Admin', 'Systeme', 'admin@balmasque.ci', '$2a$10$/27JdxWzY.OGd9XXUDH6pety2i0STGUzjFHai0ZqN2Sfqb.lCfJBa', 'admin')
on conflict (email) do update set
  nom = excluded.nom,
  prenom = excluded.prenom,
  password = excluded.password,
  role = excluded.role,
  updated_at = now();

insert into evenements (nom, description, date_evenement, lieu, prix_ticket, quantite_totale, quantite_disponible)
values (
  'Bal Masque 2026 - Soiree des Mysteres',
  'La grande soiree de fin d''annee de l''universite. Venez masques et prets a danser !',
  '2026-09-04 19:00:00+00',
  'Espace Le Villier, Yopougon Chambéry',
  7000.00,
  300,
  300
);

-- ============================================================
-- MIGRATION : ajout du role sous_admin (base deja existante)
-- A executer dans Supabase SQL Editor si la table users existe deja
-- ============================================================
-- alter type user_role add value 'sous_admin' after 'admin';
