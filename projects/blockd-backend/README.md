# BLOCKD: Backend API Service

FastAPI-based backend for the BLOCKD transparency platform.

## 🛠 Features

- **Automated Policy Scraping**: Uses Playwright and BeautifulSoup to find and extract privacy policies.
- **AI Task Orchestration**: Manages Celery jobs for policy analysis and risk scoring.
- **Blockchain Integration**: Connects to Algorand Testnet to anchor audit results.
- **IPFS Storage**: Decentralized storage for audit reports via Pinata.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```
2. **Setup Environment**:
   - Copy `.env.example` in this folder to `.env` and fill in real values (never commit `.env`).
   - **Database**: `DATABASE_URL` must be a MongoDB URI (`mongodb://` or `mongodb+srv://`). If the URI has no database path, set `MONGODB_DB_NAME=blockd` (or your DB name).
   - Other envs: `REDIS_URL`, `SECRET_KEY`, Algorand + Pinata keys, `CORS_ORIGINS`, `AUTO_CREATE_TABLES=true` (ensures MongoDB indexes on startup), `TRUST_PROXY_HEADERS`, `RATE_LIMIT_USE_REDIS`.
3. **Run Locally**:
   ```bash
   uvicorn app.main:app --reload
   ```

## 🏗 Architecture

- `app/routers`: API endpoints for Auth, Scans, and Blockchain interactions.
- `app/services`: Core logic for Algorand, IPFS, and Scraper.
- `app/tasks`: Asynchronous background tasks managed by Celery.
