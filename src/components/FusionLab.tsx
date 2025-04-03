
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowDownCircle, 
  Magnet, 
  Zap, 
  Thermometer, 
  Atom, 
  Flame, 
  ArrowRightCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FusionLabProps {
  energy: number;
  onEnergyProduced: (amount: number) => void;
  className?: string;
}

type FusionFuel = 'deuterium-tritium' | 'deuterium-deuterium' | 'hydrogen-boron';
type FusionStatus = 'idle' | 'heating' | 'fusion' | 'stable' | 'unstable';

const FusionLab: React.FC<FusionLabProps> = ({ energy, onEnergyProduced, className }) => {
  const [fusionFuel, setFusionFuel] = useState<FusionFuel>('deuterium-tritium');
  const [temperature, setTemperature] = useState<number>(0); // Millions of degrees Celsius
  const [magneticField, setMagneticField] = useState<number>(50); // Tesla
  const [plasmaConfinement, setPlasmaConfinement] = useState<number>(0); // 0-100%
  const [fusionStatus, setFusionStatus] = useState<FusionStatus>('idle');
  const [energyOutput, setEnergyOutput] = useState<number>(0);
  const [stepByStepMode, setStepByStepMode] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fusionReactionVisible, setFusionReactionVisible] = useState<boolean>(false);
  const fusionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Constants for different fusion fuels
  const FUSION_THRESHOLDS = {
    'deuterium-tritium': 150, // Million degrees
    'deuterium-deuterium': 400, // Million degrees
    'hydrogen-boron': 1000, // Million degrees
  };

  const ENERGY_OUTPUT_RATES = {
    'deuterium-tritium': 10,
    'deuterium-deuterium': 5,
    'hydrogen-boron': 20,
  };

  const CONFINEMENT_RATES = {
    'deuterium-tritium': 1.0,
    'deuterium-deuterium': 0.7,
    'hydrogen-boron': 0.5,
  };

  // Animation for plasma and fusion reactions
  useEffect(() => {
    const animationInterval = setInterval(() => {
      if (canvasRef.current) {
        drawFusionVisualization();
      }
    }, 50);

    return () => clearInterval(animationInterval);
  }, [fusionStatus, plasmaConfinement, temperature, fusionReactionVisible]);

  // Effect for fusion process simulation
  useEffect(() => {
    if (fusionStatus === 'heating' || fusionStatus === 'fusion' || fusionStatus === 'stable') {
      fusionIntervalRef.current = setInterval(() => {
        processFusionStep();
      }, 1000);
    }

    return () => {
      if (fusionIntervalRef.current) {
        clearInterval(fusionIntervalRef.current);
      }
    };
  }, [fusionStatus, temperature, magneticField, plasmaConfinement]);

  const processFusionStep = () => {
    // Update temperature based on status
    if (fusionStatus === 'heating') {
      // Heating phase
      const heatRate = 10 + (magneticField / 10);
      const newTemperature = Math.min(2000, temperature + heatRate);
      setTemperature(newTemperature);
      
      // Calculate confinement based on magnetic field
      const newConfinement = Math.min(100, plasmaConfinement + (magneticField / 20));
      setPlasmaConfinement(newConfinement);
      
      // Check if we've reached fusion temperature
      if (newTemperature >= FUSION_THRESHOLDS[fusionFuel]) {
        setFusionStatus('fusion');
        setFusionReactionVisible(true);
        toast({
          title: "Fusion initiiert!",
          description: `Das Plasma hat die Zündtemperatur von ${FUSION_THRESHOLDS[fusionFuel]} Millionen °C erreicht.`,
        });
      }
    } else if (fusionStatus === 'fusion' || fusionStatus === 'stable') {
      // Fusion reaction ongoing
      // Calculate energy output
      const baseOutput = ENERGY_OUTPUT_RATES[fusionFuel];
      const confinementFactor = CONFINEMENT_RATES[fusionFuel] * plasmaConfinement / 100;
      const magnFieldFactor = magneticField / 100;
      
      // Energy output increases with confinement quality
      const output = baseOutput * confinementFactor * magnFieldFactor * (temperature / FUSION_THRESHOLDS[fusionFuel]);
      setEnergyOutput(output);
      onEnergyProduced(output / 5); // Scale down for game balance
      
      // Update status based on confinement quality
      if (plasmaConfinement > 80 && magneticField > 70) {
        if (fusionStatus !== 'stable') {
          setFusionStatus('stable');
          toast({
            title: "Stabile Fusion erreicht!",
            description: "Das Plasma ist nun stabil eingeschlossen und erzeugt konstant Energie.",
          });
        }
      } else if (fusionStatus === 'stable') {
        setFusionStatus('fusion');
        toast({
          title: "Instabilität im Plasma",
          description: "Der Plasmaeinschluss ist nicht mehr optimal. Erhöhe das Magnetfeld!",
        });
      }
      
      // Random chance of instability based on confinement
      if (Math.random() > (plasmaConfinement / 100)) {
        // Lose some confinement
        setPlasmaConfinement(prev => Math.max(0, prev - 5));
        
        if (plasmaConfinement < 30) {
          // Plasma is becoming unstable
          toast({
            title: "Warnung: Plasmainstabilität",
            description: "Der Magnetische Einschluss wird schwächer. Erhöhe das Magnetfeld!",
            variant: "destructive"
          });
        }
      }
    }
  };

  const startFusion = () => {
    if (fusionStatus !== 'idle') return;
    
    setFusionStatus('heating');
    setTemperature(20); // Start at 20 million degrees
    
    toast({
      title: "Fusionsversuch gestartet",
      description: stepByStepMode ? 
        "Folge den Schritten, um eine Fusionsreaktion zu erzeugen." :
        "Erhitze das Plasma auf die Zündtemperatur und optimiere den magnetischen Einschluss.",
    });
  };

  const stopFusion = () => {
    if (fusionStatus === 'idle') return;
    
    setFusionStatus('idle');
    setTemperature(0);
    setPlasmaConfinement(0);
    setEnergyOutput(0);
    setFusionReactionVisible(false);
    setCurrentStep(1);
    
    toast({
      title: "Fusionsreaktion gestoppt",
      description: "Der Tokamak wurde heruntergefahren.",
    });
  };

  const handleCompleteStep = (step: number) => {
    if (currentStep !== step) return;
    
    switch(step) {
      case 1: // Select fuel
        setCurrentStep(2);
        toast({
          title: "Schritt 1 abgeschlossen",
          description: `${getFuelName(fusionFuel)} als Brennstoff ausgewählt.`,
        });
        break;
      case 2: // Heat plasma
        if (temperature < 50) {
          setTemperature(50);
        }
        setCurrentStep(3);
        toast({
          title: "Schritt 2 abgeschlossen",
          description: "Plasma wird erhitzt.",
        });
        break;
      case 3: // Increase magnetic field
        if (magneticField < 70) {
          setMagneticField(70);
        }
        setCurrentStep(4);
        toast({
          title: "Schritt 3 abgeschlossen",
          description: "Magnetfeld erhöht für besseren Plasmaeinschluss.",
        });
        break;
      case 4: // Wait for fusion
        if (fusionStatus !== 'heating') {
          startFusion();
        }
        setCurrentStep(5);
        toast({
          title: "Schritt 4 abgeschlossen",
          description: "Warte auf das Erreichen der Fusionstemperatur...",
        });
        break;
      case 5: // Optimize for stable fusion
        if (magneticField < 90) {
          setMagneticField(90);
        }
        toast({
          title: "Schritt 5 abgeschlossen",
          description: "Gratulation! Du hast eine stabile Fusionsreaktion erzeugt!",
        });
        setStepByStepMode(false);
        break;
    }
  };

  const drawFusionVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate center and radius
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;

    // Draw tokamak container (donut shape)
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#777';
    ctx.stroke();
    
    // Draw magnetic field coils
    const numCoils = 8;
    for (let i = 0; i < numCoils; i++) {
      const angle = (Math.PI * 2 / numCoils) * i;
      const coilX = centerX + Math.cos(angle) * maxRadius;
      const coilY = centerY + Math.sin(angle) * maxRadius;
      
      ctx.beginPath();
      ctx.arc(coilX, coilY, 10, 0, Math.PI * 2);
      ctx.fillStyle = magneticField > 50 ? '#3b82f6' : '#93c5fd';
      ctx.fill();
      
      // Draw magnetic field lines
      if (magneticField > 30) {
        const fieldStrength = magneticField / 100;
        const oppositeAngle = (angle + Math.PI) % (Math.PI * 2);
        const oppositeX = centerX + Math.cos(oppositeAngle) * maxRadius;
        const oppositeY = centerY + Math.sin(oppositeAngle) * maxRadius;
        
        ctx.beginPath();
        ctx.moveTo(coilX, coilY);
        
        // Draw curved field line
        const cp1x = centerX + Math.cos(angle - Math.PI/4) * maxRadius * 0.7;
        const cp1y = centerY + Math.sin(angle - Math.PI/4) * maxRadius * 0.7;
        const cp2x = centerX + Math.cos(oppositeAngle + Math.PI/4) * maxRadius * 0.7;
        const cp2y = centerY + Math.sin(oppositeAngle + Math.PI/4) * maxRadius * 0.7;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, oppositeX, oppositeY);
        
        ctx.strokeStyle = `rgba(59, 130, 246, ${fieldStrength})`;
        ctx.lineWidth = 2 * fieldStrength;
        ctx.stroke();
      }
    }
    
    // Draw plasma
    if (temperature > 0) {
      const plasmaRadius = maxRadius * 0.7 * (plasmaConfinement / 100);
      
      // Plasma glow effect
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, plasmaRadius
      );
      
      let color1, color2;
      if (temperature < FUSION_THRESHOLDS[fusionFuel] * 0.5) {
        // Heating up - orange/red
        color1 = 'rgba(255, 165, 0, 0.8)';
        color2 = 'rgba(255, 120, 0, 0)';
      } else if (temperature < FUSION_THRESHOLDS[fusionFuel]) {
        // Near fusion - bright orange/yellow
        color1 = 'rgba(255, 220, 50, 0.9)';
        color2 = 'rgba(255, 150, 0, 0)';
      } else {
        // Fusion - bright blue/white
        color1 = 'rgba(200, 230, 255, 1)';
        color2 = 'rgba(70, 150, 255, 0)';
      }
      
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, plasmaRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Fusion reactions - small energy particles emanating from center
      if (fusionReactionVisible) {
        const numParticles = 20 * (energyOutput / ENERGY_OUTPUT_RATES[fusionFuel]);
        
        for (let i = 0; i < numParticles; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * plasmaRadius;
          const particleX = centerX + Math.cos(angle) * distance;
          const particleY = centerY + Math.sin(angle) * distance;
          const particleSize = 1 + Math.random() * 2;
          
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
          
          // Energy rays for higher energy output
          if (energyOutput > ENERGY_OUTPUT_RATES[fusionFuel] * 0.5 && Math.random() > 0.8) {
            const rayLength = 10 + Math.random() * 20;
            const rayEndX = particleX + Math.cos(angle) * rayLength;
            const rayEndY = particleY + Math.sin(angle) * rayLength;
            
            ctx.beginPath();
            ctx.moveTo(particleX, particleY);
            ctx.lineTo(rayEndX, rayEndY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }
  };

  const getFuelName = (fuel: FusionFuel): string => {
    switch(fuel) {
      case 'deuterium-tritium': return 'Deuterium-Tritium';
      case 'deuterium-deuterium': return 'Deuterium-Deuterium';
      case 'hydrogen-boron': return 'Wasserstoff-Bor (p-B11)';
      default: return '';
    }
  };

  return (
    <Card className={cn("p-6 bg-white", className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tokamak Fusionsreaktor</h2>
          <Badge 
            variant={fusionStatus !== 'idle' ? "default" : "outline"}
            className={cn(
              "px-3 py-1",
              fusionStatus === 'stable' ? "bg-green-500 hover:bg-green-600" : 
              fusionStatus === 'fusion' ? "bg-blue-500 hover:bg-blue-600" :
              fusionStatus === 'heating' ? "bg-orange-500 hover:bg-orange-600" :
              "text-gray-500"
            )}
          >
            {fusionStatus === 'idle' ? "Inaktiv" : 
             fusionStatus === 'heating' ? "Aufheizphase" :
             fusionStatus === 'fusion' ? "Fusionsreaktion" :
             fusionStatus === 'stable' ? "Stabile Fusion" : 
             "Unbekannt"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Fusion visualizer */}
            <div className="bg-gray-900 rounded-lg p-2 h-[300px] relative">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full"
              />
              
              {/* Step-by-step guide overlay */}
              {stepByStepMode && (
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <div className="bg-black bg-opacity-70 p-3 rounded-lg text-white">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Schritte zur Fusion</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-6 bg-white text-black"
                        onClick={() => setStepByStepMode(false)}
                      >
                        Überspringen
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className={cn(
                        "flex items-center",
                        currentStep === 1 ? "text-white" : currentStep > 1 ? "text-green-400" : "text-gray-400"
                      )}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 bg-gray-800">
                          {currentStep > 1 ? "✓" : "1"}
                        </div>
                        <span className="flex-1">Wähle einen Brennstoff</span>
                        {currentStep === 1 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleCompleteStep(1)}
                          >
                            Weiter
                          </Button>
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex items-center",
                        currentStep === 2 ? "text-white" : currentStep > 2 ? "text-green-400" : "text-gray-400"
                      )}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 bg-gray-800">
                          {currentStep > 2 ? "✓" : "2"}
                        </div>
                        <span className="flex-1">Erhitze das Plasma</span>
                        {currentStep === 2 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleCompleteStep(2)}
                          >
                            Weiter
                          </Button>
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex items-center",
                        currentStep === 3 ? "text-white" : currentStep > 3 ? "text-green-400" : "text-gray-400"
                      )}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 bg-gray-800">
                          {currentStep > 3 ? "✓" : "3"}
                        </div>
                        <span className="flex-1">Erhöhe das Magnetfeld</span>
                        {currentStep === 3 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleCompleteStep(3)}
                          >
                            Weiter
                          </Button>
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex items-center",
                        currentStep === 4 ? "text-white" : currentStep > 4 ? "text-green-400" : "text-gray-400"
                      )}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 bg-gray-800">
                          {currentStep > 4 ? "✓" : "4"}
                        </div>
                        <span className="flex-1">Starte die Fusion</span>
                        {currentStep === 4 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleCompleteStep(4)}
                          >
                            Weiter
                          </Button>
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex items-center",
                        currentStep === 5 ? "text-white" : currentStep > 5 ? "text-green-400" : "text-gray-400"
                      )}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 bg-gray-800">
                          {currentStep > 5 ? "✓" : "5"}
                        </div>
                        <span className="flex-1">Optimiere für stabile Fusion</span>
                        {currentStep === 5 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleCompleteStep(5)}
                          >
                            Fertig
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Empty state message */}
              {fusionStatus === 'idle' && !stepByStepMode && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white text-lg font-medium text-center bg-black bg-opacity-50 p-4 rounded-lg">
                    Drücke "Fusion starten", um einen Fusionsversuch zu beginnen
                  </p>
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  className={cn(
                    "flex flex-col h-auto py-2",
                    fusionFuel === 'deuterium-tritium' && "border-2 border-primary"
                  )}
                  variant="outline"
                  onClick={() => setFusionFuel('deuterium-tritium')}
                  disabled={fusionStatus !== 'idle'}
                >
                  <Atom className="h-6 w-6 mb-1" />
                  <span className="text-xs">D-T</span>
                </Button>
                
                <Button 
                  className={cn(
                    "flex flex-col h-auto py-2",
                    fusionFuel === 'deuterium-deuterium' && "border-2 border-primary"
                  )}
                  variant="outline"
                  onClick={() => setFusionFuel('deuterium-deuterium')}
                  disabled={fusionStatus !== 'idle'}
                >
                  <Atom className="h-6 w-6 mb-1" />
                  <span className="text-xs">D-D</span>
                </Button>
                
                <Button 
                  className={cn(
                    "flex flex-col h-auto py-2",
                    fusionFuel === 'hydrogen-boron' && "border-2 border-primary"
                  )}
                  variant="outline"
                  onClick={() => setFusionFuel('hydrogen-boron')}
                  disabled={fusionStatus !== 'idle'}
                >
                  <Atom className="h-6 w-6 mb-1" />
                  <span className="text-xs">p-B11</span>
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-1 text-red-500" />
                      <span>Temperatur</span>
                    </div>
                    <span className="text-sm font-bold">{temperature.toFixed(0)} Mio. °C</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (temperature / FUSION_THRESHOLDS[fusionFuel]) * 100)} 
                    className={cn(
                      "h-2",
                      temperature >= FUSION_THRESHOLDS[fusionFuel] ? "bg-blue-200" : "bg-red-200"
                    )}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{FUSION_THRESHOLDS[fusionFuel]} Mio. °C</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <Magnet className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Magnetfeld</span>
                    </div>
                    <span className="text-sm font-bold">{magneticField.toFixed(0)} Tesla</span>
                  </div>
                  <Slider
                    value={[magneticField]}
                    onValueChange={values => setMagneticField(values[0])}
                    max={100}
                    step={1}
                    disabled={fusionStatus === 'idle'}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <ArrowDownCircle className="h-4 w-4 mr-1 text-purple-500" />
                      <span>Plasmaeinschluss</span>
                    </div>
                    <span className="text-sm font-bold">{plasmaConfinement.toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={plasmaConfinement} 
                    className={cn(
                      "h-2",
                      plasmaConfinement >= 80 ? "bg-green-200" : 
                      plasmaConfinement >= 50 ? "bg-blue-200" : 
                      plasmaConfinement >= 30 ? "bg-yellow-200" : "bg-red-200"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-medium mb-2">Gewählter Brennstoff: {getFuelName(fusionFuel)}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Zündtemperatur:</span>
                  <span>{FUSION_THRESHOLDS[fusionFuel]} Millionen °C</span>
                </div>
                <div className="flex justify-between">
                  <span>Energieausbeute:</span>
                  <span>{ENERGY_OUTPUT_RATES[fusionFuel] * 10} MeV pro Fusion</span>
                </div>
                <div className="flex justify-between">
                  <span>Benötigter Einschluss:</span>
                  <span>{CONFINEMENT_RATES[fusionFuel] * 100}%</span>
                </div>
              </div>
              
              <p className="mt-4 text-sm">
                {fusionFuel === 'deuterium-tritium' ? 
                  "Die D-T Fusion ist die 'einfachste' Fusion mit niedrigerer Zündtemperatur, aber Tritium ist radioaktiv und selten." :
                fusionFuel === 'deuterium-deuterium' ? 
                  "D-D Fusion vermeidet Tritium, benötigt aber höhere Temperaturen und hat geringere Energieausbeute." :
                  "Die aneutrische Proton-Bor-Fusion (p-B11) ist strahlungsarm aber extrem schwer zu erreichen."}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Zap className="h-5 w-5 mr-1 text-yellow-500" />
                  <span>Energieproduktion</span>
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Aktueller Output:</span>
                    <span className="font-bold">{energyOutput.toFixed(1)} MW</span>
                  </div>
                  
                  <Progress 
                    value={Math.min(100, (energyOutput / (ENERGY_OUTPUT_RATES[fusionFuel] * 2)) * 100)} 
                    className="h-3 bg-gray-200"
                  />
                  
                  <div className="text-sm text-center mt-1">
                    {fusionStatus === 'stable' ? (
                      <span className="text-green-600">Stabile Fusionsreaktion!</span>
                    ) : fusionStatus === 'fusion' ? (
                      <span className="text-blue-600">Fusionsreaktion läuft</span>
                    ) : fusionStatus === 'heating' ? (
                      <span className="text-orange-600">Plasma wird erhitzt</span>
                    ) : (
                      <span className="text-gray-600">Reaktor inaktiv</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-sm bg-blue-50 p-3 rounded-lg mb-4">
                <h4 className="font-medium">Wusstest du?</h4>
                <p className="mt-1">
                  Kernfusion ist der Prozess, der Sterne antreibt. Im Inneren unserer Sonne verschmelzen 
                  bei etwa 15 Millionen Grad Wasserstoffkerne zu Helium, wobei enorme Energiemengen freigesetzt werden.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  className="flex-1" 
                  onClick={startFusion}
                  disabled={fusionStatus !== 'idle'}
                >
                  <Flame className="h-4 w-4 mr-2" />
                  Fusion starten
                </Button>
                
                <Button 
                  className="flex-1" 
                  variant="outline" 
                  onClick={stopFusion}
                  disabled={fusionStatus === 'idle'}
                >
                  Stoppen
                </Button>
                
                {!stepByStepMode && (
                  <Button 
                    className="flex-none" 
                    variant="outline" 
                    onClick={() => {setStepByStepMode(true); setCurrentStep(1);}}
                    disabled={fusionStatus !== 'idle'}
                  >
                    <ArrowRightCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FusionLab;
