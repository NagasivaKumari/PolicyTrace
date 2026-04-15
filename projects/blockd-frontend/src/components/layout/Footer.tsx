import React from 'react';
import { Shield, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlgorand } from '../../context/AlgorandContext';

const TWITTER_URL = import.meta.env.VITE_TWITTER_URL || '';
const GITHUB_URL = import.meta.env.VITE_GITHUB_URL || '';
const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL || '';
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';
const SUPPORT_EMAIL_HREF = SUPPORT_EMAIL
  ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(SUPPORT_EMAIL)}`
  : '';

export const Footer = () => {
  const { isConnected, walletAddress } = useAlgorand();

  return (
    <footer className="bg-bg-base border-t border-border py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <Shield className="text-purple-400" size={28} />
            <span className="text-2xl font-bold tracking-tight text-white">BLOCKD</span>
          </Link>
          <p className="text-text-muted max-w-sm mb-8">
            Exposing what apps really do with your data — using AI pattern detection and
            immutable proof on the Algorand blockchain. Your privacy, verified forever.
          </p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 text-xs">
            <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-500'}`} />
            <span className="text-text-secondary">
              {isConnected && walletAddress ? `Wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Wallet not connected'}
            </span>
          </div>
          <div className="flex gap-4">
            {TWITTER_URL ? (
              <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-purple-400 transition-colors">
                <Twitter size={20} />
              </a>
            ) : (
              <span className="text-text-muted/30 cursor-not-allowed"><Twitter size={20} /></span>
            )}
            {GITHUB_URL ? (
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-purple-400 transition-colors">
                <Github size={20} />
              </a>
            ) : (
              <span className="text-text-muted/30 cursor-not-allowed"><Github size={20} /></span>
            )}
            {LINKEDIN_URL ? (
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-purple-400 transition-colors">
                <Linkedin size={20} />
              </a>
            ) : (
              <span className="text-text-muted/30 cursor-not-allowed"><Linkedin size={20} /></span>
            )}
            {SUPPORT_EMAIL_HREF ? (
              <a
                href={SUPPORT_EMAIL_HREF}
                className="text-text-muted hover:text-purple-400 transition-colors"
                aria-label="Email support"
              >
                <Mail size={20} />
              </a>
            ) : (
              <span className="text-text-muted/30 cursor-not-allowed" aria-label="Email support">
                <Mail size={20} />
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-text-muted mb-6">Platform</h4>
          <ul className="space-y-4">
            <li><Link to="/scan" className="text-text-secondary hover:text-purple-400 transition-colors">Analyze a Website</Link></li>
            <li><Link to="/dashboard" className="text-text-secondary hover:text-purple-400 transition-colors">Audit Dashboard</Link></li>
            <li><Link to="/history" className="text-text-secondary hover:text-purple-400 transition-colors">Immutable History</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-text-muted mb-6">Info</h4>
          <ul className="space-y-4">
            <li>
              <a
                href="https://algorand.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-purple-400 transition-colors"
              >
                Built on Algorand
              </a>
            </li>
            <li>
              <a
                href="https://digitalindia.gov.in/dpdp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-purple-400 transition-colors"
              >
                DPDP Act 2023
              </a>
            </li>
            <li><Link to="/register" className="text-text-secondary hover:text-purple-400 transition-colors">Sign Up Free</Link></li>
            <li><Link to="/login" className="text-text-secondary hover:text-purple-400 transition-colors">Sign In</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-border mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted">
        <p>© {new Date().getFullYear()} BLOCKD. All rights reserved. AI-powered privacy intelligence.</p>
        <div className="flex items-center gap-2">
          <span>Anchored on</span>
          <div className="w-5 h-5 rounded-full border border-purple-400/50 flex items-center justify-center text-[10px] font-bold text-purple-400">A</div>
          <span className="font-bold text-text-secondary">ALGORAND</span>
        </div>
      </div>
    </footer>
  );
};
