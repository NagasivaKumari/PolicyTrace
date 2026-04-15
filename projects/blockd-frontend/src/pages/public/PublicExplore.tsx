import React, { useEffect, useState } from 'react';
import { Globe, Search, ArrowUpRight, ShieldCheck, Map, Filter, Activity, Plus } from 'lucide-react';
import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { ScanResult } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const PublicExplore = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total_scans: 0, total_certs: 0 });

  useEffect(() => {
    fetchPublicScans(initialQuery);
    fetchGlobalStats();
  }, [initialQuery]);

  const fetchPublicScans = async (query = '') => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/scan/public`, {
        params: { q: query, limit: 50 }
      });
      setScans(Array.isArray(res.data.items) ? res.data.items : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/scan/stats/global`);
      setStats({
        total_scans: res.data.total_scans,
        total_certs: res.data.total_certs
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublicScans(searchTerm);
  };

  return (
    <AppLayout>
      <PageWrapper title="Global Privacy Registry">
        <div className="space-y-12 pb-20">
          {/* Hero Section */}
          <div className="relative pt-12 text-center space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-white">Global Privacy Registry</h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Explore the DPDP compliance posture of thousands of Indian digital services, permanently anchored on the Algorand blockchain.
            </p>
          </div>

          {/* Search & Stats Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-6 items-center">
            <Card padding="sm" className="flex-grow bg-bg-surface border-purple-500/20">
              <Input 
                placeholder="Search by domain (e.g. flipkart.com)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                className="bg-transparent h-14 text-lg border-none focus:ring-0 text-white"
              />
            </Card>
            <div className="flex gap-4">
               <Card padding="sm" className="flex items-center gap-4 bg-bg-surface/30">
                 <div className="text-center px-4 border-r border-border">
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Audits</p>
                  <p className="text-xl font-bold text-white">{(stats.total_scans || 0).toLocaleString()}</p>
                 </div>
                 <div className="text-center px-4">
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Anchored</p>
                  <p className="text-xl font-bold text-purple-400">{(stats.total_certs || 0).toLocaleString()}</p>
                 </div>
               </Card>
            </div>
          </form>

          {/* Audit Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-bg-surface/50 rounded-3xl animate-pulse border border-border" />
              ))
            ) : scans.length > 0 ? (
              scans.map((scan) => (
                <Card key={scan.id} className="group hover:scale-[1.02] transition-all duration-300 border-border hover:border-purple-500/50 flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-bg-base rounded-2xl flex items-center justify-center border border-border group-hover:bg-purple-600/10 group-hover:border-purple-500/30 transition-all">
                      <Globe size={28} className="text-text-muted group-hover:text-purple-400" />
                    </div>
                    <RiskBadge score={scan.risk_score} />
                  </div>
                  
                  <h3 className="font-bold text-xl text-white truncate mb-1">{scan.url.replace(/^https?:\/\//, '')}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-8">
                    <Activity size={12} className="text-purple-400" />
                    Audited {scan.completed_at ? new Date(scan.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </div>

                  <div className="mt-auto space-y-4 pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                       {scan.anchored ? (
                         <Badge variant="success" size="sm" icon={ShieldCheck}>On-Chain Proof</Badge>
                       ) : (
                         <Badge variant="muted" size="sm">Unverified</Badge>
                       )}
                       <Link to={scan.anchored ? `/cert/${scan.anchored_txid}` : `/scan/${scan.id}`}>
                         <Button variant="ghost" size="sm" icon={ArrowUpRight}>Inspect</Button>
                       </Link>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState 
                  icon={Globe}
                  title="No audits found"
                  description={searchTerm ? `We haven't audited "${searchTerm}" yet.` : "The global registry is currently empty."}
                  action={<Button icon={Plus} onClick={() => navigate('/scan')}>Perform First Audit</Button>}
                />
              </div>
            )}
          </div>

          {/* CTA Footer for Non-Users */}
          <Card className="bg-bg-surface border-purple-500/30 p-12 text-center">
             <h2 className="text-3xl font-bold text-white mb-4">Want to audit your own website?</h2>
             <p className="text-text-secondary mb-8 max-w-lg mx-auto">Join BLOCKD to generate immutable compliance certificates and display them on your website for user trust.</p>
             <div className="flex justify-center gap-4">
               <Button size="lg" onClick={() => navigate('/register')}>Create Free Account</Button>
               <Button size="lg" variant="secondary" onClick={() => navigate('/scan')}>Try a Quick Scan</Button>
             </div>
          </Card>
        </div>
      </PageWrapper>
    </AppLayout>
  );
};
