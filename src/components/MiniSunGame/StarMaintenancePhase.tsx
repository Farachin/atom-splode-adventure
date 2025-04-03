
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import Effect from '../Effect';
import { CirclePlus, Star, StarHalf, Sun } from 'lucide-react';

interface StarMaintenancePhaseProps {
  temperature: number;
  stability: number;
  fuel: number;
  starType: 'none' | 'red-dwarf' | 'main-sequence' | 'blue-giant' | 'neutron';
  starSize: number;
  onTemperatureChange: (temp: number) => void;
  onStabilityChange: (stability: number) => void;
  onFuelChange: (fuel: number) => void;
  className?: string;
}

const StarMaintenancePhase: React.FC<StarMaintenancePhaseProps> = ({
  temperature,
  stability,
  fuel,
  starType,
  starSize,
  onTemperatureChange,
  onStabilityChange,
  onFuelChange,
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
    type: 'hydrogen' | 'helium' | 'photon';
    distance: number;
  }>>([]);
  const [effects, setEffects] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: 'flare' | 'fuel-add';
  }>>([]);
  const [pulsation, setPulsation] = useState(0);
  const [magnetStrength, setMagnetStrength] = useState(70);
  const [starTemperature, setStarTemperature] = useState(0);
  const [fuelToAdd, setFuelToAdd] = useState({ active: false, x: 0, y: 0 });
  
  const nextIdRef = useRef(1);
  const lastTickRef = useRef(Date.now());
  
  // Get star properties based on type
  const getStarProperties = () => {
    switch (starType) {
      case 'red-dwarf':
        return {
          color: 'rgb(255, 100, 50)',
          coreColor: 'rgb(255, 140, 80)',
          size: 50 + starSize * 5,
          fuelConsumption: 0.02,
          temperature: 150000000,
          photonColor: 'rgba(255, 120, 50, 0.7)'
        };
      case 'main-sequence':
        return {
          color: 'rgb(255, 230, 120)',
          coreColor: 'rgb(255, 255, 200)',
          size: 70 + starSize * 5,
          fuelConsumption: 0.04,
          temperature: 200000000,
          photonColor: 'rgba(255, 240, 140, 0.7)'
        };
      case 'blue-giant':
        return {
          color: 'rgb(150, 200, 255)',
          coreColor: 'rgb(220, 240, 255)',
          size: 100 + starSize * 8,
          fuelConsumption: 0.08,
          temperature: 300000000,
          photonColor: 'rgba(180, 220, 255, 0.7)'
        };
      case 'neutron':
        return {
          color: 'rgb(180, 180, 255)',
          coreColor: 'rgb(220, 220, 255)',
          size: 25 + starSize * 2,
          fuelConsumption: 0.01,
          temperature: 500000000,
          photonColor: 'rgba(180, 180, 255, 0.7)'
        };
      default:
        return {
          color: 'rgb(255, 150, 100)',
          coreColor: 'rgb(255, 180, 120)',
          size: 40,
          fuelConsumption: 0.01,
          temperature: 100000000,
          photonColor: 'rgba(255, 150, 100, 0.7)'
        };
    }
  };
  
  const starProps = getStarProperties();
  
  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    const newParticles = [];
    
    // Inner core particles (hydrogen and helium)
    for (let i = 0; i < 80; i++) {
      const distance = Math.random() * starProps.size * 0.8;
      const angle = Math.random() * Math.PI * 2;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      newParticles.push({
        id: nextIdRef.current++,
        x,
        y,
        size: 4 + Math.random() * 3,
        speed: 8 + Math.random() * 12,
        angle: Math.random() * Math.PI * 2,
        energy: 70 + Math.random() * 30,
        type: Math.random() < 0.7 ? 'hydrogen' : 'helium',
        distance
      });
    }
    
    // Photon particles (radiating outward)
    for (let i = 0; i < 50; i++) {
      const distance = starProps.size * 0.7 + Math.random() * starProps.size * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      newParticles.push({
        id: nextIdRef.current++,
        x,
        y,
        size: 2 + Math.random() * 2,
        speed: 30 + Math.random() * 50,
        angle: Math.atan2(y - centerY, x - centerX),
        energy: 100,
        type: 'photon',
        distance
      });
    }
    
    setParticles(newParticles);
    setStarTemperature(starProps.temperature);
    
    // Set initial temperature
    onTemperatureChange(starProps.temperature);
  }, [starType, starSize]);

  // Star pulsation and fuel consumption
  useEffect(() => {
    const interval = setInterval(() => {
      // Pulsation effect
      setPulsation(prev => (prev + 0.1) % (2 * Math.PI));
      
      // Consume fuel
      const now = Date.now();
      const deltaTime = (now - lastTickRef.current) / 1000; // in seconds
      lastTickRef.current = now;
      
      // Fuel consumption based on star type
      const fuelConsumptionRate = starProps.fuelConsumption * (1 + Math.sin(pulsation) * 0.1);
      onFuelChange(Math.max(0, fuel - fuelConsumptionRate * deltaTime));
      
      // Temperature fluctuation based on pulsation
      const tempFluctuation = Math.sin(pulsation) * 10000000;
      onTemperatureChange(starProps.temperature + tempFluctuation);
      setStarTemperature(starProps.temperature + tempFluctuation);
      
      // Random stellar flares
      if (Math.random() < 0.02) {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          const angle = Math.random() * Math.PI * 2;
          const distance = starProps.size * 0.9;
          const x = width/2 + Math.cos(angle) * distance;
          const y = height/2 + Math.sin(angle) * distance;
          
          setEffects(prev => [...prev, {
            id: Date.now(),
            x,
            y,
            type: 'flare'
          }]);
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [fuel, pulsation, starProps.fuelConsumption, starProps.temperature, onFuelChange, onTemperatureChange]);

  // Update particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          // Different behavior for each particle type
          if (particle.type === 'photon') {
            // Photons always move outward
            const angle = Math.atan2(particle.y - centerY, particle.x - centerX);
            
            let newX = particle.x + Math.cos(angle) * particle.speed * 0.05;
            let newY = particle.y + Math.sin(angle) * particle.speed * 0.05;
            
            // If photon is outside the container, create a new one from the core
            if (newX < 0 || newX > width || newY < 0 || newY > height) {
              const newAngle = Math.random() * Math.PI * 2;
              const newDistance = starProps.size * 0.7;
              newX = centerX + Math.cos(newAngle) * newDistance;
              newY = centerY + Math.sin(newAngle) * newDistance;
              
              return {
                ...particle,
                x: newX,
                y: newY,
                angle: newAngle,
                distance: newDistance
              };
            }
            
            return {
              ...particle,
              x: newX,
              y: newY,
              distance: Math.sqrt((newX - centerX) ** 2 + (newY - centerY) ** 2)
            };
          } else {
            // Core particles (hydrogen and helium) move in circular orbits
            const orbitSpeed = particle.type === 'hydrogen' ? 0.04 : 0.03;
            const orbitRadius = particle.distance * (1 + Math.sin(pulsation) * 0.05);
            
            // Orbit center with some randomness
            particle.angle += orbitSpeed * (1 + (Math.random() - 0.5) * 0.2);
            
            const newX = centerX + Math.cos(particle.angle) * orbitRadius;
            const newY = centerY + Math.sin(particle.angle) * orbitRadius;
            
            return {
              ...particle,
              x: newX,
              y: newY
            };
          }
        });
      });
      
      // Remove old effects
      setEffects(prev => prev.filter(effect => Date.now() - effect.id < 800));
      
      // Handle fuel drag and drop
      if (fuelToAdd.active) {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          const centerX = width / 2;
          const centerY = height / 2;
          
          // Calculate distance to core
          const dx = fuelToAdd.x - centerX;
          const dy = fuelToAdd.y - centerY;
          const distToCore = Math.sqrt(dx*dx + dy*dy);
          
          // If fuel is dropped into the core
          if (distToCore < starProps.size) {
            onFuelChange(Math.min(100, fuel + 15));
            
            // Add fuel effect
            setEffects(prev => [...prev, {
              id: Date.now(),
              x: fuelToAdd.x,
              y: fuelToAdd.y,
              type: 'fuel-add'
            }]);
            
            setFuelToAdd({ active: false, x: 0, y: 0 });
          }
        }
      }
      
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [fuel, pulsation, fuelToAdd, starProps.size, onFuelChange]);

  // Handle magnet strength change
  const handleMagnetChange = (value: number[]) => {
    setMagnetStrength(value[0]);
    
    // Update stability based on magnet strength
    onStabilityChange(Math.min(100, value[0]));
  };
  
  // Start fuel drag operation
  const handleFuelDragStart = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Initialize at top of screen
      setFuelToAdd({
        active: true,
        x: width / 2,
        y: 20
      });
    }
  };
  
  // Track fuel movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (fuelToAdd.active && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setFuelToAdd({
        active: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Get color and glow based on temperature
  const getStarStyle = () => {
    const pulseScale = 1 + Math.sin(pulsation) * 0.05;
    
    // Add flickering effect for dying stars
    const opacityFactor = fuel < 20 ? 0.7 + Math.random() * 0.3 : 1;
    
    return {
      background: `radial-gradient(circle, ${starProps.coreColor} 30%, ${starProps.color} 70%)`,
      width: starProps.size * pulseScale,
      height: starProps.size * pulseScale,
      boxShadow: `0 0 ${starProps.size/2}px ${starProps.color}, 0 0 ${starProps.size}px ${starProps.color}`,
      opacity: opacityFactor,
      transition: 'background 0.5s ease'
    };
  };
  
  // Get particle style based on type
  const getParticleStyle = (particle: {
    type: 'hydrogen' | 'helium' | 'photon';
    energy: number;
    distance: number;
  }) => {
    const fuelFactor = Math.max(0.3, fuel / 100);
    
    switch (particle.type) {
      case 'hydrogen':
        return {
          background: `rgba(200, 220, 255, ${Math.min(1, particle.energy / 100 * fuelFactor)})`,
          boxShadow: `0 0 5px rgba(200, 220, 255, ${Math.min(0.8, particle.energy / 100 * fuelFactor)})`
        };
      case 'helium':
        return {
          background: `rgba(255, 220, 150, ${Math.min(1, particle.energy / 100 * fuelFactor)})`,
          boxShadow: `0 0 5px rgba(255, 220, 150, ${Math.min(0.8, particle.energy / 100 * fuelFactor)})`
        };
      case 'photon':
        return {
          background: starProps.photonColor,
          boxShadow: `0 0 8px ${starProps.photonColor}`,
          opacity: Math.max(0.2, 1 - (particle.distance / (starProps.size * 2)) * fuelFactor)
        };
      default:
        return {};
    }
  };

  return (
    <div 
      className={cn("relative w-full h-full cursor-pointer", className)}
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Star core visualization */}
      <div 
        className="absolute rounded-full z-10"
        style={{
          ...getStarStyle(),
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Magnetic corona visualization */}
      <div 
        className="absolute rounded-full border-4 z-5"
        style={{ 
          top: '50%',
          left: '50%',
          width: starProps.size * 2.2,
          height: starProps.size * 2.2,
          transform: 'translate(-50%, -50%)',
          borderColor: starProps.color,
          borderStyle: 'dashed',
          opacity: magnetStrength / 200,
          borderRadius: '50%'
        }}
      />
      
      {/* Particles visualization */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full z-20"
          style={{
            left: particle.x - particle.size/2,
            top: particle.y - particle.size/2,
            width: particle.size,
            height: particle.size,
            ...getParticleStyle(particle)
          }}
        />
      ))}
      
      {/* Fuel drag visualization */}
      {fuelToAdd.active && (
        <div 
          className="absolute z-30 flex items-center justify-center"
          style={{
            left: fuelToAdd.x - 15,
            top: fuelToAdd.y - 15,
            width: 30,
            height: 30
          }}
        >
          <div className="w-6 h-6 rounded-full bg-blue-400 animate-pulse" />
        </div>
      )}
      
      {/* Effects */}
      {effects.map(effect => (
        effect.type === 'flare' ? (
          <Effect
            key={effect.id}
            type="explosion"
            x={effect.x}
            y={effect.y}
            className="z-25"
          />
        ) : (
          <Effect
            key={effect.id}
            type="energy-release"
            x={effect.x}
            y={effect.y}
            className="z-25"
          />
        )
      ))}
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 space-y-3 z-40">
        <div className="flex justify-between text-xs text-white">
          <span>Magnetfeld-Stärke</span>
          <span>{magnetStrength}%</span>
        </div>
        <Slider
          value={[magnetStrength]}
          onValueChange={handleMagnetChange}
          max={100}
          step={1}
          className="mb-4"
        />
        
        <Button 
          onClick={handleFuelDragStart}
          disabled={fuelToAdd.active || fuel >= 95}
          className="w-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
        >
          <CirclePlus className="w-4 h-4 mr-2" />
          Wasserstoff hinzufügen
        </Button>
      </div>
      
      {/* Star info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-2 rounded text-white text-sm z-40">
        <div className="flex items-center">
          {starType === 'red-dwarf' && <StarHalf className="w-4 h-4 mr-1 text-red-400" />}
          {starType === 'main-sequence' && <Sun className="w-4 h-4 mr-1 text-yellow-400" />}
          {starType === 'blue-giant' && <Star className="w-4 h-4 mr-1 text-blue-400" />}
          {starType === 'neutron' && <Star className="w-4 h-4 mr-1 text-purple-400" />}
          <span className="font-medium">
            {(() => {
              switch(starType) {
                case 'red-dwarf': return 'Roter Zwerg';
                case 'main-sequence': return 'Hauptreihenstern';
                case 'blue-giant': return 'Blauer Riese';
                case 'neutron': return 'Neutronenstern';
                default: return 'Stern';
              }
            })()}
          </span>
        </div>
        <div className="mt-1 text-xs">
          Kerntemperatur: {(starTemperature / 1000000).toFixed(0)} Mio °C
        </div>
      </div>
    </div>
  );
};

export default StarMaintenancePhase;
