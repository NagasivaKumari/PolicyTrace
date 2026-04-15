// src/types/index.ts
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  name?: string;           // legacy alias kept for compat
  plan: string;
  scan_limit: number;
  scans_this_month: number;
  wallet_address?: string;
  is_verified: boolean;
  created_at: string;
  createdAt?: string;      // legacy alias
}

export interface ScanJob {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'analyzing' | 'scoring' | 'complete' | 'failed' | 'scanning';
  status_message?: string;
  current_step?: number;
  metadata?: {
    scan_id: string;
    owner: string;
    url_hash: string;
    policy_url?: string;
    risk_score: number;
    ipfs_cid: string;
    ipfs_hash?: string;
    policy_cid?: string;
    policy_hash?: string;
    audit_cid?: string;
    audit_hash?: string;
    scanner_version?: string;
    version?: number;
    receiver: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface FlaggedClause {
  dpdp_section: string;
  excerpt?: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'warning';
  explanation?: string;
  recommendation?: string;
  message?: string;
  confidence?: number;
  dpdp_sections?: string[];
  section_links?: Record<string, string>;
  source_url?: string;
  section_title?: string;
}

export interface ViolationItem {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  impact: number;
  evidence: string;
  section: string;
  explanation: string;
  dpdp_sections?: string[];
  section_links?: Record<string, string>;
  source_url?: string;
  section_title?: string;
}

export interface DPDPSection {
  id: number;
  title: string;
  description: string;
}

export interface ScanResult {
  id: string;
  url: string;
  policy_url?: string;
  status: 'pending' | 'scraping' | 'analyzing' | 'scoring' | 'complete' | 'failed';
  current_step?: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  version?: number;
  risk_delta?: number;
  total_violations: number;
  flagged_clauses: FlaggedClause[];
  section_scores: any[];
  violations?: Array<string | ViolationItem>;
  data_collected?: any[];
  data_shared_with?: any[];
  user_rights?: string[];
  policy_text?: string;
  anchored: boolean;
  anchored_txid?: string;
  ipfs_cid?: string;
  ipfs_hash?: string;
  policy_cid?: string;
  policy_hash?: string;
  audit_cid?: string;
  audit_hash?: string;
  scanner_version?: string;
  sha256?: string;
  is_public?: boolean;
  created_at: string;
  completed_at?: string;
}

export interface Certificate {
  id: string;
  scan_id: string;
  risk_score: number;
  url: string;
  total_violations: number;
  txid: string;
  ipfs_cid: string;
  confirmed_at: string;
  flagged_clauses: FlaggedClause[];
  section_scores: any[];
  sha256: string;
}

export interface AlgorandTx {
  txId: string;
  block: number;
  timestamp: string;
  note: any;
}
