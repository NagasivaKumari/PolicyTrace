import React, { useEffect, useState } from 'react';
import { 
  ScanLine, 
  ShieldAlert, 
  FileBadge, 
  BarChart2, 
  TrendingUp, 
  Globe, 
  ChevronRight, 
  AlertTriangle,
  Zap,
  ShieldCheck,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RiskTrendChart } from '../../components/charts/RiskTrendChart';
import { AlgorandWalletCard } from '../../components/algorand/AlgorandWalletCard';
import { useAuth } from '../../hooks/useAuth';
import { useAlgorand } from '../../context/AlgorandContext';
import type { ScanResult } from '../../types';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const Dashboard = () => {
  const { user } = useAuth();
  const { walletAddress } = useAlgorand();
  const [stats, setStats] = useState({
    total_scans: 0,
    total_certs: 0,
    avg_score: 0,
    high_risk_count: 0,
    violations_by_section: {} as Record<string, number>
  });
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Layout Stabilizer: Recharts needs the grid to finish its initial expansion
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const activeId = walletAddress || user?.wallet_address;
    if (activeId && activeId !== 'Stored Session') {
      fetchDashboardData(activeId);
    }
  }, [walletAddress, user?.wallet_address]);

  const fetchDashboardData = async (address: string) => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders(address);
      const statsUrl = address ? `${API_URL}/api/scan/user/stats/${address}` : `${API_URL}/api/scan/user/stats`;
      const historyUrl = address ? `${API_URL}/api/scan/history/${address}` : `${API_URL}/api/scan/history`;

      const [statsRes, scansRes] = await Promise.all([
        axios.get(statsUrl, { headers }),
        axios.get(historyUrl, { headers }),
      ]);
      
      setStats(statsRes.data);
      const historyRows = Array.isArray(scansRes.data)
        ? scansRes.data
        : scansRes.data?.items ?? [];
      setRecentScans(historyRows.slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const username = user?.wallet_address 
    ? `@${user.wallet_address.substring(0, 6)}...` 
    : 'Blockchain User';

  return (
    <AppLayout>
      <PageWrapper title="Dashboard">
        <div className="space-y-8">
          <SectionHeader 
            title="Dashboard" 
            subtitle={`Pure Web3 Session: ${username}. Auditing Testnet audits in real-time.`}
            action={
              <Link to="/scan">
                <Button icon={ScanLine} variant="purple">Analyze Website</Button>
              </Link>
            }
          />

          {/* ROW 1: LIVE BLOCKCHAIN METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-purple-500/10 hover:border-purple-500/30 transition-all">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Scans</span>
                  <Activity size={16} className="text-purple-400" />
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-4xl font-black italic text-white tracking-tighter">{stats.total_scans}</span>
                  <div className="flex items-center text-purple-400 text-[10px] font-black uppercase gap-1 mb-1">
                    <TrendingUp size={12} />
                    Live
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-red-500/10 hover:border-red-500/30 transition-all">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">High Risk Flags</span>
                  <ShieldAlert size={16} className="text-red-400" />
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-4xl font-black italic text-white tracking-tighter">{stats.high_risk_count}</span>
                  <span className="text-red-400 text-[10px] font-black uppercase mb-1">
                    {stats.total_scans > 0 ? Math.round((stats.high_risk_count / stats.total_scans) * 100) : 0}% Ratio
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border-amber-500/10 hover:border-amber-500/30 transition-all">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Certs Issued</span>
                  <FileBadge size={16} className="text-amber-400" />
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-4xl font-black italic text-white tracking-tighter">{stats.total_certs}</span>
                  <span className="text-amber-500 text-[10px] font-black uppercase mb-1 whitespace-nowrap">Anchored</span>
                </div>
              </div>
            </Card>

            <Card className="border-green-500/10 hover:border-green-500/30 transition-all">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Compliance Score</span>
                  <Zap size={16} className="text-green-400" />
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl font-black italic text-white">{Math.round(100 - stats.avg_score)}%</span>
                  </div>
                  <ProgressBar value={100 - stats.avg_score} color="green" size="sm" />
                </div>
              </div>
            </Card>
          </div>

          {/* ROW 2: LIVE BLOCKCHAIN LEDGER + CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Card className="lg:col-span-3 border-white/5 bg-bg-surface/50 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                        <Activity className="text-purple-400" size={20} />
                        Recent Blockchain Anchors
                    </h3>
                    <p className="text-xs text-text-muted font-medium mt-1">Live data from Algorand Testnet Indexer</p>
                </div>
                <Link to="/history">
                  <Button variant="ghost" size="sm" icon={ChevronRight} iconPosition="right">Ledger History</Button>
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                    <tr>
                      <th className="pb-4">Website Node</th>
                      <th className="pb-4 text-center">Security Score</th>
                      <th className="pb-4 text-center">Status</th>
                      <th className="pb-4 text-right">Ledger Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentScans.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="py-12 text-center text-text-muted text-xs font-black uppercase italic tracking-widest opacity-20">No Ledger events detected</td>
                        </tr>
                    ) : recentScans.map((scan) => (
                      <tr key={scan.id} className="group hover:bg-purple-500/5 transition-all">
                        <td className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-purple-400 group-hover:border-purple-500/50 transition-colors">
                                <Globe size={16} />
                            </div>
                            <span className="font-black text-sm text-white tracking-tight">{scan.url.replace(/^https?:\/\//, '').substring(0, 24)}</span>
                          </div>
                        </td>
                        <td className="py-5 text-center"><RiskBadge score={scan.risk_score} size="md" /></td>
                        <td className="py-5 text-center">
                          <Badge variant="success" size="sm" icon={ShieldCheck} className="bg-green-500/10 text-green-500 border-none px-3 font-black">VALIDATED</Badge>
                        </td>
                        <td className="py-5 text-right">
                          <Link to={`/scan/${scan.id}`}>
                            <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest border-white/10 hover:border-purple-500 hover:text-purple-400">
                                Open Audit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="lg:col-span-2 w-full h-[300px]">
              {isReady ? (
                <RiskTrendChart />
              ) : (
                <div className="w-full h-full bg-bg-surface rounded-2xl animate-pulse flex items-center justify-center border border-border">
                  <span className="text-[10px] font-black uppercase text-text-muted">Loading Analytics...</span>
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: DYNAMIC DPDP COMPLIANCE SPREAD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
            <Card className="border-white/5">
              <div className="mb-8">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">DPDP Compliance Spread</h3>
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mt-1">Real-time non-compliance mapping</p>
              </div>
              
              <div className="space-y-4">
                {Object.keys(stats.violations_by_section || {}).length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs text-text-muted font-black uppercase italic tracking-widest opacity-20">Analyzing blockchain metadata...</p>
                  </div>
                ) : (
                  Object.entries(stats.violations_by_section).map(([section, count], idx) => (
                    <div key={section} className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                            <span className="text-xs font-black uppercase tracking-widest text-white">{section}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="h-1.5 w-24 bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-purple-500 transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, (count / (stats.total_scans || 1)) * 100)}%` }} 
                                />
                             </div>
                             <span className="text-xs font-mono font-bold text-text-muted">{count}</span>
                        </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <AlgorandWalletCard />
          </div>
        </div>
      </PageWrapper>
    </AppLayout>
  );
};
