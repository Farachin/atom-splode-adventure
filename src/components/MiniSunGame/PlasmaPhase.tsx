
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Effect from '../Effect';

interface PlasmaPhaseProps {
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  className?: string;
}

const PlasmaPhase: React.FC<PlasmaPhaseProps> = ({
  temperature,
  onTemperatureChange,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    angle: number;
    energy: number;
  }>>([]);
  const [effects, setEffects] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: 'laser' | 'heat';
  }>>([]);
  const [lastLaser, setLastLaser] = useState(0);
  const [magnetActive, setMagnetActive] = useState(false);
  const nextIdRef = useRef(1);
  
  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const newParticles = [];
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: nextIdRef.current++,
        x: Math.random() * width,
        y: Math.random() * height,
        size: 3 + Math.random() * 4,
        speed: 10 + Math.random() * 20,
        angle: Math.random() * Math.PI * 2,
        energy: 20 + Math.random() * 30
      });
    }
    
    setParticles(newParticles);
  }, []);

  // Update particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          // Update position
          let newX = particle.x + Math.cos(particle.angle) * particle.speed * 0.02;
          let newY = particle.y + Math.sin(particle.angle) * particle.speed * 0.02;
          
          // Bounce off walls
          if (newX < 0 || newX > width) {
            particle.angle = Math.PI - particle.angle;
            newX = Math.max(0, Math.min(width, newX));
          }
          if (newY < 0 || newY > height) {
            particle.angle = -particle.angle;
            newY = Math.max(0, Math.min(height, newY));
          }
          
          // Random angle changes for natural movement
          if (Math.random() < 0.05) {
            particle.angle += (Math.random() - 0.5) * 0.5;
          }
          
          // Particles move faster as temperature increases
          const speedFactor = 1 + (temperature / 10000000);
          let newSpeed = particle.speed * speedFactor;
          
          // Magnetic confinement effect
          if (magnetActive && temperature > 100000) {
            // Pull particles toward center when magnet is active
            const centerX = width / 2;
            const centerY = height / 2;
            const dx = centerX - newX;
            const dy = centerY - newY;
            const distToCenter = Math.sqrt(dx * dx + dy * dy);
            const pullStrength = 0.01;
            
            particle.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.2;
            newSpeed = Math.min(newSpeed, 30);
          }
          
          return {
            ...particle,
            x: newX,
            y: newY,
            speed: newSpeed,
            angle: particle.angle,
            // Size and energy increase with temperature
            size: 3 + (temperature / 10000000) * 5,
            energy: Math.min(100, particle.energy + (temperature / 50000000))
          };
        });
      });
      
      // Remove old effects
      setEffects(prev => prev.filter(effect => Date.now() - effect.id < 500));
      
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [temperature, magnetActive]);

  // Handle container click - add heat effect
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add heat effect
    setEffects(prev => [...prev, {
      id: Date.now(),
      x,
      y,
      type: 'heat'
    }]);
    
    // Increase temperature
    onTemperatureChange(temperature + 500000);
  };
  
  // Fire laser
  const handleFireLaser = () => {
    if (!containerRef.current || Date.now() - lastLaser < 300) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    // Random position for laser
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    // Add laser effect
    setEffects(prev => [...prev, {
      id: Date.now(),
      x,
      y,
      type: 'laser'
    }]);
    
    // Increase temperature significantly
    onTemperatureChange(temperature + 2000000);
    setLastLaser(Date.now());
  };
  
  // Toggle magnetic confinement
  const handleToggleMagnet = () => {
    setMagnetActive(!magnetActive);
    
    // Magnetic confinement helps control the particles and increases temperature slightly
    if (!magnetActive) {
      onTemperatureChange(temperature + 500000);
    }
  };

  // Get color based on temperature
  const getParticleColor = (energy: number, temp: number) => {
    if (temp >= 100000000) {
      return `rgba(255, 255, 255, ${Math.min(1, energy / 100)})`;
    } else if (temp >= 10000000) {
      return `rgba(255, ${100 + (155 * energy / 100)}, 100, ${Math.min(1, energy / 100)})`;
    } else if (temp >= 1000000) {
      return `rgba(255, 100, ${100 + (155 * energy / 100)}, ${Math.min(1, energy / 100)})`;
    } else if (temp >= 100000) {
      return `rgba(150, 120, 255, ${Math.min(1, energy / 100)})`;
    } else {
      return `rgba(100, 150, 255, ${Math.min(1, energy / 100)})`;
    }
  };

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      {/* Magnetic field visualization */}
      {magnetActive && (
        <div className="absolute inset-0 border-8 border-blue-500 opacity-20 rounded-full" 
             style={{ 
               top: '10%', 
               left: '10%', 
               right: '10%', 
               bottom: '10%',
               borderRadius: '50%',
               borderStyle: 'dashed'
             }}
        />
      )}
      
      {/* Particle visualization */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            background: getParticleColor(particle.energy, temperature),
            boxShadow: temperature > 1000000 
              ? `0 0 ${Math.min(20, (temperature / 10000000) * 10)}px ${getParticleColor(particle.energy, temperature)}` 
              : 'none',
            transition: 'background-color 0.3s ease',
            zIndex: 5
          }}
        />
      ))}
      
      {/* Effects (laser, heating) */}
      {effects.map(effect => (
        effect.type === 'laser' ? (
          <Effect
            key={effect.id}
            type="energy-release"
            x={effect.x}
            y={effect.y}
            className="z-20"
          />
        ) : (
          <div
            key={effect.id}
            className="absolute rounded-full bg-orange-500 animate-pulse-grow z-10"
            style={{
              left: effect.x - 10,
              top: effect.y - 10,
              width: 20,
              height: 20,
              opacity: 0.7
            }}
          />
        )
      ))}
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex space-x-2 z-30">
        <Button 
          onClick={handleFireLaser}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 flex-1"
        >
          Laser
        </Button>
        
        <Button 
          onClick={handleToggleMagnet}
          size="sm"
          variant={magnetActive ? "default" : "outline"} 
          className={cn(
            "flex-1",
            magnetActive ? "bg-orange-500 hover:bg-orange-600" : ""
          )}
        >
          Magnetfeld {magnetActive ? 'An' : 'Aus'}
        </Button>
      </div>
    </div>
  );
};

export default PlasmaPhase;
