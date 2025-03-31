
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Atom, { AtomProps } from './Atom';
import Neutron from './Neutron';
import Effect from './Effect';
import { toast } from '@/components/ui/use-toast';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

interface Position {
  x: number;
  y: number;
}

interface GameAreaProps {
  selectedElement: AtomProps['element'] | null;
  onFission: (energy: number, neutronCount: number) => void;
  className?: string;
}

interface FissionEffect {
  id: string;
  type: 'explosion' | 'neutron-release' | 'energy-release';
  position: Position;
}

const elementFissionProperties = {
  uranium235: {
    canFission: true,
    energyReleased: 200,
    neutronReleased: 3,
    probability: 0.95,
  },
  uranium238: {
    canFission: false,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0.05,
  },
  plutonium239: {
    canFission: true,
    energyReleased: 210,
    neutronReleased: 3,
    probability: 0.9,
  },
  thorium232: {
    canFission: false,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0.1,
  },
};

export const GameArea = ({ selectedElement, onFission, className }: GameAreaProps) => {
  const [atomPosition, setAtomPosition] = useState<Position | null>(null);
  const [neutronPosition, setNeutronPosition] = useState<Position | null>(null);
  const [isNeutronMoving, setIsNeutronMoving] = useState(false);
  const [effects, setEffects] = useState<FissionEffect[]>([]);
  const [showAtom, setShowAtom] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedElement && gameAreaRef.current) {
      const area = gameAreaRef.current;
      const centerX = area.clientWidth / 2;
      const centerY = area.clientHeight / 2;
      
      setAtomPosition({ x: centerX, y: centerY });
      setNeutronPosition(null);
      setShowAtom(true);
    } else {
      setShowAtom(false);
    }
  }, [selectedElement]);

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedElement || isNeutronMoving || !atomPosition) return;
    
    const rect = gameAreaRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Don't place neutron on top of atom
    const distanceToAtom = Math.sqrt(
      Math.pow(clickX - atomPosition.x, 2) + Math.pow(clickY - atomPosition.y, 2)
    );
    
    if (distanceToAtom < 50) return;
    
    setNeutronPosition({ x: clickX, y: clickY });
  };

  const fireNeutron = () => {
    if (!selectedElement || !atomPosition || !neutronPosition) return;
    
    setIsNeutronMoving(true);
    
    // Simulate neutron movement
    setTimeout(() => {
      const fissionProperties = elementFissionProperties[selectedElement];
      const willFission = Math.random() < fissionProperties.probability;
      
      if (willFission && fissionProperties.canFission) {
        // Successful fission
        setEffects([
          {
            id: `explosion-${Date.now()}`,
            type: 'explosion',
            position: atomPosition
          }
        ]);
        
        setTimeout(() => {
          // Create neutron release effects
          const newEffects = [];
          for (let i = 0; i < fissionProperties.neutronReleased; i++) {
            const angle = (Math.PI * 2 / fissionProperties.neutronReleased) * i;
            const distance = 40;
            newEffects.push({
              id: `neutron-${Date.now()}-${i}`,
              type: 'neutron-release',
              position: {
                x: atomPosition.x + Math.cos(angle) * distance,
                y: atomPosition.y + Math.sin(angle) * distance
              }
            });
          }
          
          // Create energy release effects
          for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i;
            const distance = 30;
            newEffects.push({
              id: `energy-${Date.now()}-${i}`,
              type: 'energy-release',
              position: {
                x: atomPosition.x + Math.cos(angle) * distance,
                y: atomPosition.y + Math.sin(angle) * distance
              }
            });
          }
          
          setEffects(newEffects);
          onFission(fissionProperties.energyReleased, fissionProperties.neutronReleased);
          
          toast({
            title: "Kernspaltung!",
            description: `${fissionProperties.energyReleased} MeV Energie und ${fissionProperties.neutronReleased} Neutronen freigesetzt!`,
            duration: 3000,
          });
        }, 800);
      } else {
        // Failed fission
        toast({
          title: "Keine Kernspaltung",
          description: selectedElement === 'uranium238' || selectedElement === 'thorium232' 
            ? "Dieses Isotop ist nicht gut spaltbar." 
            : "Das Neutron hat den Kern nicht richtig getroffen.",
          duration: 3000,
        });
      }
      
      setIsNeutronMoving(false);
      setNeutronPosition(null);
    }, 1000);
  };

  const removeEffect = (id: string) => {
    setEffects(effects.filter(effect => effect.id !== id));
  };

  return (
    <Card 
      ref={gameAreaRef}
      className={cn(
        'relative w-full h-[400px] overflow-hidden bg-blue-50 border-blue-200',
        className
      )}
      onClick={handleAreaClick}
    >
      {showAtom && selectedElement && atomPosition && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: atomPosition.x, top: atomPosition.y }}
        >
          <Atom element={selectedElement} size="lg" />
        </div>
      )}
      
      {neutronPosition && !isNeutronMoving && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: neutronPosition.x, top: neutronPosition.y }}
        >
          <Neutron 
            size="md" 
            onClick={fireNeutron} 
          />
        </div>
      )}
      
      {neutronPosition && isNeutronMoving && atomPosition && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
          style={{ 
            left: `${neutronPosition.x}px`, 
            top: `${neutronPosition.y}px`,
            transform: `translate(-50%, -50%) translateX(${(atomPosition.x - neutronPosition.x) * 0.8}px) translateY(${(atomPosition.y - neutronPosition.y) * 0.8}px)`
          }}
        >
          <Neutron size="md" />
        </div>
      )}
      
      {effects.map(effect => (
        <Effect
          key={effect.id}
          type={effect.type}
          x={effect.position.x}
          y={effect.position.y}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}
      
      {!selectedElement && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-medium text-gray-500">
            Wähle ein Element aus, um zu beginnen
          </p>
        </div>
      )}
    </Card>
  );
};

export default GameArea;
