import { useState, useCallback } from 'react';
import axios from 'axios';
import type { ScanJob, ScanResult } from '../types';
import { useAuth } from './useAuth';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useScan = () => {
  const { user } = useAuth();
  const walletAddress = user?.wallet_address || null;
  const [scanJob, setScanJob] = useState<ScanJob | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async (url: string, isSimple: boolean = false): Promise<string> => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    const headers = getAuthHeaders(walletAddress);

    try {
      const res = await axios.post(`${API_URL}/api/scan`, { url, is_simple: isSimple }, { headers });
      const job: ScanJob = res.data;
      setScanJob(job);
      return job.id;
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Scan limit reached. Please upgrade your plan for more audits.');
      } else if (err.response?.status === 401) {
        setError('Wallet not recognized. Please reconnect your wallet.');
      } else {
        setError('Failed to start scan. Please try again later.');
      }
      setIsScanning(false);
      throw err;
    }
  }, [walletAddress]);

  const loadScan = useCallback(async (scanId: string): Promise<ScanResult | null> => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    
    const headers = getAuthHeaders(walletAddress);

    try {
      const jobRes = await axios.get(`${API_URL}/api/scan/status/${scanId}`, { headers });
      const job: ScanJob = jobRes.data;
      setScanJob(job);

      if (job.status === 'complete') {
        // In the new unified API, the result is in the job object itself
        const result: ScanResult = jobRes.data as any;
        setScanResult(result);
        setIsScanning(false);
        return result;
      }

      if (job.status === 'failed') {
        setError('Scan failed. Please try again.');
        setIsScanning(false);
        return null;
      }

      return null;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load scan');
      setIsScanning(false);
      throw err;
    }
  }, [walletAddress]);

  const pollScan = useCallback(async (scanId: string): Promise<ScanJob | null> => {
    const headers = getAuthHeaders(walletAddress);
    
    try {
      const res = await axios.get(`${API_URL}/api/scan/status/${scanId}`, { headers });
      const job: ScanJob = res.data;
      
      console.log(`BLOCKD: [SENTRY] Polling status for ${scanId}:`, job.status);
      if (job.metadata) {
        console.log("BLOCKD: [SENTRY] Metadata received in heartbeat! Ready to anchor.");
      } else if (job.status === 'complete') {
        console.warn("BLOCKD: [SENTRY] CRITICAL: Job is complete but metadata is NULL in heartbeat.");
      }

      setScanJob(job);
      
      if (job.status === 'complete') {
        setScanResult(job as any);
        setIsScanning(false);
      }
      return job;
    } catch (err) {
      console.error("Polling error", err);
    }
    return null;
  }, []);

  const cancelScan = useCallback(() => {
    setIsScanning(false);
    setScanJob(null);
  }, []);

  return { scanJob, scanResult, isScanning, error, startScan, pollScan, loadScan, cancelScan };
};
