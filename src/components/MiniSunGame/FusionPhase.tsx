
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import Effect from '../Effect';

interface FusionPhaseProps {
  temperature: number;
  stability: number;
  pressure: number;
  onTemperatureChange: (temp: number) => void;
  onStabilityChange: (stability: number) => void;
  onPressureChange: (pressure: number) => void;
  className?: string;
}

const FusionPhase: React.FC<FusionPhaseProps> = ({
  temperature,
  stability,
  pressure,
  onTemperatureChange,
  onStabilityChange,
  onPressureChange,
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
    type: 'hydrogen' | 'helium' | 'neutron';
  }>>([]);
  const [effects, setEffects] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: 'fusion' | 'laser';
  }>>([]);
  const [lastLaserPulse, setLastLaserPulse] = useState(0);
  const [magnetStrength, setMagnetStrength] = useState(50);
  const [gravityStrength, setGravityStrength] = useState(50);
  const [compressionActive, setCompressionActive] = useState(false);
  const [fusionEvents, setFusionEvents] = useState(0);
  
  const nextIdRef = useRef(1);
  
  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const newParticles = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < 100; i++) {
      // Calculate position within containment field
      const radius = Math.min(width, height) * 0.3 * Math.sqrt(Math.random());
      const angle = Math.random() * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      newParticles.push({
        id: nextIdRef.current++,
        x,
        y,
        size: 5 + Math.random() * 3,
        speed: 15 + Math.random() * 25,
        angle: Math.random() * Math.PI * 2,
        energy: 70 + Math.random() * 30,
        type: 'hydrogen'
      });
    }
    
    setParticles(newParticles);
  }, []);

  // Update particles and check for fusion
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate containment radius based on pressure
    // Higher pressure = smaller containment
    const maxRadius = Math.min(width, height) * 0.4;
    const containmentRadius = maxRadius * (1 - pressure / 150);
    
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        // Collect positions for collision detection
        const positions: Record<number, { x: number, y: number, type: string }> = {};
        prevParticles.forEach(p => {
          positions[p.id] = { x: p.x, y: p.y, type: p.type };
        });
        
        // Check for fusion events
        const fusionCandidates: number[][] = [];
        
        // Only hydrogen particles can fuse
        const hydrogenParticles = prevParticles.filter(p => p.type === 'hydrogen');
        
        // Check for pairs of hydrogen particles that are close enough
        for (let i = 0; i < hydrogenParticles.length; i++) {
          for (let j = i + 1; j < hydrogenParticles.length; j++) {
            const p1 = hydrogenParticles[i];
            const p2 = hydrogenParticles[j];
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx*dx + dy*dy;
            
            // Fusion probability increases with pressure and temperature
            const fusionThreshold = 100 - (temperature / 10000000) - pressure;
            const minDist = 10 - (pressure / 20); // Higher pressure = particles need to be closer
            
            if (distSq < minDist*minDist && Math.random() * 100 < fusionThreshold * 0.1) {
              fusionCandidates.push([p1.id, p2.id]);
            }
          }
        }
        
        // Process fusion events
        if (fusionCandidates.length > 0) {
          const fusionEvents = [];
          
          for (const [id1, id2] of fusionCandidates) {
            const p1 = prevParticles.find(p => p.id === id1);
            const p2 = prevParticles.find(p => p.id === id2);
            
            if (p1 && p2) {
              // Average position for fusion event
              const x = (p1.x + p2.x) / 2;
              const y = (p1.y + p2.y) / 2;
              
              // Add fusion effect
              setEffects(prev => [...prev, {
                id: Date.now() + Math.random() * 1000,
                x,
                y,
                type: 'fusion'
              }]);
              
              // Increase temperature due to fusion energy release
              onTemperatureChange(temperature + 1000000);
              
              // Add some pressure
              onPressureChange(Math.min(100, pressure + 1));
              
              // Track fusion event
              setFusionEvents(prev => prev + 1);
              
              // Add this event to be processed
              fusionEvents.push({
                removeIds: [id1, id2],
                heliumPos: { x, y },
                neutronPos: { x, y },
                heliumAngle: Math.random() * Math.PI * 2,
                neutronAngle: Math.random() * Math.PI * 2
              });
            }
          }
          
          // Apply fusion events
          if (fusionEvents.length > 0) {
            const idsToRemove = fusionEvents.flatMap(e => e.removeIds);
            const newParticles = prevParticles.filter(p => !idsToRemove.includes(p.id));
            
            // Add new helium and neutron particles
            fusionEvents.forEach(event => {
              // Add helium
              newParticles.push({
                id: nextIdRef.current++,
                x: event.heliumPos.x,
                y: event.heliumPos.y,
                size: 7,
                speed: 10 + Math.random() * 15,
                angle: event.heliumAngle,
                energy: 90 + Math.random() * 10,
                type: 'helium'
              });
              
              // Add neutron
              newParticles.push({
                id: nextIdRef.current++,
                x: event.neutronPos.x,
                y: event.neutronPos.y,
                size: 3,
                speed: 40 + Math.random() * 20,
                angle: event.neutronAngle,
                energy: 100,
                type: 'neutron'
              });
            });
            
            return newParticles;
          }
        }
        
        return prevParticles.map(particle => {
          // Update position
          let newX = particle.x + Math.cos(particle.angle) * particle.speed * 0.03;
          let newY = particle.y + Math.sin(particle.angle) * particle.speed * 0.03;
          
          // Calculate distance from center
          const dx = newX - centerX;
          const dy = newY - centerY;
          const distFromCenter = Math.sqrt(dx*dx + dy*dy);
          
          // Apply magnetic field and gravity effects
          
          // Stronger containment field when compression is active
          const effectiveContainmentRadius = compressionActive 
            ? containmentRadius * 0.8 
            : containmentRadius;
          
          // Magnetic field effect (circular motion + containment)
          if (distFromCenter > effectiveContainmentRadius * 0.7) {
            // Pull back towards center based on magnetic strength
            const pullFactor = Math.min(1, (distFromCenter - effectiveContainmentRadius * 0.7) / (effectiveContainmentRadius * 0.3));
            const magnetFactor = magnetStrength / 100;
            
            // Only hydrogen and helium are affected by magnetic field
            if (particle.type !== 'neutron') {
              newX -= dx * pullFactor * 0.05 * magnetFactor;
              newY -= dy * pullFactor * 0.05 * magnetFactor;
              
              // Change angle to follow containment field
              const tangentAngle = Math.atan2(dx, -dy);
              particle.angle = tangentAngle + (Math.random() - 0.5) * 0.2;
            }
          }
          
          // Gravity effect (pull to center)
          const gravityFactor = gravityStrength / 100;
          
          // All particles are affected by gravity
          newX -= dx * 0.01 * gravityFactor;
          newY -= dy * 0.01 * gravityFactor;
          
          // Compression pulse effect
          if (compressionActive) {
            // Strong pulse towards center
            newX -= dx * 0.05;
            newY -= dy * 0.05;
          }
          
          // Boundary handling
          if (newX < 0) newX = 0;
          if (newX > width) newX = width;
          if (newY < 0) newY = 0;
          if (newY > height) newY = height;
          
          // Random angle changes for natural movement
          if (Math.random() < 0.02) {
            particle.angle += (Math.random() - 0.5) * 0.5;
          }
          
          // Particles move faster with higher temperature
          let speedFactor = 1 + (temperature / 100000000);
          
          // Helium moves slower, neutrons move faster
          if (particle.type === 'helium') speedFactor *= 0.7;
          if (particle.type === 'neutron') speedFactor *= 2;
          
          return {
            ...particle,
            x: newX,
            y: newY,
            angle: particle.angle,
            speed: particle.speed * speedFactor,
            // Size and energy stay constant for each particle type
          };
        });
      });
      
      // Remove old effects
      setEffects(prev => prev.filter(effect => Date.now() - effect.id < 500));
      
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [temperature, stability, pressure, magnetStrength, gravityStrength, compressionActive, onTemperatureChange, onPressureChange]);

  // Handle laser pulse
  const handleLaserPulse = () => {
    if (!containerRef.current || Date.now() - lastLaserPulse < 1000) return;
    
    setLastLaserPulse(Date.now());
    setCompressionActive(true);
    
    // Temporary compression
    setTimeout(() => setCompressionActive(false), 500);
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    // Add laser effects
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.min(width, height) * 0.4;
      const x = width/2 + Math.cos(angle) * distance;
      const y = height/2 + Math.sin(angle) * distance;
      
      setEffects(prev => [...prev, {
        id: Date.now() + i * 100,
        x,
        y,
        type: 'laser'
      }]);
    }
    
    // Increase pressure
    onPressureChange(Math.min(100, pressure + 5));
  };
  
  // Handle magnet strength change
  const handleMagnetChange = (value: number[]) => {
    setMagnetStrength(value[0]);
    
    // Update stability based on magnet strength
    onStabilityChange(Math.min(100, stability - 2 + value[0] / 25));
  };
  
  // Handle gravity strength change
  const handleGravityChange = (value: number[]) => {
    setGravityStrength(value[0]);
    
    // Increase pressure based on gravity
    onPressureChange(Math.min(100, pressure + value[0] / 50));
  };

  // Get color based on particle type and temperature
  const getParticleColor = (particle: {
    energy: number;
    type: 'hydrogen' | 'helium' | 'neutron';
  }) => {
    switch (particle.type) {
      case 'hydrogen':
        return `rgba(255, ${150 + (105 * particle.energy / 100)}, 100, ${Math.min(1, particle.energy / 100)})`;
      case 'helium':
        return `rgba(255, 220, 50, ${Math.min(1, particle.energy / 100)})`;
      case 'neutron':
        return `rgba(100, 200, 255, ${Math.min(1, particle.energy / 100)})`;
      default:
        return `rgba(255, 255, 255, ${Math.min(1, particle.energy / 100)})`;
    }
  };

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      ref={containerRef}
    >
      {/* Containment field visualization - shrinks with pressure */}
      <div 
        className="absolute rounded-full border-4 border-blue-500"
        style={{ 
          top: `${25 - pressure/5}%`, 
          left: `${25 - pressure/5}%`, 
          right: `${25 - pressure/5}%`, 
          bottom: `${25 - pressure/5}%`,
          borderRadius: '50%',
          borderStyle: 'solid',
          opacity: 0.5,
          zIndex: 5,
          transition: 'all 0.5s ease'
        }}
      />
      
      {/* Compression effect animation */}
      {compressionActive && (
        <div 
          className="absolute rounded-full bg-orange-500 animate-ping"
          style={{ 
            top: '30%', 
            left: '30%', 
            right: '30%', 
            bottom: '30%',
            opacity: 0.3,
            zIndex: 4
          }}
        />
      )}
      
      {/* Particle visualization */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x - particle.size/2,
            top: particle.y - particle.size/2,
            width: particle.size,
            height: particle.size,
            background: getParticleColor(particle),
            boxShadow: `0 0 ${particle.type === 'neutron' ? 5 : 8}px ${getParticleColor(particle)}`,
            transition: 'background-color 0.3s ease',
            zIndex: 10
          }}
        />
      ))}
      
      {/* Fusion and laser effects */}
      {effects.map(effect => (
        effect.type === 'fusion' ? (
          <Effect
            key={effect.id}
            type="explosion"
            x={effect.x}
            y={effect.y}
            className="z-20"
          />
        ) : (
          <Effect
            key={effect.id}
            type="energy-release"
            x={effect.x}
            y={effect.y}
            className="z-20"
          />
        )
      ))}
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 space-y-3 z-30">
        <div className="flex justify-between text-xs text-white">
          <span>Magnetfeld</span>
          <span>{magnetStrength}%</span>
        </div>
        <Slider
          value={[magnetStrength]}
          onValueChange={handleMagnetChange}
          max={100}
          step={1}
          className="mb-4"
        />
        
        <div className="flex justify-between text-xs text-white">
          <span>Gravitation</span>
          <span>{gravityStrength}%</span>
        </div>
        <Slider
          value={[gravityStrength]}
          onValueChange={handleGravityChange}
          max={100}
          step={1}
          className="mb-4"
        />
        
        <Button 
          onClick={handleLaserPulse}
          disabled={Date.now() - lastLaserPulse < 1000}
          className="w-full bg-red-500 hover:bg-red-600"
        >
          Laser-Kompression
          {Date.now() - lastLaserPulse < 1000 && (
            <span className="ml-2">{(1 - (Date.now() - lastLaserPulse) / 1000).toFixed(1)}s</span>
          )}
        </Button>
      </div>
      
      {/* Fusion counter */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm z-30">
        Fusionen: {fusionEvents}
      </div>
    </div>
  );
};

export default FusionPhase;
