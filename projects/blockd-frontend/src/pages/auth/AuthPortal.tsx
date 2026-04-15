import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';
import { useAlgorand } from '../../context/AlgorandContext';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * AuthPortal now acts as a silent redirector.
 * In the new 'Pure Web3' model, connection IS authentication.
 */
export const AuthPortal: React.FC = () => {
  const { isConnected } = useAlgorand();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // If we've achieved authentication (which is now automatic on connection), 
    // go straight to the dashboard.
    if (isAuthenticated) {
      console.log("BLOCKD: Access confirmed, redirecting to Dashboard...");
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[#05040A] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-2xl">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
          <Loader2 className="animate-spin" size={16} />
          Securing Access...
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPortal;
