export function getAuthHeaders(walletAddress?: string | null): Record<string, string> {
  const token = localStorage.getItem('blockd_token');
  if (token) return { Authorization: `Bearer ${token}` };
  if (walletAddress) return { 'X-Wallet-Address': walletAddress };
  return {};
}

