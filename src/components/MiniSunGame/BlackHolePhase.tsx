
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import Effect from '../Effect';

interface BlackHolePhaseProps {
  blackHoleSize: number;
  blackHoleGravity: number;
  setBlackHoleSize: (size: number) => void;
  setBlackHoleGravity: (gravity: number) => void;
  className?: string;
}

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  orbitRadius: number;
  orbitAngle: number;
  inAccretionDisk: boolean;
};

const BlackHolePhase: React.FC<BlackHolePhaseProps> = ({
  blackHoleSize,
  blackHoleGravity,
  setBlackHoleSize,
  setBlackHoleGravity,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [accretionDiskRotation, setAccretionDiskRotation] = useState(0);
  const [hawkingParticles, setHawkingParticles] = useState<{ id: number; x: number; y: number; size: number; angle: number; distance: number; }[]>([]);
  const [addedMass, setAddedMass] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);
  
  const nextIdRef = useRef(1);
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    const newParticles: Particle[] = [];
    
    // Create initial matter particles around the black hole
    for (let i = 0; i < 80; i++) {
      const orbitRadius = blackHoleSize * 3 + Math.random() * (width / 3);
      const orbitAngle = Math.random() * Math.PI * 2;
      const x = centerX + Math.cos(orbitAngle) * orbitRadius;
      const y = centerY + Math.sin(orbitAngle) * orbitRadius;
      
      newParticles.push({
        id: nextIdRef.current++,
        x,
        y,
        size: 2 + Math.random() * 3,
        color: getRandomStarColor(),
        speed: 0.5 + Math.random() * 2,
        angle: Math.random() * Math.PI * 2,
        orbitRadius,
        orbitAngle,
        inAccretionDisk: orbitRadius < blackHoleSize * 4
      });
    }
    
    setParticles(newParticles);
    
    // Auto-close explanation after 15 seconds
    const timer = setTimeout(() => {
      setShowExplanation(false);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [blackHoleSize]);
  
  // Animation loop for black hole and particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    
    const updateParticles = () => {
      // Rotate accretion disk
      setAccretionDiskRotation(prev => prev + 0.005);
      
      // Update particle positions
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          // Calculate distance to black hole center
          const dx = particle.x - centerX;
          const dy = particle.y - centerY;
          const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
          
          // Gravitational effect based on distance
          const gravitationalPull = Math.min(5, (blackHoleGravity / 20) * (blackHoleSize / distanceToCenter));
          
          if (distanceToCenter < blackHoleSize + 1) {
            // Particle is consumed by black hole - replace with a new one
            const newOrbitRadius = blackHoleSize * 3 + Math.random() * (width / 3);
            const newOrbitAngle = Math.random() * Math.PI * 2;
            
            // Slowly increase black hole size when matter is consumed
            if (Math.random() < 0.05) {
              setBlackHoleSize(blackHoleSize + 0.01);
              setAddedMass(prev => prev + 0.1);
            }
            
            return {
              ...particle,
              x: centerX + Math.cos(newOrbitAngle) * newOrbitRadius,
              y: centerY + Math.sin(newOrbitAngle) * newOrbitRadius,
              orbitRadius: newOrbitRadius,
              orbitAngle: newOrbitAngle,
              inAccretionDisk: false
            };
          } else if (distanceToCenter < blackHoleSize * 4) {
            // Particle is in the accretion disk - orbital motion
            let orbitSpeed = 0.02 + (0.1 / distanceToCenter) * blackHoleSize;
            let newOrbitAngle = particle.orbitAngle + orbitSpeed;
            
            // Make orbit slightly elliptical
            const orbitalVariation = particle.inAccretionDisk ? 
              0.1 * Math.sin(newOrbitAngle * 2) : 0;
            
            const newRadius = distanceToCenter * (1 + orbitalVariation) - gravitationalPull;
            
            return {
              ...particle,
              x: centerX + Math.cos(newOrbitAngle) * newRadius,
              y: centerY + Math.sin(newOrbitAngle) * newRadius,
              orbitAngle: newOrbitAngle,
              orbitRadius: newRadius,
              inAccretionDisk: true
            };
          } else {
            // Particle is far from black hole - slow spiral inward
            const angleToCenter = Math.atan2(dy, dx);
            const newDistance = distanceToCenter - gravitationalPull;
            
            return {
              ...particle,
              x: centerX + Math.cos(angleToCenter) * newDistance,
              y: centerY + Math.sin(angleToCenter) * newDistance,
              orbitRadius: newDistance,
              inAccretionDisk: false
            };
          }
        });
      });
      
      // Randomly generate Hawking radiation particles
      if (Math.random() < 0.05) {
        const angle = Math.random() * Math.PI * 2;
        const distance = blackHoleSize;
        
        setHawkingParticles(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            size: 1 + Math.random() * 1.5,
            angle,
            distance
          }
        ]);
      }
      
      // Update Hawking radiation particles
      setHawkingParticles(prev => 
        prev
          .map(particle => {
            const newDistance = particle.distance + 1.5;
            return {
              ...particle,
              x: centerX + Math.cos(particle.angle) * newDistance,
              y: centerY + Math.sin(particle.angle) * newDistance,
              distance: newDistance
            };
          })
          .filter(particle => 
            particle.x >= 0 && 
            particle.x <= width && 
            particle.y >= 0 && 
            particle.y <= height
          )
      );
      
      animationFrameRef.current = requestAnimationFrame(updateParticles);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateParticles);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [blackHoleSize, blackHoleGravity, setBlackHoleSize]);
  
  // Handle user interaction - adding matter
  const handleAddMatter = () => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Add a burst of new particles
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = width / 3;
      
      newParticles.push({
        id: nextIdRef.current++,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        size: 2 + Math.random() * 4,
        color: getRandomStarColor(),
        speed: 1 + Math.random() * 3,
        angle: Math.random() * Math.PI * 2,
        orbitRadius: distance,
        orbitAngle: angle,
        inAccretionDisk: false
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Helper function to get random star-like colors
  const getRandomStarColor = () => {
    const colors = [
      'rgba(255, 255, 220, 0.9)', // Yellow-white
      'rgba(220, 220, 255, 0.9)', // Blue-white
      'rgba(255, 200, 180, 0.9)', // Orange
      'rgba(255, 180, 180, 0.9)', // Red
      'rgba(200, 200, 255, 0.9)', // Blue
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div 
      className={cn("relative w-full h-full bg-black overflow-hidden", className)}
      ref={containerRef}
    >
      {/* Stars background */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(20, 20, 40, 0.3) 0%, rgba(0, 0, 0, 0) 70%)'
        }}
      />
      
      {/* Event horizon visualization */}
      <div
        className="absolute rounded-full z-20"
        style={{
          left: '50%',
          top: '50%',
          width: blackHoleSize * 2,
          height: blackHoleSize * 2,
          transform: 'translate(-50%, -50%)',
          background: 'rgb(0, 0, 0)',
          boxShadow: `0 0 ${blackHoleSize * 0.5}px rgba(90, 50, 160, 0.3), 
                    0 0 ${blackHoleSize}px rgba(30, 20, 40, 0.8)`
        }}
      />
      
      {/* Gravitational lensing effect */}
      <div
        className="absolute rounded-full z-10"
        style={{
          left: '50%',
          top: '50%',
          width: blackHoleSize * 6,
          height: blackHoleSize * 6,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(30, 10, 60, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(4px)'
        }}
      />
      
      {/* Accretion disk */}
      <div
        className="absolute rounded-full z-15"
        style={{
          left: '50%',
          top: '50%',
          width: blackHoleSize * 8,
          height: blackHoleSize * 2,
          transform: `translate(-50%, -50%) rotate(${accretionDiskRotation}rad)`,
          background: 'linear-gradient(90deg, rgba(255, 100, 50, 0.8) 0%, rgba(255, 200, 100, 0.8) 20%, rgba(200, 100, 255, 0.8) 40%, rgba(100, 100, 255, 0.8) 60%, rgba(50, 50, 150, 0.5) 80%, transparent 100%)',
          filter: 'blur(3px)',
          opacity: 0.7,
          borderRadius: '100%'
        }}
      />
      
      {/* Matter particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full z-20"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            opacity: particle.inAccretionDisk ? 0.9 : 0.7
          }}
        />
      ))}
      
      {/* Hawking radiation particles */}
      {hawkingParticles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full z-20"
          style={{
            left: particle.x - particle.size/2,
            top: particle.y - particle.size/2,
            width: particle.size,
            height: particle.size,
            backgroundColor: 'rgba(180, 100, 255, 0.8)',
            boxShadow: '0 0 3px rgba(200, 150, 255, 0.8)',
            opacity: Math.max(0.1, 1 - particle.distance / 300)
          }}
        />
      ))}
      
      {/* Educational overlay */}
      {showExplanation && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-black bg-opacity-80 rounded-lg text-white max-w-xs z-50 text-sm border border-purple-700"
        >
          <h4 className="text-center font-bold mb-2 text-purple-400">Schwarzes Loch!</h4>
          <p className="mb-2">
            Dein Stern ist so schwer geworden, dass er unter seiner eigenen Schwerkraft kollabiert ist.
          </p>
          <p className="mb-2">
            Jetzt ist die Schwerkraft so stark, dass nicht einmal Licht entkommen kann!
          </p>
          <button 
            className="w-full mt-2 px-2 py-1 bg-purple-900 hover:bg-purple-800 rounded text-xs"
            onClick={() => setShowExplanation(false)}
          >
            Verstanden
          </button>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 space-y-3 z-40">
        <Button 
          onClick={handleAddMatter}
          className="w-full bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white flex items-center justify-center"
        >
          Materie hinzufügen
        </Button>
        
        <div className="p-2 bg-black bg-opacity-50 rounded text-white text-xs">
          <div className="flex justify-between mb-1">
            <span>Schwarzes Loch Masse: {(addedMass + blackHoleSize * 10).toFixed(1)} M☉</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Hawking-Strahlung aktiv</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackHolePhase;
