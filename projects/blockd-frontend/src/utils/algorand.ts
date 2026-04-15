import algosdk from 'algosdk';

export const ALGORAND_NODE = import.meta.env.VITE_ALGORAND_NODE || 'https://testnet-api.algonode.cloud';
export const ALGORAND_INDEXER = 'https://testnet-idx.algonode.cloud';
export const EXPLORER_BASE = 'https://lora.algokit.io/testnet';

export const getExplorerTxUrl = (txid: string): string =>
  `${EXPLORER_BASE}/transaction/${txid}`;

export const getExplorerAssetUrl = (assetId: number): string =>
  `${EXPLORER_BASE}/asset/${assetId}`;

export const getExplorerAddressUrl = (address: string): string =>
  `${EXPLORER_BASE}/address/${address}`;

export const decodeUnsignedTxn = (base64Txn: string): algosdk.Transaction => {
  const bytes = new Uint8Array(Buffer.from(base64Txn, 'base64'));
  return algosdk.decodeUnsignedTransaction(bytes);
};

export const encodeSignedTxn = (signedTxn: Uint8Array): string => {
  return Buffer.from(signedTxn).toString('base64');
};

export const isValidAlgorandAddress = (address: string): boolean => {
  try {
    algosdk.decodeAddress(address);
    return true;
  } catch {
    return false;
  }
};
