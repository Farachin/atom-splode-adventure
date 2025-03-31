
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface AtomProps {
  element: 'uranium235' | 'uranium238' | 'plutonium239' | 'thorium232';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

interface ElementProperties {
  name: string;
  symbol: string;
  color: string;
  protons: number;
  neutrons: number;
  canFission: boolean;
}

const elementData: Record<AtomProps['element'], ElementProperties> = {
  uranium235: {
    name: 'Uran-235',
    symbol: 'U-235',
    color: 'bg-atom-uranium235',
    protons: 92,
    neutrons: 143,
    canFission: true,
  },
  uranium238: {
    name: 'Uran-238',
    symbol: 'U-238',
    color: 'bg-atom-uranium238',
    protons: 92,
    neutrons: 146,
    canFission: false,
  },
  plutonium239: {
    name: 'Plutonium-239',
    symbol: 'Pu-239',
    color: 'bg-atom-plutonium239',
    protons: 94,
    neutrons: 145,
    canFission: true,
  },
  thorium232: {
    name: 'Thorium-232',
    symbol: 'Th-232',
    color: 'bg-atom-thorium232',
    protons: 90,
    neutrons: 142,
    canFission: false,
  },
};

const sizeClasses = {
  sm: {
    atom: 'w-24 h-24',
    nucleus: 'w-16 h-16',
    shell: 'w-24 h-24',
  },
  md: {
    atom: 'w-32 h-32',
    nucleus: 'w-20 h-20',
    shell: 'w-32 h-32',
  },
  lg: {
    atom: 'w-40 h-40',
    nucleus: 'w-24 h-24',
    shell: 'w-40 h-40',
  },
};

export const Atom = ({
  element,
  size = 'md',
  onClick,
  isActive = false,
  className,
}: AtomProps) => {
  const elementInfo = elementData[element];
  const { atom: atomSize, nucleus: nucleusSize, shell: shellSize } = sizeClasses[size];
  
  return (
    <div 
      className={cn(
        'atom group cursor-pointer transition-all duration-300 hover:scale-105',
        isActive ? 'ring-4 ring-yellow-400 ring-opacity-70' : '',
        atomSize,
        className
      )}
      onClick={onClick}
    >
      <div className="electron-shell animate-spin-slow">
        <div className={cn(shellSize, "electron-shell")}></div>
      </div>
      
      <div className={cn(
        'nucleus transition-all duration-300',
        elementInfo.color,
        nucleusSize,
        isActive ? 'animate-pulse-grow' : ''
      )}>
        <span className="text-white font-bold">{elementInfo.symbol}</span>
      </div>
      
      <div className="absolute -bottom-8 text-center w-full text-sm font-medium">
        {elementInfo.name}
      </div>
    </div>
  );
};

export default Atom;
