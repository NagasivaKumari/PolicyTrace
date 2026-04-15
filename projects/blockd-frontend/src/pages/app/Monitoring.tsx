import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Shield, Eye, AlertTriangle, 
  Plus, Trash2, ExternalLink, RefreshCw,
  Search, TrendingUp, History, Lock
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { useAlgorand } from '../../context/AlgorandContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Monitoring = () => {
  const { activeAccount } = useAlgorand();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [registry, setRegistry] = useState<any[]>([]);
  const [settings, setSettings] = useState({ email: '', email_alerts: false });
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const fetchMonitoringData = async () => {
    if (!activeAccount) return;
    try {
      const authWallet = activeAccount.address;
      const token = localStorage.getItem('blockd_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // 1. Fetch Watchlist
      const wRes = await fetch(`/api/watchlist/${authWallet}`, { headers });
      const wData = await wRes.json();
      setWatchlist(wData);

      // 2. Fetch Personal Alerts
      const aRes = await fetch(`/api/scan/changes/${authWallet}`, { headers });
      const aData = await aRes.json();
      setAlerts(aData);

      // 3. Fetch Public Registry
      const rRes = await fetch(`/api/scan/registry?limit=10`);
      const rData = await rRes.json();
      setRegistry(rData.items || []);

      // 4. Fetch User Settings
      const sRes = await fetch(`/api/user/settings`, { headers });
      if (sRes.ok) {
        const sData = await sRes.json();
        setSettings(sData);
      }
    } catch (err) {
      console.error("Failed to fetch monitoring data", err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('blockd_token');
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success("Notification preferences updated!");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [activeAccount]);

  const handleAddToWatchlist = async () => {
    if (!newUrl || !activeAccount) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/watchlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: activeAccount.address, url: newUrl })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.domain} added to your Watchlist!`);
        setNewUrl('');
        fetchMonitoringData();
      } else {
        toast.error(data.detail || "Failed to add domain");
      }
    } catch (err) {
      toast.error("Network error adding to watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (domain: string) => {
    if (!activeAccount) return;
    try {
      await fetch('/api/watchlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: activeAccount.address, domain })
      });
      toast.success(`${domain} removed from tracking.`);
      fetchMonitoringData();
    } catch (err) {
      toast.error("Failed to remove domain");
    }
  };

  return (
    <AppLayout>
      <PageWrapper title="Privacy Monitor">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Watchlist Management */}
            <Card padding="lg" className="border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
                    <Eye className="text-purple-400" size={24} />
                    Active Watchlist
                  </h2>
                  <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">Domains under continuous AI monitoring</p>
                </div>
                <div className="flex gap-2">
                   <Input 
                     placeholder="domain.com" 
                     value={newUrl}
                     onChange={(e) => setNewUrl(e.target.value)}
                     className="max-w-[200px] h-10 text-xs"
                   />
                   <Button size="sm" variant="purple" icon={Plus} onClick={handleAddToWatchlist} loading={isLoading}>Track</Button>
                </div>
              </div>

              <div className="space-y-3">
                {watchlist.length === 0 ? (
                  <div className="py-12 text-center text-text-muted font-black italic uppercase border border-dashed border-white/5 rounded-2xl">
                    No domains tracked. Add an app to start monitoring.
                  </div>
                ) : (
                  watchlist.map((item) => (
                    <div key={item.domain} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Globe className="text-purple-400" size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{item.domain}</h4>
                          <span className="text-[10px] text-text-muted font-bold uppercase underline">
                            Last Sync: {item.last_checked ? new Date(item.last_checked).toLocaleTimeString() : 'Pending 初次'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="xs" icon={Trash2} onClick={() => handleRemove(item.domain)} className="text-red-400">Untrack</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 2. Public Registry Feed */}
            <Card padding="lg" className="border-white/5">
               <h3 className="text-lg font-black italic uppercase text-white mb-6 flex items-center gap-2">
                 <TrendingUp className="text-purple-400" size={20} />
                 Global Trust Registry
               </h3>
               <div className="space-y-4">
                 {registry.map((site, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <span className="text-xl">{(site.risk?.score || 0) > 60 ? '🛡️' : '⚠️'}</span>
                         <div>
                            <span className="text-sm font-black text-white">{site.domain}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${site.risk?.score > 60 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  Trust Score: {site.risk?.score || 0}%
                               </span>
                               {site.blockchain?.status === 'confirmed' && (
                                 <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-black uppercase">Verified</span>
                               )}
                            </div>
                         </div>
                      </div>
                      <span className="text-[10px] font-bold text-text-muted uppercase italic">{new Date(site.created_at).toLocaleDateString()}</span>
                   </div>
                 ))}
               </div>
            </Card>
          </div>

          <div className="space-y-8">
            {/* 3. Alerts Feed */}
            <Card padding="lg" className="border-purple-500/20 bg-purple-500/5">
              <h3 className="text-base font-black italic uppercase text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={20} />
                Privacy & Data Alerts
              </h3>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-text-muted uppercase">No changes detected yet</div>
                ) : (
                  alerts.map((a, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black text-white italic">{a.domain}</span>
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                         {a.categories?.map((c: string, j: number) => (
                           <span key={j} className="text-[8px] font-black uppercase bg-red-500/20 text-red-100 px-2 py-0.5 rounded border border-red-500/30">{c}</span>
                         ))}
                      </div>

                      <p className="text-[10px] font-bold text-red-100 leading-tight">AI identified a silent policy update affecting the categories above. Audit required to verify new legal terms.</p>
                      
                      <div className="pt-1 flex justify-between items-center">
                         <span className="text-[8px] font-bold text-red-300 italic opacity-60">{new Date(a.detected_at).toLocaleString()}</span>
                         <Button variant="outline" size="xs" className="text-[8px] h-6 px-3 border-red-500/30 hover:bg-red-500/20" onClick={() => navigate(`/scan`)}>Audit Changes</Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>

            <Card className="border-white/5 space-y-4">
               <div className="flex items-center gap-3">
                  <Lock className="text-purple-400" size={18} />
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">Monitor Active</span>
               </div>
               <p className="text-[10px] font-bold text-text-muted leading-relaxed italic">
                 Your watchlist is anchored to your wallet address. The AI Night-Watchman probes these domains every 12 hours for policy delta.
               </p>
            </Card>

            <Card padding="lg" className="border-white/5 space-y-4 bg-slate-900/40">
               <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-white flex items-center gap-2">
                       <Shield size={14} className="text-purple-400" />
                       Alert Preferences
                    </h4>
                    <p className="text-[9px] font-bold text-text-muted mt-1 italic">Optional: Bind an email for real-time risk alerts</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Input 
                      placeholder="alert-me@email.com" 
                      value={settings.email}
                      onChange={(e) => setSettings({...settings, email: e.target.value})}
                      className="h-10 text-[10px]"
                    />
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-text-muted uppercase italic">Email Notifications</span>
                       <input 
                         type="checkbox" 
                         checked={settings.email_alerts}
                         onChange={(e) => setSettings({...settings, email_alerts: e.target.checked})}
                         className="w-4 h-4 rounded border-white/10 bg-black accent-purple-500"
                       />
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-[9px] font-black h-9 border-white/10" 
                      onClick={handleSaveSettings}
                      loading={isSaving}
                    >
                      Save Preferences
                    </Button>
                  </div>
               </div>
            </Card>
          </div>

        </div>
      </PageWrapper>
    </AppLayout>
  );
};

const Globe = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
