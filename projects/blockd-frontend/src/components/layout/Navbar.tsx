import React, { useState } from 'react';
import { Shield, Menu, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAlgorand } from '../../context/AlgorandContext';
import { WalletModal } from '../blockchain/WalletModal';

export const Navbar = () => {
  const { isConnected, connectWallet, walletAddress } = useAlgorand();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleConnectClick = () => {
    if (isConnected) {
      navigate('/dashboard');
      return;
    }
    setIsModalOpen(true);
  };

  // High-fidelity fix: Perform direct, forceful navigation to the dashboard
  const handleConnect = async (walletId: string) => {
    try {
      await connectWallet(walletId);
      setIsModalOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  return (
    <nav className="h-16 bg-bg-base/80 backdrop-blur-md border-b border-border fixed top-0 w-full z-50 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <Shield className="text-purple-400" size={24} />
        <span className="text-xl font-bold tracking-tight text-white uppercase italic">BlockD</span>
      </Link>

      <div className="hidden md:flex items-center gap-10">
        <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-purple-400 transition-all">Home</Link>
        <a href="#how-it-works" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-purple-400 transition-all">How It Works</a>
        <a href="#about" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-purple-400 transition-all">Technology</a>
        <a href="#compliance" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-purple-400 transition-all">Compliance</a>
      </div>

      <div className="flex items-center gap-4">
        {/* User specifically asked for 'Connect Wallet' here */}
        <Button 
          variant="purple" 
          size="sm" 
          icon={Wallet} 
          iconPosition="right"
          onClick={handleConnectClick}
        >
          {isConnected && walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
        </Button>
        
        <button className="md:hidden text-text-secondary">
          <Menu size={24} />
        </button>
      </div>

      <WalletModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConnect={handleConnect} 
      />
    </nav>
  );
};
