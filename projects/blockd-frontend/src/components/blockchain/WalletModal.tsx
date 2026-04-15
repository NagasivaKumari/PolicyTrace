import React from 'react';
import { Smartphone, ArrowRight, Wallet } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useWallet } from '@txnlab/use-wallet-react';
import { WalletId } from '@txnlab/use-wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => Promise<void>;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const { wallets } = useWallet();
  const [isConnecting, setIsConnecting] = React.useState(false);

  const providers = [
    {
      id: WalletId.PERA,
      name: 'Pera Wallet',
      description: 'The official Algorand mobile wallet (Connect via QR)',
      icon: Smartphone,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    }
  ];

  const handleSelect = async (id: string) => {
    try {
      if (isConnecting) return;
      setIsConnecting(true);
      await onConnect(id);
      onClose();
    } catch (err) {
      // Error handled by parent toast
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Algorand Wallet" size="md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-bg-base border border-border mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
            <Wallet className="text-purple-400" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Why connect?</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Connect to anchor your audits on the blockchain. BLOCKD never accesses your private keys.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-border hover:border-purple-500/50 hover:bg-white/5 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className={`w-12 h-12 rounded-xl ${p.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <p.icon className={p.color} size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">{p.name}</p>
                  <ArrowRight size={14} className="text-text-muted group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate">{p.description}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-center text-text-muted font-bold uppercase tracking-widest pt-4">
          Algorand Mainnet / Testnet Supported
        </p>
      </div>
    </Modal>
  );
};
