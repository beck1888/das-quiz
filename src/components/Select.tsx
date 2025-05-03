'use client';
import { useState, useRef, useEffect } from 'react';

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  className?: string;
}

export default function Select({ value, onChange, options, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(option => option.value === value)?.label;

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-black border border-white/30 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary hover:border-white/50 transition-colors flex items-center justify-between"
      >
        <span>{selectedLabel}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-black border border-white/30 rounded-lg text-sm text-white max-h-60 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] shadow-lg" 
          style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="[&::-webkit-scrollbar]:hidden">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => {
                  onChange(String(option.value));
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
