# 🛡️ BlockD: Verifiable DPDP Compliance Monitoring

**Real-time DPDP compliance monitoring with verifiable audit trails on blockchain.**

BlockD is a full-stack platform that uses AI for privacy audits and Algorand as a **proof layer**. The application runs off-chain (AI, dashboards, storage) while the blockchain stores **tamper-proof hashes** that prove a specific policy version and audit existed at a point in time.

---

## 🧠 Problem

Indian digital services publish privacy policies, but users and regulators cannot easily verify if those policies are compliant, updated, or tamper-free over time. Most audits are black boxes with no reproducible evidence.

---

## 💡 Solution

BlockD scans policies, extracts evidence-based violations, and stores **policy snapshots + audit reports** on IPFS. It anchors **hashes only** on Algorand, enabling anyone to verify integrity and timeline changes without exposing personal data.

---

## 🚀 Hackathon Summary

BlockD helps regulators, enterprises, and users verify DPDP compliance without trusting a black-box report. We store **policy snapshots** and **audit reports** on IPFS and anchor **hashes only** on Algorand so anyone can verify that an audit existed and was not tampered with.

**Core idea**: AI is the signal extractor, blockchain is the proof layer.

---

## ✨ Key Features

### 🔍 Evidence-Based Privacy Audits
Clause-level evidence with explanations and confidence. The output is structured, reproducible, and verifiable.

### ⛓️ Algorand Proof Layer
Anchor **policy_hash** and **audit_hash** (plus timestamp/version) on Algorand. No personal data, no full documents, only tamper-proof proofs.

### 👛 Wallet Support
Connect via **Pera Wallet** to sign and anchor audits.

### 🧾 Reproducible Verification
Store policy snapshots and audit reports on IPFS. Anyone can re-hash and compare to on-chain proofs to verify integrity.

### 🌐 Compliance History Timeline
See a timeline of changes and violations over time. The blockchain serves as the audit trail, while UI shows detailed evidence and sources.

### 🔒 DPDP-Safe Data Handling
No personal data on-chain. IPFS stores policy snapshots and audits only. User data stays off-chain and can be deleted.

---

## 🧭 Architecture (What Runs Where)

### Off-chain (Main App)
- Policy scraping and text cleanup
- AI detection and evidence extraction
- Scoring engine + risk level mapping
- MongoDB storage + history views
- Watchlist monitoring + change detection

### IPFS (Storage)
- Policy snapshot (text)
- Audit report JSON (violations, evidence, scores)

### Algorand (Proof Layer)
- On-chain note stores: `policy_hash`, `audit_hash`, `timestamp`, `version`
- No personal data, no full documents

---

## 🛠️ Tech Stack

- **Blockchain**: Algorand
- **Smart Contracts**: PuyaPy / PuyaTS
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python 3.11+)
- **AI/ML**: Transformers (DistilBERT)
- **Scraping**: Firecrawl, Serper (discovery)
- **Storage**: IPFS (Pinata)
- **Database**: MongoDB (Atlas)
- **Cache**: Redis

---

## 🧪 How It Works (Flow)

1. **Scan** a policy URL
2. **Extract** text and evidence
3. **Score** by DPDP category weights and confidence
4. **Upload** policy snapshot + audit report to IPFS
5. **Anchor** only hashes on Algorand
6. **Verify** by re-hashing and comparing to chain

---

## 🎥 Demo

- Video: TODO
- Screenshots / GIFs: TODO

---

## 🚀 Features

- Evidence-based DPDP audit results
- Reproducible verification via IPFS + Algorand
- Compliance history timeline with risk delta
- Tamper detection and on-chain proof

---

## 🚀 Deployment (Recommended)

### ☁️ Backend on Render
1. Connect this repository to [Render](https://render.com).
2. Create a **Web Service** for `projects/blockd-backend`.
3. Set Build Command:
    ```bash
    pip install -r requirements.txt
    ```
4. Set Start Command:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
    ```
5. Add Environment Variables:
    * `MONGODB_URI`
    * `SECRET_KEY`
    * `PINATA_API_KEY`, `PINATA_SECRET_KEY`
    * `SERPER_API_KEY` (optional)
    * `FIRECRAWL_API_KEY` (optional)
    * `PLATFORM_RECEIVER_ADDRESS`
    * `ALGORAND_NODE` (if overriding default)
    * `ALGORAND_INDEXER` (if overriding default)

### ▲ Frontend on Vercel
1. Import this repository in [Vercel](https://vercel.com).
2. Set the Root Directory to `projects/blockd-frontend`.
3. Add Environment Variables:
    * `VITE_API_URL` → your Render backend URL (e.g. `https://blockd-backend.onrender.com`)
    * `VITE_ALGORAND_NODE`
4. Deploy.

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (Recommended)

### Using Docker (Fastest)
```bash
docker-compose up --build
```

### Manual Setup
1.  **Backend**:
    ```bash
    cd projects/blockd-backend
    python -m venv .venv
    source .venv/bin/activate # or venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    ```
2.  **Frontend**:
    ```bash
    cd projects/blockd-frontend
    npm install
    npm run dev
    ```

---

## 🧪 Usage

1. Open the app and start a new scan with a policy URL
2. Review violations, evidence, and confidence scores
3. Anchor the audit to Algorand (hashes only)
4. Verify integrity from the public verify page
5. Track changes and risk deltas in Scan History

---

## 🔐 On-chain Proof Format

The Algorand note stores only hashes and versioning:

```
BLOCKD|POLICY:<policy_hash>|AUDIT:<audit_hash>|V:<version>
```

Verification recomputes hashes from IPFS and compares to on-chain values.

---

## 📂 Project Navigation

- `projects/blockd-frontend`: Dashboard and public verification UI.
- `projects/blockd-backend`: API, scan pipeline, IPFS + chain integration.
- `projects/blockd-ai`: Classification rules and risk engines.
- `projects/blockd-contracts`: Smart contracts for on-chain anchoring.

---

## 🧑‍⚖️ Compliance Notes

- Blockchain stores **hashes only** (no personal data)
- IPFS stores policy snapshots and audit reports
- User data remains off-chain and can be deleted

---

## ✅ Hackathon Demo Checklist

- Scan a public policy URL
- Show violations + evidence
- Anchor hash on Algorand
- Verify via IPFS re-hash
- Show compliance timeline

---

## 📊 Future Scope

- Auto re-audit on meaningful policy changes
- Regulator-grade compliance dashboards
- Expanded model coverage and multilingual policies

---

## 👥 Team

- TODO - Role
- TODO - Role

---

## 📜 License

MIT

---
*Built with ❤️ for a more transparent internet by Antigravity*
