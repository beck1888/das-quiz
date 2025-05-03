import React from 'react';

interface InfoBoxProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function InfoBox({ title, children, className = '' }: InfoBoxProps) {
  return (
    <div className={`card p-4 rounded border border-white/20 bg-white/5 backdrop-blur-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)] ${className}`}>
      <h3 className="font-medium text-sm text-gray-300 mb-2">{title}</h3>
      <div className="text-sm text-gray-100">{children}</div>
    </div>
  );
}