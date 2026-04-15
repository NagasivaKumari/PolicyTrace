import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ExternalLink, 
  Download, 
  Share2, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Database,
  ArrowLeft,
  ChevronRight,
  Verified
} from 'lucide-react';
import axios from 'axios';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RiskGauge } from '../../components/charts/RiskGauge';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CopyButton } from '../../components/ui/CopyButton';
import { useAlgorand } from '../../hooks/useAlgorand';
import { useToast } from '../../hooks/useToast';
import type { Certificate } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const PublicCertificate = () => {
  const { txid } = useParams<{ txid: string }>();
  const { getExplorerTxUrl } = useAlgorand();
  const navigate = useNavigate();
  const toast = useToast();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Public link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    if (txid) fetchCertificate(txid);
  }, [txid]);

  const fetchCertificate = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/certificate/${id}`);
      setCert(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center space-y-4">
        <AlertTriangle size={64} className="text-red-400" />
        <h1 className="text-2xl font-bold text-white">Certificate Not Found</h1>
        <p className="text-text-secondary">The requested audit record does not exist on our registry.</p>
        <Link to="/explore">
          <Button variant="ghost">Back to Registry</Button>
        </Link>
      </div>
    );
  }

  return (
    <PageWrapper title={`Compliance Certificate: ${cert.url}`}>
      <div className="min-h-screen bg-bg-base text-text-primary py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Navigation & Status */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/explore" className="flex items-center gap-2 text-text-muted hover:text-white transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm font-bold uppercase tracking-widest">Back to Registry</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <Verified size={16} className="text-green-400" />
              <span className="text-xs font-black text-green-400 uppercase tracking-widest">On-Chain Verified Record</span>
            </div>
          </div>

          {/* Main Certificate Card */}
          <Card padding="none" className="bg-bg-surface relative overflow-hidden border-purple-500/20">
            {/* Watermark Logo (Solid Opacity Only, No Blur) */}
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600/5 rotate-12" size={400} />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Left Column: Visual Score */}
              <div className="lg:col-span-5 p-12 flex flex-col items-center justify-center text-center space-y-8 bg-bg-base/30">
                <RiskGauge score={cert.risk_score} size={280} />
                <div className="space-y-2">
                  <RiskBadge score={cert.risk_score} />
                  <p className="text-2xl font-black text-white tracking-tight pt-4 uppercase">{cert.url.replace(/^https?:\/\//, '')}</p>
                  <p className="text-xs text-text-muted font-bold tracking-widest uppercase">Target Audit Domain</p>
                </div>
              </div>

              {/* Right Column: Audit Details */}
              <div className="lg:col-span-7 p-12 space-y-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-600/20">
                       <Shield size={20} />
                     </div>
                     <div>
                       <h2 className="text-2xl font-bold text-white leading-tight">DPDP Act Compliance Proof</h2>
                       <p className="text-sm text-text-secondary">Verified against Digital Personal Data Protection Act 2023</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-xl bg-bg-base border border-border">
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Audit Score</p>
                       <p className="text-2xl font-bold text-white">{Math.round(cert.risk_score)}<span className="text-text-muted text-sm ml-1">/100</span></p>
                     </div>
                     <div className="p-4 rounded-xl bg-bg-base border border-border">
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Violations</p>
                       <p className="text-2xl font-bold text-red-500">{cert.total_violations}</p>
                     </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">On-Chain Metadata</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-base border border-border">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Algorand TXID</p>
                        <p className="text-xs font-mono text-purple-400 truncate max-w-[200px]">{cert.txid}</p>
                      </div>
                      <div className="flex gap-2">
                        <CopyButton value={cert.txid} label="TXID" />
                        <a href={getExplorerTxUrl(cert.txid)} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/5 rounded-lg border border-border text-text-muted hover:text-white transition-all">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-base border border-border">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Metadata Hash (IPFS CID)</p>
                        <p className="text-xs font-mono text-text-secondary truncate max-w-[200px]">{cert.ipfs_cid}</p>
                      </div>
                      <a href={`https://gateway.pinata.cloud/ipfs/${cert.ipfs_cid}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/5 rounded-lg border border-border text-text-muted hover:text-white transition-all">
                         <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Audit Conducted By</p>
                    <p className="text-sm font-bold text-white">BLOCKD Privacy Engine V1.0</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Confirmation Date</p>
                    <p className="text-sm font-bold text-white">{new Date(cert.confirmed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 print:hidden">
            <Button size="lg" icon={Download} variant="secondary" onClick={handleExportPDF}>Export PDF Certificate</Button>
            <Button size="lg" icon={Share2} variant="secondary" onClick={handleShare}>Share Public Link</Button>
            <Button size="lg" icon={Globe} onClick={() => window.open(`https://${cert.url.replace(/^https?:\/\//, '')}`, '_blank')}>Visit Audited Site</Button>
          </div>

          {/* Policy Breakdown Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-2">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="text-amber-400" size={18} />
                Key Compliance Risks
              </h3>
              <div className="space-y-4">
                {cert.flagged_clauses?.slice(0, 3).map((clause, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-bg-base border border-border border-l-4 border-l-red-500/30">
                    <p className="text-xs font-bold text-text-muted uppercase mb-2">Issue #{idx + 1}: {clause.dpdp_section.replace('_', ' ')}</p>
                    <p className="text-sm text-text-secondary italic mb-2">"{clause.excerpt.substring(0, 100)}..."</p>
                    <p className="text-xs text-text-muted leading-relaxed">{clause.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-bold mb-6">Section Scores</h3>
              <div className="space-y-6">
                 {cert.section_scores?.map((section) => (
                   <div key={section.section} className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
                       <span>{section.label}</span>
                       <span className={section.score > 80 ? 'text-green-400' : 'text-amber-400'}>{section.score}/100</span>
                     </div>
                     <ProgressBar value={section.score} color={section.score > 80 ? 'green' : 'amber'} size="sm" />
                   </div>
                 ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
