import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-bg-elevated rounded w-1/4" />
      <div className="space-y-2">
        <div className="h-8 bg-bg-elevated rounded w-full" />
        <div className="h-4 bg-bg-elevated rounded w-2/3" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 5 }) => {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          {[...Array(columns)].map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 bg-bg-elevated/50 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
