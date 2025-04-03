import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Gauge, 
  Magnet, 
  Zap, 
  ArrowRight, 
  PlayCircle, 
  PauseCircle, 
  RotateCcw,
  HelpCircle,
  ThumbsUp
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FusionLabProps {
  energy: number;
  onEnergyProduced: (amount: number) => void;
  className?: string;
}

const FusionLab = ({ energy, onEnergyProduced, className }: FusionLabProps) => {
  // Parameters for fusion
  const [temperature, setTemperature] = useState(10); // in Million K
  const [magneticField, setMagneticField] = useState(5); // in Tesla
  const [plasmaDensity, setPlasmaDensity] = useState(30); // in %
  
  // Operating parameters
  const [isRunning, setIsRunning] = useState(false);
  const [plasmaPressure, setPlasmaPressure] = useState(0);
  const [plasmaStability, setPlasmaStability] = useState(100); // % - starts stable
  const [energyOutput, setEnergyOutput] = useState(0);
  const [totalEnergyProduced, setTotalEnergyProduced] = useState(0);
  const [fusionReactionRate, setFusionReactionRate] = useState(0);
  const [fusionAchieved, setFusionAchieved] = useState(false);
  const [fusionSustained, setFusionSustained] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("d-t");
  
  // Guidance system
  const [showGuidance, setShowGuidance] = useState(true);
  const [guidanceStep, setGuidanceStep] = useState(1);
  const [guidanceCompleted, setGuidanceCompleted] = useState(false);
  
  // Animation frame reference
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();
  
  // Set initial parameters based on fusion type
  useEffect(() => {
    if (activeTab === "d-t") {
      // Deuterium-Tritium fusion - easier
      setTemperature(10);
      setMagneticField(5);
      setPlasmaDensity(30);
    } else if (activeTab === "d-d") {
      // Deuterium-Deuterium fusion - harder
      setTemperature(12);
      setMagneticField(6);
      setPlasmaDensity(40);
    } else {
      // p-B11 fusion - hardest
      setTemperature(15);
      setMagneticField(8);
      setPlasmaDensity(50);
    }
    
    setFusionAchieved(false);
    setFusionSustained(false);
    setSuccessMessage("");
    setTotalEnergyProduced(0);
    setPlasmaStability(100);
    stopReactor();
  }, [activeTab]);

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) return;
    
    // Calculate pressure from temperature and density
    const pressure = (temperature * plasmaDensity) / 100;
    setPlasmaPressure(pressure);
    
    // Calculate stability
    const idealMagneticField = Math.sqrt(pressure) * 2.5;
    const fieldDifference = Math.abs(magneticField - idealMagneticField);
    const stabilityFactor = 1 - (fieldDifference / idealMagneticField) * 0.8;
    const newStability = Math.max(0, Math.min(100, stabilityFactor * 100));
    setPlasmaStability(newStability);
    
    // Calculate fusion reaction rate
    let reactionRate = 0;
    
    if (activeTab === "d-t") {
      // D-T fusion conditions: T > 10M K, reasonable stability
      if (temperature >= 10 && newStability > 60) {
        reactionRate = (temperature - 9) * (plasmaDensity / 100) * (newStability / 100);
      }
    } else if (activeTab === "d-d") {
      // D-D fusion conditions: T > 12M K, higher stability
      if (temperature >= 12 && newStability > 70) {
        reactionRate = (temperature - 11) * (plasmaDensity / 100) * (newStability / 100) * 0.7;
      }
    } else {
      // p-B11 fusion conditions: T > 15M K, very high stability
      if (temperature >= 15 && newStability > 80) {
        reactionRate = (temperature - 14) * (plasmaDensity / 100) * (newStability / 100) * 0.5;
      }
    }
    
    // Make kid-friendly by being more forgiving with parameters
    reactionRate = Math.max(0, reactionRate * 1.5); // Boost reaction rate by 50%
    setFusionReactionRate(reactionRate);
    
    // Energy output based on reaction rate
    let energyOut = 0;
    if (reactionRate > 0) {
      // Energy calculation based on fusion type
      if (activeTab === "d-t") {
        energyOut = reactionRate * 3; // D-T produces most energy
      } else if (activeTab === "d-d") {
        energyOut = reactionRate * 2; // D-D produces medium energy
      } else {
        energyOut = reactionRate * 2.5; // p-B11 produces less but cleaner energy
      }
      
      // Make it easier to generate energy for kids
      energyOut = Math.max(0, energyOut * 1.5);
      
      // Update total energy
      const newTotalEnergy = totalEnergyProduced + energyOut;
      setTotalEnergyProduced(newTotalEnergy);
      
      // Call the parent component's handler to update global energy
      onEnergyProduced(energyOut / 10);
    }
    setEnergyOutput(energyOut);
    
    // Check for fusion achievement
    if (reactionRate > 1 && !fusionAchieved) {
      setFusionAchieved(true);
      toast({
        title: "Fusion erreicht!",
        description: "Die Kernfusion hat begonnen! Halte die Plasmastabilität aufrecht.",
      });
      setSuccessMessage("Fusion erreicht! 🌟");
      
      // Complete guidance step 3 if active
      if (guidanceStep === 3 && showGuidance) {
        setGuidanceStep(4);
      }
    }
    
    // Check for sustained fusion
    if (reactionRate > 1 && isRunning && plasmaStability > 70 && !fusionSustained && totalEnergyProduced > 50) {
      setFusionSustained(true);
      toast({
        title: "Stabile Fusion!",
        description: "Du hast eine stabile Fusionsreaktion erzeugt - wie in einem Stern!",
        variant: "default"
      });
      setSuccessMessage("Stabile Fusion wie in einem Stern! 🌞");
      
      // Complete guidance if active
      if (showGuidance) {
        setGuidanceStep(5);
        setTimeout(() => {
          setGuidanceCompleted(true);
          setShowGuidance(false);
        }, 3000);
      }
    }
    
    // Update plasma visualization
    updatePlasmaVisualization();
    
    // Instabilities and challenges - but make them more forgiving for kids
    if (newStability < 30 && Math.random() < 0.05) {
      // 5% chance of plasma disruption at low stability
      plasmaDisruption();
    }
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(updateSimulation);
  }, [isRunning, temperature, magneticField, plasmaDensity, activeTab]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Simulation update function
  const updateSimulation = () => {
    // This just triggers the useEffect above to run again
    setIsRunning(prevState => prevState);
  };
  
  // Handle plasma disruption event
  const plasmaDisruption = () => {
    if (Math.random() < 0.7) { // Make disruptions less likely
      return; // 70% chance to ignore disruption for kid-friendliness
    }
    
    toast({
      title: "Plasma-Instabilität",
      description: "Das Plasma ist instabil geworden. Passe das Magnetfeld an!",
      variant: "destructive"
    });
    setPlasmaStability(Math.max(30, plasmaStability - 20));
  };
  
  // Start fusion reactor
  const startReactor = () => {
    if (!isRunning) {
      setIsRunning(true);
      animationRef.current = requestAnimationFrame(updateSimulation);
      
      // Progress guidance if active
      if (guidanceStep === 2 && showGuidance) {
        setGuidanceStep(3);
      }
    }
  };
  
  // Stop fusion reactor
  const stopReactor = () => {
    if (isRunning) {
      setIsRunning(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setEnergyOutput(0);
    }
  };
  
  // Reset reactor
  const resetReactor = () => {
    stopReactor();
    setTotalEnergyProduced(0);
    setPlasmaStability(100);
    setFusionAchieved(false);
    setFusionSustained(false);
    setSuccessMessage("");
    
    // Reset guidance to step 1 if not completed
    if (showGuidance && !guidanceCompleted) {
      setGuidanceStep(1);
    }
  };
  
  // Update plasma visualization
  const updatePlasmaVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw tokamak reactor (donut shape)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(canvas.width, canvas.height) * 0.4;
    const innerRadius = outerRadius * 0.6;
    
    // Draw outer reactor shell
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
    
    // Draw inner reactor chamber
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    
    if (isRunning) {
      // Draw plasma
      const plasmaRadius = innerRadius * (0.5 + (plasmaDensity / 200));
      
      // Plasma color based on temperature
      let plasmaColor = '#f97316'; // Default orange
      
      if (temperature < 8) {
        plasmaColor = '#f59e0b'; // Amber
      } else if (temperature < 12) {
        plasmaColor = '#f97316'; // Orange
      } else if (temperature < 15) {
        plasmaColor = '#ef4444'; // Red
      } else {
        plasmaColor = '#ec4899'; // Pink (very hot)
      }
      
      // Add a glow effect
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, plasmaRadius
      );
      gradient.addColorStop(0, plasmaColor);
      gradient.addColorStop(0.7, plasmaColor);
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, plasmaRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw fusion reactions (small bright spots) if fusion is happening
      if (fusionReactionRate > 0) {
        const numReactions = Math.floor(fusionReactionRate * 5) + 1;
        for (let i = 0; i < numReactions; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * plasmaRadius * 0.8;
          const reactionX = centerX + Math.cos(angle) * distance;
          const reactionY = centerY + Math.sin(angle) * distance;
          const reactionSize = 2 + Math.random() * 4;
          
          ctx.beginPath();
          ctx.arc(reactionX, reactionY, reactionSize, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          // Add fusion glow
          ctx.beginPath();
          ctx.arc(reactionX, reactionY, reactionSize * 2, 0, Math.PI * 2);
          const glowGradient = ctx.createRadialGradient(
            reactionX, reactionY, 0,
            reactionX, reactionY, reactionSize * 2
          );
          glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }
      }
      
      // Draw magnetic field lines
      const numFieldLines = Math.ceil(magneticField) * 2;
      for (let i = 0; i < numFieldLines; i++) {
        const angle = (i / numFieldLines) * Math.PI * 2;
        const fieldRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
        
        ctx.beginPath();
        ctx.ellipse(
          centerX, centerY,
          fieldRadius, fieldRadius * 0.3,
          angle, 0, Math.PI * 2
        );
        ctx.strokeStyle = `rgba(59, 130, 246, ${magneticField / 10})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    
    // Draw instability waves if stability is low
    if (isRunning && plasmaStability < 70) {
      const waveCount = Math.floor((100 - plasmaStability) / 10);
      for (let i = 0; i < waveCount; i++) {
        const startAngle = Math.random() * Math.PI * 2;
        const arcLength = (Math.random() * 0.5 + 0.2) * Math.PI;
        const waveRadius = innerRadius * 0.8 * (0.5 + (plasmaDensity / 200));
        
        ctx.beginPath();
        ctx.arc(
          centerX, centerY, waveRadius,
          startAngle, startAngle + arcLength
        );
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  };
  
  // Get optimal parameter hints for guidance
  const getOptimalTemperature = () => {
    switch (activeTab) {
      case "d-t": return "10-15";
      case "d-d": return "12-18";
      case "p-b11": return "15-20";
      default: return "10-15";
    }
  };
  
  const getOptimalMagneticField = () => {
    // Simplified for kids: ~sqrt(pressure) * 2.5
    const pressure = (temperature * plasmaDensity) / 100;
    const optimal = Math.sqrt(pressure) * 2.5;
    return `${Math.floor(optimal - 0.5)}-${Math.ceil(optimal + 0.5)}`;
  };
  
  // Guidance system components
  const renderGuidance = () => {
    if (!showGuidance || guidanceCompleted) return null;
    
    const steps = [
      {
        title: "Starte hier!",
        content: "Willkommen im Fusionslabor! Wir werden wie ein Stern Wasserstoffatome verschmelzen."
      },
      {
        title: "Stelle die Parameter ein",
        content: `Erhöhe die Temperatur auf ${getOptimalTemperature()} Millionen Grad und passe das Magnetfeld auf ${getOptimalMagneticField()} Tesla an.`
      },
      {
        title: "Starte den Reaktor",
        content: "Drücke den 'Reaktor starten' Knopf um die Fusion zu beginnen!"
      },
      {
        title: "Halte das Plasma stabil",
        content: "Super! Halte das Magnetfeld angepasst, damit das Plasma stabil bleibt. Die Stabilität sollte über 70% bleiben."
      },
      {
        title: "Fusion erreicht!",
        content: "Herzlichen Glückwunsch! Du hast erfolgreich eine Fusionsreaktion wie in einem Stern erzeugt!"
      }
    ];
    
    const currentStep = steps[guidanceStep - 1];
    
    return (
      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center bg-blue-500 text-white rounded-full w-6 h-6 text-xs font-bold">
              {guidanceStep}
            </span>
            <h3 className="font-medium">{currentStep.title}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowGuidance(false)}
            className="text-xs h-6"
          >
            Schließen
          </Button>
        </div>
        <p className="mt-1 text-blue-800">{currentStep.content}</p>
        
        {guidanceStep === 5 && (
          <div className="mt-2 flex justify-center">
            <ThumbsUp className="text-blue-500 w-6 h-6 mr-2" />
            <span className="font-bold text-blue-700">Gut gemacht!</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Fusionslabor</h2>
        
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-8 h-8 p-0"
                  onClick={() => setShowGuidance(!showGuidance)}
                >
                  <HelpCircle size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Anleitung {showGuidance ? "ausblenden" : "anzeigen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="ml-2">
            <TabsList>
              <TabsTrigger value="d-t" className="text-xs px-2 py-1">D-T Fusion</TabsTrigger>
              <TabsTrigger value="d-d" className="text-xs px-2 py-1">D-D Fusion</TabsTrigger>
              <TabsTrigger value="p-b11" className="text-xs px-2 py-1">p-B11 Fusion</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {renderGuidance()}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-2">
          <div className="aspect-square relative bg-gray-900 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            
            {!isRunning && !fusionAchieved && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button 
                  size="lg" 
                  onClick={startReactor}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Reaktor starten
                </Button>
              </div>
            )}
            
            {fusionAchieved && (
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {successMessage}
                </div>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 p-2 rounded text-white text-xs">
              <div className="flex justify-between">
                <div>
                  <Gauge className="inline-block mr-1 h-3 w-3" /> 
                  Temperatur: {temperature.toFixed(1)} Mio. K
                </div>
                <div>
                  <Magnet className="inline-block mr-1 h-3 w-3" /> 
                  Magnetfeld: {magneticField.toFixed(1)} T
                </div>
                <div>
                  <Zap className="inline-block mr-1 h-3 w-3" /> 
                  Energie: {energyOutput.toFixed(1)} MW
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button 
              className={cn("flex-1", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600")}
              onClick={isRunning ? stopReactor : startReactor}
            >
              {isRunning ? (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Reaktor anhalten
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Reaktor starten
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={resetReactor} disabled={isRunning && fusionReactionRate > 0}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Zurücksetzen
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Reaktorsteuerung</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Temperatur</span>
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 mr-1 text-orange-500" />
                    <span>{temperature.toFixed(1)} Mio. K</span>
                  </div>
                </div>
                <Slider
                  value={[temperature]}
                  min={5}
                  max={20}
                  step={0.1}
                  onValueChange={(values) => setTemperature(values[0])}
                  disabled={!isRunning}
                />
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Kühl</span>
                  <span>Mittel</span>
                  <span>Sehr heiß</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Magnetfeld</span>
                  <div className="flex items-center">
                    <Magnet className="w-4 h-4 mr-1 text-blue-500" />
                    <span>{magneticField.toFixed(1)} Tesla</span>
                  </div>
                </div>
                <Slider 
                  value={[magneticField]}
                  min={1}
                  max={10}
                  step={0.1}
                  onValueChange={(values) => setMagneticField(values[0])}
                  disabled={!isRunning}
                />
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Schwach</span>
                  <span>Optimal: {getOptimalMagneticField()}</span>
                  <span>Stark</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Plasmadichte</span>
                  <div className="flex items-center">
                    <span>{plasmaDensity}%</span>
                  </div>
                </div>
                <Slider 
                  value={[plasmaDensity]}
                  min={10}
                  max={70}
                  step={1}
                  onValueChange={(values) => setPlasmaDensity(values[0])}
                  disabled={!isRunning}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Reaktorstatus</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Plasmadruck</span>
                  <span>{plasmaPressure.toFixed(1)} bar</span>
                </div>
                <Progress value={plasmaPressure * 5} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Plasmastabilität</span>
                  <span className={cn(
                    plasmaStability < 40 ? "text-red-500" : 
                    plasmaStability < 70 ? "text-orange-500" : 
                    "text-green-500"
                  )}>
                    {plasmaStability.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={plasmaStability} 
                  className={cn(
                    "h-2",
                    plasmaStability < 40 ? "bg-red-200" : 
                    plasmaStability < 70 ? "bg-orange-200" : 
                    "bg-green-200"
                  )}
                  indicatorClassName={cn(
                    plasmaStability < 40 ? "bg-red-500" : 
                    plasmaStability < 70 ? "bg-orange-500" : 
                    "bg-green-500"
                  )}
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fusionsrate</span>
                  <span>{fusionReactionRate.toFixed(2)} fus/s</span>
                </div>
                <Progress value={fusionReactionRate * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Energieausbeute</span>
                  <span>{energyOutput.toFixed(1)} MW</span>
                </div>
                <Progress value={energyOutput * 2} className="h-2" />
              </div>
              
              <div className="pt-2 text-center">
                <div className="text-sm font-medium">Gesamtenergie erzeugt</div>
                <div className="text-2xl font-bold mt-1 text-blue-600">
                  {totalEnergyProduced.toFixed(0)} MJ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <TabsContent value="d-t" className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium mb-2">Deuterium-Tritium Fusion</h3>
        <p className="text-sm">
          Die D-T Fusion ist die einfachste Fusionsreaktion und benötigt die niedrigsten Temperaturen 
          (ca. 10-15 Millionen Grad). Sie setzt viel Energie frei, aber erzeugt auch Neutronen, die das Reaktormaterial
          radioaktiv machen können.
        </p>
        <div className="mt-2 text-center text-sm">
          <span className="font-mono">²H + ³H <ArrowRight className="inline-block mx-1 h-3 w-3" /> ⁴He + n + 17,6 MeV</span>
        </div>
      </TabsContent>
      
      <TabsContent value="d-d" className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium mb-2">Deuterium-Deuterium Fusion</h3>
        <p className="text-sm">
          Die D-D Fusion verwendet nur Deuterium, das aus Meerwasser gewonnen werden kann. Sie benötigt 
          höhere Temperaturen (ca. 12-18 Millionen Grad) als D-T Fusion und setzt weniger Energie frei.
        </p>
        <div className="mt-2 text-center text-sm">
          <span className="font-mono">²H + ²H <ArrowRight className="inline-block mx-1 h-3 w-3" /> ³He + n + 3,27 MeV</span>
        </div>
      </TabsContent>
      
      <TabsContent value="p-b11" className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium mb-2">Proton-Bor Fusion</h3>
        <p className="text-sm">
          Die p-B11 Fusion verwendet Wasserstoff und Bor und benötigt extrem hohe Temperaturen 
          (ca. 15-20 Millionen Grad). Sie erzeugt keine Neutronen und daher keine Radioaktivität, 
          was sie sehr umweltfreundlich macht.
        </p>
        <div className="mt-2 text-center text-sm">
          <span className="font-mono">¹H + ¹¹B <ArrowRight className="inline-block mx-1 h-3 w-3" /> 3 ⁴He + 8,7 MeV</span>
        </div>
      </TabsContent>
    </Card>
  );
};

export default FusionLab;
