
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Zap, Fan, Atom, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import ReactorVisualizer from './ReactorVisualizer';

interface ReactorLabProps {
  energy: number;
  onEnergyProduced: (amount: number) => void;
  className?: string;
}

type ReactorType = 'pressurized-water' | 'fast-breeder' | 'fusion';
type CoolantType = 'water' | 'sodium' | 'helium';

const MAX_TEMPERATURE = 2000; // degrees C
const MELTDOWN_TEMPERATURE = 1800; // degrees C
const OPTIMAL_TEMPERATURE = {
  'pressurized-water': 330, // degrees C
  'fast-breeder': 550, // degrees C
  'fusion': 150000000, // degrees C (fusion plasma)
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
      }

      // Calculate cooling effect based on coolant type and flow
      let coolingEffect = 0;
      
      if (coolantType === 'water') {
        coolingEffect = coolantFlow * 8; // Max 800 cooling units
      } else if (coolantType === 'sodium') {
        coolingEffect = coolantFlow * 12; // Max 1200 cooling units
      } else if (coolantType === 'helium') {
        coolingEffect = coolantFlow * 5; // Max 500 cooling units
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
  }, [isRunning, reactorType, coolantType, controlRodLevel, coolantFlow, temperature]);

  // Check reactor stability based on temperature
  const checkReactorStability = (temp: number) => {
    if (temp >= MELTDOWN_TEMPERATURE) {
      setIsStable(false);
      setIsRunning(false);
      toast({
        title: "Reaktor Kernschmelze!",
        description: "Die Temperatur ist zu hoch gestiegen. Der Reaktor ist geschmolzen!",
        variant: "destructive",
      });
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
      default: return '';
    }
  };

  // Get coolant name in German
  const getCoolantName = (type: CoolantType): string => {
    switch(type) {
      case 'water': return 'Wasser';
      case 'sodium': return 'Flüssiges Natrium';
      case 'helium': return 'Helium-Gas';
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
              </TabsContent>
              
              <TabsContent value="cooling" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className={cn(
                      "h-24 flex-col items-center justify-center space-y-2 text-left",
                      coolantType === 'water' ? "border-4 border-primary" : "border",
                      reactorType === 'fusion' ? "opacity-50" : ""
                    )}
                    variant="outline"
                    onClick={() => reactorType !== 'fusion' && setCoolantType('water')}
                    disabled={reactorType === 'fusion' || isRunning}
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
                      reactorType === 'fusion' ? "opacity-50" : ""
                    )}
                    variant="outline"
                    onClick={() => reactorType !== 'fusion' && setCoolantType('sodium')}
                    disabled={reactorType === 'fusion' || isRunning}
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
                      coolantType === 'helium' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => setCoolantType('helium')}
                    disabled={isRunning}
                  >
                    <div className="flex items-center">
                      <Fan className="h-5 w-5 mr-2 text-purple-500" />
                      <span className="font-bold">Helium-Gas</span>
                    </div>
                    <p className="text-xs text-gray-500">Für Hochtemperatur-Reaktoren, weniger effizient</p>
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
                  </div>
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
