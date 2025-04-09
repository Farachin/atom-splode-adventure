
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Circle, Zap, Sun, Flame, Star, ArrowUp, ArrowDown, CirclePlus, CircleMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import PlasmaPhase from './MiniSunGame/PlasmaPhase';
import StabilizationPhase from './MiniSunGame/StabilizationPhase';
import FusionPhase from './MiniSunGame/FusionPhase';
import StarMaintenancePhase from './MiniSunGame/StarMaintenancePhase';
import AchievementsPanel from './MiniSunGame/AchievementsPanel';

interface MiniSunGameProps {
  className?: string;
  onEnergyProduced?: (amount: number) => void;
}

type GamePhase = 'plasma' | 'stabilize' | 'fusion' | 'maintain';
type StarType = 'none' | 'red-dwarf' | 'main-sequence' | 'blue-giant' | 'neutron';

// Constants for game physics - lower thresholds for easier gameplay
const MIN_TEMPERATURE = 20; // Room temperature in C
const PLASMA_THRESHOLD = 3000000; // Further lowered for easier gameplay
const FUSION_THRESHOLD = 50000000; // Lowered for easier gameplay
const MAX_TEMPERATURE = 500000000; // 500 million C

const MIN_STABILITY = 0;
const MAX_STABILITY = 100;

const MIN_PRESSURE = 0;
const MAX_PRESSURE = 100;

const MIN_FUEL = 0;
const MAX_FUEL = 100;

