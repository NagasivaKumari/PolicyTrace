import React from 'react';
import { Link2, ShieldCheck, Box } from 'lucide-react';
import { getExplorerTxUrl, getExplorerAssetUrl } from '../../utils/algorand';
import { formatTxId } from '../../utils/formatters';
import { Tooltip } from '../ui/Tooltip';

interface AlgorandBadgeProps {
  txid?: string;
  assetId?: number;
  type?: 'tx' | 'asset' | 'app';
}

export const AlgorandBadge: React.FC<AlgorandBadgeProps> = ({ txid, assetId, type = 'tx' }) => {
  const url = txid ? getExplorerTxUrl(txid) : assetId ? getExplorerAssetUrl(assetId) : '#';
  const label = txid ? formatTxId(txid) : assetId ? `#${assetId}` : 'On-chain';
  const Icon = type === 'asset' ? ShieldCheck : type === 'app' ? Box : Link2;
  const tooltipContent = txid ? 'View transaction on AlgoExplorer' : assetId ? 'View asset on AlgoExplorer' : 'Verified on-chain';

  return (
    <Tooltip content={tooltipContent}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-600/20 text-xs font-semibold transition-all group"
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
        <Link2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      </a>
    </Tooltip>
  );
};
