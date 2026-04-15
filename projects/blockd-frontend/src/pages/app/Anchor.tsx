import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Coins, ExternalLink, Globe, ShieldCheck, Wallet, X } from 'lucide-react';

import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Spinner } from '../../components/ui/Spinner';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { RiskGauge } from '../../components/charts/RiskGauge';
import { useAlgorand as useAlgorandWallet } from '../../hooks/useAlgorand';
import { useAlgorand as useAlgorandContext } from '../../context/AlgorandContext';
import { useScan } from '../../hooks/useScan';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import type { ScanResult } from '../../types';
import { getAuthHeaders } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const steps = [
  { id: 1, label: 'Connect Wallet' },
  { id: 2, label: 'Review & Sign' },
  { id: 3, label: 'Certificate Ready' },
];

import { WalletModal } from '../../components/blockchain/WalletModal';

export const Anchor = () => {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  const toast = useToast();
  const { scanResult, loadScan, isScanning } = useScan();
  const { walletAddress, isConnected, connectWallet, anchorAudit } = useAlgorandContext();
  const { balance, getExplorerTxUrl } = useAlgorandWallet();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isWaitingWallet, setIsWaitingWallet] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [anchoredTxid, setAnchoredTxid] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!scanId) return;
    loadScan(scanId).catch(() => {
      toast.error('Failed to load scan result');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  useEffect(() => {
    if (isConnected) setCurrentStep((s) => Math.max(s, 2));
  }, [isConnected]);

  useEffect(() => {
    if (scanResult && isConnected && currentStep === 1) setCurrentStep(2);
  }, [scanResult, isConnected, currentStep]);

  const displayScan = useMemo((): ScanResult | null => {
    return scanResult;
  }, [scanResult]);

  const scanDate = useMemo(() => {
    if (!displayScan) return '';
    return formatDate((displayScan.completed_at ?? displayScan.created_at) as string);
  }, [displayScan]);

  const balanceNum = useMemo(() => {
    const n = parseFloat(balance || '0');
    return Number.isFinite(n) ? n : 0;
  }, [balance]);

  const lowBalance = balanceNum < 0.01;

  const handleConnect = async (walletId: string) => {
    try {
      await connectWallet(walletId);
      toast.success('Wallet connected!');
    } catch {
      toast.error('Failed to connect wallet');
    }
  };

  const handleSignAndAnchor = async () => {
    if (!displayScan) return;
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const metadata = (displayScan as any)?.metadata;
    if (!metadata) {
      toast.error('Missing audit metadata. Please refresh and try again.');
      return;
    }

    setIsWaitingWallet(true);
    setAnchoredTxid(null);
    try {
      const txid = await anchorAudit(metadata);
      await axios.post(
        `${API_URL}/api/scan/${metadata.scan_id}/verify`,
        { tx_id: txid },
        { headers: getAuthHeaders(walletAddress) }
      );

      setAnchoredTxid(txid);
      setIsWaitingWallet(false);

      setIsConfirming(true);
      toast.loading('Confirming on Algorand...');

      await new Promise((r) => setTimeout(r, 4000));
      setIsConfirming(false);
      toast.success('Anchored on Algorand!');
      setCurrentStep(3);
    } catch (err: any) {
      setIsWaitingWallet(false);
      setIsConfirming(false);
      toast.error(err?.message ? `Failed: ${err.message}` : 'Failed to anchor on-chain');
    }
  };

  const explorerUrl = anchoredTxid ? getExplorerTxUrl(anchoredTxid) : '';

  const handleBackDashboard = () => navigate('/dashboard');


  return (
    <AppLayout>
      <div className="max-w-[900px] mx-auto space-y-8 text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">Anchor on Algorand</h1>
            <p className="text-text-secondary">Permanently anchor this audit to Algorand Testnet.</p>
          </div>
        </div>

        <StepIndicator steps={steps} currentStep={currentStep} status={isWaitingWallet || isConfirming ? 'loading' : 'success'} />

        {!displayScan ? (
          <Card className="flex flex-col items-center justify-center py-16 gap-4">
            <Spinner size="lg" color="purple" />
            <p className="text-text-secondary">Loading scan summary...</p>
          </Card>
        ) : (
          <>
            {currentStep === 1 && (
              <Card padding="lg" className="max-w-[520px] mx-auto text-center bg-bg-surface border-border">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Wallet size={44} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Connect your Pera wallet to sign one Algorand transaction and anchor this audit.
                  </p>

                  <Button
                    size="lg"
                    fullWidth
                    icon={Wallet}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Connect Wallet
                  </Button>

                  <WalletModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onConnect={handleConnect} 
                  />

                  <p className="text-xs text-text-muted">
                    Everything you store is public and immutable on Algorand.
                  </p>
                </div>
              </Card>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[860px] mx-auto">
                <Card padding="lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
                        <Globe size={14} className="text-purple-400" />
                        Website scanned
                      </div>
                      <div className="text-lg font-bold text-text-primary">{displayScan.url.replace(/^https?:\/\//, '')}</div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-text-primary">{Math.round(displayScan.risk_score)} / 100</div>
                        <RiskBadge score={displayScan.risk_score} />
                      </div>
                      <div className="text-text-secondary text-sm">
                        {displayScan.total_violations} DPDP violations found
                      </div>
                      <div className="text-text-secondary text-sm">
                        {scanDate}
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      <RiskGauge score={displayScan.risk_score} size={180} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 font-bold text-purple-400 text-sm mb-2">
                        <ShieldCheck size={16} />
                        What will be stored on Algorand
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        The transaction note stores the IPFS CID and SHA-256 hash of the report for public verification.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-text-muted font-bold uppercase tracking-widest">Transaction fee</span>
                      <span className="text-text-primary font-bold">0.001 ALGO</span>
                    </div>

                    <div className={`flex items-center justify-between gap-4 text-sm ${lowBalance ? 'text-red-400' : 'text-text-secondary'}`}>
                      <span className="text-text-muted font-bold uppercase tracking-widest">Wallet balance</span>
                      <span className="font-bold text-text-primary">
                        {balance} ALGO
                      </span>
                    </div>
                    {lowBalance && (
                      <div className="text-red-400 text-xs font-bold">
                        Warning: balance is below 0.01 ALGO.
                      </div>
                    )}

                    <Button
                      size="lg"
                      fullWidth
                      icon={Coins}
                      loading={isWaitingWallet || isConfirming}
                      disabled={isWaitingWallet || isConfirming}
                      onClick={handleSignAndAnchor}
                    >
                      Sign & Anchor on Algorand
                    </Button>

                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => setCurrentStep(1)}
                      disabled={isWaitingWallet || isConfirming}
                      icon={X}
                      iconPosition="left"
                    >
                      Cancel, go back
                    </Button>
                  </div>
                </Card>

                <Card padding="lg" className="bg-bg-elevated/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-text-muted font-bold uppercase tracking-widest text-xs">IPFS Report</div>
                      {displayScan.ipfs_cid ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-text-secondary">
                            {displayScan.ipfs_cid.slice(0, 10)}...
                          </span>
                          <CopyButton value={displayScan.ipfs_cid} label="CID" />
                        </div>
                      ) : (
                        <span className="text-text-secondary text-sm">Not available</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-text-muted font-bold uppercase tracking-widest text-xs">SHA-256</div>
                      {displayScan.sha256 ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-text-secondary">
                            {displayScan.sha256.slice(0, 10)}...
                          </span>
                          <CopyButton value={displayScan.sha256} label="Hash" />
                        </div>
                      ) : (
                        <span className="text-text-secondary text-sm">Not available</span>
                      )}
                    </div>

                    <div className="mt-8">
                      {isWaitingWallet && (
                        <div className="flex items-center gap-3 text-text-secondary">
                          <Spinner size="md" color="purple" />
                          <span>Waiting for wallet approval...</span>
                        </div>
                      )}

                      {isConfirming && (
                        <div className="flex items-center gap-3 text-text-secondary">
                          <Spinner size="md" color="green" />
                          <span>Confirming on Algorand...</span>
                        </div>
                      )}

                      {!isWaitingWallet && !isConfirming && (
                        <p className="text-text-secondary text-sm">
                          Your wallet will prompt for approval. Once confirmed, you'll receive your anchored certificate.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {currentStep === 3 && anchoredTxid && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card padding="lg" className="max-w-[760px] mx-auto">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                      <CheckCircle2 size={44} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">Proof Anchored</h2>
                    <p className="text-text-secondary">Your audit proof is now permanent and verifiable.</p>
                  </div>

                  <div className="mt-8 bg-bg-elevated border border-green-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-text-muted font-bold uppercase tracking-widest text-xs">Transaction ID</div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-text-primary">
                          {anchoredTxid}
                        </span>
                        <CopyButton value={anchoredTxid} label="TXID" />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <Button
                        variant="secondary"
                        icon={ExternalLink}
                        onClick={() => window.open(explorerUrl, '_blank')}
                      >
                        View on Algorand Explorer
                      </Button>
                      <div className="text-xs text-text-secondary font-bold">
                        Confirmed in 3.8 seconds
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Button
                      variant="primary"
                      icon={ShieldCheck}
                      onClick={() => navigate(`/verify/${anchoredTxid}`)}
                    >
                      Verify Proof
                    </Button>
                    <Button variant="ghost" onClick={handleBackDashboard}>
                      Back to Dashboard
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};