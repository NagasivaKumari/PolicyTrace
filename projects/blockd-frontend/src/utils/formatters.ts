export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatTxId = (txid: string): string => {
  if (!txid || txid.length < 12) return txid;
  return `${txid.slice(0, 6)}...${txid.slice(-6)}`;
};

export const formatAddress = (address: string): string => {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatScore = (score: number): string => {
  return `${Math.round(score)}/100`;
};

export const formatAlgo = (microAlgo: number): string => {
  return (microAlgo / 1_000_000).toFixed(4) + ' ALGO';
};
