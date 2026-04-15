import React, { useEffect, useState } from 'react';
import { Bell, ShieldCheck, Activity, Globe, X } from 'lucide-react';
import axios from 'axios';
import { useAlgorand } from '../../context/AlgorandContext';
import { formatDate } from '../../utils/formatters';
import { getAuthHeaders } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info';
  created_at: string;
  url?: string;
}

export const NotificationsDropdown = () => {
  const { walletAddress } = useAlgorand();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletAddress && isOpen) {
      fetchLiveEvents();
    }
  }, [walletAddress, isOpen]);

  const fetchLiveEvents = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders(walletAddress);
      const res = await axios.get(`${API_URL}/api/scan/history?limit=5`, { headers });
      
      const history = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      
      const events: Notification[] = history.map((item: any) => ({
        id: item.id,
        title: 'Ledger Audit Anchored',
        message: `Compliance proof for ${item.url_hash.substring(0, 15)}... anchored at block ${item.block}`,
        type: 'success',
        created_at: item.timestamp ? new Date(item.timestamp * 1000).toISOString() : new Date().toISOString(),
        url: item.url_hash
      }));

      // Add a system welcome if empty
      if (events.length === 0) {
        events.push({
          id: 'system-ready',
          title: 'Blockchain Synchronized',
          message: 'Zero-Click auditing protocol is active. Algorand Testnet node is listening.',
          type: 'info',
          created_at: new Date().toISOString(),
        });
      }

      setNotifications(events);
    } catch (err) {
      console.error("Failed to fetch ledger events", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-text-secondary hover:text-text-primary transition-colors relative p-2 rounded-full hover:bg-white/5"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-bg-surface border border-white/5 rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-3xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-bg-elevated/50">
              <div>
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-white italic">Protocol Logs</h3>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest leading-none mt-1">Live Ledger Feed</p>
              </div>
              <button 
                className="text-text-muted hover:text-text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 italic opacity-50 animate-pulse">Syncing Blockchain...</div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 italic opacity-50">Protocol Idle</div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">
                         {n.type === 'success' ? (
                            <ShieldCheck className="text-green-500" size={16} />
                         ) : (
                            <Activity className="text-purple-400" size={16} />
                         )}
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{n.title}</p>
                          <span className="text-[9px] text-slate-600 font-bold whitespace-nowrap">{formatDate(n.created_at)}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{n.message}</p>
                        {n.url && (
                           <div className="flex items-center gap-1 mt-2">
                                <Globe size={10} className="text-slate-500" />
                                <span className="text-[9px] font-bold text-slate-500 truncate lowercase tracking-tight">{n.url}</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-950/50 text-center">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                Algorand Testnet Connected
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
