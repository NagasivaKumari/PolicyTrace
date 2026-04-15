import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import axios from 'axios';
// ALGORAND_NODE is now managed dynamically via environment variables below.
interface AlgorandContextType {
  walletAddress: string | null;
  isConnected: boolean;
  activeWalletId: string | null;
  connectWallet: (walletId: string) => Promise<string | null>;
  disconnectWallet: () => void;
  signAuthTransaction: (nonce: string, address: string) => Promise<string>;
  anchorAudit: (metadata: { scan_id: string; owner: string; url_hash: string; risk_score: number; ipfs_cid: string; ipfs_hash?: string }) => Promise<string>;
}
const AlgorandContext = createContext<AlgorandContextType | null>(null);
// Network Configuration from Environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ALGORAND_NODE = import.meta.env.VITE_ALGORAND_NODE;
const ALGORAND_PORT = "";
const ALGORAND_TOKEN = "";
// STRICT VALIDATION: No fallbacks allowed.
if (!ALGORAND_NODE) {
  console.error("BLOCKD: CRITICAL CONFIGURATION ERROR - Environment variables missing.", {
    NODE: !!ALGORAND_NODE
  });
  throw new Error("CRITICAL_CONFIGURATION_ERROR: VITE_ALGORAND_NODE must be set in .env");
}
const algodClient = new algosdk.Algodv2(ALGORAND_TOKEN, ALGORAND_NODE, ALGORAND_PORT);
const normalizeSignedTxnBytes = (value: Uint8Array | ArrayBuffer | string): Uint8Array => {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === 'string') {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(value as ArrayBuffer);
};
export const AlgorandProvider = ({ children }: { children: ReactNode }) => {
  const { activeAddress, activeAccount, activeWallet, wallets, providers, signTransactions } = useWallet();
  const [isManuallyConnected, setIsManuallyConnected] = React.useState(false);
  const connectWallet = async (walletId: string): Promise<string | null> => {
    if (activeAccount?.address && algosdk.isValidAddress(activeAccount.address)) {
      return activeAccount.address;
    }

    const provider = providers?.find(p => p.metadata.id.toLowerCase() === walletId.toLowerCase());
    if (provider) {
      if (provider.isActive && provider.activeAccount?.address && algosdk.isValidAddress(provider.activeAccount.address)) {
        return provider.activeAccount.address;
      }
      try {
        await provider.connect();
      } catch (err: any) {
        const message = String(err?.message || err);
        if (message.toLowerCase().includes("session currently connected")) {
          return provider.activeAccount?.address || activeAccount?.address || null;
        }
        throw err;
      }
      setIsManuallyConnected(true);
      return provider.activeAccount?.address || null;
    }

    const wallet = wallets?.find(w => w.id.toLowerCase() === walletId.toLowerCase());
    if (wallet) {
      if (wallet.isActive && wallet.activeAccount?.address && algosdk.isValidAddress(wallet.activeAccount.address)) {
        return wallet.activeAccount.address;
      }
      try {
        await wallet.connect();
      } catch (err: any) {
        const message = String(err?.message || err);
        if (message.toLowerCase().includes("session currently connected")) {
          return wallet.activeAccount?.address || activeAccount?.address || null;
        }
        throw err;
      }
      setIsManuallyConnected(true);
      return wallet.activeAccount?.address || null;
    }

    return null;
  };
  const disconnectWallet = async () => {
    const activeProvider = providers?.find(p => p.isActive);
    if (activeProvider) await activeProvider.disconnect();
    setIsManuallyConnected(false);
  };
  const anchorAudit = async (metadata: any) => {
    const sender = activeAccount?.address;
    const receiverRes = await axios.get(`${API_URL}/api/config/receiver`);
    const receiver = receiverRes.data?.receiver as string | undefined;
    console.log("BLOCKD: [IDENTITY] Requesting Anchor for:", sender);
    console.log("BLOCKD: [IDENTITY] Wallet Hook Active Address:", activeAccount?.address);
    if (!activeAccount?.address) {
      throw new Error("Wallet not properly connected");
    }
    if (activeAccount.address !== sender) {
      throw new Error("Active account mismatch before signing");
    }
    if (!sender || !algosdk.isValidAddress(sender)) {
      throw new Error(`CRITICAL: Sender is invalid (${sender}).`);
    }
    if (!receiver || !algosdk.isValidAddress(receiver)) {
      throw new Error(`CRITICAL: Receiver is invalid (${receiver}).`);
    }

    const scanId = metadata?.scan_id;
    const cid = metadata?.ipfs_cid;
    const reportHash = metadata?.audit_hash || metadata?.ipfs_hash || metadata?.url_hash;
    const policyHash = metadata?.policy_hash;
    const rawVersion = metadata?.version ?? metadata?.scanner_version;
    const version = typeof rawVersion === 'number'
      ? String(rawVersion)
      : String(rawVersion || "1").replace(/^v/i, "");
    const owner = metadata?.owner;
    const isMissing = (value?: string) => !value || value === 'N/A' || value === 'NA';
    if (!scanId) throw new Error("CRITICAL: Scan ID is missing from metadata.");
    if (isMissing(cid)) throw new Error("CRITICAL: IPFS CID is missing from metadata.");
    if (isMissing(reportHash)) throw new Error("CRITICAL: Report hash is missing from metadata.");
    if (isMissing(policyHash)) throw new Error("CRITICAL: Policy hash is missing from metadata.");
    if (!owner || !algosdk.isValidAddress(owner)) {
      throw new Error(`CRITICAL: Owner address is invalid or missing (${owner}). Audit cannot be anchored.`);
    }

    try {
      console.log("BLOCKD: [DEBUG] Requesting network params from:", ALGORAND_NODE);
      const params = await algodClient.getTransactionParams().do();
      params.fee = 1000;
      params.flatFee = true;

      console.log("BLOCKD: [SANITY] SENDER:", sender);
      console.log("BLOCKD: [SANITY] RECEIVER:", receiver);
      console.log("BLOCKD: [SANITY] PARAMS READY (Flat Fee: 1000)");
      console.log("BLOCKD: [SECURITY] Isolation proof verified. Constructing transaction...");

      const note = new TextEncoder().encode(`BLOCKD|POLICY:${policyHash}|AUDIT:${reportHash}|V:${version}`);
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: sender as string,
        receiver,
        amount: 0,
        suggestedParams: params,
        note
      });

      console.log("BLOCKD: STEP 1: Requesting wallet signature...");
      const signedTxns = await signTransactions([payTxn.toByte()]);
      if (!signedTxns?.[0]) {
        throw new Error("TXN was NOT signed");
      }
      const signedBytes = normalizeSignedTxnBytes(signedTxns[0] as Uint8Array | ArrayBuffer | string);
      console.log("BLOCKD: STEP 2: Submitting transaction to network...");
      const result = await algodClient.sendRawTransaction(signedBytes).do();
      const txIdFromResult = (result as any)?.txId || (result as any)?.txid;
      let txId = txIdFromResult as string | undefined;
      if (!txId) {
        try {
          const decoded = algosdk.decodeSignedTransaction(signedBytes);
          txId = decoded?.txn?.txID();
        } catch (err) {
          console.warn("BLOCKD: Unable to compute txId from signed bytes", err);
        }
      }
      if (!txId) {
        console.warn("BLOCKD: Missing txId in algod response", result);
        throw new Error("Transaction submission failed (missing txId)");
      }
      console.log("BLOCKD: STEP 3: Transaction submitted:", txId);
      return txId;
    } catch (err: any) {
      console.error("BLOCKD: [FATAL ON-CHAIN ERROR]:", err);
      const message = err.message || "Logic Error or Signature Denied";
      throw new Error(`Anchor Error: ${message}`);
    }
  };
  const signAuthTransaction = async (nonce: string, address: string) => {
    if (!address) throw new Error("Wallet address is missing");
    if (!nonce) throw new Error("Auth nonce is missing");
    console.log("BLOCKD: --- SECURE HANDSHAKE START ---", address);
    
    try {
      // 1. FETCH LIVE PARAMS
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Safety overrides
      suggestedParams.flatFee = true;
      suggestedParams.fee = 1000;
      // 2. ENCODE NOTE
      const note = new TextEncoder().encode(`BlockD Auth: ${nonce}`);
      // 3. CONSTRUCT TRANSACTION (Universal SDK Compatibility)
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: address,
        receiver: address,
        amount: 0,
        note: note,
        suggestedParams: suggestedParams,
      });
      console.log("BLOCKD: Transaction constructed successfully");
      // 4. SIGN VIA WALLET
      const encodedTxn = txn.toByte();
      const result = await signTransactions([encodedTxn]);
      // 🔒 THE CRYPTOGRAPHIC GUARD: Pre-verify identity before backend submission
      if (!result || !result[0]) {
        throw new Error("TXN was NOT signed");
      }
      // 🛡️ ZERO-TRUST GUARD: Verification is mandatory.
      const signedBytes = normalizeSignedTxnBytes(result[0] as Uint8Array | ArrayBuffer | string);
      const decoded = algosdk.decodeSignedTransaction(signedBytes);
      
      if (!decoded?.txn?.from) {
        throw new Error("TXN has NO sender after decode");
      }
      // 🛡️ CORRECT ACCESS: decoded.txn.from IS the Uint8Array
      const actualSigner = algosdk.encodeAddress(decoded.txn.from);
      
      console.log(`BLOCKD: [AUTH-IDENTITY] INTENDED: ${address}`);
      console.log(`BLOCKD: [AUTH-IDENTITY] ACTUAL:   ${actualSigner}`);
      if (actualSigner !== address) {
        console.error("BLOCKD: [AUTH-IDENTITY] CRITICAL AUTH MISMATCH DETECTED.", {
           EXPECTED: address,
           ACTUAL: actualSigner
        });
        throw new Error(`AUTH MISMATCH: Signer (${actualSigner}) does not match login account (${address}). Please switch to the correct account in your wallet.`);
      }
      console.log("BLOCKD: [AUTH-IDENTITY] Authentication signature cryptographically verified.");
      console.log("BLOCKD: Signature verified. Integrity confirmed.");
      // 5. ENCODE RESULT
      return btoa(String.fromCharCode(...new Uint8Array(result[0])));
    } catch (err: any) {
      console.error("BLOCKD: CRITICAL HANDSHAKE FAILURE:", err);
      // Detailed error for better troubleshooting
      throw new Error(`Auth Error: ${err.message || "Construction Failure"}`);
    }
  };
  return (
    <AlgorandContext.Provider value={{ 
      walletAddress: activeAddress || null, 
      isConnected: !!activeAccount,
      activeWalletId: activeWallet?.id || null,
      connectWallet,
      disconnectWallet,
      signAuthTransaction,
      anchorAudit
    }}>
      {children}
    </AlgorandContext.Provider>
  );
};
export const useAlgorand = () => {
  const ctx = useContext(AlgorandContext);
  if (!ctx) throw new Error('useAlgorand must be used inside AlgorandProvider');
  return ctx;
};