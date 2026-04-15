import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { useAlgorand } from '../../hooks/useAlgorand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type VerifyResult = {
  txid: string;
  policy_cid: string;
  audit_cid: string;
  policy_hash: string;
  audit_hash: string;
  calculated_policy: string;
  calculated_audit: string;
  verified: boolean;
  version?: string;
  report: Record<string, unknown> | null;
};

const dpdpMap: Record<string, string> = {
  consent: 'Section 6 (Consent)',
  minimisation: 'Section 5 (Data Minimisation)',
  protection: "Section 9 (Children's Data)",
  obligations: 'Section 8 (Obligations)',
  transparency: 'Section 4 (Transparency)',
  complaints: 'Section 10 (Grievance Redressal)'
};

export const VerifyTx = () => {
  const { txid } = useParams<{ txid: string }>();
  const { getExplorerTxUrl } = useAlgorand();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!txid) return;
    const fetchVerify = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/algorand/verify/tx/${txid}`);
        setResult(res.data);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    };
    fetchVerify();
  }, [txid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!result || !txid) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center space-y-4">
        <AlertTriangle size={64} className="text-red-400" />
        <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
        <p className="text-text-secondary">We could not verify this transaction.</p>
        <Link to="/">
          <Button variant="ghost">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <PageWrapper title="Verification">
      <div className="min-h-screen bg-bg-base text-text-primary py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-3">
              {result.verified ? (
                <CheckCircle2 size={22} className="text-green-400" />
              ) : (
                <AlertTriangle size={22} className="text-red-400" />
              )}
              <h1 className="text-2xl font-bold">
                {result.verified ? 'Verified Proof' : 'Tamper Detected'}
              </h1>
            </div>
            <p className="text-text-secondary text-sm">
              This page verifies on-chain hashes against IPFS policy and audit snapshots.
            </p>
            <div className="text-xs text-text-muted font-bold uppercase tracking-[0.2em]">
              ✔ All findings backed by extracted policy text
            </div>
            <div className="text-xs text-text-muted font-bold uppercase tracking-[0.2em]">
              ✔ Proof anchored on Algorand
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Transaction ID</div>
                <div className="text-sm font-mono text-text-primary break-all">{result.txid}</div>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton value={result.txid} label="TXID" />
                <a
                  href={getExplorerTxUrl(result.txid)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 hover:bg-white/5 rounded-lg border border-border text-text-muted hover:text-white transition-all"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Policy Snapshot CID</div>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${result.policy_cid}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-mono text-purple-300 hover:text-white transition-colors break-all"
              >
                {result.policy_cid}
              </a>
            </div>
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Audit Report CID</div>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${result.audit_cid}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-mono text-purple-300 hover:text-white transition-colors break-all"
              >
                {result.audit_cid}
              </a>
            </div>
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Policy Hash (On-chain)</div>
              <div className="text-sm font-mono text-text-secondary break-all">{result.policy_hash}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Audit Hash (On-chain)</div>
              <div className="text-sm font-mono text-text-secondary break-all">{result.audit_hash}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Policy Hash (Calculated)</div>
              <div className="text-sm font-mono text-text-secondary break-all">{result.calculated_policy}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Audit Hash (Calculated)</div>
              <div className="text-sm font-mono text-text-secondary break-all">{result.calculated_audit}</div>
            </div>
            <div className="pt-2">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Tamper Detection</div>
              <div className="text-sm text-text-secondary mt-2">
                Policy Hash: {result.calculated_policy === result.policy_hash ? '✅ Verified' : '❌ Different'}
                <br />
                Audit Hash: {result.calculated_audit === result.audit_hash ? '✅ Verified' : '❌ Different'}
              </div>
              {!result.verified && (
                <div className="mt-3 text-red-400 text-sm font-bold">
                  ⚠️ This policy was modified after audit
                </div>
              )}
            </div>
            {Array.isArray((result.report as any)?.flagged_clauses) && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Evidence snippets</div>
                {(result.report as any).flagged_clauses.map((clause: any, idx: number) => (
                  <div key={idx} className="bg-bg-elevated border border-border rounded-xl p-4">
                    <div className="text-sm font-bold text-red-400">❌ {clause.message}</div>
                    <div className="mt-2 text-xs text-text-muted uppercase tracking-widest">Evidence</div>
                    <div className="text-sm text-text-secondary italic">“{clause.excerpt}”</div>
                    {clause.section_title && (
                      <div className="mt-2 text-[10px] text-text-muted uppercase tracking-widest">
                        Section: <span className="text-text-secondary">{clause.section_title}</span>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-text-muted uppercase tracking-widest">Why it matters</div>
                    <div className="text-sm text-text-secondary">{clause.explanation}</div>
                    <div className="mt-3 text-xs text-text-muted uppercase tracking-widest">Source</div>
                    <div className="text-sm text-text-secondary space-y-1">
                      {clause.source_url && (
                        <div>
                          <a
                            href={clause.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-300 hover:text-white transition-colors"
                          >
                            Policy Source Link
                          </a>
                        </div>
                      )}
                      {Array.isArray(clause.dpdp_sections) && clause.dpdp_sections.length > 0 ? (
                        clause.dpdp_sections.map((section: string, i: number) => (
                          <div key={i}>
                            {clause.section_links?.[section] ? (
                              <a
                                href={clause.section_links[section]}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-300 hover:text-white transition-colors"
                              >
                                {section}
                              </a>
                            ) : (
                              section
                            )}
                          </div>
                        ))
                      ) : (
                        <span>DPDP {dpdpMap[clause.dpdp_section] || 'Section (General Compliance)'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};
