import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAlgorand } from './AlgorandContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
  wallet_address: string;
  role?: 'user' | 'expert' | 'regulator';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithWallet: (address: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { walletAddress, isConnected, disconnectWallet, signAuthTransaction } = useAlgorand();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('blockd_token'));
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('blockd_token'));

  useEffect(() => {
    const token = localStorage.getItem('blockd_token');
    
    // 1. If we have a token, we are AUTHENTICATED regardless of live wallet connection
    if (token) {
      setIsAuthenticated(true);
      
      // Simple decode (JWT payload is base64 in the middle)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const addressFromToken = payload.sub;
        setUser({ wallet_address: addressFromToken });
      } catch (e) {
        console.warn("Failed to decode token identity:", e);
        setUser({ wallet_address: 'Stored Session' }); 
      }
      
      setIsLoading(false);
      return;
    }

    // 2. Fallback to live wallet handshake for first-time login
    if (isConnected && walletAddress) {
      setUser({ wallet_address: walletAddress });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, [isConnected, walletAddress]);

  const loginWithWallet = async (address: string) => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Nonce from Backend
      const nonceRes = await axios.post(`${API_URL}/api/auth/nonce`, { wallet_address: address });
      const { nonce } = nonceRes.data;

      // 2. Request Cryptographic Signature via Wallet
      const signedTxn = await signAuthTransaction(nonce, address);

      // 3. Exchange Signature for Permanent Access Token
      const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
        wallet_address: address,
        signed_txn: signedTxn,
        nonce: nonce
      });

      const { access_token } = loginRes.data;

      // 4. Persistence: Lock Token to Browser
      localStorage.setItem('blockd_token', access_token);
      
      setUser({ wallet_address: address });
      setIsAuthenticated(true);
      console.log("BLOCKD: Secure handshake successful. Member Key anchored.");
    } catch (err: any) {
      console.error("BLOCKD: Handshake failed:", err);
      localStorage.removeItem('blockd_token');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    disconnectWallet();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('blockd_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, loginWithWallet, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};
