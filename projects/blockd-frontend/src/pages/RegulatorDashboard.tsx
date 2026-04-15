import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Users, 
  Globe, 
  Search,
  ArrowUpRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const RegulatorDashboard: React.FC = () => {
  // Fetch global stats from the new stateless regulator endpoint
  const { data: stats, isLoading } = useQuery({
    queryKey: ['regulator-global-stats'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/regulator/global-stats`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  return (
    <div className="min-h-screen bg-[#0A0914] pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-violet-400 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Authority Portal</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white">Regulator Data Hub</h1>
            <p className="text-slate-400 mt-2">Real-time global compliance monitoring powered by Algorand.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search URL / Wallet..." 
                className="bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 min-w-[280px]"
              />
            </div>
            <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20">
              <Globe className="w-4 h-4" />
              Global View
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Audited Sites', value: stats?.total_websites_shielded || '...', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
            { label: 'Certified Pass', value: stats?.total_certified_pass || '...', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Avg Risk Index', value: stats?.average_market_risk ? `${stats.average_market_risk}%` : '...', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { label: 'Market Status', value: stats?.status || '...', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-400/10' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Intelligence Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visualization */}
          <div className="lg:col-span-2 p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px]" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Compliance Trajectory
              </h3>
              <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-lg border border-white/5">
                {['1H', '1D', '1W'].map(t => (
                  <button key={t} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${t === '1D' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
              <div className="text-center">
                <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-500 text-sm font-medium">Visualizing indexer trends...</p>
              </div>
            </div>
          </div>

          {/* Expert Vouching Feed */}
          <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              Expert Verifiers
            </h3>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500" />
                  </div>
                  <div className="flex-1 border-b border-white/5 pb-4 group-hover:border-violet-500/30 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">Expert_7a49...</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase">Vouched</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">Verified Audit for finance.app</p>
                    <div className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-widest">2 Min Ago</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              View All Experts
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatorDashboard;
