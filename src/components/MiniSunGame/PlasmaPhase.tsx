
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
  const [autoHeaterActive, setAutoHeaterActive] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseDownPosition, setMouseDownPosition] = useState<{x: number, y: number} | null>(null);
  const [heatingIntensity, setHeatingIntensity] = useState(0);
  const [heatMultiplier, setHeatMultiplier] = useState(1);
  const heatingIntervalRef = useRef<number | null>(null);
  const nextIdRef = useRef(1);
  const autoHeaterRef = useRef<number | null>(null);
  const mouseHoldTimeRef = useRef(0);
  
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

  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          let newX = particle.x + Math.cos(particle.angle) * particle.speed * 0.02;
          let newY = particle.y + Math.sin(particle.angle) * particle.speed * 0.02;
          
          if (newX < 0 || newX > width) {
            particle.angle = Math.PI - particle.angle;
            newX = Math.max(0, Math.min(width, newX));
          }
          if (newY < 0 || newY > height) {
            particle.angle = -particle.angle;
            newY = Math.max(0, Math.min(height, newY));
          }
          
          if (Math.random() < 0.05) {
            particle.angle += (Math.random() - 0.5) * 0.5;
          }
          
          const speedFactor = 1 + (temperature / 10000000);
          let newSpeed = particle.speed * speedFactor;
          
          if (magnetActive && temperature > 100000) {
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
            size: 3 + (temperature / 10000000) * 5,
            energy: Math.min(100, particle.energy + (temperature / 50000000))
          };
        });
      });
      
      setEffects(prev => prev.filter(effect => Date.now() - effect.id < 500));
      
    }, 16);
    
    return () => clearInterval(interval);
  }, [temperature, magnetActive]);

  // Hold-to-heat functionality with increasing multiplier over time
  useEffect(() => {
    if (isMouseDown && mouseDownPosition) {
      // Start a heating interval when mouse is held down
      if (!heatingIntervalRef.current) {
        mouseHoldTimeRef.current = Date.now();
        
        heatingIntervalRef.current = window.setInterval(() => {
          // Calculate how long the mouse has been held down
          const holdDuration = (Date.now() - mouseHoldTimeRef.current) / 1000; // in seconds
          
          // Increase heat multiplier over time (caps at 20x after 5 seconds)
          const newHeatMultiplier = Math.min(20, 1 + holdDuration * 4);
          setHeatMultiplier(newHeatMultiplier);
          
          // Increase heating intensity the longer mouse is held
          setHeatingIntensity(prev => Math.min(prev + 0.5, 10));
          
          // Create heat effect at mouse position
          setEffects(prev => [...prev, {
            id: Date.now(),
            x: mouseDownPosition.x,
            y: mouseDownPosition.y,
            type: 'heat'
          }]);
          
          // Increase temperature based on heating intensity and multiplier
          // The longer the mouse is held, the more heat is generated per interval
          const heatIncrement = 1500000 * (1 + heatingIntensity) * newHeatMultiplier;
          onTemperatureChange(temperature + heatIncrement);
        }, 100);
      }
    } else {
      // Clear heating interval when mouse is released
      if (heatingIntervalRef.current) {
        clearInterval(heatingIntervalRef.current);
        heatingIntervalRef.current = null;
        setHeatingIntensity(0);
        setHeatMultiplier(1);
        mouseHoldTimeRef.current = 0;
      }
    }
    
    return () => {
      if (heatingIntervalRef.current) {
        clearInterval(heatingIntervalRef.current);
        heatingIntervalRef.current = null;
      }
    };
  }, [isMouseDown, mouseDownPosition, temperature, onTemperatureChange, heatingIntensity]);

  // Auto heater effect
  useEffect(() => {
    if (autoHeaterActive && !autoHeaterRef.current) {
      autoHeaterRef.current = window.setInterval(() => {
        if (!containerRef.current) return;
        
        const { width, height } = containerRef.current.getBoundingClientRect();
        
        // Add random heat effect
        setEffects(prev => {
          const newEffects = [...prev];
          for (let i = 0; i < 2; i++) {
            newEffects.push({
              id: Date.now() + i,
              x: Math.random() * width,
              y: Math.random() * height,
              type: 'heat'
            });
          }
          return newEffects;
        });
        
        // Significantly increase temperature
        onTemperatureChange(temperature + 6000000);
      }, 500);
    } else if (!autoHeaterActive && autoHeaterRef.current) {
      clearInterval(autoHeaterRef.current);
      autoHeaterRef.current = null;
    }
    
    return () => {
      if (autoHeaterRef.current) {
        clearInterval(autoHeaterRef.current);
        autoHeaterRef.current = null;
      }
    };
  }, [autoHeaterActive, temperature, onTemperatureChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsMouseDown(true);
    setMouseDownPosition({ x, y });
    mouseHoldTimeRef.current = Date.now();
    
    // Initial effect on mouse down
    setEffects(prev => [...prev, {
      id: Date.now(),
      x,
      y,
      type: 'heat'
    }]);
    
    // Initial temperature increase
    onTemperatureChange(temperature + 1000000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update mouse position for heating effects
    setMouseDownPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setMouseDownPosition(null);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
    setMouseDownPosition(null);
  };

  const handleFireLaser = () => {
    if (!containerRef.current || Date.now() - lastLaser < 300) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    setEffects(prev => [...prev, {
      id: Date.now(),
      x,
      y,
      type: 'laser'
    }]);
    
    // Increased laser heat
    onTemperatureChange(temperature + 8000000);
    setLastLaser(Date.now());
  };

  const handleToggleMagnet = () => {
    setMagnetActive(!magnetActive);
    
    if (!magnetActive) {
      onTemperatureChange(temperature + 500000);
    }
  };
  
  const handleToggleAutoHeater = () => {
    setAutoHeaterActive(!autoHeaterActive);
  };

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
      className={cn("relative w-full h-full cursor-pointer", className)}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
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
      
      <div className="absolute top-4 left-0 right-0 text-center bg-black bg-opacity-70 text-white py-2 px-4 mx-auto w-max rounded-full text-sm z-30 shadow-lg">
        <span className="font-medium">Tipp:</span> Halte gedrückt zum Erhitzen! Je länger gedrückt, desto mehr Hitze.
      </div>
      
      {isMouseDown && heatingIntensity > 0 && (
        <div 
          className="absolute rounded-full bg-yellow-500 animate-pulse z-10"
          style={{
            left: mouseDownPosition?.x ? mouseDownPosition.x - 15 - (heatingIntensity * 3) : 0,
            top: mouseDownPosition?.y ? mouseDownPosition.y - 15 - (heatingIntensity * 3) : 0,
            width: 30 + (heatingIntensity * 6),
            height: 30 + (heatingIntensity * 6),
            opacity: 0.7,
            boxShadow: `0 0 ${10 + heatingIntensity * 5}px rgba(255, 200, 0, 0.8)`,
            transition: 'width 0.2s, height 0.2s, left 0.2s, top 0.2s'
          }}
        />
      )}
      
      {/* Heat multiplier indicator */}
      {isMouseDown && heatMultiplier > 1 && (
        <div 
          className="absolute bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-full text-sm px-3 py-1 shadow-lg z-20"
          style={{
            left: mouseDownPosition?.x ? mouseDownPosition.x + 15 : 0,
            top: mouseDownPosition?.y ? mouseDownPosition.y - 30 : 0,
            transition: 'all 0.2s',
            opacity: Math.min(1, (heatMultiplier - 1) / 5),
            transform: `scale(${Math.min(1.5, 1 + (heatMultiplier - 1) / 10)})`
          }}
        >
          {heatMultiplier.toFixed(1)}x
        </div>
      )}
      
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
              left: effect.x - 15,
              top: effect.y - 15,
              width: 30,
              height: 30,
              opacity: 0.8
            }}
          />
        )
      ))}
      
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
        
        <Button 
          onClick={handleToggleAutoHeater}
          size="sm"
          variant={autoHeaterActive ? "default" : "outline"} 
          className={cn(
            "flex-1",
            autoHeaterActive ? "bg-red-500 hover:bg-red-600" : ""
          )}
        >
          Auto-Erhitzer {autoHeaterActive ? 'An' : 'Aus'}
        </Button>
      </div>
    </div>
  );
};

export default PlasmaPhase;
