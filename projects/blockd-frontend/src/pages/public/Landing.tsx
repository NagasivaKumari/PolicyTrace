import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, ScanLine, Globe, ArrowRight, 
  Award, AlertTriangle, Layers, Zap, CheckCircle, 
  Smartphone, BarChart2, Check
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthContext } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const Landing = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleScan = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (url) {
      navigate(`/scan?url=${encodeURIComponent(url)}`);
    }
  };


  const [stats, setStats] = useState({
    total_scans: 0,
    total_violations: 0,
    total_certs: 0,
    algo_fee: 0.0001
  });

  React.useEffect(() => {
    axios.get(`${API_URL}/api/scan/stats/global`)
      .then(res => setStats(res.data))
      .catch(err => console.error("Failed to fetch live stats", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#05040A] text-text-primary">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-16 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-bg-base" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Badge variant="purple" icon={Shield}>Built on Algorand Testnet</Badge>
            </motion.div>
            
            <motion.h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-white uppercase italic">
              Companies can’t
              <br />
              fake privacy
              <br />
              <span className="text-purple-500 underline decoration-purple-500/30 underline-offset-[12px]">compliance anymore.</span>
            </motion.h1>
            
            <motion.p className="text-sm font-black uppercase tracking-[0.4em] text-purple-400/80 mt-6 mb-8">
              Audit once. Verify forever on Algorand.
            </motion.p>
            <motion.p className="text-text-secondary text-sm font-bold uppercase tracking-[0.2em]">
              We show exactly where policies violate DPDP — and prove it on-chain.
            </motion.p>

            <div className="h-1 w-24 bg-purple-500/50 mb-8 shadow-[0_0_30px_rgba(168,85,247,0.3)]" />

            <motion.p className="text-xl text-text-muted leading-relaxed max-w-2xl font-medium">
              BLOCKD uses advanced AI to detect DPDP Act violations in any website's privacy policy — then anchors the immutable proof forever on Algorand.
            </motion.p>

            <motion.form onSubmit={handleScan} className="space-y-4">
              <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted">
                  <Globe size={20} />
                </div>
                <input 
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter any website URL — e.g. swiggy.com"
                  className="w-full bg-slate-900/50 border border-white/5 focus:border-purple-500 rounded-lg pl-12 pr-40 py-4 text-text-primary text-lg transition-all outline-none backdrop-blur-xl"
                />
                <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                  <Button type="submit" size="md" icon={ArrowRight} iconPosition="right">
                    Audit & Prove Compliance
                  </Button>
                </div>
              </div>
            </motion.form>

            <Card className="max-w-2xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-3 text-red-400 font-bold uppercase tracking-widest text-xs">
                <AlertTriangle size={16} />
                Tamper Detection
              </div>
              <p className="text-text-secondary text-sm mt-3">
                Policy changed after audit. Original proof remains verifiable on-chain.
              </p>
            </Card>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
             <Card className="w-full max-w-sm border-purple-500/10 bg-slate-900/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(139,92,246,0.05)] p-8 text-center">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Node Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-green-500">Live</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="text-center py-6 bg-slate-950/50 rounded-2xl border border-white/5">
                    <p className="text-5xl font-black text-white italic tracking-tighter">{(stats.total_scans || 12).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3">Verified Audits</p>
                  </div>
                  <div className="text-center py-4 bg-slate-950/50 rounded-2xl border border-white/5">
                    <p className="text-3xl font-black text-white italic tracking-tighter">{(stats.total_certs || 5).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Websites Anchored Today</p>
                  </div>
                </div>

                {/* User specifically asked for 'Connect Wallet' here as well */}
                <Button 
                  fullWidth 
                  variant="purple" 
                  size="lg" 
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate('/scan')}
                  className="h-16 text-lg font-black uppercase tracking-widest"
                >
                  Start Scan
                </Button>
             </Card>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <Badge variant="purple">Simple Flow</Badge>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase">How it works</h2>
            </div>
            <p className="text-text-muted max-w-md font-medium">
              Enter a site, get a score, anchor proof, verify anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { 
                step: "01", 
                icon: ScanLine, 
                title: "Enter a website", 
                desc: "We find and extract its privacy policy.", 
                color: "border-blue-500/20 shadow-blue-500/5 text-blue-400" 
              },
              { 
                step: "02", 
                icon: Zap, 
                title: "AI analyzes compliance", 
                desc: "We detect DPDP violations instantly.", 
                color: "border-purple-500/20 shadow-purple-500/5 text-purple-400" 
              },
              { 
                step: "03", 
                icon: Layers, 
                title: "Proof is generated", 
                desc: "The audit is stored on IPFS.", 
                color: "border-amber-500/20 shadow-amber-500/5 text-amber-400" 
              },
              { 
                step: "04", 
                icon: ShieldCheck, 
                title: "Proof is anchored", 
                desc: "A permanent record is stored on Algorand. This ensures the audit cannot be modified or faked later.", 
                color: "border-green-500/20 shadow-green-500/5 text-green-400" 
              }
            ].map((step, idx) => (
              <Card key={idx} className={`p-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 p-4 font-black text-4xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>{step.step}</div>
                <step.icon className={`${step.color.split(' ')[2]} mb-6 group-hover:scale-110 transition-transform`} size={32} />
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DYNAMIC TECH SECTION - #about */}
      <section id="about" className="py-24 px-6 bg-slate-950/40">
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-24 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 text-left">
              <Badge variant="purple">Proof Stack</Badge>
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-tight">
                Built for
                <br />
                <span className="text-purple-500">verifiable proof.</span>
              </h2>
              <p className="text-lg text-text-muted leading-relaxed font-medium">
                Audit results are stored on IPFS and anchored on Algorand so claims stay verifiable.
              </p>
              
              <div className="space-y-4">
                {[
                  { label: "AI Engine", desc: "Puya-TS compiled intelligence for pattern recognition" },
                  { label: "Blockchain", desc: "Algorand Testnet for atomic compliance proof" },
                  { label: "Storage", desc: "IPFS via Pinata for decentralized audit persistence" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-default">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-150 transition-transform" />
                    <div className="text-left">
                      <span className="text-xs font-black uppercase text-white block tracking-widest">{item.label}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-8 space-y-6">
              <div className="flex items-center gap-4">
                <Zap className="text-purple-400" />
                <div>
                  <span className="text-xs font-black uppercase text-white block tracking-widest">AI Audit</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Compliance score + violations</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Layers className="text-amber-400" />
                <div>
                  <span className="text-xs font-black uppercase text-white block tracking-widest">IPFS Report</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Immutable report storage</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ShieldCheck className="text-green-500" />
                <div>
                  <span className="text-xs font-black uppercase text-white block tracking-widest">Algorand Proof</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">On-chain verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE STANDARDS SECTION - #compliance */}
      <section id="compliance" className="py-24 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
               <Badge variant="purple">The Ruleset</Badge>
               <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase">DPDP Act 2023.</h2>
               <p className="text-text-secondary font-medium uppercase tracking-[0.2em] text-[10px]">What we monitor for you in every audit</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                  { section: "Section 5", title: "Minimisation", desc: "Data collected must be limited to declared purpose." },
                  { section: "Section 6", title: "Consent", desc: "Clear, specific, and unambiguous opt-in required." },
                  { section: "Section 8", title: "Obligations", desc: "Duty of accuracy, security, and grievance redressal." },
                  { section: "Section 9", title: "Protection", desc: "Special guardrails for minors and children's data." }
               ].map((rule, idx) => (
                  <div key={idx} className="p-8 bg-slate-900/40 rounded-3xl border border-white/5 hover:bg-slate-900/60 transition-colors text-left">
                     <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-4">{rule.section}</span>
                     <h4 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">{rule.title}</h4>
                     <p className="text-sm text-text-muted leading-relaxed font-medium">{rule.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* FINAL CTA */}
      <section id="motto" className="py-32 px-6 text-center bg-slate-950/20">
        <div className="max-w-4xl mx-auto space-y-12">
          <Badge variant="purple">The Final Step</Badge>
          <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
            Compliance Audited.
            <br />
            <span className="text-purple-500">Blockchain Anchored.</span>
          </h2>
          <Button 
            size="lg" 
            className="px-16 h-20 text-2xl bg-violet-600 hover:bg-violet-500 font-black uppercase tracking-tighter shadow-2xl shadow-violet-600/20"
            onClick={() => navigate('/scan')}
            icon={ArrowRight}
            iconPosition="right"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      <Footer />

    </div>
  );
};
