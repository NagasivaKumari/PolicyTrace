# BLOCKD: Algorand Smart Contracts

On-chain audit trails and compliance certificates for the BLOCKD platform.

## 🛠 Features

- **Audit Anchoring**: Implements the `BlockdAudit` contract to record policy scans, risk scores, and IPFS report hashes.
- **On-Chain Certificates**: Implements `BlockdCertificate` to record verified compliance status as ARC-19 compliant metadata.
- **Built with PuyaPy**: Modern Algorand Python for maximum security and maintainability.

## 🚀 Getting Started

1. **Bootstrap**:
   ```bash
   algokit project bootstrap all
   ```
2. **Build**:
   ```bash
   algokit project run build
   ```
3. **Deploy (LocalNet)**:
   ```bash
   algokit project deploy localnet
   ```

## 📂 Structure

- `smart_contracts/blockd_audit/`: Registry for audit results.
- `smart_contracts/blockd_certificate/`: Registry for compliance certificates.
- `smart_contracts/artifacts/`: Compiled TEAL and app specifications.
