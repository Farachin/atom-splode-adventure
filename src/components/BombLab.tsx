import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Bomb, AlertTriangle, Radiation, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BombLabProps {
  availableUranium235: number;
  uranium235Enrichment: number;
  availablePlutonium239: number;
  totalEnergy: number;
  onDetonation: (yieldValue: number, type: string) => void;
  className?: string;
}

export const BombLab = ({ 
  availableUranium235,
  uranium235Enrichment,
  availablePlutonium239,
  totalEnergy,
  onDetonation,
  className 
}: BombLabProps) => {
  const [bombType, setBombType] = useState<'uranium' | 'plutonium'>('uranium');
  const [designType, setDesignType] = useState<'gun' | 'implosion'>('gun');
  const [isArmed, setIsArmed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isDetonating, setIsDetonating] = useState(false);
  const [detonationProgress, setDetonationProgress] = useState(0);
  const [yieldEstimate, setYieldEstimate] = useState(0);
  const { toast } = useToast();

  const criticalMasses = {
    uranium: {
      gun: 56, // kg for gun-type uranium bomb
      implosion: 15 // kg for implosion-type uranium bomb
    },
    plutonium: {
      implosion: 6 // kg for implosion-type plutonium bomb
    }
  };

  useEffect(() => {
    if (bombType === 'plutonium') {
      setDesignType('implosion');
    }
  }, [bombType]);

  const calculateBuildability = () => {
    if (bombType === 'uranium') {
      if (uranium235Enrichment < 90) {
        return {
          canBuild: false,
          reason: `Uran-Anreicherung zu niedrig (${uranium235Enrichment.toFixed(1)}%). Mindestens 90% benötigt.`
        };
      }
      
      const requiredMass = criticalMasses.uranium[designType];
      if (availableUranium235 < requiredMass) {
        return {
          canBuild: false, 
          reason: `Nicht genug U-235 (${availableUranium235.toFixed(1)}kg). ${requiredMass}kg benötigt.`
        };
      }
    } else {
      if (availablePlutonium239 < criticalMasses.plutonium.implosion) {
        return {
          canBuild: false,
          reason: `Nicht genug Pu-239 (${availablePlutonium239.toFixed(1)}kg). ${criticalMasses.plutonium.implosion}kg benötigt.`
        };
      }
    }
    
    if (totalEnergy < 500) {
      return {
        canBuild: false,
        reason: "Nicht genug Energie produziert. Mindestens 500 MeV benötigt."
      };
    }
    
    return { canBuild: true, reason: "" };
  };

  const buildability = calculateBuildability();

  useEffect(() => {
    let estimatedYield = 0;
    
    if (bombType === 'uranium') {
      const criticalMass = criticalMasses.uranium[designType];
      const excessMass = Math.max(0, availableUranium235 - criticalMass);
      
      estimatedYield = 15 + (excessMass * 2);
      
      if (designType === 'gun') {
        estimatedYield *= 0.7;
      }
    } else {
      const criticalMass = criticalMasses.plutonium.implosion;
      const excessMass = Math.max(0, availablePlutonium239 - criticalMass);
      
      estimatedYield = 20 + (excessMass * 3);
    }
    
    setYieldEstimate(Math.min(100, estimatedYield));
  }, [bombType, designType, availableUranium235, availablePlutonium239]);

  const handleArm = () => {
    if (!buildability.canBuild) return;
    
    setIsArmed(!isArmed);
    if (!isArmed) {
      toast({
        title: "Atomwaffe scharf geschaltet",
        description: `${bombType === 'uranium' ? 'Uran' : 'Plutonium'}-Bombe mit ${designType === 'gun' ? 'Kanonen' : 'Implosions'}-Design.`,
        variant: "destructive"
      });
    }
  };

  const handleDetonate = () => {
    if (!isArmed || !buildability.canBuild) return;
    
    setCountdown(5);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startDetonation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startDetonation = () => {
    setIsDetonating(true);
    
    const explosionInterval = setInterval(() => {
      setDetonationProgress(prev => {
        if (prev >= 100) {
          clearInterval(explosionInterval);
          completeDetonation();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const completeDetonation = () => {
    onDetonation(
      yieldEstimate, 
      `${bombType === 'uranium' ? 'Uran' : 'Plutonium'}-${designType === 'gun' ? 'Kanonen' : 'Implosions'}`
    );
    
    setTimeout(() => {
      setIsDetonating(false);
      setIsArmed(false);
      setDetonationProgress(0);
    }, 3000);
  };

  return (
    <Card className={cn(
      'p-4 relative overflow-hidden',
      isDetonating ? 'animate-pulse bg-orange-100' : '',
      className
    )}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center">
            <Bomb className="mr-2 h-5 w-5" />
            Atomwaffen-Labor
          </h3>
          {isArmed && (
            <div className="flex items-center text-red-500">
              <AlertTriangle className="mr-1 h-4 w-4" />
              <span className="text-sm font-bold">SCHARF</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Materialauswahl:</h4>
              <RadioGroup 
                value={bombType} 
                onValueChange={(value) => setBombType(value as 'uranium' | 'plutonium')}
                disabled={isArmed || isDetonating}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="uranium" id="uranium" />
                  <Label htmlFor="uranium" className="flex items-center">
                    <span className="mr-2">Uran-235</span>
                    <span className="text-xs text-gray-500">
                      ({availableUranium235.toFixed(1)} kg, {uranium235Enrichment.toFixed(1)}% angereichert)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="plutonium" id="plutonium" />
                  <Label htmlFor="plutonium" className="flex items-center">
                    <span className="mr-2">Plutonium-239</span>
                    <span className="text-xs text-gray-500">
                      ({availablePlutonium239.toFixed(1)} kg)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Bombendesign:</h4>
              <RadioGroup 
                value={designType} 
                onValueChange={(value) => setDesignType(value as 'gun' | 'implosion')}
                disabled={bombType === 'plutonium' || isArmed || isDetonating}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gun" id="gun" disabled={bombType === 'plutonium'} />
                  <Label htmlFor="gun" className={cn(bombType === 'plutonium' ? "text-gray-400" : "")}>
                    <span className="mr-2">Kanonendesign</span>
                    <span className="text-xs text-gray-500">(nur für Uran-235)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="implosion" id="implosion" />
                  <Label htmlFor="implosion">
                    <span className="mr-2">Implosionsdesign</span>
                    <span className="text-xs text-gray-500">(effizienter)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Kritische Masse benötigt:</h4>
              <div className="text-sm">
                {bombType === 'uranium' ? 
                  `${criticalMasses.uranium[designType]} kg U-235` : 
                  `${criticalMasses.plutonium.implosion} kg Pu-239`
                }
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium">Verfügbare Energie:</h4>
              <Progress 
                value={(totalEnergy / 1000) * 100} 
                className="h-2 mt-1" 
              />
              <div className="text-sm mt-1">{totalEnergy} / 1000 MeV</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Geschätzte Sprengkraft:</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold">{yieldEstimate.toFixed(1)}</span>
                <span className="ml-2">Kilotonnen TNT-Äquivalent</span>
              </div>
              
              <Progress 
                value={(yieldEstimate / 100) * 100} 
                className={cn(
                  "h-3 mt-2",
                  yieldEstimate > 50 ? "bg-red-300" : "bg-orange-300"
                )} 
              />
              
              <div className="text-xs text-gray-500 mt-1">
                {yieldEstimate < 20 && "Geringe Sprengkraft"}
                {yieldEstimate >= 20 && yieldEstimate < 50 && "Mittlere Sprengkraft"}
                {yieldEstimate >= 50 && "Hohe Sprengkraft"}
              </div>
            </div>
            
            {!buildability.canBuild && (
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-sm">
                <div className="font-bold flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Konstruktion nicht möglich:
                </div>
                <div className="mt-1">{buildability.reason}</div>
              </div>
            )}
            
            {countdown > 0 && (
              <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <span className="text-3xl font-bold text-red-600">{countdown}</span>
              </div>
            )}
            
            {isDetonating && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Kernspaltung läuft:</h4>
                <Progress value={detonationProgress} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span>Initiale Spaltung</span>
                  <span>Kritikalität</span>
                  <span>Explosion</span>
                </div>
                
                <div className="w-full h-40 relative bg-black rounded mt-4 overflow-hidden">
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-full bg-white transition-all duration-500",
                      detonationProgress > 50 ? "bg-yellow-300" : "bg-white",
                      detonationProgress > 80 ? "bg-orange-500" : ""
                    )}
                    style={{ 
                      transform: `scale(${detonationProgress / 100 * 2})`,
                      opacity: Math.min(1, detonationProgress / 50)
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={handleArm}
            disabled={!buildability.canBuild || isDetonating}
            className={cn(
              "w-32",
              isArmed ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {isArmed ? "Entschärfen" : "Scharf schalten"}
          </Button>
          
          <Button 
            onClick={handleDetonate}
            disabled={!isArmed || isDetonating || countdown > 0}
            className="w-32 bg-red-600 hover:bg-red-700 relative overflow-hidden"
          >
            <span className="relative z-10">Detonieren</span>
            {isArmed && (
              <span className="absolute inset-0 bg-red-400 animate-pulse"></span>
            )}
          </Button>
        </div>
      </div>
      
      <div className="absolute -bottom-8 -right-8 opacity-5 pointer-events-none">
        <Radiation className="w-32 h-32" />
      </div>
    </Card>
  );
};

export default BombLab;
