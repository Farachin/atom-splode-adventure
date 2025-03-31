
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface EffectProps {
  type: 'explosion' | 'neutron-release' | 'energy-release' | 'split-product';
  x: number;
  y: number;
  onComplete?: () => void;
  className?: string;
  productType?: string;
}

export const Effect = ({ type, x, y, onComplete, className, productType }: EffectProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, type === 'explosion' ? 800 : 500);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  if (!isVisible) return null;

  const getProductColor = (productType?: string) => {
    if (!productType) return 'bg-gray-500';
    switch(productType) {
      case 'barium': return 'bg-green-500';
      case 'krypton': return 'bg-blue-500';
      case 'xenon': return 'bg-purple-500';
      case 'zirconium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getProductLabel = (productType?: string) => {
    if (!productType) return '?';
    switch(productType) {
      case 'barium': return 'Ba';
      case 'krypton': return 'Kr';
      case 'xenon': return 'Xe';
      case 'zirconium': return 'Zr';
      default: return '?';
    }
  };

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
      case 'split-product':
        return (
          <div 
            className={cn(
              `absolute rounded-full flex items-center justify-center text-white font-bold animate-scale-in ${getProductColor(productType)}`,
              className
            )}
            style={{ 
              left: x - 20, 
              top: y - 20, 
              width: '40px', 
              height: '40px',
            }}
          >
            {getProductLabel(productType)}
          </div>
        );
      default:
        return null;
    }
  };

  return renderEffect();
};

export default Effect;
