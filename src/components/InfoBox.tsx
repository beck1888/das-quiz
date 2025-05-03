import React from 'react';

interface InfoBoxProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function InfoBox({ title, children, className = '' }: InfoBoxProps) {
  return (
    <div className={`p-4 rounded-lg border border-white/30 bg-black/90 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${className}`}>
      <h3 className="font-medium text-sm text-blue-300 mb-3 uppercase tracking-wide">{title}</h3>
      <div className="text-sm text-gray-100 leading-relaxed">{children}</div>
    </div>
  );
}