# Deploiement Vercel + Supabase

## 1. Creer la base Supabase

1. Creer un projet sur Supabase.
2. Ouvrir **SQL Editor**.
3. Copier-coller le contenu de `supabase/schema.sql`.
4. Executer le script.

Le compte admin cree par defaut est :

- Email : `admin@balmasque.ci`
- Mot de passe : `Admin@123`

## 2. Recuperer l'URL Postgres

Dans Supabase, utiliser l'URL du pooler Postgres, format :

```text
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

Remplacer `PROJECT_REF`, `PASSWORD` et eventuellement la region selon ton projet Supabase.

## 3. Variables d'environnement Vercel

Ajouter ces variables dans Vercel :

```text
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
JWT_SECRET=une_longue_valeur_secrete
CORS_ORIGIN=https://ton-domaine.vercel.app
FRONTEND_URL=https://ton-domaine.vercel.app
BACKEND_URL=https://ton-domaine.vercel.app
GOOGLE_CLIENT_ID=ton_google_client_id
GOOGLE_CLIENT_SECRET=ton_google_client_secret
FACEBOOK_APP_ID=ton_facebook_app_id
FACEBOOK_APP_SECRET=ton_facebook_app_secret
```

Si tu testes en preview Vercel, tu peux mettre plusieurs origines separees par des virgules :

```text
CORS_ORIGIN=https://ton-domaine.vercel.app,https://ton-preview.vercel.app
```

Si le frontend et le backend sont deployes sur deux domaines differents, utilise :

```text
FRONTEND_URL=https://ton-frontend.vercel.app
BACKEND_URL=https://ton-backend.vercel.app
CORS_ORIGIN=https://ton-frontend.vercel.app
```

`OAUTH_BASE_URL` est optionnel. Ajoute-le seulement si l'URL publique utilisee par Google/Facebook pour les callbacks est differente de `BACKEND_URL`.

## 4. Configuration OAuth Google/Facebook

Dans Google Cloud Console, ajoute cette URL de redirection autorisee :

```text
https://ton-backend-ou-domaine.vercel.app/api/auth/google/callback
```

Dans Meta for Developers, ajoute cette URL OAuth valide :

```text
https://ton-backend-ou-domaine.vercel.app/api/auth/facebook/callback
```

En local, les callbacks sont :

```text
http://localhost:5000/api/auth/google/callback
http://localhost:5000/api/auth/facebook/callback
```

## 5. Configuration Vercel

Le projet contient deja :

- `vercel.json` pour builder `frontend/build` et router `/api/*`.
- `api/[...path].js` pour exposer l'API Express en serverless.
- `package.json` racine avec `npm run build:vercel`.

Dans Vercel, importer le repo avec la racine du projet. La commande de build est :

```bash
npm run build:vercel
```

Le dossier de sortie est :

```text
frontend/build
```

## 6. Verification

Apres deploiement :

- Tester `https://ton-domaine.vercel.app/api/health`.
- Ouvrir `https://ton-domaine.vercel.app/login`.
- Se connecter avec `admin@balmasque.ci / Admin@123`.
- Tester `Continuer avec Google`.
- Tester `Continuer avec Facebook`.



- 
