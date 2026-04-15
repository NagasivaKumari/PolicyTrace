import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ExternalLink } from 'lucide-react';

interface TrustSealProps {
  url?: string;
  variant?: 'floating' | 'inline' | 'compact';
  riskScore?: number;
  anchored?: boolean;
}

const TrustSeal: React.FC<TrustSealProps> = ({ 
  url, 
  variant = 'compact', 
  riskScore = 0, 
  anchored = true 
}) => {
  const isHighRisk = riskScore >= 60;
  const isMedRisk = riskScore >= 30 && riskScore < 60;
  const colorClass = isHighRisk ? 'text-red-400' : isMedRisk ? 'text-amber-400' : 'text-emerald-400';
  const bgClass = isHighRisk ? 'bg-red-500/10 border-red-500/30' : isMedRisk ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30';

  if (variant === 'floating') {
    return (
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 right-6 z-[9999] group"
      >
        <div className={`p-4 rounded-2xl backdrop-blur-xl border-2 flex items-center gap-4 shadow-2xl transition-all duration-300 hover:scale-105 ${bgClass}`}>
          <div className="relative">
             <Shield className={`w-8 h-8 ${colorClass}`} />
             {anchored && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-slate-900" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified by BlockD</span>
            <span className={`text-sm font-black uppercase ${colorClass}`}>
               {isHighRisk ? 'High Risk' : isMedRisk ? 'Moderate' : 'Shielded'}
            </span>
          </div>
          <a 
            href={`https://testnet.algoexplorer.io/address/BLOCKD_AUDIT_APP_ID`} 
            target="_blank" 
            rel="noreferrer"
            className="ml-2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="w-4 h-4 text-white" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 ${bgClass}`}>
      <ShieldCheck className={`w-5 h-5 ${colorClass}`} />
      <div className="flex flex-col">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Blockchain Verified</span>
        <span className={`text-xs font-black uppercase leading-none ${colorClass}`}>BlockD Shielded</span>
      </div>
    </div>
  );
};

export default TrustSeal;
