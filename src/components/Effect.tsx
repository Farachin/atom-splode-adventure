
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface EffectProps {
  type: 'explosion' | 'neutron-release' | 'energy-release';
  x: number;
  y: number;
  onComplete?: () => void;
  className?: string;
}

export const Effect = ({ type, x, y, onComplete, className }: EffectProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, type === 'explosion' ? 800 : 500);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  if (!isVisible) return null;

  const renderEffect = () => {
    switch (type) {
      case 'explosion':
        return (
          <div 
            className={cn(
              'absolute rounded-full bg-gradient-to-r from-yellow-300 to-orange-500 animate-explosion',
              className
            )}
            style={{ 
              left: x - 25, 
              top: y - 25, 
              width: '50px', 
              height: '50px',
            }}
          />
        );
      case 'neutron-release':
        return (
          <div 
            className={cn(
              'absolute bg-atom-neutron rounded-full animate-pulse-grow',
              className
            )}
            style={{ 
              left: x - 4, 
              top: y - 4, 
              width: '8px', 
              height: '8px',
            }}
          />
        );
      case 'energy-release':
        return (
          <div 
            className={cn(
              'absolute bg-atom-energy rounded-full animate-pulse-grow',
              className
            )}
            style={{ 
              left: x - 6, 
              top: y - 6, 
              width: '12px', 
              height: '12px',
            }}
          />
        );
      default:
        return null;
    }
  };

  return renderEffect();
};

export default Effect;