const MiniSunGame: React.FC<MiniSunGameProps> = ({ className, onEnergyProduced }) => {
  // Game state
  const [phase, setPhase] = useState<GamePhase>('plasma');
  const [temperature, setTemperature] = useState<number>(MIN_TEMPERATURE);
  const [stability, setStability] = useState<number>(0);
  const [pressure, setPressure] = useState<number>(0);
  const [fuel, setFuel] = useState<number>(100);
  const [energy, setEnergy] = useState<number>(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [starType, setStarType] = useState<StarType>('none');
  const [starSize, setStarSize] = useState<number>(0);
  const [starAge, setStarAge] = useState<number>(0);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  
  // For animation and game loop
  const gameLoopRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const { toast } = useToast();

  // Tutorial steps
  const tutorialSteps = [
    {
      title: "Schritt 1: Plasma erzeugen",
      description: "Um eine Sonne zu erschaffen, musst du zuerst ein super heißes Plasma machen! Klicke und halte gedrückt, um das Gas zu erhitzen. Du brauchst mindestens 3 Millionen Grad!"
    },
    {
      title: "Schritt 2: Plasma stabilisieren",
      description: "Super! Jetzt musst du das heiße Plasma zusammenhalten. Verwende Magnetfelder, damit es nicht entweicht. Stabilität über 80% erreichen!"
    },
    {
      title: "Schritt 3: Fusion starten",
      description: "Fast geschafft! Jetzt erhöhe den Druck auf die Wasserstoffatome, damit sie zusammenstoßen und verschmelzen. Druck auf 90% erhöhen!"
    },
    {
      title: "Schritt 4: Deine Mini-Sonne pflegen",
      description: "Toll gemacht! Deine Sonne brennt jetzt. Halte sie am Leben, indem du Brennstoff hinzufügst, wenn er niedrig wird."
    }
  ];

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'plasma' && temperature >= PLASMA_THRESHOLD) {
      toast({
        title: "Plasma erzeugt!",
        description: "Das Gas ist jetzt ionisiert und ein Plasma. Stabilisiere es mit Magnetfeldern!",
        variant: "default",
      });
      setPhase('stabilize');
      setTutorialStep(1);
    } else if (phase === 'stabilize' && stability >= 80 && temperature >= FUSION_THRESHOLD) {
      toast({
        title: "Plasma ist stabil!",
        description: "Jetzt kannst du den Druck erhöhen, um die Fusion zu starten!",
        variant: "default",
      });
      setPhase('fusion');
      setTutorialStep(2);
    } else if (phase === 'fusion' && pressure >= 90 && temperature >= FUSION_THRESHOLD) {
      // First fusion achieved
      if (starType === 'none') {
        toast({
          title: "Fusion gestartet!",
          description: "Deine Mini-Sonne beginnt zu leuchten! Halte sie am Leben.",
          variant: "default",
        });
        setStarType('red-dwarf');
        unlockAchievement('first-fusion');
        setPhase('maintain');
        setTutorialStep(3);
      }
    }
  }, [temperature, stability, pressure, phase, starType, toast]);

  // Game loop
  useEffect(() => {
    if (!gameActive) return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTickRef.current) / 1000; // in seconds
      lastTickRef.current = now;

      // Update game state based on current phase
      if (phase === 'plasma') {
        // Temperature slowly drops unless being heated - EXTREMELY reduced cooling rate
        setTemperature(prev => Math.max(MIN_TEMPERATURE, prev - (100000 * deltaTime))); // Further reduced cooling
      } else if (phase === 'stabilize') {
        // Temperature drops faster, stability decreases - EXTREMELY reduced cooling rate
        setTemperature(prev => Math.max(MIN_TEMPERATURE, prev - (200000 * deltaTime))); // Further reduced cooling
        setStability(prev => Math.max(0, prev - (2 * deltaTime))); // Reduced stability loss
        
        // If temperature drops below plasma threshold, go back to plasma phase
        if (temperature < PLASMA_THRESHOLD) {
          setPhase('plasma');
          setTutorialStep(0);
          toast({
            title: "Plasma verloren!",
            description: "Die Temperatur ist zu niedrig. Erhitze das Gas wieder!",
            variant: "default",
          });
        }
      } else if (phase === 'fusion') {
        // Temperature and stability drop, pressure drops - EXTREMELY reduced rates
        setTemperature(prev => Math.max(MIN_TEMPERATURE, prev - (300000 * deltaTime))); // Further reduced cooling
        setStability(prev => Math.max(0, prev - (2 * deltaTime))); // Reduced stability loss
        setPressure(prev => Math.max(0, prev - (3 * deltaTime))); // Reduced pressure loss
        
        // If stability or temperature gets too low, go back to appropriate phase
        if (stability < 30) {
          setPhase('stabilize');
          setTutorialStep(1);
          toast({
            title: "Instabil!",
            description: "Das Plasma wird instabil. Stabilisiere es wieder!",
            variant: "default",
          });
        } else if (temperature < PLASMA_THRESHOLD) {
          setPhase('plasma');
          setTutorialStep(0);
          toast({
            title: "Plasma verloren!",
            description: "Die Temperatur ist zu niedrig. Erhitze das Gas wieder!",
            variant: "default",
          });
        }
      } else if (phase === 'maintain') {
        // Your star burns fuel and produces energy
        const fuelConsumptionRate = getStarFuelConsumption(starType);
        const energyProductionRate = getStarEnergyProduction(starType);
        
        setFuel(prev => Math.max(0, prev - (fuelConsumptionRate * deltaTime)));
        setEnergy(prev => prev + (energyProductionRate * deltaTime));
        setStarAge(prev => prev + deltaTime);
        
        // Pass energy to parent component
        if (onEnergyProduced) {
          onEnergyProduced(energyProductionRate * deltaTime * 0.1); // Scale down for game balance
        }
        
        // If fuel runs out, star dies
        if (fuel <= 0) {
          starDeath();
        }
        
        // Evolve star based on age
        evolveStarBasedOnAge();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameActive, phase, temperature, stability, pressure, fuel, starType, onEnergyProduced]);

  // Helper functions
  const getStarFuelConsumption = (type: StarType): number => {
    switch (type) {
      case 'red-dwarf': return 2;
      case 'main-sequence': return 5;
      case 'blue-giant': return 15;
      case 'neutron': return 0.5;
      default: return 0;
    }
  };

  const getStarEnergyProduction = (type: StarType): number => {
    switch (type) {
      case 'red-dwarf': return 5;
      case 'main-sequence': return 15;
      case 'blue-giant': return 50;
      case 'neutron': return 25;
      default: return 0;
    }
  };

  const getStarName = (type: StarType): string => {
    switch (type) {
      case 'red-dwarf': return 'Roter Zwerg';
      case 'main-sequence': return 'Hauptreihenstern';
      case 'blue-giant': return 'Blauer Riese';
      case 'neutron': return 'Neutronenstern';
      default: return 'Keine Sonne';
    }
  };

  const evolveStarBasedOnAge = () => {
    if (starType === 'red-dwarf' && starAge > 30 && fuel > 50) {
      setStarType('main-sequence');
      setStarSize(prev => prev + 1);
      unlockAchievement('main-sequence');
      toast({
        title: "Sternevolution!",
        description: "Dein Roter Zwerg hat sich zu einem Hauptreihenstern entwickelt!",
        variant: "default",
      });
    } else if (starType === 'main-sequence' && starAge > 60 && fuel > 70) {
      setStarType('blue-giant');
      setStarSize(prev => prev + 2);
      unlockAchievement('blue-giant');
      toast({
        title: "Sternevolution!",
        description: "Dein Stern ist jetzt ein massiver Blauer Riese!",
        variant: "default",
      });
    }
  };

  const starDeath = () => {
    if (starType === 'blue-giant') {
      // Supernova explosion
      toast({
        title: "Supernova!",
        description: "Dein Blauer Riese ist in einer spektakulären Supernova explodiert!",
        variant: "default",
      });
      unlockAchievement('supernova');
      setStarType('neutron');
      setStarSize(1);
      
      // Some leftover fuel from explosion
      setFuel(20);
    } else {
      // Normal star death
      toast({
        title: "Stern erloschen",
        description: "Deine Sonne hat keinen Brennstoff mehr und ist erloschen.",
        variant: "default",
      });
      resetGame();
    }
  };

  const unlockAchievement = (id: string) => {
    if (!achievements.includes(id)) {
      setAchievements(prev => [...prev, id]);
      
      const achievementNames: Record<string, string> = {
        'first-fusion': 'Erster Lichtblick',
        'main-sequence': 'Sonnengleich',
        'blue-giant': 'Gigantische Leistung',
        'perfect-stability': 'Plasma-Meister',
        'long-life': 'Mini-Sternenforscher',
        'supernova': 'Supernova-Entdecker'
      };
      
      toast({
        title: "Erfolg freigeschaltet!",
        description: achievementNames[id] || id,
        variant: "default",
      });
    }
  };

  const startGame = () => {
    setGameActive(true);
    setShowTutorial(false);
    resetGame();
  };

  const resetGame = () => {
    setPhase('plasma');
    setTemperature(MIN_TEMPERATURE);
    setStability(0);
    setPressure(0);
    setFuel(100);
    setStarType('none');
    setStarSize(0);
    setStarAge(0);
    setTutorialStep(0);
  };

  const handleAddFuel = () => {
    if (phase === 'maintain') {
      setFuel(prev => Math.min(MAX_FUEL, prev + 20));
      toast({
        title: "Brennstoff hinzugefügt",
        description: "Deine Sonne hat neuen Wasserstoff bekommen.",
        variant: "default",
      });
    }
  };
  
  // Get appropriate color for temperature display
  const getTemperatureColor = () => {
    if (temperature < 100000) return "text-blue-500";
    if (temperature < 1000000) return "text-purple-500";
    if (temperature < 10000000) return "text-orange-500";
    return "text-red-500";
  };
  
  // Format temperature for display
  const formatTemperature = () => {
    if (temperature < 1000) {
      return `${temperature.toFixed(0)} °C`;
    } else if (temperature < 1000000) {
      return `${(temperature / 1000).toFixed(1)} Tausend °C`;
    } else {
      return `${(temperature / 1000000).toFixed(1)} Mio. °C`;
    }
  };

  return (
    <Card className={cn("p-6 bg-gradient-to-b from-blue-50 to-indigo-50 overflow-hidden shadow-lg", className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Bau deine eigene Mini-Sonne!
          </h2>
          
          {starType !== 'none' ? (
            <Badge 
              variant="outline"
              className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500"
            >
              {getStarName(starType)}
            </Badge>
          ) : (
            <Badge variant="outline" className="px-3 py-1">
              Keine Sonne
            </Badge>
          )}
        </div>

        {showTutorial ? (
          <div className="space-y-4 text-center py-8 animate-fade-in">
            <Sun className="w-16 h-16 mx-auto text-yellow-500 animate-pulse" />
            <h3 className="text-xl font-bold">Willkommen zum Mini-Sonnen-Baukasten!</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Erschaffe deine eigene funktionierende Mini-Sonne! Du wirst durch alle Schritte geführt, 
              um eine echte Kernfusion zu erzeugen - genau wie unsere Sonne.
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-4">
              <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shadow">
                <Circle className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                <h4 className="font-medium">Plasma erzeugen</h4>
                <p className="text-xs text-gray-500">Erhitze Wasserstoff auf Millionen Grad</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors shadow">
                <Zap className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                <h4 className="font-medium">Plasma stabilisieren</h4>
                <p className="text-xs text-gray-500">Halte das Plasma mit Magnetfeldern zusammen</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors shadow">
                <Flame className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                <h4 className="font-medium">Fusion starten</h4>
                <p className="text-xs text-gray-500">Presse die Atomkerne zusammen</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors shadow">
                <Sun className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                <h4 className="font-medium">Sonne pflegen</h4>
                <p className="text-xs text-gray-500">Halte deine Mini-Sonne am Leuchten</p>
              </div>
            </div>
            
            <Button 
              className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
              size="lg"
              onClick={startGame}
            >
              Los geht's!
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative h-64 md:h-80 rounded-lg bg-gradient-to-b from-black to-blue-900 overflow-hidden flex items-center justify-center shadow-md">
                {phase === 'plasma' && (
                  <PlasmaPhase 
                    temperature={temperature} 
                    onTemperatureChange={setTemperature}
                  />
                )}
                
                {phase === 'stabilize' && (
                  <StabilizationPhase 
                    temperature={temperature}
                    stability={stability}
                    onTemperatureChange={setTemperature}
                    onStabilityChange={setStability}
                  />
                )}
                
                {phase === 'fusion' && (
                  <FusionPhase 
                    temperature={temperature}
                    stability={stability}
                    pressure={pressure}
                    onTemperatureChange={setTemperature}
                    onStabilityChange={setStability}
                    onPressureChange={setPressure}
                  />
                )}
                
                {phase === 'maintain' && (
                  <StarMaintenancePhase 
                    temperature={temperature}
                    stability={stability}
                    fuel={fuel}
                    starType={starType}
                    starSize={starSize}
                    onTemperatureChange={setTemperature}
                    onStabilityChange={setStability}
                    onFuelChange={setFuel}
                  />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <Flame className="w-4 h-4 mr-1 text-red-500" />
                        Temperatur
                      </span>
                      <span className={`text-sm font-bold ${getTemperatureColor()}`}>
                        {formatTemperature()}
                      </span>
                    </div>
                    <Progress 
                      value={(temperature / MAX_TEMPERATURE) * 100} 
                      className="h-2 bg-gray-200"
                      style={{
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
                        opacity: temperature > 100000 ? 1 : 0.3
                      }}
                    />
                    {temperature >= FUSION_THRESHOLD ? (
                      <span className="text-xs text-green-500 font-semibold">Fusionstemperatur erreicht! ✓</span>
                    ) : temperature >= PLASMA_THRESHOLD ? (
                      <span className="text-xs text-blue-500">Plasma erzeugt</span>
                    ) : (
                      <span className="text-xs text-gray-500">Zu kalt für Plasma</span>
                    )}
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <Zap className="w-4 h-4 mr-1 text-purple-500" />
                        Stabilität
                      </span>
                      <span className="text-sm font-bold">{stability.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={stability} 
                      className="h-2 bg-gray-200"
                      style={{
                        background: stability >= 80 ? '#10b981' : 
                                    stability >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                    {stability >= 80 ? (
                      <span className="text-xs text-green-500 font-semibold">Perfekt stabil ✓</span>
                    ) : stability >= 50 ? (
                      <span className="text-xs text-yellow-500">Relativ stabil</span>
                    ) : (
                      <span className="text-xs text-red-500">Instabil</span>
                    )}
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <ArrowDown className="w-4 h-4 mr-1 text-blue-500" />
                        Druck
                      </span>
                      <span className="text-sm font-bold">{pressure.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={pressure} 
                      className="h-2 bg-gray-200"
                      style={{
                        background: pressure >= 90 ? '#10b981' : 
                                   pressure >= 50 ? '#f59e0b' : '#3b82f6'
                      }}
                    />
                    {pressure >= 90 ? (
                      <span className="text-xs text-green-500 font-semibold">Fusionsdruck erreicht! ✓</span>
                    ) : pressure >= 50 ? (
                      <span className="text-xs text-yellow-500">Mittlerer Druck</span>
                    ) : (
                      <span className="text-xs text-gray-500">Niedriger Druck</span>
                    )}
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <CirclePlus className="w-4 h-4 mr-1 text-green-500" />
                        Brennstoff
                      </span>
                      <span className="text-sm font-bold">{fuel.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={fuel} 
                      className="h-2 bg-gray-200"
                      style={{
                        background: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)',
                        opacity: fuel / 100
                      }}
                    />
                    {fuel <= 10 ? (
                      <span className="text-xs text-red-500 font-semibold animate-pulse">Kritisch niedrig!</span>
                    ) : fuel <= 30 ? (
                      <span className="text-xs text-orange-500">Brennstoff niedrig</span>
                    ) : (
                      <span className="text-xs text-green-500">Ausreichend Brennstoff</span>
                    )}
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 shadow-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium flex items-center">
                      <Sun className="w-4 h-4 mr-1 text-yellow-500" />
                      Energieproduktion
                    </span>
                    <span>{energy.toFixed(0)} MJ</span>
                  </div>
                  <Progress 
                    value={Math.min(100, energy / 100)} 
                    className="h-2 bg-gray-200"
                    style={{
                      background: 'linear-gradient(to right, #fbbf24, #f97316)',
                    }}
                  />
                </div>
                
                <div className="flex space-x-2">
                  {phase === 'maintain' && (
                    <Button 
                      onClick={handleAddFuel}
                      className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white shadow"
                      disabled={fuel >= MAX_FUEL}
                    >
                      <CirclePlus className="w-4 h-4 mr-2" />
                      Brennstoff hinzufügen
                    </Button>
                  )}
                  
                  <Button 
                    onClick={resetGame}
                    variant="outline" 
                    className="flex-1 hover:bg-gray-100"
                  >
                    Neustart
                  </Button>
                </div>
                
                <AchievementsPanel achievements={achievements} />
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
              <h3 className="font-medium mb-2 flex items-center">
                {phase === 'plasma' && <Flame className="w-5 h-5 mr-2 text-red-500" />}
                {phase === 'stabilize' && <Zap className="w-5 h-5 mr-2 text-purple-500" />}
                {phase === 'fusion' && <ArrowDown className="w-5 h-5 mr-2 text-blue-500" />}
                {phase === 'maintain' && <Sun className="w-5 h-5 mr-2 text-yellow-500" />}
                {tutorialSteps[tutorialStep].title}
              </h3>
              <p className="text-sm text-gray-700">
                {tutorialSteps[tutorialStep].description}
              </p>
              
              {/* Progress bars for current goal */}
              <div className="mt-3">
                {phase === 'plasma' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Ziel: {(PLASMA_THRESHOLD / 1000000).toFixed(1)} Mio. °C</span>
                      <span>{Math.min(100, (temperature / PLASMA_THRESHOLD) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (temperature / PLASMA_THRESHOLD) * 100)} 
                      className="h-1.5"
                    />
                  </div>
                )}
                
                {phase === 'stabilize' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Ziel: 80% Stabilität</span>
                      <span>{Math.min(100, (stability / 80) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (stability / 80) * 100)} 
                      className="h-1.5"
                    />
                  </div>
                )}
                
                {phase === 'fusion' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Ziel: 90% Druck</span>
                      <span>{Math.min(100, (pressure / 90) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (pressure / 90) * 100)} 
                      className="h-1.5"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default MiniSunGame;
