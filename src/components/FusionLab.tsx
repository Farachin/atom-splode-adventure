
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Atom, Zap, Thermometer, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FusionLabProps {
  energy: number;
  onEnergyProduced: (amount: number) => void;
  className?: string;
}

type FusionFuel = 'hydrogen' | 'deuterium' | 'deuterium-tritium' | 'helium-3';

const FusionLab: React.FC<FusionLabProps> = ({ energy, onEnergyProduced, className }) => {
  const [selectedFuel, setSelectedFuel] = useState<FusionFuel>('hydrogen');
  const [temperature, setTemperature] = useState<number>(1000); // in kelvin
  const [magneticField, setMagneticField] = useState<number>(50); // percentage
  const [plasmaDensity, setPlasmaDensity] = useState<number>(50); // percentage
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [fusionRate, setFusionRate] = useState<number>(0); // percentage
  const [energyOutput, setEnergyOutput] = useState<number>(0);
  const [isMeltdown, setIsMeltdown] = useState<boolean>(false);
  const [isSupernova, setIsSupernova] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Animation refs
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, color: string, size: number}>>([]);

  // Fuel properties
  const fusionProperties = {
    'hydrogen': {
      name: 'Wasserstoff',
      color: '#87CEFA',
      ignitionTemp: 5000000,
      energyFactor: 0.5,
      description: 'Einfacher Wasserstoff ist am häufigsten, aber schwer zur Fusion zu bringen.'
    },
    'deuterium': {
      name: 'Deuterium',
      color: '#6495ED',
      ignitionTemp: 400000000,
      energyFactor: 1.0,
      description: 'Schwerer Wasserstoff (Deuterium) ist leichter zu fusionieren als gewöhnlicher Wasserstoff.'
    },
    'deuterium-tritium': {
      name: 'Deuterium-Tritium',
      color: '#1E90FF',
      ignitionTemp: 150000000,
      energyFactor: 3.5,
      description: 'Deuterium-Tritium-Fusion benötigt die niedrigste Temperatur und erzeugt viel Energie.'
    },
    'helium-3': {
      name: 'Helium-3',
      color: '#7B68EE',
      ignitionTemp: 600000000,
      energyFactor: 2.5,
      description: 'Helium-3-Fusion erzeugt weniger Neutronen und ist sauberer, aber benötigt höhere Temperaturen.'
    }
  };

  // Initialize animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    initializeParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Update animation when parameters change
  useEffect(() => {
    if (!isRunning) return;
    
    // Update particles behavior based on current parameters
    updateParticlesBehavior();
    
    // Start animation if not already running
    if (!animationRef.current) {
      animateParticles();
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    };
  }, [isRunning, temperature, magneticField, plasmaDensity, selectedFuel]);

  // React to supernova
  useEffect(() => {
    if (isSupernova) {
      // Create supernova explosion effect
      createSupernovaEffect();
      
      toast({
        title: "Supernova!",
        description: "Die Dichte und Temperatur haben einen kritischen Punkt erreicht! Sternenexplosion!",
        variant: "destructive",
      });
      
      // Reset after some time
      const timeout = setTimeout(() => {
        setIsSupernova(false);
        setIsRunning(false);
        setTemperature(1000);
        setPlasmaDensity(50);
        setMagneticField(50);
        initializeParticles();
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isSupernova]);

  // Effect for fusion simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Calculate fusion parameters
      const ignitionTemp = fusionProperties[selectedFuel].ignitionTemp;
      const tempRatio = temperature / ignitionTemp;
      
      // Calculate magnetic field stability
      const magneticStability = magneticField / 100;
      
      // Calculate fusion rate based on temperature, density and magnetic field
      let calculatedFusionRate = 0;
      
      if (tempRatio > 0.8) {
        // Above 80% of ignition temperature, fusion starts to happen
        calculatedFusionRate = Math.min(100, (tempRatio - 0.8) * 500);
        
        // Density increases fusion rate
        calculatedFusionRate *= (plasmaDensity / 50);
        
        // Magnetic field controls stability
        if (magneticStability < 0.4 && calculatedFusionRate > 20) {
          // Risk of plasma escape
          if (Math.random() < 0.2) {
            handlePlasmaMeltdown();
            return;
          }
        }
      }
      
      // Check for supernova conditions
      if (plasmaDensity > 90 && temperature > ignitionTemp * 2 && calculatedFusionRate > 80) {
        if (Math.random() < 0.3) {
          handleSupernova();
          return;
        }
      }
      
      // Adjust temperature based on fusion rate
      let newTemperature = temperature;
      if (calculatedFusionRate > 0) {
        // Fusion generates heat
        newTemperature += calculatedFusionRate * 10000;
      }
      
      // External heating
      newTemperature += 5000;
      
      // Cooling effect from magnetic field
      newTemperature *= (1 - 0.01 * magneticStability);
      
      setTemperature(newTemperature);
      setFusionRate(calculatedFusionRate);
      
      // Calculate energy output
      const output = calculatedFusionRate * fusionProperties[selectedFuel].energyFactor * 2;
      setEnergyOutput(output);
      
      // Contribute to game energy
      onEnergyProduced(output / 100);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, selectedFuel, temperature, magneticField, plasmaDensity]);

  // Initialize particles for visualization
  const initializeParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const numParticles = 100;
    const particles = [];
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: fusionProperties[selectedFuel].color,
        size: Math.random() * 3 + 1
      });
    }
    
    particlesRef.current = particles;
  };

  // Update particles behavior based on current parameters
  const updateParticlesBehavior = () => {
    const particles = particlesRef.current;
    const fuel = selectedFuel;
    const tempFactor = Math.min(1, temperature / fusionProperties[fuel].ignitionTemp);
    const magFactor = magneticField / 100;
    const densityFactor = plasmaDensity / 100;
    
    particles.forEach(particle => {
      // Update color
      particle.color = fusionProperties[fuel].color;
      
      // Update velocity based on temperature
      const speedMultiplier = 0.5 + tempFactor * 2;
      particle.vx = (Math.random() - 0.5) * speedMultiplier;
      particle.vy = (Math.random() - 0.5) * speedMultiplier;
      
      // Update size based on density
      particle.size = Math.random() * 3 + 1 + densityFactor * 2;
    });
    
    // Add more particles based on density
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const targetParticleCount = 50 + Math.floor(densityFactor * 150);
    
    while (particles.length < targetParticleCount) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (0.5 + tempFactor * 2),
        vy: (Math.random() - 0.5) * (0.5 + tempFactor * 2),
        color: fusionProperties[fuel].color,
        size: Math.random() * 3 + 1 + densityFactor * 2
      });
    }
    
    // Remove excess particles
    while (particles.length > targetParticleCount) {
      particles.pop();
    }
  };

  // Animate particles
  const animateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const particles = particlesRef.current;
    const magFactor = magneticField / 100;
    
    // Draw and update particles
    particles.forEach(particle => {
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off walls
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.vx *= -1;
      }
      if (particle.y < 0 || particle.y > canvas.height) {
        particle.vy *= -1;
      }
      
      // Apply magnetic containment
      if (isRunning && magFactor > 0.2) {
        // Calculate distance from center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = particle.x - centerX;
        const dy = particle.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply containment force if near edge
        const containerRadius = (canvas.width < canvas.height ? canvas.width : canvas.height) * 0.4;
        if (distance > containerRadius) {
          // Force directed toward center
          const angle = Math.atan2(dy, dx);
          const fx = -Math.cos(angle) * magFactor * 0.5;
          const fy = -Math.sin(angle) * magFactor * 0.5;
          
          particle.vx += fx;
          particle.vy += fy;
        }
      }
    });
    
    // Draw fusion reactions if happening
    if (isRunning && fusionRate > 10) {
      const numReactions = Math.floor(fusionRate / 10);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      for (let i = 0; i < numReactions; i++) {
        // Random position near center
        const rx = centerX + (Math.random() - 0.5) * canvas.width * 0.3;
        const ry = centerY + (Math.random() - 0.5) * canvas.height * 0.3;
        
        // Draw fusion flash
        const grd = ctx.createRadialGradient(rx, ry, 0, rx, ry, 10 + Math.random() * 10);
        grd.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grd.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(rx, ry, 10 + Math.random() * 10, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }
    
    // Continue animation
    animationRef.current = requestAnimationFrame(animateParticles);
  };

  // Handle plasma meltdown
  const handlePlasmaMeltdown = () => {
    setIsMeltdown(true);
    setIsRunning(false);
    
    toast({
      title: "Plasma-Ausbruch!",
      description: "Das Magnetfeld war zu schwach, um das Plasma zu halten!",
      variant: "destructive",
    });
    
    // Reset after some time
    setTimeout(() => {
      setIsMeltdown(false);
      setTemperature(1000);
    }, 3000);
  };

  // Handle supernova
  const handleSupernova = () => {
    setIsSupernova(true);
    setEnergyOutput(10000);
    onEnergyProduced(100); // Big energy boost from supernova
  };

  // Create supernova effect
  const createSupernovaEffect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const particles = particlesRef.current;
    
    // Clear existing particles
    particles.length = 0;
    
    // Create explosion particles
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 3 === 0 ? '#FF5500' : i % 3 === 1 ? '#FFAA00' : '#FFFFFF',
        size: 2 + Math.random() * 4
      });
    }
  };

  // Start the fusion reactor
  const handleStartFusion = () => {
    if (isRunning) return;
    setIsRunning(true);
    
    toast({
      title: "Fusion gestartet",
      description: `Fusion mit ${fusionProperties[selectedFuel].name} begonnen.`,
    });
  };

  // Stop the fusion reactor
  const handleStopFusion = () => {
    if (!isRunning) return;
    setIsRunning(false);
    
    toast({
      title: "Fusion gestoppt",
      description: "Der Fusionsreaktor wurde sicher heruntergefahren.",
    });
  };

  // Format temperature for display
  const formatTemperature = (temp: number): string => {
    if (temp >= 1000000) {
      return `${(temp / 1000000).toFixed(2)} Mio K`;
    } else if (temp >= 1000) {
      return `${(temp / 1000).toFixed(2)} tausend K`;
    }
    return `${temp.toFixed(0)} K`;
  };

  return (
    <Card className={cn("p-6 bg-white overflow-hidden", className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Sternenphysik-Labor</h2>
          <Badge 
            variant={isRunning ? "default" : "outline"}
            className={cn(
              "px-3 py-1",
              isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "text-gray-500"
            )}
          >
            {isRunning ? "Aktiv" : "Inaktiv"}
          </Badge>
        </div>
        
        <div className="relative rounded-lg overflow-hidden bg-gray-900 h-48 mb-4">
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
          />
          {(!isRunning && !isMeltdown && !isSupernova) && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Star className="h-10 w-10 mb-2 mx-auto text-yellow-300" />
                <p>Wähle Brennstoff und starte die Fusion</p>
              </div>
            </div>
          )}
          {isMeltdown && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-red-500 bg-opacity-50">
              <div className="text-center">
                <AlertTriangle className="h-10 w-10 mb-2 mx-auto text-white" />
                <p className="font-bold">Plasma-Ausbruch!</p>
              </div>
            </div>
          )}
          {isSupernova && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Star className="h-16 w-16 mb-2 mx-auto text-yellow-300 animate-pulse" />
                <p className="font-bold text-2xl">SUPERNOVA!</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="font-medium">Brennstoff wählen</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(fusionProperties) as FusionFuel[]).map((fuel) => (
                <Button 
                  key={fuel}
                  className={cn(
                    "h-16 flex-col items-center justify-center space-y-1 text-left text-sm",
                    selectedFuel === fuel ? "border-2 border-primary" : "border"
                  )}
                  variant="outline"
                  onClick={() => !isRunning && setSelectedFuel(fuel)}
                  disabled={isRunning}
                  style={{
                    borderColor: selectedFuel === fuel ? 'var(--primary)' : undefined,
                    backgroundColor: selectedFuel === fuel ? `${fusionProperties[fuel].color}15` : undefined
                  }}
                >
                  <span className="font-bold">{fusionProperties[fuel].name}</span>
                  <span className="text-xs">
                    {formatTemperature(fusionProperties[fuel].ignitionTemp)} Zündtemp.
                  </span>
                </Button>
              ))}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <h4 className="font-medium mb-1">{fusionProperties[selectedFuel].name}</h4>
              <p>{fusionProperties[selectedFuel].description}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Kontrollparameter</h3>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Magnetfeld-Stärke</span>
                <span>{magneticField}%</span>
              </div>
              <Slider
                value={[magneticField]}
                onValueChange={values => setMagneticField(values[0])}
                max={100}
                step={1}
                disabled={!isRunning || isMeltdown || isSupernova}
              />
              <p className="text-xs text-gray-500 mt-1">
                Steuert, wie gut das Plasma eingeschlossen bleibt
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Plasma-Dichte</span>
                <span>{plasmaDensity}%</span>
              </div>
              <Slider
                value={[plasmaDensity]}
                onValueChange={values => setPlasmaDensity(values[0])}
                max={100}
                step={1}
                disabled={!isRunning || isMeltdown || isSupernova}
              />
              <p className="text-xs text-gray-500 mt-1">
                Höhere Dichte = mehr Fusionsreaktionen, aber höheres Risiko
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Thermometer className="h-5 w-5 mr-2 text-red-500" />
                <span className="font-medium">Temperatur</span>
              </div>
              <span className="font-bold text-gray-700">
                {formatTemperature(temperature)}
              </span>
            </div>
            <Progress 
              value={Math.min(100, (temperature / fusionProperties[selectedFuel].ignitionTemp) * 100)} 
              className={temperature >= fusionProperties[selectedFuel].ignitionTemp * 0.8 ? "bg-orange-500" : ""}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>0 K</span>
              <span>Zündtemperatur: {formatTemperature(fusionProperties[selectedFuel].ignitionTemp)}</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Atom className="h-5 w-5 mr-2 text-blue-500" />
                <span className="font-medium">Fusionsrate</span>
              </div>
              <span className="font-bold text-gray-700">{fusionRate.toFixed(1)}%</span>
            </div>
            <Progress value={fusionRate} className="bg-blue-500" />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Energieausbeute: {energyOutput.toFixed(1)} MW</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4">
          {(!isMeltdown && !isSupernova) ? (
            <>
              <Button 
                className="flex-1" 
                onClick={handleStartFusion}
                disabled={isRunning}
              >
                Fusion starten
              </Button>
              <Button 
                className="flex-1" 
                variant="outline" 
                onClick={handleStopFusion}
                disabled={!isRunning}
              >
                Fusion stoppen
              </Button>
            </>
          ) : (
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600" 
              onClick={() => {
                setIsMeltdown(false);
                setIsSupernova(false);
                setTemperature(1000);
                setPlasmaDensity(50);
                setMagneticField(50);
                initializeParticles();
              }}
            >
              Labor zurücksetzen
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FusionLab;
