import { Buffer } from 'buffer';
// Polyfill Buffer for browser
window.Buffer = Buffer;
import React from 'react';
import ReactDOM from 'react-dom/client';

// BlockD: Institutional Hardening Entry Point
// High-security Web3 session management.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletManager, WalletId, NetworkId } from '@txnlab/use-wallet';
import { WalletProvider } from '@txnlab/use-wallet-react';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AlgorandProvider } from './context/AlgorandContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

if (typeof window !== 'undefined') {
  window.localStorage.removeItem('@txnlab/use-wallet:v4');
}

const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
  ],
  defaultNetwork: NetworkId.TESTNET,
  options: {
    autoConnect: false,
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WalletProvider manager={walletManager}>
        <AlgorandProvider>
          <AuthProvider>
            <App />
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1C1A3A',
                  color: '#F1F0FF',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                },
              }}
            />
          </AuthProvider>
        </AlgorandProvider>
      </WalletProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
