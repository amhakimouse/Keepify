# Keepify

Prédiction de résiliation client, avec une interface web et une API.

## Ce qui n'est pas dans Git

Ces dossiers se reconstruisent. Ils ne sont pas poussés.

| Absent du dépôt | Comment le retrouver |
| --- | --- |
| `frontend/node_modules/` | `cd frontend` puis `npm install` |
| `frontend/dist/` | `cd frontend` puis `npm run build` |
| `__pycache__/` | recréé tout seul au lancement de Python |
| `backend/.env` | copier `backend/.env.example` vers `backend/.env`, puis mettre le mot de passe PostgreSQL |
| `DATA/` | doublon local de `dataset/`, déjà dans le dépôt |

Le modèle `MODELS/best_churn_model.joblib` est dans le dépôt. Une autre machine peut prédire sans réentraîner.

## Installation sur une autre machine

Python 3.11, Node.js 18 ou plus, et PostgreSQL.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

L'interface est sur http://127.0.0.1:5173. Comptes de démonstration créés au premier démarrage : `admin` / `admin123` et `client` / `client123`.

Sous Linux ou macOS, l'environnement Python s'active avec `source .venv/bin/activate`, et la copie du fichier d'environnement se fait avec `cp .env.example .env`.
