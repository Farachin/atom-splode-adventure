
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Zap, Fan, Atom, AlertTriangle, Flask, Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import ReactorVisualizer from './ReactorVisualizer';

interface ReactorLabProps {
  energy: number;
  onEnergyProduced: (amount: number) => void;
  className?: string;
}

type ReactorType = 'pressurized-water' | 'fast-breeder' | 'fusion' | 'thorium-msr';
type CoolantType = 'water' | 'sodium' | 'helium' | 'molten-salt';

const MAX_TEMPERATURE = 2000; // degrees C
const MELTDOWN_TEMPERATURE = 1800; // degrees C
const OPTIMAL_TEMPERATURE = {
  'pressurized-water': 330, // degrees C
  'fast-breeder': 550, // degrees C
  'fusion': 150000000, // degrees C (fusion plasma)
  'thorium-msr': 700, // degrees C (molten salt)
};

const ReactorLab: React.FC<ReactorLabProps> = ({ energy, onEnergyProduced, className }) => {
  const [reactorType, setReactorType] = useState<ReactorType>('pressurized-water');
  const [coolantType, setCoolantType] = useState<CoolantType>('water');
  const [controlRodLevel, setControlRodLevel] = useState<number>(50);
  const [coolantFlow, setCoolantFlow] = useState<number>(50);
  const [temperature, setTemperature] = useState<number>(25); // start at room temp
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [energyOutput, setEnergyOutput] = useState<number>(0);
  const [efficiency, setEfficiency] = useState<number>(0);
  const [isStable, setIsStable] = useState<boolean>(true);
  const [warningLevel, setWarningLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [showSafetyFeature, setShowSafetyFeature] = useState<boolean>(false);
  const [emergencyDrainActive, setEmergencyDrainActive] = useState<boolean>(false);
  const { toast } = useToast();

  // Effects for reactor simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Calculate heat generation based on reactor type and control rod level
      let heatGeneration = 0;
      
      if (reactorType === 'pressurized-water') {
        heatGeneration = (100 - controlRodLevel) * 10; // Max 1000 heat units
      } else if (reactorType === 'fast-breeder') {
        heatGeneration = (100 - controlRodLevel) * 15; // Max 1500 heat units
      } else if (reactorType === 'fusion') {
        // Fusion is harder to start but produces more energy
        if (temperature < 100000000) {
          heatGeneration = (100 - controlRodLevel) * 100000; // Initial plasma heating
        } else {
          heatGeneration = (100 - controlRodLevel) * 30; // Max 3000 heat units when plasma is hot
        }
      } else if (reactorType === 'thorium-msr') {
        // Thorium MSR heat generation - increases with temperature up to a point, then decreases (passive safety)
        const normalizedTemp = Math.min(1, temperature / 900); // Peak efficiency around 900°C
        const safetyFactor = temperature > 900 ? Math.max(0.1, 1 - (temperature - 900) / 500) : 1;
        heatGeneration = (100 - controlRodLevel) * 12 * normalizedTemp * safetyFactor;
        
        // Safety feature for thorium MSR - as temperature rises beyond optimal, reaction slows down
        if (temperature > 900 && !showSafetyFeature && Math.random() > 0.8) {
          setShowSafetyFeature(true);
          toast({
            title: "Tolle Sicherheit!",
            description: "Der Thoriumreaktor verlangsamt die Reaktion automatisch, wenn er zu heiß wird!",
          });
          
          // Hide safety message after a while
          setTimeout(() => {
            setShowSafetyFeature(false);
          }, 5000);
        }
        
        // Emergency drain for MSR - if temperature gets dangerously high
        if (temperature > 1400 && !emergencyDrainActive) {
          setEmergencyDrainActive(true);
          toast({
            title: "Notablauf aktiviert!",
            description: "Das heiße Salz fließt in den Sicherheitsbehälter und stoppt die Reaktion!",
            variant: "default",
          });
          
          // Stop reactor after a short delay to simulate drain
          setTimeout(() => {
            setIsRunning(false);
            setEmergencyDrainActive(false);
            setTemperature(prev => Math.max(400, prev - 400)); // Cool down but still hot
          }, 2000);
        }
      }

      // Calculate cooling effect based on coolant type and flow
      let coolingEffect = 0;
      
      if (coolantType === 'water') {
        coolingEffect = coolantFlow * 8; // Max 800 cooling units
      } else if (coolantType === 'sodium') {
        coolingEffect = coolantFlow * 12; // Max 1200 cooling units
      } else if (coolantType === 'helium') {
        coolingEffect = coolantFlow * 5; // Max 500 cooling units
      } else if (coolantType === 'molten-salt') {
        coolingEffect = coolantFlow * 10; // Max 1000 cooling units
      }

      // Calculate new temperature
      const temperatureChange = heatGeneration - coolingEffect;
      const newTemperature = Math.max(25, Math.min(MAX_TEMPERATURE, temperature + temperatureChange / 10));
      setTemperature(newTemperature);

      // Check for stability and meltdown
      checkReactorStability(newTemperature);

      // Calculate energy output based on temperature and reactor type
      calculateEnergyOutput(newTemperature);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, reactorType, coolantType, controlRodLevel, coolantFlow, temperature, showSafetyFeature, emergencyDrainActive]);

  // Check reactor stability based on temperature
  const checkReactorStability = (temp: number) => {
    // Thorium MSR can't have a traditional meltdown, but can still overheat
    const meltdownThreshold = reactorType === 'thorium-msr' ? MELTDOWN_TEMPERATURE * 1.1 : MELTDOWN_TEMPERATURE;
    
    if (temp >= meltdownThreshold) {
      setIsStable(false);
      setIsRunning(false);
      
      // Different messages for different reactor types
      if (reactorType === 'thorium-msr') {
        toast({
          title: "Reaktor überhitzt!",
          description: "Das Flüssigsalz ist zu heiß geworden und hat die Rohre beschädigt. Der Reaktor wurde gestoppt.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reaktor Kernschmelze!",
          description: "Die Temperatur ist zu hoch gestiegen. Der Reaktor ist geschmolzen!",
          variant: "destructive",
        });
      }
      return;
    }

    // Determine warning level based on temperature
    const optimalTemp = OPTIMAL_TEMPERATURE[reactorType];
    const tempDiff = Math.abs(temp - optimalTemp);
    const tempPercentage = tempDiff / optimalTemp;

    if (tempPercentage > 0.5 || temp > MELTDOWN_TEMPERATURE * 0.9) {
      setWarningLevel('high');
    } else if (tempPercentage > 0.3) {
      setWarningLevel('medium');
    } else if (tempPercentage > 0.1) {
      setWarningLevel('low');
    } else {
      setWarningLevel('none');
    }

    setIsStable(true);
  };

  // Calculate energy output based on temperature and reactor type
  const calculateEnergyOutput = (temp: number) => {
    let output = 0;
    let eff = 0;
    const optimalTemp = OPTIMAL_TEMPERATURE[reactorType];

    if (reactorType === 'pressurized-water') {
      // PWR efficiency peaks around optimal temperature
      const tempRatio = Math.min(1, temp / optimalTemp);
      eff = tempRatio * (1 - Math.abs(temp - optimalTemp) / optimalTemp) * 0.35; // Max 35% efficiency
      output = eff * temp * 0.5;
    } else if (reactorType === 'fast-breeder') {
      // Fast breeder has higher efficiency but needs higher temperature
      const tempRatio = Math.min(1, temp / optimalTemp);
      eff = tempRatio * (1 - Math.abs(temp - optimalTemp) / optimalTemp) * 0.4; // Max 40% efficiency
      output = eff * temp * 0.7;
    } else if (reactorType === 'fusion') {
      // Fusion needs very high temperature to start, but then has great efficiency
      if (temp > 100000000) {
        const tempRatio = Math.min(1, temp / optimalTemp);
        eff = tempRatio * 0.5; // Max 50% efficiency
        output = eff * temp * 0.001; // Scale down the enormous numbers
      } else {
        eff = 0;
        output = 0;
      }
    } else if (reactorType === 'thorium-msr') {
      // Thorium MSR operates at high temperature with good efficiency
      const tempRatio = Math.min(1, temp / optimalTemp);
      
      // Efficiency curve - peaks at optimal then falls off if too hot
      if (temp < optimalTemp) {
        eff = tempRatio * 0.45; // Ramp up to 45% max efficiency
      } else {
        // Gradually decrease efficiency if too hot, but still decent
        eff = Math.max(0.1, 0.45 * (1 - (temp - optimalTemp) / 800));
      }
      
      output = eff * temp * 0.6;
      
      // Emergency drain causes output to drop
      if (emergencyDrainActive) {
        output *= 0.3; // Rapidly decreasing output
      }
    }

    setEfficiency(eff * 100); // Convert to percentage
    setEnergyOutput(output);
    onEnergyProduced(output / 100); // Scale down for game balance
  };

  // Start the reactor
  const handleStartReactor = () => {
    if (isRunning) return;
    setIsRunning(true);
    toast({
      title: "Reaktor gestartet",
      description: `${getReactorName(reactorType)} läuft jetzt.`,
    });
  };

  // Stop the reactor
  const handleStopReactor = () => {
    if (!isRunning) return;
    setIsRunning(false);
    toast({
      title: "Reaktor angehalten",
      description: "Der Reaktor wurde sicher heruntergefahren.",
    });
  };

  // Reset the reactor after meltdown
  const handleResetReactor = () => {
    setTemperature(25);
    setIsStable(true);
    setWarningLevel('none');
    setEnergyOutput(0);
    setEfficiency(0);
    setEmergencyDrainActive(false);
    toast({
      title: "Reaktor zurückgesetzt",
      description: "Der Reaktor wurde neu aufgebaut und ist bereit für den Start.",
    });
  };

  // Get reactor name in German
  const getReactorName = (type: ReactorType): string => {
    switch(type) {
      case 'pressurized-water': return 'Druckwasserreaktor';
      case 'fast-breeder': return 'Schneller Brüter';
      case 'fusion': return 'Fusionsreaktor';
      case 'thorium-msr': return 'Thorium-Flüssigsalzreaktor';
      default: return '';
    }
  };

  // Get coolant name in German
  const getCoolantName = (type: CoolantType): string => {
    switch(type) {
      case 'water': return 'Wasser';
      case 'sodium': return 'Flüssiges Natrium';
      case 'helium': return 'Helium-Gas';
      case 'molten-salt': return 'Flüssigsalz';
      default: return '';
    }
  };

  // Get temperature display based on reactor type
  const getTemperatureDisplay = (): string => {
    if (reactorType === 'fusion' && temperature > 1000000) {
      return `${(temperature / 1000000).toFixed(1)} Mio °C`;
    }
    return `${temperature.toFixed(0)} °C`;
  };

  // Get warning color based on warning level
  const getWarningColor = (): string => {
    switch(warningLevel) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      case 'none': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("p-6 bg-white", className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reaktor-Konstruktion</h2>
          <Badge 
            variant={isRunning ? "default" : "outline"}
            className={cn(
              "px-3 py-1",
              isRunning ? "bg-green-500 hover:bg-green-600" : "text-gray-500"
            )}
          >
            {isRunning ? "Aktiv" : "Inaktiv"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Reactor visualizer */}
            <ReactorVisualizer 
              temperature={temperature}
              coolantFlow={coolantFlow}
              controlRodLevel={controlRodLevel}
              isRunning={isRunning}
              coolantType={coolantType}
              efficiency={efficiency}
              reactorType={reactorType}
              isStable={isStable}
              warningLevel={warningLevel}
              className="h-64 mb-4"
              emergencyDrainActive={emergencyDrainActive}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Thermometer className="h-5 w-5 mr-2 text-red-500" />
                    <span className="font-medium">Temperatur</span>
                  </div>
                  <span className={cn(
                    "font-bold",
                    temperature > MELTDOWN_TEMPERATURE * 0.9 ? "text-red-500" : 
                    temperature > MELTDOWN_TEMPERATURE * 0.7 ? "text-orange-500" : "text-gray-700"
                  )}>
                    {getTemperatureDisplay()}
                  </span>
                </div>
                <Progress value={(temperature / MAX_TEMPERATURE) * 100} className={getWarningColor()} />
                {warningLevel === 'high' && (
                  <div className="flex items-center mt-2 text-red-500 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>Kritisch! Kühlung erhöhen!</span>
                  </div>
                )}
                {reactorType === 'thorium-msr' && showSafetyFeature && (
                  <div className="flex items-center mt-2 text-green-500 text-sm animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span>Sicherheitssystem aktiv!</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    <span className="font-medium">Energieausbeute</span>
                  </div>
                  <span className="font-bold text-gray-700">{energyOutput.toFixed(1)} MW</span>
                </div>
                <Progress value={efficiency} className="bg-gray-200" />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>Wirkungsgrad: {efficiency.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-4">
              {isStable ? (
                <>
                  <Button 
                    className="flex-1" 
                    onClick={handleStartReactor}
                    disabled={isRunning}
                  >
                    Reaktor starten
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline" 
                    onClick={handleStopReactor}
                    disabled={!isRunning}
                  >
                    Reaktor stoppen
                  </Button>
                </>
              ) : (
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600" 
                  onClick={handleResetReactor}
                >
                  Reaktor wieder aufbauen
                </Button>
              )}
            </div>
          </div>
          
          <div>
            <Tabs defaultValue="reactor-type" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="reactor-type">Reaktortyp</TabsTrigger>
                <TabsTrigger value="cooling">Kühlsystem</TabsTrigger>
                <TabsTrigger value="control">Steuerung</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reactor-type" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      reactorType === 'pressurized-water' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => {
                      setReactorType('pressurized-water');
                      setCoolantType('water');
                    }}
                    disabled={isRunning}
                  >
                    <div className="flex items-center">
                      <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-bold">Druckwasserreaktor</span>
                    </div>
                    <p className="text-xs text-gray-500">Sicher & zuverlässig, niedrige Effizienz</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      reactorType === 'fast-breeder' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => {
                      setReactorType('fast-breeder');
                      setCoolantType('sodium');
                    }}
                    disabled={isRunning}
                  >
                    <div className="flex items-center">
                      <Atom className="h-5 w-5 mr-2 text-purple-500" />
                      <span className="font-bold">Schneller Brüter</span>
                    </div>
                    <p className="text-xs text-gray-500">Erzeugt Plutonium, höhere Effizienz</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      reactorType === 'fusion' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => {
                      setReactorType('fusion');
                      setCoolantType('helium');
                    }}
                    disabled={isRunning}
                  >
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                      <span className="font-bold">Fusionsreaktor</span>
                    </div>
                    <p className="text-xs text-gray-500">Sehr hohe Effizienz, schwer zu starten</p>
                  </Button>

                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      reactorType === 'thorium-msr' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => {
                      setReactorType('thorium-msr');
                      setCoolantType('molten-salt');
                    }}
                    disabled={isRunning}
                  >
                    <div className="flex items-center">
                      <Flask className="h-5 w-5 mr-2 text-orange-400" />
                      <span className="font-bold">Thoriumreaktor</span>
                    </div>
                    <p className="text-xs text-gray-500">Flüssigsalz, sicherer, weniger Müll</p>
                  </Button>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 text-sm">
                  <h3 className="font-medium mb-2">Info: {getReactorName(reactorType)}</h3>
                  {reactorType === 'pressurized-water' && (
                    <p>Verwendet Wasser unter hohem Druck als Kühlmittel und Moderator. 
                      Ein sicherer Reaktortyp, der in den meisten Kernkraftwerken verwendet wird.</p>
                  )}
                  {reactorType === 'fast-breeder' && (
                    <p>Nutzt schnelle Neutronen und flüssiges Natrium als Kühlmittel. Kann neuen Brennstoff (Plutonium) 
                      erzeugen, während er Energie produziert.</p>
                  )}
                  {reactorType === 'fusion' && (
                    <p>Verschmilzt Wasserstoffisotope zu Helium, ähnlich wie in der Sonne. 
                      Benötigt extrem hohe Temperaturen und starke Magnetfelder, produziert aber viel Energie.</p>
                  )}
                  {reactorType === 'thorium-msr' && (
                    <p>Thorium ist ein besonderes Metall aus dem Boden. Es macht Energie, aber ganz anders als Uran! 
                      Der Reaktor verwendet Flüssigsalz statt Wasser und wird bei niedrigerem Druck betrieben. 
                      Er stoppt automatisch, wenn er zu heiß wird!</p>
                  )}
                </div>

                {reactorType === 'thorium-msr' && (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm relative overflow-hidden">
                    <div className="flex space-x-2 items-center mb-3">
                      <div className="w-4 h-4 rounded-full bg-orange-300 animate-pulse"></div>
                      <h3 className="font-medium text-orange-700">Der Thorium-Flüssigsalzreaktor</h3>
                    </div>
                    
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><span className="font-medium">Sicherer:</span> Wenn's zu heiß wird, stoppt der Reaktor von selbst!</li>
                      <li><span className="font-medium">Kein Hochdruck:</span> Weil wir Salz statt Wasser benutzen, kann es nicht explodieren!</li>
                      <li><span className="font-medium">Weniger Müll:</span> Macht viel weniger radioaktiven Abfall als normale Reaktoren.</li>
                      <li><span className="font-medium">Notablauf:</span> Bei Problemen fließt das Salz in einen sicheren Behälter.</li>
                    </ul>
                    
                    <div className="mt-3 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs text-green-700">Wissenschaftler sagen: Vielleicht der Reaktor der Zukunft!</span>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="cooling" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-{reactorType === 'thorium-msr' ? '4' : '3'} gap-4">
                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      coolantType === 'water' ? "border-4 border-primary" : "border",
                      (reactorType === 'fusion' || reactorType === 'thorium-msr') ? "opacity-50" : ""
                    )}
                    variant="outline"
                    onClick={() => (reactorType !== 'fusion' && reactorType !== 'thorium-msr') && setCoolantType('water')}
                    disabled={reactorType === 'fusion' || reactorType === 'thorium-msr' || isRunning}
                  >
                    <div className="flex items-center">
                      <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-bold">Wasser</span>
                    </div>
                    <p className="text-xs text-gray-500">Gute Kühlung, sicher</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      coolantType === 'sodium' ? "border-4 border-primary" : "border",
                      (reactorType === 'fusion' || reactorType === 'thorium-msr') ? "opacity-50" : ""
                    )}
                    variant="outline"
                    onClick={() => (reactorType !== 'fusion' && reactorType !== 'thorium-msr') && setCoolantType('sodium')}
                    disabled={reactorType === 'fusion' || reactorType === 'thorium-msr' || isRunning}
                  >
                    <div className="flex items-center">
                      <Thermometer className="h-5 w-5 mr-2 text-orange-500" />
                      <span className="font-bold">Flüssiges Natrium</span>
                    </div>
                    <p className="text-xs text-gray-500">Sehr effiziente Kühlung, reagiert mit Wasser</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      coolantType === 'helium' ? "border-4 border-primary" : "border",
                      reactorType === 'thorium-msr' ? "opacity-50" : ""
                    )}
                    variant="outline"
                    onClick={() => reactorType !== 'thorium-msr' && setCoolantType('helium')}
                    disabled={reactorType === 'thorium-msr' || isRunning}
                  >
                    <div className="flex items-center">
                      <Fan className="h-5 w-5 mr-2 text-purple-500" />
                      <span className="font-bold">Helium-Gas</span>
                    </div>
                    <p className="text-xs text-gray-500">Für Hochtemperatur-Reaktoren, weniger effizient</p>
                  </Button>

                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      coolantType === 'molten-salt' ? "border-4 border-primary" : "border",
                      reactorType !== 'thorium-msr' ? "opacity-50" : ""
                    )}
                    variant="outline"
                    onClick={() => reactorType === 'thorium-msr' && setCoolantType('molten-salt')}
                    disabled={reactorType !== 'thorium-msr' || isRunning}
                  >
                    <div className="flex items-center">
                      <Beaker className="h-5 w-5 mr-2 text-orange-400" />
                      <span className="font-bold">Flüssigsalz</span>
                    </div>
                    <p className="text-xs text-gray-500">Für Thoriumreaktor, wird sehr heiß, verdampft nicht</p>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Kühlmittelfluss</span>
                      <span>{coolantFlow}%</span>
                    </div>
                    <Slider
                      value={[coolantFlow]}
                      onValueChange={values => setCoolantFlow(values[0])}
                      max={100}
                      step={1}
                      disabled={!isStable || !isRunning}
                    />
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 text-sm">
                    <h3 className="font-medium mb-2">Info: {getCoolantName(coolantType)}</h3>
                    {coolantType === 'water' && (
                      <p>Wasser hat eine hohe Wärmekapazität und ist ein guter Moderator für thermische Reaktoren. 
                        Es kann jedoch bei zu hoher Temperatur verdampfen.</p>
                    )}
                    {coolantType === 'sodium' && (
                      <p>Flüssiges Natrium überträgt Wärme sehr effizient und siedet erst bei 883°C. 
                        Es reagiert jedoch heftig mit Wasser und Luft.</p>
                    )}
                    {coolantType === 'helium' && (
                      <p>Helium ist chemisch inert und eignet sich für Hochtemperaturreaktoren. 
                        Es hat jedoch eine geringere Wärmekapazität als Flüssigkeiten.</p>
                    )}
                    {coolantType === 'molten-salt' && (
                      <p>Flüssigsalz wird sehr heiß (700-800°C), ohne zu verdampfen. Es kann den Brennstoff direkt aufnehmen 
                      und leitet Wärme sehr gut. Bei Problemen kann das Salz einfach in einen sicheren Behälter abgelassen werden.</p>
                    )}
                  </div>

                  {coolantType === 'molten-salt' && (
                    <div className="relative p-4 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center mb-2">
                        <Beaker className="h-5 w-5 mr-2 text-orange-500" />
                        <span className="font-medium">Wie funktioniert ein Flüssigsalzreaktor?</span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p>1. Thorium wird im heißen Flüssigsalz gelöst (statt feste Brennstäbe)</p>
                        <p>2. Neutronen treffen auf Thorium-232 und es wird zu Uran-233</p>
                        <p>3. Uran-233 spaltet sich und macht Energie, das Salz wird heiß</p>
                        <p>4. Das heiße Salz fließt durch Rohre zum Wärmetauscher</p>
                        <p>5. Bei Problemen: Salz fließt in Sicherheitsbehälter - Stopp!</p>
                      </div>

                      <div className="absolute -right-2 -bottom-2 opacity-20">
                        <Flask className="h-16 w-16 text-orange-300" />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="control" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Steuerstäbe (Eintauchtiefe)</span>
                      <span>{controlRodLevel}%</span>
                    </div>
                    <Slider
                      value={[controlRodLevel]}
                      onValueChange={values => setControlRodLevel(values[0])}
                      max={100}
                      step={1}
                      disabled={!isStable || !isRunning}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Höherer Wert = mehr Kontrolle, weniger Reaktionen
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 text-sm">
                    <h3 className="font-medium mb-2">Kontrollinformationen</h3>
                    <p>Steuerstäbe absorbieren Neutronen und verlangsamen so die Kettenreaktion. 
                      Tiefer eingetauchte Stäbe (höherer Wert) reduzieren die Reaktionsrate und Wärmeerzeugung.</p>
                  </div>

                  {reactorType === 'thorium-msr' && (
                    <div className="bg-green-50 rounded-lg p-4 text-sm border border-green-100">
                      <h3 className="font-medium mb-2 text-green-700">Vergleich: Uran vs. Thorium</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded border border-red-100">
                          <div className="font-medium text-red-700 mb-1">Uranreaktor:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            <li>Viel radioaktiver Müll</li>
                            <li>Kann überhitzen und schmelzen</li>
                            <li>Benötigt hohen Druck</li>
                            <li>Braucht viel Notfallschutz</li>
                          </ul>
                        </div>
                        
                        <div className="p-3 bg-white rounded border border-green-100">
                          <div className="font-medium text-green-700 mb-1">Thoriumreaktor:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            <li>Weniger radioaktiver Müll</li>
                            <li>Stoppt automatisch bei Überhitzung</li>
                            <li>Niedriger Druck, keine Explosion</li>
                            <li>Hat eingebaute Sicherheitsfeatures</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-center text-green-700 font-medium">
                        Thoriumreaktoren machen viel Energie und fast keinen Müll. Die Wissenschaftler denken: 
                        Vielleicht ist das der Reaktor der Zukunft!
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReactorLab;

