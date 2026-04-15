import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, Database, Globe, ArrowRight, Zap } from 'lucide-react';

interface BlockchainHandshakeProps {
  status: 'idle' | 'scanning' | 'anchoring' | 'verified';
  url?: string;
}

const BlockchainHandshake: React.FC<BlockchainHandshakeProps> = ({ status, url }) => {
  return (
    <div className="relative p-8 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-between mb-12">
          {/* Source: Website */}
          <motion.div 
            animate={status === 'scanning' ? { y: [0, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`flex flex-col items-center gap-3 ${status === 'idle' ? 'opacity-40' : 'opacity-100'}`}
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-lg shadow-black/20">
              <Globe className="w-8 h-8 text-cyan-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Source</span>
          </motion.div>

          <div className="flex-1 flex items-center justify-center relative px-4">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent absolute" />
            
            {/* Travelling Particles */}
            <AnimatePresence>
              {status === 'scanning' && (
                <motion.div 
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 100, opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                />
              )}
              {status === 'anchoring' && (
                <motion.div 
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: 100, opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Brain: AI Analyzer */}
          <motion.div 
            animate={status === 'scanning' || status === 'anchoring' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`flex flex-col items-center gap-3 ${status === 'idle' ? 'opacity-40' : 'opacity-100'}`}
          >
            <div className={`w-20 h-20 rounded-full transition-all duration-500 flex items-center justify-center shadow-2xl relative
              ${status === 'verified' ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-violet-600/20 border-violet-500/50'}
              border-2 backdrop-blur-md`}>
              {status === 'verified' ? (
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              ) : (
                <Zap className={`w-10 h-10 ${status === 'scanning' || status === 'anchoring' ? 'text-violet-400' : 'text-slate-500'}`} />
              )}
              
              {/* Analyzer Rings */}
              {status === 'scanning' && (
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-violet-400/30 border-dashed"
                />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">BlockD AI</span>
          </motion.div>

          <div className="flex-1 flex items-center justify-center relative px-4">
             <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent absolute" />
          </div>

          {/* Destination: Algorand */}
          <motion.div 
            className={`flex flex-col items-center gap-3 ${status === 'verified' ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className={`w-16 h-16 rounded-2xl transition-all duration-700 bg-slate-800 border flex items-center justify-center shadow-lg
              ${status === 'verified' ? 'border-violet-500 shadow-violet-500/20' : 'border-white/10'}`}>
              <Database className={`w-8 h-8 ${status === 'verified' ? 'text-violet-400' : 'text-slate-600'}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Immutable Ledger</span>
          </motion.div>
        </div>

        {/* Textual Status */}
        <div className="text-center">
          <AnimatePresence mode="wait">
             <motion.div
               key={status}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-2"
             >
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                  {status === 'idle' && "Ready to Inspect"}
                  {status === 'scanning' && "Scraping Privacy Policy..."}
                  {status === 'anchoring' && "Anchoring Proof to Algorand..."}
                  {status === 'verified' && "Cryptographically Verified"}
                </h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                   {status === 'idle' && "Paste a URL to generate an on-chain compliance proof."}
                   {status === 'scanning' && `Reading legal clauses from ${url || 'the website'}...`}
                   {status === 'anchoring' && "Creating immutable box storage and timestamping audit."}
                   {status === 'verified' && "Double-Proof enabled. Your compliance is now part of the global truth."}
                </p>
             </motion.div>
          </AnimatePresence>
        </div>

        {/* Verification Success Stats */}
        {status === 'verified' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-12"
          >
             <div className="text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Status</div>
                <div className="text-emerald-400 font-mono font-bold text-lg uppercase">Success</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Proof Type</div>
                <div className="text-violet-400 font-mono font-bold text-lg uppercase">ARC-32</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Verifiers</div>
                <div className="text-cyan-400 font-mono font-bold text-lg uppercase">Double</div>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BlockchainHandshake;
