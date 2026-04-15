import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FileBadge,
  ExternalLink,
  Plus,
  Search,
  ShieldCheck,
  Coins,
  AlertTriangle,
  Globe
} from 'lucide-react';

import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CopyButton } from '../../components/ui/CopyButton';
import { Badge } from '../../components/ui/Badge';
import { RiskGauge } from '../../components/charts/RiskGauge';
import { getAuthHeaders } from '../../utils/auth';
import { useAlgorand } from '../../context/AlgorandContext';
import type { Certificate, ScanResult } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type FilterKey = 'all' | 'high' | 'medium' | 'low' | 'nft';
type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

export const Certificates = () => {
  const navigate = useNavigate();
  const { getExplorerTxUrl, walletAddress } = useAlgorand();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [items, setItems] = useState<Array<{ scan: ScanResult; certificate?: Certificate }>>([]);

  const { user } = useAuth();

  useEffect(() => {
    const activeId = walletAddress || user?.wallet_address;
    if (activeId && activeId !== 'Stored Session') {
      fetchCertificates(activeId);
    }
  }, [walletAddress, user?.wallet_address]);

  const fetchCertificates = async (address?: string) => {
    const activeId = address || walletAddress || user?.wallet_address;
    if (!activeId || activeId === 'Stored Session') return;

    try {
      const headers = getAuthHeaders(activeId);
      const res = await axios.get(`${API_URL}/api/scan/history`, { headers });
      const scans: ScanResult[] = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      const anchored = scans.filter(s => s.anchored);
      
      // Fetch corresponding certificates
      const certPromises = anchored.map(s => 
        axios.get(`${API_URL}/api/certificate/${s.anchored_txid}`, { headers }).then(r => r.data).catch(() => null)
      );
      const certificates = await Promise.all(certPromises);
      
      const combined = anchored.map((scan, idx) => ({
        scan,
        certificate: certificates[idx]
      }));
      
      setItems(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(it => {
      if (filter === 'all') return true;
      if (filter === 'nft') return it.certificate?.nft_minted;
      return it.scan.risk_level === filter;
    });

    return result.sort((a, b) => {
      if (sortKey === 'newest') return new Date(b.scan.completed_at || '').getTime() - new Date(a.scan.completed_at || '').getTime();
      if (sortKey === 'oldest') return new Date(a.scan.completed_at || '').getTime() - new Date(b.scan.completed_at || '').getTime();
      if (sortKey === 'highest') return (b.scan.risk_score || 0) - (a.scan.risk_score || 0);
      if (sortKey === 'lowest') return (a.scan.risk_score || 0) - (b.scan.risk_score || 0);
      return 0;
    });
  }, [items, filter, sortKey]);

  return (
    <AppLayout>
      <PageWrapper title="My Certificates">
        <div className="space-y-8 pb-10">
          <SectionHeader 
            title="My Certificates" 
            subtitle="Blockchain-anchored audit proofs and compliance NFTs"
            action={<Button icon={Plus} onClick={() => navigate('/scan')}>New Scan</Button>}
          />

          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {(['all', 'high', 'medium', 'low', 'nft'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`
                    px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap
                    ${filter === key 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' 
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'}
                  `}
                >
                  {key === 'nft' ? 'NFT Minted' : key.replace('_', ' ')}
                </button>
              ))}
            </div>

            <Card padding="sm" className="bg-bg-surface/30 flex items-center gap-3">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Sort by</span>
              <select 
                value={sortKey} 
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-xs font-bold text-text-primary outline-none cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest Risk</option>
                <option value="lowest">Lowest Risk</option>
              </select>
            </Card>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map(({ scan, certificate }) => (
                <Card key={scan.id} className="group transition-all hover:border-purple-500/50">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-600/20 group-hover:bg-purple-600/20 transition-all">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white leading-tight">{scan.url.replace(/^https?:\/\//, '')}</h3>
                        <p className="text-xs text-text-muted mt-1">{new Date(scan.completed_at || '').toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <RiskBadge score={scan.risk_score} />
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Risk Score</span>
                        <span className="text-xs font-bold text-white">{Math.round(scan.risk_score)}/100</span>
                      </div>
                      <div className="h-40 flex items-center justify-center bg-bg-base/50 rounded-xl border border-border">
                        <RiskGauge score={scan.risk_score} size={100} />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Findings</span>
                        <p className="text-sm font-bold text-text-secondary">{scan.total_violations} Violations detected</p>
                      </div>
                      {certificate?.nft_minted && (
                        <div className="flex items-center gap-2">
                          <Badge variant="purple" icon={AlertTriangle} size="sm">NFT MINTED</Badge>
                          <span className="text-[10px] font-bold text-text-muted">#{certificate.asset_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-bg-elevated/30 rounded-xl border border-border p-4 mb-6">
                    <div className="flex items-center gap-3 text-green-400 mb-2">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verified on Algorand</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-text-secondary truncate max-w-[200px]">{scan.anchored_txid}</span>
                      <CopyButton value={scan.anchored_txid || ''} label="TXID" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" fullWidth size="sm" onClick={() => navigate(`/cert/${scan.anchored_txid}`)}>View Certificate</Button>
                    <Button variant="ghost" fullWidth size="sm" icon={ExternalLink} onClick={() => window.open(getExplorerTxUrl(scan.anchored_txid || ''), '_blank')}>Explorer</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={FileBadge}
              title="No certificates found"
              description={filter === 'all' ? "You haven't anchored any audits on Algorand yet." : `No certificates match the "${filter}" filter.`}
              action={<Button icon={Plus} onClick={() => navigate('/scan')}>Analyze New Website</Button>}
            />
          )}
        </div>
      </PageWrapper>
    </AppLayout>
  );
};