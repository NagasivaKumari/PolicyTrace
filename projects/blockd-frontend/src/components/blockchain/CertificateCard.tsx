import React from 'react';
import { Shield, Clock, Database, CheckCircle2, QrCode } from 'lucide-react';
import { Card } from '../ui/Card';
import { RiskBadge } from '../ui/RiskBadge';
import { AlgorandBadge } from './AlgorandBadge';
import { formatDate } from '../../utils/formatters';
import type { Certificate } from '../../types';

export const CertificateCard = ({ cert }: { cert: Certificate }) => {
  return (
    <Card className="relative overflow-hidden group border-purple-500/20">
      {/* Decorative Overlay - Solid Only */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-purple-600/10 transition-all" />
      
      <div className="flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white border border-purple-500/30">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight uppercase tracking-tight">Compliance Certificate</h4>
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider">{cert.url.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>
          <QrCode className="text-text-muted opacity-30 group-hover:opacity-50 transition-opacity" size={40} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-text-muted uppercase">Risk Score</p>
            <div className="flex items-center gap-2">
              <RiskBadge score={cert.risk_score} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-text-muted uppercase">Issued Date</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <Clock size={14} className="text-purple-400" />
              {formatDate(cert.confirmed_at)}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <Database size={14} />
              <span>Report Hash (SHA-256)</span>
            </div>
            <span className="text-[11px] font-mono text-text-secondary bg-white/5 px-2 py-0.5 rounded">{cert.sha256.slice(0, 16)}...</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <CheckCircle2 size={14} className="text-green-400" />
              <span>On-chain Integrity verified</span>
            </div>
            <AlgorandBadge txid={cert.txid} />
          </div>
        </div>
      </div>
    </Card>
  );
};
