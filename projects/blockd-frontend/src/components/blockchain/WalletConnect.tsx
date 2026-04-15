import React, { useState } from 'react';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useAlgorand } from '../../context/AlgorandContext';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { WalletModal } from './WalletModal';

const formatAddress = (addr: string) => {
  return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
};

export const WalletConnect = () => {
  const { walletAddress, connectWallet, disconnectWallet, isConnected } = useAlgorand();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const toast = useToast();

  const { loginWithWallet } = useAuthContext();

  const handleConnect = async (walletId: string) => {
    try {
      // 1. Establish low-level wallet connection
      const address = await connectWallet(walletId);
      
      // 2. Perform the secure Web3 Handshake (Sign & Get Token)
      if (address) {
        toast.info('Authenticating secure session...');
        await loginWithWallet(address);
        toast.success('Member Session Secured!');
      }
      
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Connection or Handshake failed');
      console.error(err);
      throw err;
    }
  };

  if (!isConnected) {
    return (
      <>
        <Button
          variant="purple"
          size="md"
          icon={Wallet}
          onClick={() => setIsModalOpen(true)}
          className="w-full h-14 text-lg font-bold"
        >
          Connect Wallet
        </Button>
        <WalletModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onConnect={handleConnect} 
        />
      </>
    );
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center justify-between gap-2 bg-purple-600/10 text-purple-400 px-6 py-4 rounded-xl border border-purple-600/20 font-bold text-lg hover:bg-purple-600/20 transition-all"
      >
        <div className="flex items-center gap-3">
          <Wallet size={20} />
          {formatAddress(walletAddress!)}
        </div>
        <ChevronDown size={18} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute right-0 mt-3 w-full bg-slate-900 border border-white/5 rounded-2xl py-2 z-20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                disconnectWallet();
                setShowDropdown(false);
                toast.success('Wallet disconnected');
              }}
              className="w-full flex items-center gap-3 px-6 py-4 text-base font-bold text-red-400 hover:bg-red-500/5 transition-all text-left"
            >
              <LogOut size={20} />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
};
