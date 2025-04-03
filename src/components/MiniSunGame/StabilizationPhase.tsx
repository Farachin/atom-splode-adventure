import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Effect from '../Effect';

interface StabilizationPhaseProps {
  temperature: number;
  stability: number;
  onTemperatureChange: (temp: number) => void;
  onStabilityChange: (stability: number) => void;
  className?: string;
}

type MagnetType = 'tokamak' | 'stellarator' | 'none';

const StabilizationPhase: React.FC<StabilizationPhaseProps> = ({
  temperature,
  stability,
  onTemperatureChange,
  onStabilityChange,
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
    type: 'escape' | 'containment';
  }>>([]);
  const [magnetType, setMagnetType] = useState<MagnetType>('none');
  const [containmentStrength, setContainmentStrength] = useState(10);
  const [instabilityWarning, setInstabilityWarning] = useState(false);
  const [containmentField, setContainmentField] = useState<{
    pulsing: boolean;
    intensity: number;
    color: string;
  }>({ pulsing: false, intensity: 0, color: 'blue-500' });
  
  const nextIdRef = useRef(1);
  
  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const newParticles = [];
    
    for (let i = 0; i < 70; i++) {
      newParticles.push({
        id: nextIdRef.current++,
        x: width/2 + (Math.random() - 0.5) * width * 0.6,
        y: height/2 + (Math.random() - 0.5) * height * 0.6,
        size: 4 + Math.random() * 4,
        speed: 20 + Math.random() * 30,
        angle: Math.random() * Math.PI * 2,
        energy: 50 + Math.random() * 50
      });
    }
    
    setParticles(newParticles);
  }, []);

  // Update containment field appearance based on stability
  useEffect(() => {
    if (stability < 30) {
      setContainmentField({
        pulsing: true,
        intensity: 0.3 + (stability / 100) * 0.4,
        color: 'red-500'
      });
      setInstabilityWarning(true);
    } else if (stability < 60) {
      setContainmentField({
        pulsing: true,
        intensity: 0.5 + (stability / 100) * 0.3,
        color: 'yellow-500'
      });
      setInstabilityWarning(false);
    } else {
      setContainmentField({
        pulsing: false,
        intensity: 0.7 + (stability / 100) * 0.3,
        color: 'green-500'
      });
      setInstabilityWarning(false);
    }
  }, [stability]);

  // Update particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        // Calculate how many particles are escaping
        const escapingCount = prevParticles.filter(p => {
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          return Math.sqrt(dx*dx + dy*dy) > Math.min(width, height) * 0.45;
        }).length;
        
        // Calculate stability loss based on escaping particles
        if (escapingCount > 0) {
          onStabilityChange(Math.max(0, stability - escapingCount * 0.5));
        }
        
        // If magnet active, increase stability slightly
        if (magnetType !== 'none') {
          onStabilityChange(Math.min(100, stability + 0.5));
          
          // Tokamak is more efficient for stabilizing
          if (magnetType === 'tokamak') {
            onStabilityChange(Math.min(100, stability + 0.3));
          }
          
          // Stellarator is better for heat retention
          if (magnetType === 'stellarator') {
            onTemperatureChange(temperature + 50000);
          }
        } else {
          // Without magnet, stability decreases
          onStabilityChange(Math.max(0, stability - 1));
        }
        
        return prevParticles.map(particle => {
          // Update position
          let newX = particle.x + Math.cos(particle.angle) * particle.speed * 0.025;
          let newY = particle.y + Math.sin(particle.angle) * particle.speed * 0.025;
          
          // Calculate distance from center
          const dx = newX - centerX;
          const dy = newY - centerY;
          const distFromCenter = Math.sqrt(dx*dx + dy*dy);
          
          // Apply containment field effect if magnet is active
          if (magnetType !== 'none') {
            // The containment strength defines how strong the magnetic field pulls particles back
            let pullStrength = 0;
            let angleChange = 0;
            
            if (magnetType === 'tokamak') {
              // Tokamak creates a uniform circular containment
              pullStrength = 0.04 * containmentStrength;
              
              // If particle is too far from center, pull it back
              if (distFromCenter > Math.min(width, height) * 0.4) {
                const pullAngle = Math.atan2(centerY - newY, centerX - newX);
                particle.angle = pullAngle + (Math.random() - 0.5) * 0.2;
              } else {
                // Otherwise make it circle around the center
                const tangentAngle = Math.atan2(dx, -dy);
                particle.angle = tangentAngle + (Math.random() - 0.5) * 0.1;
              }
            } else if (magnetType === 'stellarator') {
              // Stellarator creates a more complex twisted field
              pullStrength = 0.03 * containmentStrength;
              
              // Stellarator has a varying field that creates a twisted path
              const twist = Math.sin(distFromCenter / 20) * Math.PI * 0.3;
              
              if (distFromCenter > Math.min(width, height) * 0.4) {
                const pullAngle = Math.atan2(centerY - newY, centerX - newX) + twist;
                particle.angle = pullAngle + (Math.random() - 0.5) * 0.4;
              } else {
                // More chaotic movement inside
                const tangentAngle = Math.atan2(dx, -dy) + twist;
                particle.angle = tangentAngle + (Math.random() - 0.5) * 0.3;
              }
            }
            
            // Apply some movement constraints for more realistic plasma behavior
            if (distFromCenter > Math.min(width, height) * 0.45) {
              // Add containment effect
              setEffects(prev => [...prev, {
                id: Date.now() + Math.random() * 1000,
                x: newX,
                y: newY,
                type: 'containment'
              }]);
              
              // Pull back to containment field
              const pullFactor = Math.min(1, distFromCenter / (Math.min(width, height) * 0.5));
              newX -= dx * pullFactor * pullStrength;
              newY -= dy * pullFactor * pullStrength;
            }
          } else {
            // Without magnet, particles move more randomly
            if (Math.random() < 0.05) {
              particle.angle += (Math.random() - 0.5) * 1;
            }
            
            // Without containment, particles escape more easily
            if (distFromCenter > Math.min(width, height) * 0.45 && Math.random() < 0.1) {
              // Add escape effect
              setEffects(prev => [...prev, {
                id: Date.now() + Math.random() * 1000,
                x: newX,
                y: newY,
                type: 'escape'
              }]);
            }
          }
          
          // Boundary handling - particles that leave the container are lost
          if (newX < 0 || newX > width || newY < 0 || newY > height) {
            // Reintroduce particle at edge of containment field
            const angle = Math.random() * Math.PI * 2;
            newX = centerX + Math.cos(angle) * Math.min(width, height) * 0.3;
            newY = centerY + Math.sin(angle) * Math.min(width, height) * 0.3;
            particle.angle = Math.random() * Math.PI * 2;
          }
          
          return {
            ...particle,
            x: newX,
            y: newY,
            angle: particle.angle,
            // Size and energy based on temperature
            size: 4 + (temperature / 10000000) * 5,
            energy: Math.min(100, particle.energy + (temperature / 50000000))
          };
        });
      });
      
      // Remove old effects
      setEffects(prev => prev.filter(effect => Date.now() - effect.id < 300));
      
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [temperature, stability, magnetType, containmentStrength, onStabilityChange, onTemperatureChange]);

  // Activate tokamak containment
  const handleTokamak = () => {
    if (magnetType === 'tokamak') {
      setMagnetType('none');
    } else {
      setMagnetType('tokamak');
      onStabilityChange(Math.min(100, stability + 5));
    }
  };
  
  // Activate stellarator containment
  const handleStellarator = () => {
    if (magnetType === 'stellarator') {
      setMagnetType('none');
    } else {
      setMagnetType('stellarator');
      onStabilityChange(Math.min(100, stability + 3));
      onTemperatureChange(temperature + 1000000);
    }
  };
  
  // Increase containment strength
  const handleIncreaseStrength = () => {
    if (magnetType !== 'none') {
      setContainmentStrength(Math.min(20, containmentStrength + 1));
      onStabilityChange(Math.min(100, stability + 2));
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
    >
      {/* Containment field visualization */}
      {magnetType !== 'none' && (
        <>
          {/* Outer containment field */}
          <div 
            className={cn(
              `absolute rounded-full border-4 border-${containmentField.color}`,
              containmentField.pulsing ? "animate-pulse" : ""
            )}
            style={{ 
              top: '10%', 
              left: '10%', 
              right: '10%', 
              bottom: '10%',
              borderRadius: magnetType === 'tokamak' ? '50%' : '40% 60% 60% 40% / 60% 30% 70% 40%',
              borderStyle: magnetType === 'tokamak' ? 'solid' : 'dashed',
              opacity: containmentField.intensity,
              zIndex: 5
            }}
          />
          
          {/* Inner field lines */}
          {magnetType === 'tokamak' && (
            <div 
              className={`absolute rounded-full border-2 border-${containmentField.color}`}
              style={{ 
                top: '25%', 
                left: '25%', 
                right: '25%', 
                bottom: '25%',
                borderRadius: '50%',
                opacity: containmentField.intensity * 0.7,
                zIndex: 5
              }}
            />
          )}
          
          {magnetType === 'stellarator' && (
            <div 
              className={`absolute border-2 border-${containmentField.color}`}
              style={{ 
                top: '30%', 
                left: '20%', 
                right: '20%', 
                bottom: '30%',
                borderRadius: '70% 30% 30% 70% / 60% 40% 60% 40%',
                transform: 'rotate(45deg)',
                opacity: containmentField.intensity * 0.7,
                zIndex: 5
              }}
            />
          )}
        </>
      )}
      
      {/* Instability warning flashing */}
      {instabilityWarning && (
        <div 
          className="absolute inset-0 bg-red-500 animate-pulse z-0"
          style={{ opacity: 0.1 }}
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
            zIndex: 10
          }}
        />
      ))}
      
      {/* Effects (escaping plasma, containment) */}
      {effects.map(effect => (
        effect.type === 'escape' ? (
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
            className={`absolute rounded-full bg-${containmentField.color} z-15`}
            style={{
              left: effect.x - 5,
              top: effect.y - 5,
              width: 10,
              height: 10,
              opacity: 0.7,
              animation: 'fadeOut 0.3s forwards'
            }}
          />
        )
      ))}
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2 z-30">
        <Button 
          onClick={handleTokamak}
          size="sm"
          variant={magnetType === 'tokamak' ? "default" : "outline"} 
          className={cn(
            magnetType === 'tokamak' ? "bg-blue-500 hover:bg-blue-600" : ""
          )}
        >
          Tokamak
        </Button>
        
        <Button 
          onClick={handleStellarator}
          size="sm"
          variant={magnetType === 'stellarator' ? "default" : "outline"} 
          className={cn(
            magnetType === 'stellarator' ? "bg-purple-500 hover:bg-purple-600" : ""
          )}
        >
          Stellarator
        </Button>
        
        <Button 
          onClick={handleIncreaseStrength}
          size="sm"
          disabled={magnetType === 'none'}
          className="bg-green-500 hover:bg-green-600"
        >
          Stärken +
        </Button>
      </div>
    </div>
  );
};

export default StabilizationPhase;
