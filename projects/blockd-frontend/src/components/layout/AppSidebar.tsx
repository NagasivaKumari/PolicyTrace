import React, { useState } from 'react';
import { 
  Shield, Layers, ScanLine, Clock,
  Wallet, ChevronLeft, ChevronRight
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAlgorand } from '../../hooks/useAlgorand';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { walletAddress, isConnected, disconnectWallet, connectWallet } = useAlgorand();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: Layers, label: 'Dashboard', path: '/dashboard' },
    { icon: ScanLine, label: 'New Scan', path: '/scan' },
    { icon: Clock, label: 'Scan History', path: '/history' },
  ];

  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 border-r border-border bg-bg-surface flex flex-col h-screen fixed left-0 top-0 z-[60] overflow-hidden`}>
      {/* TOP SECTION */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <Shield className="text-purple-400" size={24} />
            <span className="text-xl font-bold tracking-tight text-white">BLOCKD</span>
          </div>
        )}
        {isCollapsed && <Shield className="text-purple-400 mx-auto" size={24} />}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-border border border-border rounded-full flex items-center justify-center hover:bg-bg-elevated transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex-grow px-4 mt-8 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all group
              ${isActive ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-500 rounded-l-none' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <item.icon size={20} className={isCollapsed ? '' : 'shrink-0'} />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>{item.label}</span>
                {item.badge && <Badge variant="muted" size="sm">{item.badge}</Badge>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* WALLET SECTION */}
      <div className="px-4 py-6 border-t border-border">
        {!isCollapsed && <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 px-4">Algorand Wallet</p>}
        {isConnected ? (
          <div className={`space-y-4 ${isCollapsed ? 'flex flex-col items-center' : 'px-4'}`}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {!isCollapsed && <span className="text-xs font-mono text-text-secondary">{formatAddress(walletAddress || '')}</span>}
            </div>
            {!isCollapsed && (
              <button 
                onClick={disconnectWallet}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
              >
                Disconnect
              </button>
            )}
            {isCollapsed && <Wallet className="text-green-500" size={20} />}
          </div>
        ) : (
          <div className={isCollapsed ? 'flex justify-center' : 'px-2'}>
            {!isCollapsed ? (
              <Button variant="secondary" size="sm" fullWidth icon={Wallet} onClick={() => connectWallet('pera')}>
                Connect
              </Button>
            ) : (
              <Wallet className="text-text-muted hover:text-purple-400 cursor-pointer" size={20} onClick={() => connectWallet('pera')} />
            )}
          </div>
        )}
      </div>

      {/* USER SECTION */}
      <div className="p-4 border-t border-border bg-bg-elevated">
      <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0 uppercase">
            {user?.username?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold truncate text-white">@{user?.username}</p>
              <p className="text-xs text-text-muted truncate">{user?.full_name}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="mt-4">
            <button onClick={handleLogout} className="text-[10px] font-bold uppercase tracking-widest text-red-400/70 hover:text-red-400 transition-colors text-left mt-1">Sign out</button>
          </div>
        )}
      </div>
    </aside>
  );
};
