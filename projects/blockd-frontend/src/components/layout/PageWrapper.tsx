import React, { useEffect } from 'react';

export type PageWrapperProps = {
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
};

export const PageWrapper: React.FC<PageWrapperProps> = ({ title, children, maxWidth = '1200px' }) => {
  useEffect(() => {
    document.title = `${title} — BLOCKD`;
  }, [title]);

  return (
    <div className="w-full min-h-screen py-8 px-4 md:px-8" style={{ maxWidth, margin: '0 auto' }}>
      {children}
    </div>
  );
};
