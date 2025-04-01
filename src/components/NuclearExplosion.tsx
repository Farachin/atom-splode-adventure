
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NuclearExplosionProps {
  isActive: boolean;
  yield: number;
  onComplete: () => void;
  className?: string;
}

export const NuclearExplosion = ({ isActive, yield: explosionYield, onComplete, className }: NuclearExplosionProps) => {
  const [phase, setPhase] = useState<'inactive' | 'flash' | 'fireball' | 'mushroom' | 'shockwave' | 'aftermath'>('inactive');
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Effect to handle explosion animation phases
  useEffect(() => {
    if (!isActive) {
      setPhase('inactive');
      setAnimationProgress(0);
      return;
    }
    
    // Initial flash
    setPhase('flash');
    
    // Sequence of explosion phases
    const flashTimer = setTimeout(() => {
      setPhase('fireball');
      
      const fireballTimer = setTimeout(() => {
        setPhase('mushroom');
        
        const mushroomTimer = setTimeout(() => {
          setPhase('shockwave');
          
          const shockwaveTimer = setTimeout(() => {
            setPhase('aftermath');
            
            const aftermathTimer = setTimeout(() => {
              onComplete();
              setPhase('inactive');
            }, 3000);
            
            return () => clearTimeout(aftermathTimer);
          }, 3000);
          
          return () => clearTimeout(shockwaveTimer);
        }, 3000);
        
        return () => clearTimeout(mushroomTimer);
      }, 2000);
      
      return () => clearTimeout(fireballTimer);
    }, 1000);
    
    // Animation progress
    const animationInterval = setInterval(() => {
      setAnimationProgress(prev => {
        if (prev >= 100) {
          clearInterval(animationInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 100);
    
    return () => {
      clearTimeout(flashTimer);
      clearInterval(animationInterval);
    };
  }, [isActive, onComplete]);
  
  // Scale effects based on yield
  const yieldFactor = Math.sqrt(explosionYield / 20); // Square root scaling for visual effect
  
  if (phase === 'inactive') {
    return null;
  }
  
  return (
    <div className={cn(
      'fixed inset-0 z-50 pointer-events-none overflow-hidden',
      className
    )}>
      {/* Initial flash */}
      {phase === 'flash' && (
        <div className="absolute inset-0 bg-white animate-pulse z-50"></div>
      )}
      
      {/* Fireball */}
      {phase === 'fireball' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div 
            className="rounded-full bg-yellow-500 animate-pulse-grow"
            style={{ 
              width: `${100 * yieldFactor}px`, 
              height: `${100 * yieldFactor}px`,
              boxShadow: `0 0 ${50 * yieldFactor}px ${30 * yieldFactor}px rgba(253, 224, 71, 0.8)`,
              transition: 'all 2s ease-out',
              animation: 'explosion 2s ease-out forwards'
            }}
          ></div>
        </div>
      )}
      
      {/* Mushroom cloud */}
      {phase === 'mushroom' && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          {/* Stem */}
          <div 
            className="bg-gray-300 rounded-lg"
            style={{ 
              width: `${30 * yieldFactor}px`, 
              height: `${200 * yieldFactor}px`,
              backgroundColor: 'rgba(209, 213, 219, 0.8)',
              transition: 'height 3s ease-out',
            }}
          ></div>
          
          {/* Cloud top */}
          <div 
            className="rounded-full bg-gray-200 -mt-10 z-10"
            style={{ 
              width: `${150 * yieldFactor}px`, 
              height: `${100 * yieldFactor}px`,
              backgroundColor: 'rgba(229, 231, 235, 0.9)',
              boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.2)',
              transition: 'all 3s ease-out',
            }}
          ></div>
          
          {/* Cloud cap */}
          <div 
            className="rounded-full bg-white -mt-20 z-20"
            style={{ 
              width: `${200 * yieldFactor}px`, 
              height: `${80 * yieldFactor}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: 'inset 0 -5px 15px rgba(0,0,0,0.1)',
              transition: 'all 3s ease-out',
            }}
          ></div>
        </div>
      )}
      
      {/* Shockwave */}
      {phase === 'shockwave' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div 
            className="rounded-full border-2 border-white opacity-70"
            style={{ 
              width: `${animationProgress * 10 * yieldFactor}px`, 
              height: `${animationProgress * 10 * yieldFactor}px`,
              transition: 'all 0.1s linear',
              opacity: Math.max(0, 1 - animationProgress / 100),
            }}
          ></div>
        </div>
      )}
      
      {/* Aftermath glow */}
      {phase === 'aftermath' && (
        <div 
          className="absolute inset-0 bg-orange-100"
          style={{ 
            opacity: Math.max(0, 0.5 - animationProgress / 200),
            transition: 'opacity 3s ease-out',
          }}
        ></div>
      )}
      
      {/* Explosion data */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded">
        <div className="text-sm font-bold">Nukleare Detonation</div>
        <div className="text-xs">Sprengkraft: {explosionYield.toFixed(1)} Kilotonnen</div>
      </div>
    </div>
  );
};

export default NuclearExplosion;
