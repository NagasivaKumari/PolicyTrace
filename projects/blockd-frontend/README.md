# BLOCKD: Frontend Dashboard

The user-facing compliance portal for BLOCKD scans and transparency reports.

## 🛠 Features

- **Real-time Scans**: Interactive dashboard for auditing privacy policies against the DPDP Act 2023.
- **Risk Visualization**: SVG gauges and progress trackers for compliance breakdown.
- **Wallet Integration**: Powered by `@txnlab/use-wallet` for Pera and other Algorand providers.
- **Typed Clients**: Integrated with on-chain contracts via generated TypeScript clients.

## 🚀 Getting Started

1. **Bootstrap**:
   ```bash
   algokit project bootstrap all
   ```
2. **Run Dev Server**:
   ```bash
   npm run dev
   ```
3. **Generate Clients**:
   ```bash
   npm run generate:app-clients
   ```

## 🏗 Technology Stack

- **React + TypeScript + Vite**
- **Tailwind CSS** (Premium Dark Theme)
- **Lucide React** (Icons)
- **Framer Motion** (Animations)
