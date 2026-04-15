import React, { useEffect, useState } from 'react';
import { Wallet, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { useAlgorand } from '../../hooks/useAlgorand';
import { formatAddress } from '../../utils/formatters';
import { getAuthHeaders } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import { WalletModal } from '../blockchain/WalletModal';

export const AlgorandWalletCard = () => {
  const { walletAddress, connectWallet, disconnectWallet, balance } = useAlgorand();
  const [certCount, setCertCount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      const headers = getAuthHeaders(walletAddress);
      axios
        .get(`${API_URL}/api/scan/user/stats`, { headers })
        .then((res) => setCertCount(res.data?.total_certs ?? 0))
        .catch(() => setCertCount(0));
    }
  }, [walletAddress]);

  const handleConnect = async (walletId: string) => {
    await connectWallet(walletId);
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
    }
  };

  if (!walletAddress) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center text-center py-12 space-y-6">
          <div className="w-16 h-16 bg-bg-elevated rounded-2xl flex items-center justify-center text-text-muted">
            <Wallet size={32} />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold text-text-primary">Connect your Wallet</h3>
            <p className="text-sm text-text-secondary max-w-xs mx-auto">
              Choose your preferred Algorand wallet to anchor audits and mint certificates.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} icon={Wallet}>
            Connect Wallet
          </Button>
        </Card>
        <WalletModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onConnect={handleConnect} 
        />
      </>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Wallet className="text-purple-400" size={20} />
          <h3 className="text-xl font-bold text-text-primary">Algorand Wallet</h3>
        </div>
        <Badge variant="success" icon={ShieldCheck}>Connected</Badge>
      </div>

      <div className="space-y-6">
        <div className="bg-bg-elevated p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted font-bold uppercase tracking-widest">
            <span>Public Address</span>
            <button
              onClick={handleCopyAddress}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <Copy size={12} />
              <span>Copy</span>
            </button>
          </div>
          <p className="font-mono text-sm text-text-primary break-all">
            {walletAddress}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-elevated p-4 rounded-xl">
            <Tooltip content="Live balance from Algorand Network">
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Balance</p>
              <p className="text-xl font-bold text-text-primary">{balance || '0.00'} ALGO</p>
            </Tooltip>
          </div>
          <div className="bg-bg-elevated p-4 rounded-xl">
            <Tooltip content="Verified DPDP compliance certificates anchored on Algorand">
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Certificates</p>
              <p className="text-xl font-bold text-text-primary">
                {certCount === null ? '...' : certCount}
              </p>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            icon={ExternalLink}
            fullWidth
            onClick={() =>
              window.open(
                `https://testnet.algoexplorer.io/address/${walletAddress}`,
                '_blank'
              )
            }
          >
            View on Explorer
          </Button>
          <button
            onClick={disconnectWallet}
            className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors w-fit mx-auto"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    </Card>
  );
};
