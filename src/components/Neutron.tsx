
import React from 'react';
import { cn } from '@/lib/utils';

interface NeutronProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  isAnimating?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const Neutron = ({
  size = 'md',
  onClick,
  className,
  isAnimating = false,
}: NeutronProps) => {
  return (
    <div
      className={cn(
        'neutron',
        sizeClasses[size],
        isAnimating ? 'animate-shoot' : '',
        className
      )}
      onClick={onClick}
    />
  );
};

export default Neutron;
