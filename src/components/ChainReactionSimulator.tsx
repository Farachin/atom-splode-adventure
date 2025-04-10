import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Atom, Calculator, Play, Square, RotateCcw, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChainReactionSimulatorProps {
  className?: string;
}

type ReactorState = 'subcritical' | 'critical' | 'supercritical' | 'idle';

const ChainReactionSimulator: React.FC<ChainReactionSimulatorProps> = ({ className }) => {
  const [initialNeutrons, setInitialNeutrons] = useState<number>(1);
  const [kFactor, setKFactor] = useState<number>(1.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [neutronCount, setNeutronCount] = useState<number[]>([0]);
  const [reactorState, setReactorState] = useState<ReactorState>('idle');
  const [halfLife, setHalfLife] = useState<number>(5); // in time steps
  const [isDecayMode, setIsDecayMode] = useState<boolean>(false);
  const [decayDuration, setDecayDuration] = useState<number>(100); // total duration to simulate
  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neutronElementsRef = useRef<HTMLDivElement[]>([]);
  const { toast } = useToast();

  const [chartData, setChartData] = useState<Array<{ step: number; neutrons: number }>>([
    { step: 0, neutrons: 0 }
  ]);

  useEffect(() => {
    if (!isSimulating) return;

    const simulationInterval = 1000 / simulationSpeed;
    
    simulationRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        
        if (isDecayMode && nextStep >= decayDuration) {
          if (simulationRef.current) {
            clearInterval(simulationRef.current);
          }
          setIsSimulating(false);
          
          toast({
            title: "Zerfallsprozess abgeschlossen",
            description: `Simulation über ${decayDuration} Jahre abgeschlossen.`,
          });
          
          return nextStep;
        }
        
        return nextStep;
      });
      
      if (isDecayMode) {
        simulateDecay();
      } else {
        simulateChainReaction();
      }
    }, simulationInterval);

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [isSimulating, simulationSpeed, kFactor, isDecayMode, halfLife, decayDuration]);

  useEffect(() => {
    if (canvasRef.current) {
      drawNeutronVisualization();
    }
  }, [neutronCount, currentStep]);

  useEffect(() => {
    if (kFactor < 0.99) {
      setReactorState('subcritical');
    } else if (kFactor > 1.01) {
      setReactorState('supercritical');
    } else {
      setReactorState('critical');
    }
  }, [kFactor]);

  const handleStartSimulation = () => {
    if (isSimulating) return;
    
    if (currentStep > 0) {
      resetSimulation();
    }
    
    setNeutronCount([initialNeutrons]);
    setChartData([{ step: 0, neutrons: initialNeutrons }]);
    setIsSimulating(true);
    
    toast({
      title: isDecayMode ? "Zerfallssimulation gestartet" : "Kettenreaktionssimulation gestartet",
      description: isDecayMode 
        ? `Halbwertszeit: ${halfLife} Jahre` 
        : `Multiplikationsfaktor: ${kFactor.toFixed(2)}`,
    });
  };

  const handleStopSimulation = () => {
    if (!isSimulating) return;
    setIsSimulating(false);
    
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }
    
    toast({
      title: "Simulation angehalten",
      description: `Simulation nach ${currentStep} Schritten gestoppt.`,
    });
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setCurrentStep(0);
    setNeutronCount([0]);
    setChartData([{ step: 0, neutrons: 0 }]);
    
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }
  };

  const simulateChainReaction = () => {
    setNeutronCount(prevNeutronCount => {
      const prevNeutrons = prevNeutronCount[prevNeutronCount.length - 1];
      
      const randomFactor = 0.9 + Math.random() * 0.2;
      const effectiveK = kFactor * randomFactor;
      
      let newNeutrons = Math.round(prevNeutrons * effectiveK);
      
      newNeutrons = Math.max(0, newNeutrons);
      
      const updatedNeutronCount = [...prevNeutronCount, newNeutrons];
      
      setChartData(prevChartData => {
        const updatedChartData = [...prevChartData, { 
          step: prevChartData.length, 
          neutrons: newNeutrons 
        }];
        
        if (updatedChartData.length > 100) {
          return updatedChartData.slice(updatedChartData.length - 100);
        }
        
        return updatedChartData;
      });
      
      if (updatedNeutronCount.length > 50) {
        return updatedNeutronCount.slice(updatedNeutronCount.length - 50);
      }
      
      if (newNeutrons > 1000000) {
        handleStopSimulation();
        toast({
          title: "Simulation überlastet",
          description: "Die Neutronenzahl ist explodiert! Simulation gestoppt.",
          variant: "destructive",
        });
      } else if (newNeutrons === 0 && prevNeutrons > 0) {
        handleStopSimulation();
        toast({
          title: "Reaktion erloschen",
          description: "Alle Neutronen wurden absorbiert oder entkamen. Reaktion erloschen.",
        });
      }
      
      return updatedNeutronCount;
    });
  };

  const simulateDecay = () => {
    setNeutronCount(prevNeutronCount => {
      const prevNeutrons = prevNeutronCount[prevNeutronCount.length - 1];
      
      const decayFactor = Math.pow(0.5, 1 / halfLife);
      let newNeutrons = Math.round(prevNeutrons * decayFactor);
      
      const randomFactor = 0.95 + Math.random() * 0.1;
      newNeutrons = Math.round(newNeutrons * randomFactor);
      
      newNeutrons = Math.max(0, newNeutrons);
      
      const updatedNeutronCount = [...prevNeutronCount, newNeutrons];
      
      setChartData(prevChartData => {
        const updatedChartData = [...prevChartData, { 
          step: prevChartData.length, 
          neutrons: newNeutrons 
        }];
        
        if (updatedChartData.length > 100) {
          return updatedChartData.slice(updatedChartData.length - 100);
        }
        
        return updatedChartData;
      });
      
      if (updatedNeutronCount.length > 50) {
        return updatedNeutronCount.slice(updatedNeutronCount.length - 50);
      }
      
      if (newNeutrons < 1 && prevNeutrons > 0) {
        handleStopSimulation();
        toast({
          title: "Zerfallsprozess abgeschlossen",
          description: "Das Material ist vollständig zerfallen.",
        });
      }
      
      return updatedNeutronCount;
    });
  };

  const drawNeutronVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const currentNeutrons = neutronCount[neutronCount.length - 1] || 0;
    
    const maxVisualNeutrons = 200;
    const visualNeutrons = Math.min(currentNeutrons, maxVisualNeutrons);
    
    for (let i = 0; i < visualNeutrons; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 2 + Math.random() * 3;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDecayMode ? '#e11d48' : '#3b82f6';
      ctx.fill();
    }
    
    if (currentNeutrons > maxVisualNeutrons) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 180, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(`Nur ${maxVisualNeutrons} von ${currentNeutrons} dargestellt`, 15, 30);
    }
  };

  const getStateColor = () => {
    switch (reactorState) {
      case 'subcritical': return 'text-blue-500';
      case 'critical': return 'text-green-500';
      case 'supercritical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}k`;
    }
    return num.toString();
  };

  return (
    <Card className={cn("p-6 bg-white", className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isDecayMode ? "Radioaktiver Zerfall" : "Kettenreaktion"}
          </h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className={cn(
                "px-3 text-sm",
                !isDecayMode && "bg-blue-50 border-blue-200"
              )}
              onClick={() => {
                resetSimulation();
                setIsDecayMode(false);
              }}
            >
              <Atom className="h-4 w-4 mr-1" />
              Kettenreaktion
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "px-3 text-sm",
                isDecayMode && "bg-red-50 border-red-200"
              )}
              onClick={() => {
                resetSimulation();
                setIsDecayMode(true);
              }}
            >
              <Calculator className="h-4 w-4 mr-1" />
              Halbwertszeit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Simulationsparameter</h3>
              
              {isDecayMode ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Anfangsmenge</span>
                      <span>{initialNeutrons} Atome</span>
                    </div>
                    <Slider
                      value={[initialNeutrons]}
                      onValueChange={values => setInitialNeutrons(values[0])}
                      min={1}
                      max={1000}
                      step={1}
                      disabled={isSimulating}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Halbwertszeit</span>
                      <span>{halfLife} Jahre</span>
                    </div>
                    <Slider
                      value={[halfLife]}
                      onValueChange={values => setHalfLife(values[0])}
                      min={1}
                      max={20}
                      step={1}
                      disabled={isSimulating}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Simulationsdauer</span>
                      <span>{decayDuration} Jahre</span>
                    </div>
                    <Slider
                      value={[decayDuration]}
                      onValueChange={values => setDecayDuration(values[0])}
                      min={20}
                      max={200}
                      step={10}
                      disabled={isSimulating}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Anfängliche Neutronen</span>
                      <span>{initialNeutrons}</span>
                    </div>
                    <Slider
                      value={[initialNeutrons]}
                      onValueChange={values => setInitialNeutrons(values[0])}
                      min={1}
                      max={100}
                      step={1}
                      disabled={isSimulating}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Multiplikationsfaktor (k)</span>
                      <span className={getStateColor()}>{kFactor.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[kFactor * 100]}
                      onValueChange={values => setKFactor(values[0] / 100)}
                      min={80}
                      max={200}
                      step={1}
                      disabled={isSimulating}
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>0.8</span>
                      <span>1.0</span>
                      <span>2.0</span>
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <Badge 
                        className={cn(
                          "mr-2",
                          reactorState === 'subcritical' ? "bg-blue-500" :
                          reactorState === 'critical' ? "bg-green-500" :
                          reactorState === 'supercritical' ? "bg-red-500" : ""
                        )}
                      >
                        {reactorState === 'subcritical' ? "Unterkritisch" :
                         reactorState === 'critical' ? "Kritisch" :
                         reactorState === 'supercritical' ? "Überkritisch" : ""}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {reactorState === 'subcritical' ? "Reaktion stirbt ab" :
                         reactorState === 'critical' ? "Stabil" :
                         reactorState === 'supercritical' ? "Unkontrollierte Kettenreaktion" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span>Simulationsgeschwindigkeit</span>
                  <span>x{simulationSpeed}</span>
                </div>
                <Slider
                  value={[simulationSpeed]}
                  onValueChange={values => setSimulationSpeed(values[0])}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 h-[180px] relative">
              <h3 className="font-medium mb-2">Visualisierung</h3>
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full" 
                style={{ top: '30px' }}
              />
              {neutronCount[neutronCount.length - 1] === 0 && currentStep === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm" style={{ top: '30px' }}>
                  Starte die Simulation, um Teilchen zu sehen
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                className={cn(
                  "flex-1",
                  isDecayMode ? "bg-red-500 hover:bg-red-600" : ""
                )}
                onClick={handleStartSimulation}
                disabled={isSimulating}
              >
                <Play className="h-4 w-4 mr-2" />
                {currentStep === 0 ? "Simulation starten" : "Fortsetzen"}
              </Button>
              
              <Button 
                className="flex-1"
                variant="outline"
                onClick={handleStopSimulation}
                disabled={!isSimulating}
              >
                <Square className="h-4 w-4 mr-2" />
                Anhalten
              </Button>
              
              <Button 
                className="aspect-square p-2"
                variant="outline"
                onClick={resetSimulation}
                disabled={isSimulating && currentStep === 0}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Zeitlicher Verlauf</h3>
                <div className="flex items-center">
                  <span className="text-sm mr-2">Schritt:</span>
                  <Badge variant="outline">{currentStep}</Badge>
                </div>
              </div>
              
              <div className="h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="step"
                      label={{ value: isDecayMode ? 'Jahre' : 'Zeit', position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis 
                      label={{ 
                        value: isDecayMode ? 'Atomanzahl' : 'Neutronen', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }}
                      tickFormatter={formatNumber}
                      domain={['auto', 'auto']}
                      allowDataOverflow={true}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatNumber(value), isDecayMode ? 'Atome' : 'Neutronen']}
                      labelFormatter={(label) => isDecayMode ? `Jahr ${label}` : `Schritt ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="neutrons" 
                      name={isDecayMode ? "Atomanzahl" : "Neutronen"}
                      stroke={isDecayMode ? "#e11d48" : "#3b82f6"} 
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 text-center text-sm">
                <div className="font-medium">
                  {isDecayMode ? "Atome verbleibend" : "Aktuelle Neutronen"}:
                  <span className="ml-2 text-lg font-bold">
                    {formatNumber(neutronCount[neutronCount.length - 1] || 0)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <h3 className="font-medium mb-2">Wusstest du?</h3>
              {isDecayMode ? (
                <p>
                  Die Halbwertszeit ist die Zeit, nach der die Hälfte aller radioaktiven Atome zerfallen ist. 
                  Dies folgt einer exponentiellen Funktion: Nach 2 Halbwertszeiten ist nur noch 1/4, nach 3 Halbwertszeiten nur noch 1/8 der ursprünglichen Menge übrig.
                  In dieser Simulation kannst du diesen exponentiellen Abfall deutlich beobachten.
                </p>
              ) : (
                <p>
                  Der Multiplikationsfaktor k bestimmt das Reaktorverhalten:<br />
                  • k &lt; 1: Reaktion stirbt exponentiell ab (unterkritisch)<br />
                  • k = 1: Stabile Reaktion (kritisch)<br />
                  • k &gt; 1: Exponentielles Wachstum (überkritisch)<br />
                  • Bei k = 2: Die Neutronenzahl verdoppelt sich bei jedem Schritt, was zu einer exponentiellen Zunahme führt!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChainReactionSimulator;
