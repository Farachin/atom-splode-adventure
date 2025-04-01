
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnrichmentLabProps {
  onEnrichedUraniumCreated: (amount: number, enrichmentLevel: number) => void;
  className?: string;
}

export const EnrichmentLab = ({ onEnrichedUraniumCreated, className }: EnrichmentLabProps) => {
  const [centrifugeCount, setCentrifugeCount] = useState(1);
  const [centrifugeSpeed, setCentrifugeSpeed] = useState(50);
  const [enrichmentLevel, setEnrichmentLevel] = useState(0.7); // Natural uranium starts at 0.7% U-235
  const [processRunning, setProcessRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedAmount, setFeedAmount] = useState(100); // kg of natural uranium
  const [instability, setInstability] = useState(0);
  const [enrichedOutput, setEnrichedOutput] = useState(0);
  const [depletedOutput, setDepletedOutput] = useState(0);
  const { toast } = useToast();

  // Reset the simulation
  const handleReset = () => {
    setProcessRunning(false);
    setProgress(0);
    setEnrichmentLevel(0.7);
    setInstability(0);
    setEnrichedOutput(0);
    setDepletedOutput(0);
  };

  // Start or stop the enrichment process
  const toggleProcess = () => {
    setProcessRunning(!processRunning);
    
    if (!processRunning) {
      // When starting, show a toast message
      toast({
        title: "Anreicherungsprozess gestartet",
        description: `${centrifugeCount} Zentrifugen mit ${centrifugeSpeed}% Geschwindigkeit.`,
      });
    }
  };

  // Calculate new enrichment level based on current parameters
  useEffect(() => {
    if (!processRunning) return;

    const interval = setInterval(() => {
      // Update progress
      setProgress(prev => {
        const newProgress = prev + 0.5;
        if (newProgress >= 100) {
          setProcessRunning(false);
          
          // Calculate final enrichment
          const finalEnrichment = calculateEnrichment();
          
          // Calculate outputs
          const enrichedAmount = calculateEnrichedOutput();
          const depletedAmount = feedAmount - enrichedAmount;
          
          setEnrichedOutput(enrichedAmount);
          setDepletedOutput(depletedAmount);
          
          // Notify parent component about the enriched uranium
          onEnrichedUraniumCreated(enrichedAmount, finalEnrichment);
          
          // Show completion toast
          toast({
            title: "Anreicherungsprozess abgeschlossen",
            description: `${enrichedAmount.toFixed(2)}kg Uran mit ${finalEnrichment.toFixed(1)}% U-235 Anreicherung erzeugt.`,
          });
          
          return 100;
        }
        return newProgress;
      });
      
      // Update enrichment level during the process
      if (progress % 10 === 0) {
        setEnrichmentLevel(calculateEnrichment());
      }
      
      // Update instability based on centrifuge speed
      if (centrifugeSpeed > 75) {
        setInstability(prev => {
          const speedFactor = (centrifugeSpeed - 75) / 25; // 0 to 1 for speeds 75 to 100
          const newInstability = prev + (Math.random() * speedFactor * 5);
          
          // If instability gets too high, there's a chance of failure
          if (newInstability > 80) {
            setProcessRunning(false);
            toast({
              title: "Zentrifugen-Fehler!",
              description: "Die hohe Geschwindigkeit hat zu einer Instabilität geführt. Material ging verloren.",
              variant: "destructive",
            });
            return 0;
          }
          
          return newInstability;
        });
      } else {
        // Instability decreases at lower speeds
        setInstability(prev => Math.max(0, prev - 0.5));
      }
      
    }, 200);
    
    return () => clearInterval(interval);
  }, [processRunning, progress, centrifugeSpeed, centrifugeCount, feedAmount]);
  
  // Calculate the enrichment level based on current parameters
  const calculateEnrichment = () => {
    // Base enrichment factor per centrifuge stage
    const baseEnrichmentFactor = 1.2;
    
    // Speed factor (higher speeds increase efficiency up to a point)
    const speedFactor = Math.min(1.5, centrifugeSpeed / 60);
    
    // Each centrifuge multiplies the enrichment
    let newEnrichment = 0.7; // Start with natural uranium (0.7% U-235)
    
    for (let i = 0; i < centrifugeCount; i++) {
      newEnrichment *= baseEnrichmentFactor * speedFactor;
    }
    
    // Cap maximum enrichment at 95%
    return Math.min(95, newEnrichment);
  };
  
  // Calculate how much enriched uranium is produced
  const calculateEnrichedOutput = () => {
    // Higher enrichment means less output
    const efficiencyFactor = 100 / enrichmentLevel;
    
    // Base output percentage (decreases as enrichment increases)
    const outputPercentage = 20 / efficiencyFactor;
    
    // Adjust for instability
    const instabilityFactor = Math.max(0.5, 1 - (instability / 100));
    
    return feedAmount * outputPercentage * instabilityFactor;
  };

  // Helper function to generate centrifuges
  const renderCentrifuges = () => {
    const centrifuges = [];
    // Show all centrifuges instead of limiting to 5
    const maxCentrifugesToShow = centrifugeCount;
    
    // Calculate if we need to compress the display
    const isCompressed = centrifugeCount > 8;
    const centrifugeSize = isCompressed ? 12 : 16;
    const marginClass = isCompressed ? "mx-px" : "mx-auto";
    
    for (let i = 0; i < maxCentrifugesToShow; i++) {
      centrifuges.push(
        <div key={i} className="relative">
          <div className={cn(
            `w-${centrifugeSize} h-${centrifugeSize} bg-gray-200 rounded-full border-4 border-gray-400 ${marginClass}`,
            processRunning ? `animate-spin-${centrifugeSpeed}` : ""
          )}>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {Math.min(99, Math.floor(enrichmentLevel * (i+1)/centrifugeCount))}%
            </div>
          </div>
          {i < maxCentrifugesToShow - 1 && 
            <div className="w-6 h-2 bg-gray-400 mx-auto"></div>
          }
        </div>
      );
    }
    return centrifuges;
  };

  // Create custom animation classes for different speeds
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin-${centrifugeSpeed} {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-${centrifugeSpeed} {
        animation: spin-${centrifugeSpeed} ${Math.max(0.1, 2 - (centrifugeSpeed/100)*1.8)}s linear infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [centrifugeSpeed]);

  // Get color based on enrichment level
  const getEnrichmentColor = (level) => {
    if (level < 5) return "bg-green-500";
    if (level < 20) return "bg-lime-500";
    if (level < 50) return "bg-yellow-500";
    if (level < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className={cn('p-4 relative overflow-hidden', className)}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Uran-235 Anreicherung</h3>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Zurücksetzen
          </Button>
        </div>
        
        {/* Visual representation of centrifuges */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
          <div className="text-center mb-2 font-bold">Zentrifugen-Kaskade</div>
          <div className="flex flex-col items-center">
            {/* Input material indicator - centered and improved */}
            <div className="w-24 h-12 bg-yellow-800 rounded-lg mb-4 flex items-center justify-center text-white font-bold shadow-md">
              Natururan
            </div>
            
            {/* Centrifuge animation - scrollable for many centrifuges */}
            <div className={cn(
              "flex flex-row items-center justify-center space-x-2 mb-4",
              centrifugeCount > 8 ? "overflow-x-auto max-w-full pb-2" : ""
            )}>
              {renderCentrifuges()}
            </div>
            
            {/* Output containers with improved visuals */}
            <div className="flex justify-between w-full">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-24 h-24 rounded-lg flex flex-col items-center justify-center text-white font-bold transition-all transform hover:scale-105 shadow-lg",
                  getEnrichmentColor(enrichmentLevel),
                  enrichmentLevel >= 90 ? "animate-pulse-grow" : ""
                )}>
                  <div className="text-xl">{enrichmentLevel.toFixed(1)}%</div>
                  <div className="text-xs mt-1">U-235</div>
                  <div className="mt-2">
                    <span className="text-xs">⭐ Wertvoll ⭐</span>
                  </div>
                </div>
                <div className="text-xs mt-2 font-bold">Angereichertes Uran</div>
                <div className="text-xs">{enrichedOutput.toFixed(1)} kg</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-500 rounded-lg flex flex-col items-center justify-center text-white shadow-md">
                  <div className="text-xl">{(100 - enrichmentLevel).toFixed(1)}%</div>
                  <div className="text-xs mt-1">U-238</div>
                  <div className="mt-2">
                    <span className="text-xs">Abfall</span>
                  </div>
                </div>
                <div className="text-xs mt-2 font-bold">Abgereichertes Uran</div>
                <div className="text-xs">{depletedOutput.toFixed(1)} kg</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Control panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Anzahl der Zentrifugen: {centrifugeCount}</label>
              <Slider 
                disabled={processRunning}
                value={[centrifugeCount]} 
                min={1} 
                max={10} 
                step={1}
                onValueChange={(value) => setCentrifugeCount(value[0])}
                className="mt-2"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Zentrifugengeschwindigkeit: {centrifugeSpeed}%</label>
              <Slider 
                disabled={processRunning}
                value={[centrifugeSpeed]} 
                min={10} 
                max={100} 
                step={5}
                onValueChange={(value) => setCentrifugeSpeed(value[0])}
                className="mt-2"
              />
              {centrifugeSpeed > 75 && (
                <div className="flex items-center mt-1 text-amber-500 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Hohe Geschwindigkeit kann zu Instabilität führen
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Ausgangsmaterial: {feedAmount} kg</label>
              <Slider 
                disabled={processRunning}
                value={[feedAmount]} 
                min={10} 
                max={200} 
                step={10}
                onValueChange={(value) => setFeedAmount(value[0])}
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Enrichment Progress and Results */}
            <div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fortschritt:</span>
                <span className="text-sm">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2 mt-1" />
            </div>
            
            <div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Anreicherungsgrad:</span>
                <span className="text-sm font-bold">{enrichmentLevel.toFixed(1)}% U-235</span>
              </div>
              <Progress 
                value={(enrichmentLevel / 95) * 100} 
                className={cn(
                  "h-2 mt-1",
                  enrichmentLevel >= 90 ? "bg-red-200" : "bg-blue-200"
                )}
              />
              {enrichmentLevel >= 90 && (
                <div className="text-xs text-red-500 mt-1 flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Waffenfähiges Material (≥90%)
                </div>
              )}
              {enrichmentLevel >= 3 && enrichmentLevel < 20 && (
                <div className="text-xs text-blue-500 mt-1">
                  Geeignet für Kernreaktoren (3-20%)
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Instabilität:</span>
                <span className="text-sm">{instability.toFixed(1)}%</span>
              </div>
              <Progress 
                value={instability} 
                className={cn(
                  "h-2 mt-1",
                  instability > 50 ? "bg-orange-200" : "bg-gray-200",
                  instability > 75 ? "bg-red-200" : ""
                )}
              />
              {instability > 50 && (
                <div className="flex justify-center mt-2">
                  <div className={cn(
                    "animate-pulse px-2 py-1 rounded text-xs font-bold",
                    instability > 75 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                  )}>
                    Achtung: Instabilität {instability > 75 ? "sehr hoch!" : "erhöht!"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Control Button */}
        <div className="flex justify-center">
          <Button 
            onClick={toggleProcess}
            className={cn(
              "w-40 h-12 rounded-full text-lg font-bold",
              processRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            )}
          >
            {processRunning ? "Stoppen" : "Starten"}
          </Button>
        </div>
      </div>
      
      {/* Animation of spinning centrifuges */}
      <div className="absolute -bottom-16 -right-16 opacity-5 pointer-events-none">
        <div className={cn(
          "w-32 h-32 border-8 border-gray-800 rounded-full",
          processRunning ? "animate-spin-slow" : ""
        )}>
          <div className="w-full h-full border-8 border-gray-600 rounded-full"></div>
        </div>
      </div>
    </Card>
  );
};

export default EnrichmentLab;
