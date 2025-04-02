
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface EffectProps {
  type: 'explosion' | 'neutron-release' | 'energy-release' | 'split-product' | 'beta-decay' | 'neutron-absorption' | 'dna-damage';
  x: number;
  y: number;
  onComplete?: () => void;
  className?: string;
  productType?: string;
  targetPosition?: {
    x: number;
    y: number;
  };
  damageLevel?: 'minor' | 'severe' | 'mutation';
}

export const Effect = ({ type, x, y, onComplete, className, productType, targetPosition, damageLevel }: EffectProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, type === 'explosion' ? 800 : 
       type === 'beta-decay' ? 1000 : 
       type === 'dna-damage' ? 1500 : 500);

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
      case 'strontium': return 'bg-red-500';
      case 'selenium': return 'bg-orange-500';
      case 'germanium': return 'bg-pink-500';
      case 'tellurium': return 'bg-cyan-500';
      case 'yttrium': return 'bg-indigo-500';
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
      case 'strontium': return 'Sr';
      case 'selenium': return 'Se';
      case 'germanium': return 'Ge';
      case 'tellurium': return 'Te';
      case 'yttrium': return 'Y';
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
              zIndex: 30
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
              zIndex: 30
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
              zIndex: 30
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
              zIndex: 30
            }}
          >
            {getProductLabel(productType)}
          </div>
        );
      case 'beta-decay':
        return (
          <div 
            className={cn(
              'absolute bg-blue-500 rounded-full animate-shoot',
              className
            )}
            style={{ 
              left: x - 3, 
              top: y - 3, 
              width: '6px', 
              height: '6px',
              zIndex: 30,
              transformOrigin: 'center',
              transform: targetPosition 
                ? `translate(0, 0)`
                : 'translate(0, 0)',
              animation: targetPosition 
                ? `shoot 1s ease-out forwards`
                : 'pulse 1s infinite'
            }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold text-white">e-</div>
          </div>
        );
      case 'neutron-absorption':
        return (
          <div 
            className={cn(
              'absolute rounded-full bg-gradient-to-r from-yellow-300 to-orange-500 animate-pulse',
              className
            )}
            style={{ 
              left: x - 15, 
              top: y - 15, 
              width: '30px', 
              height: '30px',
              zIndex: 30,
              opacity: 0.7
            }}
          />
        );
      case 'dna-damage':
        const damageColor = damageLevel === 'minor' ? 'from-red-300 to-red-500' : 
                           damageLevel === 'severe' ? 'from-red-500 to-red-700' : 
                           'from-purple-400 to-purple-600';
        const animationClass = damageLevel === 'mutation' ? 'animate-pulse' : 'animate-fade-out';
        
        return (
          <div 
            className={cn(
              `absolute rounded-full bg-gradient-to-r ${damageColor} ${animationClass}`,
              className
            )}
            style={{ 
              left: x - 10, 
              top: y - 10, 
              width: '20px', 
              height: '20px',
              zIndex: 30,
              boxShadow: '0 0 8px rgba(255, 50, 50, 0.8)'
            }}
          >
            {damageLevel === 'mutation' && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-[10px] font-bold">
                M
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return renderEffect();
};

export default Effect;
