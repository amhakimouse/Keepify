# Keepify - Site Web

Prédiction de churn client (ML) + interface React (Tailwind) + API FastAPI + PostgreSQL.

## Installation sur une nouvelle machine

1. **Prérequis** : Python 3.10+, Node.js 18+, PostgreSQL (mot de passe `@onepiece20@`)
2. **Backend** :
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   Copy-Item .env.example .env   # puis éditer DB_PASSWORD
   ```
3. **Frontend** :
   ```powershell
   cd frontend
   npm install
   ```
4. **Modèle** : les modèles entraînés sont **versionnés dans git** (`MODELS/*.joblib` + `REPORTS/`).
   Pour réentraîner (optionnel) :
   ```powershell
   cd ..
   python -m SRC.run   # régénère MODELS/best_churn_model.joblib + REPORTS/
   ```
5. **Lancer** :
   ```powershell
   # Backend (terminal 1)
   cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   # Frontend (terminal 2)
   cd frontend; npm run dev
   ```
   → Frontend : http://localhost:5173 | Backend docs : http://localhost:8000/docs

## Comptes de démo

- Admin : `admin` / `admin123`
- Client : `client` / `client123`

## Fichiers ignorés par git (à régénérer)

- `frontend/node_modules/` — via `npm install`
- `frontend/dist/` — via `npm run build`
- `backend/.env` — secrets locaux (copier depuis `backend/.env.example`)
- `DATA/` — copie locale (le jeu versionné est dans `dataset/`)

> Les modèles `MODELS/*.joblib` et les rapports `REPORTS/` sont bien committés : le site fonctionne sans réentraînement.
