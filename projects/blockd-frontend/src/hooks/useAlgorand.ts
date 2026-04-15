import { useState, useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { getExplorerTxUrl, getExplorerAssetUrl } from '../utils/algorand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAlgorand = () => {
  const { activeAddress, activeAccount, wallets } = useWallet();
  const [balance, setBalance] = useState<string>('0.00');

  const fetchBalance = async (address: string) => {
    try {
      const b = await getBalance(address);
      setBalance(b);
    } catch (err) {
      console.error('Failed to fetch balance', err);
    }
  };

  useEffect(() => {
    if (activeAddress) {
      fetchBalance(activeAddress);
    }
  }, [activeAddress]);

  const connectWallet = async (walletId: string): Promise<string> => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error("Wallet provider not found");
    
    const accounts = await wallet.connect();
    const address = accounts[0].address;
    
    // Persist to backend
    try {
      await axios.patch(`${API_URL}/api/user/wallet`, { wallet_address: address });
    } catch (e) {
      console.warn("Failed to sync wallet with backend", e);
    }

    await fetchBalance(address);
    return address;
  };

  const disconnectWallet = async () => {
    const activeWallet = wallets.find(w => w.isActive);
    if (activeWallet) {
      await activeWallet.disconnect();
    }
    setBalance('0.00');
  };


  const getBalance = async (address: string) => {
    // 1. DIRECT DIAGNOSTIC CHECK (Requested by user)
    // This verifies connectivity to the node and identifies cross-origin issues early.
    try {
      const ALGO_NODE_URL = import.meta.env.VITE_ALGORAND_NODE || 'https://testnet-api.algonode.cloud';
      await axios.get(`${ALGO_NODE_URL}/v2/accounts/${address}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log("BLOCKD: Network check successful.");
    } catch (err: any) {
      console.error("Network check:", err.message);
      // Diagnostic only — we continue to the backend-led fetch
    }

    // 2. STABLE BACKEND FETCH
    try {
      const res = await axios.get(`${API_URL}/api/user/wallet-balance?address=${address}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      return res.data.balance || '0.00';
    } catch (err) {
      console.error('Failed to fetch balance via backend', err);
      return '0.00';
    }
  };

  return {
    walletAddress: activeAddress,
    isConnected: !!activeAccount,
    balance,
    connectWallet,
    disconnectWallet,
    getBalance,
    getExplorerTxUrl,
    getExplorerAssetUrl,
  };
};
