import React, { useState, ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Bell, Search as SearchIcon, Layers, ScanLine, FileBadge, User as UserIcon } from 'lucide-react';
import { WalletConnect } from '../blockchain/WalletConnect';
import { useAuthContext } from '../../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

import { NotificationsDropdown } from './NotificationsDropdown';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col md:flex-row">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      
      <div className="flex-grow md:ml-64 flex flex-col min-h-screen">
        {/* Header - Desktop Only */}
        <header className="hidden md:flex h-20 border-b border-border bg-bg-surface px-8 items-center justify-between sticky top-0 z-50">
          <div className="relative w-96 max-w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search reports or companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-bg-elevated border border-border rounded-lg pl-11 pr-4 py-2.5 text-sm outline-none focus:border-purple-500/50 transition-all text-white"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <WalletConnect />
            <NotificationsDropdown />
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold border border-purple-600/30">
              {(user?.wallet_address || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile Top Bar */}
        <header className="md:hidden h-16 border-b border-border bg-bg-surface px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
              <Layers size={18} />
            </div>
            <span className="font-bold tracking-tight text-white uppercase italic">BlockD</span>
          </div>
          <div className="flex items-center gap-4">
            <WalletConnect />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-surface border-t border-border px-6 flex items-center justify-between z-50 pb-safe">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-400' : 'text-text-muted'}`}
          >
            <Layers size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
          </NavLink>
          <NavLink 
            to="/scan" 
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-400' : 'text-text-muted'}`}
          >
            <ScanLine size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Scan</span>
          </NavLink>
          <NavLink 
            to="/certificates" 
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-400' : 'text-text-muted'}`}
          >
            <FileBadge size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Certs</span>
          </NavLink>
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-400' : 'text-text-muted'}`}
          >
            <UserIcon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
