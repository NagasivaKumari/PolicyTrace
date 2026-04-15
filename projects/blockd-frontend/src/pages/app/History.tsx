import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Globe, Coins, Wallet, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAlgorand } from '../../context/AlgorandContext';
import { WalletModal } from '../../components/blockchain/WalletModal';
import type { ScanResult } from '../../types';
import { getAuthHeaders } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const History = () => {
  const navigate = useNavigate();
  const { walletAddress, connectWallet } = useAlgorand();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changes, setChanges] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'anchored' | 'scanned'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleConnect = async (walletId: string) => {
    try {
      await connectWallet(walletId);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Connection failed', err);
    }
  };

  useEffect(() => { 
    if (walletAddress) {
      fetchHistory(walletAddress);
      fetchChanges(walletAddress);
    }
  }, [walletAddress]);

  const fetchHistory = async (address: string) => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/scan/history/${address}`);
      setScans(res.data.items ?? []);
      setSelected({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScans = scans.filter((scan) => {
    const nameMatch = scan.url.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const statusMatch = statusFilter === 'all' ? true : scan.status === statusFilter;
    const dateValue = new Date(scan.completed_at || scan.created_at).getTime();
    const startOk = startDate ? dateValue >= new Date(startDate).getTime() : true;
    const endOk = endDate ? dateValue <= new Date(endDate).getTime() : true;
    return nameMatch && statusMatch && startOk && endOk;
  });
  const handleDelete = async (scanId: string) => {
    if (!walletAddress) return;
    if (!window.confirm('Delete this scan?')) return;
    try {
      await axios.delete(`${API_URL}/api/scan/${scanId}`, {
        headers: getAuthHeaders(walletAddress)
      });
      await fetchHistory(walletAddress);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSelected = async () => {
    if (!walletAddress) return;
    const scanIds = Object.keys(selected).filter((id) => selected[id]);
    if (scanIds.length === 0) return;
    if (!window.confirm(`Delete ${scanIds.length} selected scan(s)?`)) return;
    try {
      await axios.post(
        `${API_URL}/api/scan/delete`,
        { scan_ids: scanIds },
        { headers: getAuthHeaders(walletAddress) }
      );
      await fetchHistory(walletAddress);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChanges = async (address: string) => {
    if (!address) return;
    try {
      const res = await axios.get(`${API_URL}/api/scan/changes/${address}`);
      setChanges(res.data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <PageWrapper title="Scan History">
        {!walletAddress ? (
          <EmptyState
            icon={HistoryIcon}
            title="Connect wallet to view history"
            description="History is tied to your wallet address."
            action={<Button icon={Wallet} onClick={() => setIsModalOpen(true)}>Connect Wallet</Button>}
          />
        ) : (
        <div className="space-y-8">
          <SectionHeader 
            title="Scan History" 
            subtitle="Your scans stored in MongoDB"
          />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              {filteredScans.length} scans
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Search</div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by website"
                  className="h-9 px-3 text-xs rounded-lg bg-bg-elevated border border-border text-white"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Status</div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 px-3 text-xs rounded-lg bg-bg-elevated border border-border text-white"
                >
                  <option value="all">All</option>
                  <option value="anchored">Anchored</option>
                  <option value="scanned">Scanned</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">From</div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 px-3 text-xs rounded-lg bg-bg-elevated border border-border text-white"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">To</div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 px-3 text-xs rounded-lg bg-bg-elevated border border-border text-white"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={handleDeleteSelected}
                className="text-red-400"
              >
                Delete Selected
              </Button>
            </div>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg-elevated/50 border-b border-border">
                    <th className="px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Select</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">#</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Website</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Risk Score</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Violations</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">TxID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <SkeletonTable rows={8} columns={8} />
                  ) : filteredScans.length > 0 ? (
                    filteredScans.map((scan, idx) => (
                      <tr 
                        key={scan.id} 
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={!!selected[scan.scan_id || scan.id]}
                            onChange={(e) =>
                              setSelected((prev) => ({
                                ...prev,
                                [(scan.scan_id || scan.id) as string]: e.target.checked
                              }))
                            }
                          />
                        </td>
                        <td className="px-6 py-4 text-xs text-text-muted font-mono">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center border border-border group-hover:border-purple-500/30 transition-colors">
                              <Globe size={14} className="text-text-muted group-hover:text-purple-400" />
                            </div>
                            <span className="font-bold text-sm tracking-tight truncate max-w-[150px]">{scan.url.replace(/^https?:\/\//, '')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-text-secondary">
                          {Math.round(scan.risk_score)}
                          {typeof scan.risk_delta === 'number' && (
                            <span className={`ml-2 text-[10px] font-black ${scan.risk_delta >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {scan.risk_delta >= 0 ? '+' : ''}{Math.round(scan.risk_delta)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {scan.status === 'anchored' ? (
                            <Badge variant="success" size="sm" icon={Coins}>Anchored</Badge>
                          ) : (
                            <Badge variant="muted" size="sm">Scanned</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-text-muted max-w-[240px]">
                          {scan.violations && scan.violations.length > 0 ? (
                            <div className="space-y-1">
                              {scan.violations.slice(0, 2).map((v, i) => (
                                <div key={i} className="truncate">
                                  • {typeof v === 'string' ? v : v.explanation || v.category}
                                </div>
                              ))}
                              {scan.violations.length > 2 && (
                                <div className="text-[10px] text-text-muted">+{scan.violations.length - 2} more</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest">No issues</span>
                          )}
                          {scan.flagged_clauses && scan.flagged_clauses[0]?.excerpt && (
                            <div className="text-[9px] text-text-muted italic border-l border-slate-700 pl-2 mt-2 truncate">
                              "{scan.flagged_clauses[0].excerpt}"
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-text-muted font-mono truncate max-w-[160px]">
                          {scan.tx_id || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-text-muted whitespace-nowrap">
                          {new Date(scan.completed_at || scan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Eye}
                              onClick={() => navigate(`/scan/${scan.id}`)}
                            />
                            {scan.tx_id && (
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/verify/${scan.tx_id}`)}>
                                Verify
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              className="text-red-400"
                              onClick={() => handleDelete(scan.scan_id || scan.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12">
                        <EmptyState 
                          icon={HistoryIcon}
                          title="No history found"
                          description="You haven't performed any audits yet."
                          action={<Button onClick={() => navigate('/scan')}>Start First Scan</Button>}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {scans.length > 0 && (
            <Card padding="lg" className="border-white/5">
              <h3 className="text-lg font-black italic uppercase text-white mb-4">Compliance History Timeline</h3>
              <div className="space-y-4">
                {scans.slice(0, 10).map((scan) => (
                  <div key={scan.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate max-w-[220px]">
                          {scan.url.replace(/^https?:\/\//, '')}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {new Date(scan.completed_at || scan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted">
                        Risk Score: <span className="text-white font-bold">{Math.round(scan.risk_score)}</span>
                        {typeof scan.risk_delta === 'number' && (
                          <span className={`ml-2 font-bold ${scan.risk_delta >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ({scan.risk_delta >= 0 ? '+' : ''}{Math.round(scan.risk_delta)})
                          </span>
                        )}
                        {' '}• Violations: <span className="text-white font-bold">{scan.total_violations || 0}</span>
                        {scan.version && (
                          <span className="ml-2 text-text-muted">• v{scan.version}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {changes.length > 0 && (
            <Card padding="lg" className="border-white/5">
              <h3 className="text-lg font-black italic uppercase text-white mb-4">Policy Change Timeline</h3>
              <div className="space-y-4">
                {changes.slice(0, 10).map((change) => (
                  <div key={change._id} className="p-4 bg-bg-elevated border border-border rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-white truncate max-w-[260px]">{change.domain}</div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(change.detected_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-xs text-text-muted mt-2">
                      Risk Delta:{' '}
                      <span className={`font-bold ${change.risk_delta >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {change.risk_delta >= 0 ? '+' : ''}{Math.round(change.risk_delta || 0)}
                      </span>
                      {change.version && <span className="ml-2">• v{change.version}</span>}
                    </div>
                    {Array.isArray(change.categories) && change.categories.length > 0 && (
                      <div className="text-[10px] uppercase tracking-widest text-text-muted mt-2">
                        {change.categories.join(' • ')}
                      </div>
                    )}
                    {Array.isArray(change.diff_summary) && change.diff_summary.length > 0 && (
                      <div className="mt-3 space-y-1 text-[10px] text-text-secondary font-mono">
                        {change.diff_summary.map((line: string, idx: number) => (
                          <div key={idx} className={line.startsWith('+') ? 'text-green-300' : line.startsWith('-') ? 'text-red-300' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        )}
        <WalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConnect={handleConnect}
        />
      </PageWrapper>
    </AppLayout>
  );
};
