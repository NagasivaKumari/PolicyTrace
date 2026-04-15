import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Pencil, LogOut, Copy, ExternalLink, User as UserIcon,
  Save, X, AtSign, CheckCircle, Code, ShieldCheck
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { AlgorandWalletCard } from '../../components/algorand/AlgorandWalletCard';
import TrustSeal from '../../components/blockchain/TrustSeal';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/auth';
import { useAlgorand } from '../../context/AlgorandContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { walletAddress } = useAlgorand();

  // Stats
  const [stats, setStats] = useState({ total_scans: 0, total_certs: 0, violations_found: 0 });

  // Edit username
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchProfileStats(); }, []);

  const fetchProfileStats = async () => {
    try {
      const headers = getAuthHeaders(walletAddress);
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/api/scan/user/stats`, { headers }),
        axios.get(`${API_URL}/api/scan/history`, { headers }),
      ]);
      const history = historyRes.data?.items || historyRes.data || [];
      const violations = history.reduce((s: number, sc: any) => s + (sc.total_violations || 0), 0);
      setStats({ 
        total_scans: statsRes.data.total_scans, 
        total_certs: statsRes.data.total_certs, 
        violations_found: violations 
      });
    } catch { /* silent */ }
  };

  const initials = useMemo(() => {
    const u = user?.username || 'U';
    return u.slice(0, 2).toUpperCase();
  }, [user]);

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      await axios.patch(`${API_URL}/api/user/me`, {
        username: editUsername || undefined,
      }, { headers: getAuthHeaders(walletAddress) });
      toast.success('On-chain profile updated!');
      setIsEditing(false);
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Blockchain sync failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyWidgetCode = () => {
    const code = `<script src="${window.location.origin}/widget.js"></script>\n<div id="blockd-seal" data-url="YOUR_DOMAIN.com"></div>`;
    navigator.clipboard.writeText(code);
    toast.success('Widget code copied!');
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <AppLayout>
      <PageWrapper title="My Profile">
        <div className="space-y-8 pb-20">
          <SectionHeader title="Profile & Trust Seal" subtitle="Manage your identity and export your blockchain trust" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: User Card */}
            <div className="space-y-6">
              <Card padding="lg" className="text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                   <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-black tracking-widest uppercase">
                      <ShieldCheck size={10} /> Live
                   </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-3xl font-bold text-white mb-6 border-4 border-white/5 shadow-2xl uppercase">
                    {initials}
                  </div>

                  {isEditing ? (
                    <div className="w-full space-y-3">
                      <Input label="Username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="johndoe" icon={AtSign} />
                      <div className="flex gap-2 mt-2">
                        <Button variant="ghost" size="sm" fullWidth icon={X} onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" fullWidth icon={Save} loading={isSaving} onClick={saveEdit}>Sync Chain</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        @{user?.username || 'user'}
                        <button onClick={() => { setEditUsername(user?.username || ''); setIsEditing(true); }} className="text-text-muted hover:text-purple-400 transition-colors">
                          <Pencil size={14} />
                        </button>
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 max-w-[180px] break-all opacity-50">{user?.wallet_address}</p>
                      
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <CheckCircle size={10} /> Authenticated via Wallet
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-10 pt-10 border-t border-white/5">
                  {[
                    { label: 'Scans', value: stats.total_scans },
                    { label: 'Certs', value: stats.total_certs },
                    { label: 'Flags', value: stats.violations_found },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-lg font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Status card */}
              <Card padding="md" className="bg-emerald-500/5 border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="text-emerald-400 w-5 h-5" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Trust Status</p>
                      <p className="text-sm font-bold text-white">Expert Auditor</p>
                    </div>
                  </div>
                  <CheckCircle className="text-emerald-400 w-4 h-4" />
                </div>
              </Card>
            </div>

            {/* Right: Wallet + Trust Seal Center */}
            <div className="lg:col-span-2 space-y-6">
              <AlgorandWalletCard />

              {/* NEW: TRUST SEAL CENTER */}
              <Card padding="lg" className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-600/10 rounded-xl flex items-center justify-center text-violet-400 border border-violet-600/20">
                      <Code size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">BlockD Trust Seal</h4>
                      <p className="text-sm text-text-secondary">Export your blockchain compliance badge</p>
                    </div>
                  </div>
                  <TrustSeal variant="inline" anchored />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-950/50 p-6 rounded-2xl border border-white/5">
                   <div className="space-y-4">
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Allow your users to verify your privacy policies in real-time. This seal pulls its status 
                        <strong className="text-white"> directly from the Algorand blockchain</strong>.
                      </p>
                      <ul className="space-y-2">
                         {['Zero Tracking', 'Real-time Sync', '100% Immutable'].map(f => (
                           <li key={f} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <CheckCircle size={10} className="text-violet-400" /> {f}
                           </li>
                         ))}
                      </ul>
                   </div>
                   
                   <div className="space-y-3">
                      <div className="p-4 bg-slate-900 rounded-xl border border-white/5 font-mono text-[10px] text-violet-300 break-all select-all">
                        {`<script src="${window.location.origin}/widget.js"></script>\n<div id="blockd-seal" data-url="your-site.com"></div>`}
                      </div>
                      <Button variant="secondary" size="md" fullWidth icon={Copy} onClick={copyWidgetCode}>Copy Embed Code</Button>
                   </div>
                </div>
              </Card>

              {/* Meta Actions */}
              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5">
                <Button variant="ghost" icon={LogOut} fullWidth className="justify-start text-red-400/70 hover:text-red-400" onClick={handleLogout}>Disconnect Session</Button>
                <Button variant="ghost" icon={ExternalLink} fullWidth className="justify-start text-slate-400 hover:text-white" onClick={() => window.open('https://testnet.algoexplorer.io', '_blank')}>View Chain Explorer</Button>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </AppLayout>
  );
};