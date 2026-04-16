import React, { useState, useEffect } from 'react';
import { 
  Shield, Globe, AlertTriangle, CheckCircle2, 
  ScanLine, Info, Download, Share2, RefreshCw,
  ExternalLink, X, Activity, Zap, FileBadge
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Badge } from '../../components/ui/Badge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useScan } from '../../hooks/useScan';
import { useAlgorand } from '../../context/AlgorandContext';
import { useToast } from '../../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BlockchainHandshake from '../../components/blockchain/BlockchainHandshake';
import { useWallet } from '@txnlab/use-wallet-react';
import { getAuthHeaders } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const steps = [
  { id: 1, label: 'Finding policy' },
  { id: 2, label: 'Extracting clauses' },
  { id: 3, label: 'AI Risk Audit' },
  { id: 4, label: 'IPFS Anchor' },
  { id: 5, label: 'Blockchain' }
];

export const Scan = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const { startScan, pollScan, scanJob, scanResult, isScanning, error, cancelScan, loadScan } = useScan();
  const { isConnected, anchorAudit } = useAlgorand();
  const { activeAccount, signTransactions } = useWallet();
  const [isAnchoring, setIsAnchoring] = useState(false);
  const toast = useToast();

  const isReady = !!activeAccount?.address && !!signTransactions;

  const handleAnchor = async () => {
    // 1. Strict Guard: Stop immediately if signer is not ready
    if (!isReady) {
      navigate(`/anchor/${id}`);
      return;
    }

    const metadata = scanJob?.metadata || scanResult?.metadata;
    if (!metadata) {
      console.error("BLOCKD: [UI ERROR] Metadata missing for anchoring. Current Job State:", scanJob);
      toast.error(`Audit metadata missing for scan ${id?.slice(0, 8)}. Please refresh and try again.`);
      return;
    }

    setIsAnchoring(true);
    try {
      console.log("BLOCKD: [UI] Starting Anchor Pipeline for IPFS CID:", metadata.ipfs_cid);
      const txId = await anchorAudit(metadata);
      if (!txId) {
        throw new Error('Transaction submission did not return a txId');
      }
      await axios.post(
        `${API_URL}/api/scan/${metadata.scan_id}/verify`,
        { tx_id: txId },
        { headers: getAuthHeaders(activeAccount?.address) }
      );
      toast.success('Audit successfully anchored to Algorand Chain!');
      console.log("BLOCKD: [UI] Final Confirmation TxId:", txId);
      navigate('/history');
    } catch (err: any) {
      console.error("BLOCKD: [UI ERROR] Pipeline execution failed:", err);
      toast.error(err.message || 'Failed to anchor audit');
    } finally {
      setIsAnchoring(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadScan(id).catch(() => toast.error('Failed to load scan results'));
    }
  }, [id, loadScan, toast]);

  useEffect(() => {
    let interval: any;
    if (isScanning && scanJob && scanJob.status !== 'complete') {
      // 🚀 HARDENED POLLING: Wait for BOTH Step 5 and the Metadata
      if (scanJob.current_step === 5 && scanJob.metadata) {
        clearInterval(interval);
      } else {
        interval = setInterval(() => pollScan(scanJob.id), 1500);
      }
    }
    return () => clearInterval(interval);
  }, [isScanning, scanJob, pollScan]);

  // Auto-prompt when metadata is ready
  useEffect(() => {
    // Removed automatic anchor prompt on open — anchoring should only occur
    // when the user explicitly clicks the anchor button. This avoids
    // immediately requesting a wallet transaction when the user views an audit.
  }, [scanJob?.current_step, scanJob?.metadata]);

  const handleStartScan = async (e?: React.FormEvent, isSimple: boolean = false) => {
    e?.preventDefault();
    if (!url) return;
    try {
      await startScan(url, isSimple);
      toast.success(isSimple ? 'Fast-Track Test Started!' : 'Privacy audit initiated...');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start scan');
    }
  };

  return (
    <AppLayout>
      <PageWrapper title="Analysis Engine">
        <div className="space-y-8">
          <SectionHeader 
            title="Analysis Engine" 
            subtitle="Analyze any website's privacy policy for DPDP Act compliance"
          />

          <AnimatePresence mode="wait">
            {!isScanning && !scanResult && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto py-12"
              >
                <Card padding="lg" className="border-white/5 space-y-8">
                  <div className="space-y-4 text-center">
                    <h2 className="text-2xl font-black italic uppercase italic text-white">Enter Entity URL</h2>
                    <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Provide the domain for AI-Deep Audit</p>
                  </div>
                  
                  <div className="relative group">
                    <Input 
                      placeholder="e.g. swiggy.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-16 text-xl pl-12 pr-12 font-black italic border-white/10 group-hover:border-purple-500/50 transition-all focus:border-purple-500"
                      icon={Globe}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      fullWidth 
                      size="lg" 
                      icon={ScanLine} 
                      variant="purple"
                      onClick={() => handleStartScan()}
                      className="h-14 text-lg font-black uppercase tracking-widest"
                    >
                      Initiate Audit
                    </Button>

                    <Button 
                      fullWidth 
                      size="lg" 
                      icon={Zap} 
                      variant="outline"
                      onClick={() => handleStartScan(undefined, true)}
                      className="h-14 text-lg font-black uppercase tracking-widest border-purple-500/30 hover:bg-purple-500/10"
                    >
                      Simple Dev Test
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {isScanning && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto py-6 space-y-8"
              >
                <BlockchainHandshake 
                   status={scanJob?.current_step && scanJob.current_step >= 5 ? 'anchoring' : 'scanning'} 
                   url={url} 
                />
                
                <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl p-8 space-y-6">
                    {(scanJob?.current_step || 1) < 5 ? (
                      <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="text-purple-400 animate-pulse" size={20} />
                                <h3 className="text-sm font-black italic uppercase text-white">
                                    {scanJob?.status_message || "Analyzing Protocol..."}
                                </h3>
                            </div>
                            <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">{scanJob?.current_step || 1}/5</span>
                        </div>

                        <div className="flex gap-2 h-1.5">
                            {steps.map((s) => (
                               <div 
                                 key={s.id} 
                                 className={`flex-1 rounded-full transition-all duration-500 ${
                                    (scanJob?.current_step || 1) >= s.id ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-slate-800'
                                 }`}
                               />
                            ))}
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {steps.map((s) => (
                               <span key={s.id} className={`text-[8px] font-black uppercase tracking-tighter text-center transition-colors ${
                                  (scanJob?.current_step || 1) >= s.id ? 'text-white' : 'text-slate-600'
                               }`}>
                                   {s.label}
                               </span>
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 space-y-6">
                        <div className="flex flex-col items-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                              <Shield className="text-purple-400" size={32} />
                           </div>
                           <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">AI Audit Ready</h3>
                           <p className="text-sm font-bold text-text-secondary">Signature required to anchor result on-chain.</p>
                        </div>
                        <Button 
                          size="lg" 
                          variant="purple" 
                          fullWidth 
                          className="h-16 text-lg font-black uppercase italic"
                          onClick={handleAnchor}
                          loading={isAnchoring}
                          disabled={!isReady}
                        >
                          {!activeAccount 
                            ? "CONNECT WALLET" 
                            : !signTransactions 
                              ? "INITIALIZING WALLET..." 
                              : "CERTIFY AUDIT ON-CHAIN"
                          }
                        </Button>
                      </div>
                    )}
                </Card>

                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" icon={X} onClick={cancelScan} className="text-text-muted hover:text-white">Abort Audit</Button>
                </div>
              </motion.div>
            )}

            {scanResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-24"
              >
                <Card className={`border-2 ${scanResult.risk_score >= 60 ? 'border-red-500/50 bg-red-950/10' : 'border-green-500/50 bg-green-950/10'} text-center p-12 space-y-6 shadow-2xl`}>
                  <div className="flex justify-center">
                     {scanResult.risk_score >= 60 ? <AlertTriangle size={64} className="text-red-500" /> : <Shield size={64} className="text-green-500" />}
                  </div>
                  <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">
                    {scanResult.risk_score >= 60 ? "CRITICAL RISK DETECTED" : "COMPLIANCE VERIFIED"}
                  </h2>
                  <p className="text-xl text-text-secondary font-bold max-w-lg mx-auto leading-relaxed">
                    AI-Deep audit complete for <span className="text-white italic">{scanResult.url}</span>. 
                    {scanResult.risk_score >= 60 ? " Multiple privacy violations identified." : " No major legal gaps found across DPDP sections."}
                  </p>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card padding="lg" className="border-white/5">
                      <h3 className="text-xl font-black italic uppercase text-white mb-8 flex items-center gap-3">
                        <Activity className="text-purple-400" size={24} />
                        Compliance Intelligence
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-3">
                           <span className="text-[10px] font-black uppercase text-purple-400 mb-2 block">Data Collected & Evidence</span>
                           <div className="space-y-3">
                             {scanResult.data_collected?.map((item: any, i: number) => (
                               <div key={i} className="space-y-1">
                                 <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-white font-bold">{item.category || item}</span>
                                 {item.excerpt && (
                                   <p className="text-[9px] text-text-muted italic border-l border-slate-700 pl-2 leading-tight">"{item.excerpt}"</p>
                                 )}
                               </div>
                             ))}
                             {(!scanResult.data_collected || scanResult.data_collected.length === 0) && <span className="text-[10px] text-text-muted italic">None identified</span>}
                           </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-3">
                           <span className="text-[10px] font-black uppercase text-red-400 mb-2 block">Third-Party Exposure Proof</span>
                           <div className="space-y-3">
                             {scanResult.data_shared_with?.map((item: any, i: number) => (
                               <div key={i} className="space-y-1">
                                 <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-white font-bold">{item.category || item}</span>
                                 {item.excerpt && (
                                   <p className="text-[9px] text-text-muted italic border-l border-red-900/30 pl-2 leading-tight">"{item.excerpt}"</p>
                                 )}
                               </div>
                             ))}
                             {(!scanResult.data_shared_with || scanResult.data_shared_with.length === 0) && <span className="text-[10px] text-text-muted italic">No external sharing disclosed</span>}
                           </div>
                        </div>
                      </div>

                      {scanResult.flagged_clauses && scanResult.flagged_clauses.length > 0 ? (
                        <div className="space-y-4">
                          <span className="text-[10px] font-black uppercase text-text-muted block mb-4">Critical Risk Flags</span>
                          {scanResult.flagged_clauses.slice(0, 3).map((clause: any, i: number) => (
                            <div key={i} className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3 group hover:border-red-500/30 transition-all">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Compliance Violation</span>
                                </div>
                                <p className="text-sm font-bold text-white leading-relaxed">{clause.message || clause.explanation}</p>
                                {clause.excerpt && (
                                  <p className="text-[9px] text-text-muted italic border-l border-red-900/30 pl-2 leading-tight">"{clause.excerpt}"</p>
                                )}
                                {typeof clause.confidence === 'number' && (
                                  <p className="text-[9px] text-text-muted uppercase tracking-widest">Confidence: {(clause.confidence * 100).toFixed(0)}%</p>
                                )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-text-muted font-black italic uppercase">No primary violations found</div>
                      )}
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-purple-600 border-none p-8 space-y-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                          <Zap size={120} />
                      </div>
                      <h4 className="text-2xl font-black italic uppercase text-white">Institutional Proof</h4>
                      <p className="text-sm font-bold text-purple-100 leading-relaxed">
                        This audit record is ready to be permanently anchored on the Algorand blockchain. Request immutable certification.
                      </p>
                      
                      {scanResult.blockchain?.tx_id ? (
                        <div className="flex flex-col gap-3">
                           <Button size="lg" fullWidth variant="white" icon={CheckCircle2} className="font-black text-green-600 bg-white" disabled>
                              ANCHORED ON-CHAIN
                           </Button>
                           <a 
                             href={`https://testnet.algoexplorer.io/tx/${scanResult.blockchain.tx_id}`} 
                             target="_blank" 
                             className="text-[10px] font-black uppercase text-center text-purple-200 hover:text-white transition-colors flex items-center justify-center gap-2"
                           >
                             View in Ledger <ExternalLink size={10} />
                           </a>
                        </div>
                      ) : (
                        <Button 
                          size="lg" 
                          fullWidth 
                          variant="white" 
                          icon={Shield} 
                          className="font-black text-purple-600 shadow-[0_0_20px_rgba(255,255,255,0.2)] border-2 border-white/20 hover:bg-white" 
                          onClick={handleAnchor} 
                          loading={isAnchoring}
                          disabled={!isReady}
                        >
                          {!activeAccount 
                            ? "CONNECT WALLET" 
                            : !signTransactions 
                              ? "LOGGING INTO BLOCKCHAIN..." 
                              : "SIGN & ANCHOR AUDIT"
                          }
                        </Button>
                      )}
                      
                      {!scanResult.blockchain?.tx_id && (
                        <div className="pt-2 text-center">
                            <span className="text-[10px] font-black uppercase text-purple-200 tracking-widest opacity-80 animate-pulse">
                              SIGNATURE REQUIRED
                            </span>
                        </div>
                      )}
                    </Card>
                    
                    <Card className="border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-text-muted">Compliance Score</span>
                            <span className="text-sm font-black text-white">{Math.max(0, parseInt(scanResult.risk_score || 0))}%</span>
                        </div>
                        <ProgressBar value={Math.max(0, parseInt(scanResult.risk_score || 0))} color={scanResult.risk_score < 50 ? 'red' : 'green'} size="md" />
                    </Card>

                    <Card className="border-white/5">
                      <div className="text-[10px] font-black uppercase text-text-muted mb-4">Proof Resources</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] text-text-muted uppercase tracking-widest">Source URL</div>
                          <a
                            href={scanResult.policy_url || scanResult.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-purple-300 hover:text-white transition-colors break-all"
                          >
                            {scanResult.policy_url || scanResult.url}
                          </a>
                        </div>
                        {scanResult.policy_cid && (
                          <div>
                            <div className="text-[10px] text-text-muted uppercase tracking-widest">Policy Snapshot (IPFS)</div>
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${scanResult.policy_cid}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-purple-300 hover:text-white transition-colors break-all"
                            >
                              {scanResult.policy_cid}
                            </a>
                          </div>
                        )}
                        {scanResult.audit_cid && (
                          <div>
                            <div className="text-[10px] text-text-muted uppercase tracking-widest">Audit Report (IPFS)</div>
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${scanResult.audit_cid}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-purple-300 hover:text-white transition-colors break-all"
                            >
                              {scanResult.audit_cid}
                            </a>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-bg-surface/90 backdrop-blur-3xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-40">
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Digital Audit Validated</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => navigate('/scan')}>New Session</Button>
                    <Button size="sm" variant="purple" icon={FileBadge} onClick={() => navigate('/history')}>
                      View Ledger
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageWrapper>
    </AppLayout>
  );
};
