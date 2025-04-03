import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Atom, { AtomProps } from './Atom';
import Neutron from './Neutron';
import Effect from './Effect';
import { toast } from '@/components/ui/use-toast';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Position {
  x: number;
  y: number;
}

interface GameAreaProps {
  selectedElement: AtomProps['element'] | null;
  onFission: (energy: number, neutronCount: number) => void;
  className?: string;
  neutronSpeed: 'slow' | 'fast';
}

interface FissionEffect {
  id: string;
  type: 'explosion' | 'neutron-release' | 'energy-release' | 'split-product' | 'beta-decay' | 'neutron-absorption';
  position: Position;
  productType?: string;
  targetPosition?: Position;
}

interface AtomicElement {
  position: Position;
  type: string;
  id: string;
  isProduct?: boolean;
  decayStage?: number;
  decayTarget?: string;
  decayDelay?: number;
}

interface NeutronObject {
  id: string;
  position: Position;
  isMoving: boolean;
  speed: 'slow' | 'fast';
  targetPosition?: Position;
}

interface ElementFissionProperties {
  canFission: boolean;
  energyReleased: number;
  neutronReleased: number;
  probability: number;
  products: string[];
  canAbsorb?: boolean;
  transformTo?: string;
  isDecaying?: boolean;
  decayTo?: string;
  decayTime?: number;
  decayType?: string;
  preferredNeutronSpeed?: 'slow' | 'fast' | 'both';
}

const elementFissionProperties: Record<string, ElementFissionProperties> = {
  uranium235: {
    canFission: true,
    energyReleased: 200,
    neutronReleased: 3,
    probability: 0.95,
    products: ['barium', 'krypton'],
    preferredNeutronSpeed: 'both',
  },
  uranium238: {
    canFission: false,
    canAbsorb: true,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0.7,
    products: [],
    transformTo: 'uranium239',
    preferredNeutronSpeed: 'slow',
  },
  uranium239: {
    canFission: false,
    canAbsorb: false,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0,
    products: [],
    isDecaying: true,
    decayTo: 'neptunium239',
    decayTime: 5000,
    decayType: 'beta',
  },
  neptunium239: {
    canFission: false,
    canAbsorb: false,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0,
    products: [],
    isDecaying: true,
    decayTo: 'plutonium239',
    decayTime: 5000,
    decayType: 'beta',
  },
  plutonium239: {
    canFission: true,
    energyReleased: 210,
    neutronReleased: 3,
    probability: 0.9,
    products: ['xenon', 'zirconium'],
    preferredNeutronSpeed: 'both',
  },
  thorium232: {
    canFission: false,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0.1,
    products: [],
    preferredNeutronSpeed: 'slow',
  },
  barium: {
    canFission: true,
    energyReleased: 50,
    neutronReleased: 1,
    probability: 0.7,
    products: ['strontium', 'krypton'],
  },
  krypton: {
    canFission: true,
    energyReleased: 40,
    neutronReleased: 1,
    probability: 0.6,
    products: ['selenium', 'germanium'],
  },
  xenon: {
    canFission: true,
    energyReleased: 60,
    neutronReleased: 1,
    probability: 0.65,
    products: ['tellurium', 'zirconium'],
  },
  zirconium: {
    canFission: true,
    energyReleased: 45,
    neutronReleased: 1,
    probability: 0.55,
    products: ['yttrium', 'strontium'],
  },
  strontium: {
    canFission: true,
    energyReleased: 20,
    neutronReleased: 1,
    probability: 0.4,
    products: ['krypton', 'germanium'],
  },
  selenium: {
    canFission: false,
    energyReleased: 10,
    neutronReleased: 0,
    probability: 0.2,
    products: [],
  },
  germanium: {
    canFission: false,
    energyReleased: 10,
    neutronReleased: 0,
    probability: 0.2,
    products: [],
  },
  tellurium: {
    canFission: false,
    energyReleased: 15,
    neutronReleased: 0,
    probability: 0.3,
    products: [],
  },
  yttrium: {
    canFission: false,
    energyReleased: 15,
    neutronReleased: 0,
    probability: 0.3,
    products: [],
  },
};

export const GameArea = ({ selectedElement, onFission, className, neutronSpeed = 'fast' }: GameAreaProps) => {
  const [elements, setElements] = useState<AtomicElement[]>([]);
  const [neutrons, setNeutrons] = useState<NeutronObject[]>([]);
  const [effects, setEffects] = useState<FissionEffect[]>([]);
  const [draggingNeutronId, setDraggingNeutronId] = useState<string | null>(null);
  const [draggingNeutronSpeed, setDraggingNeutronSpeed] = useState<'slow' | 'fast'>('fast');
  const [chainReactionActive, setChainReactionActive] = useState<boolean>(false);
  const [totalEnergyReleased, setTotalEnergyReleased] = useState<number>(0);
  const [maxEnergy, setMaxEnergy] = useState<number>(1000);
  const [autoNeutronDelay, setAutoNeutronDelay] = useState<number>(800);
  const [canAddUranium, setCanAddUranium] = useState<boolean>(false);
  const [maxUraniumCores, setMaxUraniumCores] = useState<number>(5);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const chainReactionRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedElement && gameAreaRef.current) {
      const area = gameAreaRef.current;
      const centerX = area.clientWidth / 2;
      const centerY = area.clientHeight / 2;
      
      setElements([{
        id: `element-${Date.now()}`,
        position: { x: centerX, y: centerY },
        type: selectedElement,
        isProduct: false
      }]);
      setNeutrons([]);
      setEffects([]);
      setChainReactionActive(false);
      setTotalEnergyReleased(0);
    }
  }, [selectedElement]);

  useEffect(() => {
    if (chainReactionActive && neutrons.length > 0 && elements.length > 0) {
      chainReactionRef.current = setTimeout(() => {
        processAutomaticChainReaction();
      }, autoNeutronDelay);
    }

    return () => {
      if (chainReactionRef.current) {
        clearTimeout(chainReactionRef.current);
      }
    };
  }, [chainReactionActive, neutrons, elements]);

  useEffect(() => {
    const uraniumCount = elements.filter(el => 
      el.type === 'uranium235' || el.type === 'uranium238' || el.type === 'plutonium239'
    ).length;
    
    setCanAddUranium(uraniumCount < maxUraniumCores && selectedElement !== null);
  }, [elements, selectedElement, maxUraniumCores]);

  useEffect(() => {
    const decayTimers: NodeJS.Timeout[] = [];
    
    elements.forEach(element => {
      const elementType = element.type as keyof typeof elementFissionProperties;
      const properties = elementFissionProperties[elementType];
      
      if (properties && properties.isDecaying) {
        const timer = setTimeout(() => {
          handleElementDecay(element);
        }, properties.decayTime);
        
        decayTimers.push(timer);
      }
    });
    
    return () => {
      decayTimers.forEach(timer => clearTimeout(timer));
    };
  }, [elements]);

  const processAutomaticChainReaction = () => {
    if (neutrons.length === 0 || elements.length === 0 || totalEnergyReleased >= maxEnergy) {
      setChainReactionActive(false);
      return;
    }

    const availableNeutron = neutrons.find(n => !n.isMoving);
    if (!availableNeutron) return;

    const targetIndex = Math.floor(Math.random() * elements.length);
    const targetElement = elements[targetIndex];

    if (!targetElement) return;

    setNeutrons(prev => prev.map(neutron => 
      neutron.id === availableNeutron.id 
        ? { ...neutron, isMoving: true, targetPosition: targetElement.position } 
        : neutron
    ));
    
    setTimeout(() => {
      processElementFission(targetElement, availableNeutron.id, availableNeutron.speed, true);
    }, 500);
  };

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedElement) return;
    
    const rect = gameAreaRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const clickedOnElement = elements.some(element => {
      const distance = Math.sqrt(
        Math.pow(clickX - element.position.x, 2) + Math.pow(clickY - element.position.y, 2)
      );
      return distance < 40;
    });
    
    if (clickedOnElement) return;
    
    const newNeutron = {
      id: `neutron-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      position: { x: clickX, y: clickY },
      isMoving: false,
      speed: neutronSpeed
    };
    
    setNeutrons(prev => [...prev, newNeutron]);
  };

  const handleAddUranium = () => {
    if (!selectedElement || !canAddUranium) return;
    
    const area = gameAreaRef.current;
    if (!area) return;
    
    const centerX = area.clientWidth / 2;
    const centerY = area.clientHeight / 2;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 100;
    
    const newX = centerX + Math.cos(angle) * distance;
    const newY = centerY + Math.sin(angle) * distance;
    
    const isTooClose = elements.some(element => {
      const elemDistance = Math.sqrt(
        Math.pow(newX - element.position.x, 2) + Math.pow(newY - element.position.y, 2)
      );
      return elemDistance < 80;
    });
    
    if (!isTooClose) {
      const newElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        position: { x: newX, y: newY },
        type: selectedElement,
        isProduct: false
      };
      
      setElements(prev => [...prev, newElement]);
      
      toast({
        title: "Neuer Atomkern hinzugefügt",
        description: `Ein weiterer ${selectedElement}-Kern wurde zum Experiment hinzugefügt.`,
        duration: 3000,
      });
    } else {
      handleAddUranium();
    }
  };

  const handleNeutronDragStart = (id: string, e: React.DragEvent) => {
    setDraggingNeutronId(id);
    const speedData = e.dataTransfer.getData('neutronSpeed') as 'slow' | 'fast';
    setDraggingNeutronSpeed(speedData || neutronSpeed);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!draggingNeutronId) return;
    
    const rect = gameAreaRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;
    
    const targetElement = elements.find(element => {
      const distance = Math.sqrt(
        Math.pow(dropX - element.position.x, 2) + Math.pow(dropY - element.position.y, 2)
      );
      return distance < 40;
    });
    
    if (targetElement) {
      setNeutrons(prev => prev.map(neutron => 
        neutron.id === draggingNeutronId 
          ? { ...neutron, isMoving: true, targetPosition: targetElement.position } 
          : neutron
      ));
      
      setTimeout(() => {
        processElementFission(targetElement, draggingNeutronId!, draggingNeutronSpeed);
        setChainReactionActive(true);
      }, 500);
    } else {
      setNeutrons(prev => prev.map(neutron => 
        neutron.id === draggingNeutronId 
          ? { ...neutron, position: { x: dropX, y: dropY }, isMoving: false, targetPosition: undefined } 
          : neutron
      ));
    }
    
    setDraggingNeutronId(null);
  };

  const processElementFission = (element: AtomicElement, neutronId: string, neutronSpeed: 'slow' | 'fast', isAutomatic = false) => {
    const elementType = element.type as keyof typeof elementFissionProperties;
    const fissionProperties = elementFissionProperties[elementType];
    
    let speedProbabilityModifier = 1;
    if (fissionProperties.preferredNeutronSpeed) {
      if (fissionProperties.preferredNeutronSpeed === 'slow' && neutronSpeed === 'fast') {
        speedProbabilityModifier = 0.2;
      } else if (fissionProperties.preferredNeutronSpeed === 'fast' && neutronSpeed === 'slow') {
        speedProbabilityModifier = 0.3;
      }
    }
    
    const adjustedProbability = fissionProperties.probability * speedProbabilityModifier;
    const willFission = Math.random() < adjustedProbability;
    
    setNeutrons(prev => prev.filter(n => n.id !== neutronId));
    
    if (fissionProperties.canAbsorb && fissionProperties.transformTo) {
      if (fissionProperties.preferredNeutronSpeed === 'slow' && neutronSpeed === 'fast') {
        if (!isAutomatic) {
          toast({
            title: "Zu schnelles Neutron",
            description: `${elementType} kann nur langsame Neutronen effektiv absorbieren.`,
            duration: 3000,
          });
        }
        return;
      }
      
      setEffects(prev => [...prev, {
        id: `absorption-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'neutron-absorption',
        position: element.position
      }]);
      
      const transformedElement = {
        ...element,
        type: fissionProperties.transformTo,
        decayStage: 0
      };
      
      setElements(prev => 
        prev.map(el => el.id === element.id ? transformedElement : el)
      );
      
      if (!isAutomatic) {
        toast({
          title: "Neutronenabsorption",
          description: `${elementType} hat ein Neutron absorbiert und wurde zu ${fissionProperties.transformTo}`,
          duration: 3000,
        });
      }
      
      return;
    }
    
    if (willFission && fissionProperties.canFission) {
      setEffects(prev => [...prev, {
        id: `explosion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'explosion',
        position: element.position
      }]);
      
      setElements(prev => prev.filter(e => e.id !== element.id));
      
      setTotalEnergyReleased(totalEnergyReleased + fissionProperties.energyReleased);
      
      if (totalEnergyReleased >= maxEnergy) {
        setChainReactionActive(false);
        
        if (!isAutomatic) {
          toast({
            title: "Maximale Energie erreicht!",
            description: `Die Kettenreaktion hat ${totalEnergyReleased.toFixed(0)} MeV Energie freigesetzt.`,
            duration: 3000,
          });
        }
      }
      
      setTimeout(() => {
        const newElements: AtomicElement[] = [];
        fissionProperties.products.forEach((product, i) => {
          const angle = (Math.PI / fissionProperties.products.length) * i;
          const distance = 60;
          newElements.push({
            id: `element-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            position: {
              x: element.position.x + Math.cos(angle) * distance,
              y: element.position.y + Math.sin(angle) * distance
            },
            type: product,
            isProduct: true
          });
        });
        setElements(prev => [...prev, ...newElements]);
        
        const newNeutrons: NeutronObject[] = [];
        for (let i = 0; i < fissionProperties.neutronReleased; i++) {
          const angle = (Math.PI * 2 / fissionProperties.neutronReleased) * i;
          const distance = 80;
          newNeutrons.push({
            id: `neutron-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            position: {
              x: element.position.x + Math.cos(angle) * distance,
              y: element.position.y + Math.sin(angle) * distance
            },
            isMoving: false,
            speed: 'fast'
          });
        }
        setNeutrons(prev => [...prev, ...newNeutrons]);
        
        const newEffects: FissionEffect[] = [];
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i;
          const distance = 30;
          newEffects.push({
            id: `energy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            type: 'energy-release',
            position: {
              x: element.position.x + Math.cos(angle) * distance,
              y: element.position.y + Math.sin(angle) * distance
            }
          });
        }
        setEffects(prev => [...prev, ...newEffects]);
        
        onFission(fissionProperties.energyReleased, fissionProperties.neutronReleased);
        
        if (!isAutomatic) {
          toast({
            title: "Kernspaltung!",
            description: `${fissionProperties.energyReleased} MeV Energie und ${fissionProperties.neutronReleased} Neutronen freigesetzt! Neue Elemente: ${fissionProperties.products.join(', ')}`,
            duration: 3000,
          });
        }
      }, 800);
    } else {
      if (!isAutomatic) {
        let failureReason = "";
        
        if (!fissionProperties.canFission) {
          failureReason = `${elementType} ist nicht gut spaltbar.`;
        } else if (speedProbabilityModifier < 1) {
          failureReason = `${elementType} benötigt ${fissionProperties.preferredNeutronSpeed === 'slow' ? 'langsame' : 'schnelle'} Neutronen für optimale Spaltung.`;
        } else {
          failureReason = "Das Neutron hat den Kern nicht richtig getroffen.";
        }
        
        toast({
          title: "Keine Kernspaltung",
          description: failureReason,
          duration: 3000,
        });
      }
    }
  };

  const handleElementDecay = (element: AtomicElement) => {
    const elementType = element.type as keyof typeof elementFissionProperties;
    const properties = elementFissionProperties[elementType];
    
    if (!properties || !properties.isDecaying || !properties.decayTo) return;
    
    setEffects(prev => [...prev, {
      id: `decay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'beta-decay',
      position: element.position,
      targetPosition: {
        x: element.position.x + (Math.random() * 40 - 20),
        y: element.position.y + (Math.random() * 40 - 20)
      }
    }]);
    
    const decayedElement = {
      ...element,
      type: properties.decayTo
    };
    
    setElements(prev => 
      prev.map(el => el.id === element.id ? decayedElement : el)
    );
    
    toast({
      title: "Beta-Zerfall",
      description: `${elementType} hat sich durch Beta-Zerfall in ${properties.decayTo} umgewandelt.`,
      duration: 3000,
    });
  };

  const fireNeutron = () => {
    if (neutrons.length === 0 || elements.length === 0) return;
    
    const neutronToFire = neutrons.find(n => !n.isMoving);
    if (!neutronToFire) return;
    
    const targetElement = elements[0];
    
    setNeutrons(prev => prev.map(neutron => 
      neutron.id === neutronToFire.id 
        ? { ...neutron, isMoving: true, targetPosition: targetElement.position } 
        : neutron
    ));
    
    setTimeout(() => {
      processElementFission(targetElement, neutronToFire.id, neutronToFire.speed);
      setChainReactionActive(true);
    }, 500);
  };

  const removeEffect = (id: string) => {
    setEffects(effects.filter(effect => effect.id !== id));
  };

  const getNeutronSpeedInfo = (elementType: string) => {
    const properties = elementFissionProperties[elementType as keyof typeof elementFissionProperties];
    if (!properties || !properties.preferredNeutronSpeed) return "";
    
    if (properties.preferredNeutronSpeed === 'slow') {
      return "Bevorzugt langsame Neutronen";
    } else if (properties.preferredNeutronSpeed === 'fast') {
      return "Bevorzugt schnelle Neutronen";
    } else {
      return "Reagiert auf alle Neutronen";
    }
  };

  const getProductColor = (productType: string) => {
    switch(productType) {
      case 'barium': return 'bg-green-500';
      case 'krypton': return 'bg-blue-500';
      case 'xenon': return 'bg-purple-500';
      case 'zirconium': return 'bg-yellow-500';
      case 'strontium': return 'bg-red-500';
      case 'selenium': return 'bg-orange-500';
      case 'germanium': return 'bg-pink-500';
      case 'tellurium': return 'bg-cyan-500';
      case 'yttrium': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getProductLabel = (productType: string) => {
    switch(productType) {
      case 'barium': return 'Ba';
      case 'krypton': return 'Kr';
      case 'xenon': return 'Xe';
      case 'zirconium': return 'Zr';
      case 'strontium': return 'Sr';
      case 'selenium': return 'Se';
      case 'germanium': return 'Ge';
      case 'tellurium': return 'Te';
      case 'yttrium': return 'Y';
      default: return '?';
    }
  };

  const getIsotopeLabel = (elementType: string) => {
    switch(elementType) {
      case 'uranium235': return 'U-235';
      case 'uranium238': return 'U-238';
      case 'uranium239': return 'U-239';
      case 'neptunium239': return 'Np-239';
      case 'plutonium239': return 'Pu-239';
      case 'thorium232': return 'Th-232';
      default: return elementType;
    }
  };

  return (
    <Card 
      ref={gameAreaRef}
      className={cn(
        'relative w-full h-[400px] overflow-hidden bg-blue-50 border-blue-200',
        className
      )}
      onClick={handleAreaClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {chainReactionActive && (
        <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm flex justify-between items-center z-50">
          <span>Kettenreaktion aktiv</span>
          <div className="flex items-center">
            <span className="mr-2">Energie: {totalEnergyReleased.toFixed(0)} / {maxEnergy} MeV</span>
            <div className="w-32 bg-blue-700 rounded-full h-2 mr-1">
              <div 
                className="bg-yellow-400 h-2 rounded-full" 
                style={{width: `${Math.min(100, (totalEnergyReleased / maxEnergy) * 100)}%`}}
              ></div>
            </div>
          </div>
        </div>
      )}

      {canAddUranium && (
        <div className="absolute top-4 right-4 z-50">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleAddUranium}
            className="flex items-center gap-1 bg-yellow-200 border border-yellow-400 hover:bg-yellow-300"
          >
            <Plus size={14} />
            <span>Atomkern hinzufügen</span>
          </Button>
        </div>
      )}

      {elements.map((element) => {
        if (element.isProduct) {
          return (
            <div
              key={element.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white font-bold ${getProductColor(element.type)}`}
              style={{ 
                left: element.position.x, 
                top: element.position.y,
                width: '40px',
                height: '40px',
                zIndex: 10
              }}
            >
              {getProductLabel(element.type)}
              <div className="absolute -bottom-5 text-xs text-gray-700 whitespace-nowrap">
                {getNeutronSpeedInfo(element.type)}
              </div>
            </div>
          );
        } else {
          const elementType = element.type as keyof typeof elementFissionProperties;
          return (
            <div
              key={element.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: element.position.x, 
                top: element.position.y,
                zIndex: 10
              }}
            >
              {['uranium239', 'neptunium239'].includes(elementType) ? (
                <div className="relative">
                  <div className={`bg-atom-${elementType || 'plutonium239'} w-24 h-24 rounded-full flex items-center justify-center text-white font-bold`}>
                    {getIsotopeLabel(elementType)}
                  </div>
                  <div className="absolute -bottom-5 text-xs text-gray-700 whitespace-nowrap">
                    {getNeutronSpeedInfo(elementType)}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Atom element={elementType as AtomProps['element']} size="lg" />
                  <div className="absolute -bottom-12 text-xs text-gray-700 whitespace-nowrap">
                    {getNeutronSpeedInfo(elementType)}
                  </div>
                </div>
              )}
            </div>
          );
        }
      })}
      
      {neutrons.map((neutron) => (
        <div
          key={neutron.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: neutron.position.x, 
            top: neutron.position.y,
            transform: neutron.isMoving && neutron.targetPosition 
              ? `translate(-50%, -50%) translateX(${neutron.targetPosition.x - neutron.position.x}px) translateY(${neutron.targetPosition.y - neutron.position.y}px)` 
              : 'translate(-50%, -50%)',
            transition: neutron.isMoving ? 'transform 0.5s ease-in-out' : 'none',
            zIndex: 20
          }}
        >
          <Neutron 
            size="md" 
            isAnimating={neutron.isMoving}
            isDraggable={!neutron.isMoving}
            speed={neutron.speed}
            onDragStart={(e) => handleNeutronDragStart(neutron.id, e)}
          />
        </div>
      ))}
      
      {effects.map(effect => (
        <Effect
          key={effect.id}
          type={effect.type}
          x={effect.position.x}
          y={effect.position.y}
          productType={effect.productType}
          targetPosition={effect.targetPosition}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}
      
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-medium text-gray-500">
            Wähle ein Element aus, um zu beginnen
          </p>
        </div>
      )}

      {elements.length > 0 && neutrons.length === 0 && !chainReactionActive && (
        <div className="absolute bottom-4 left-4 right-4 text-center bg-blue-100 p-2 rounded-lg text-sm">
          Klicke irgendwo, um ein Neutron zu platzieren, oder verwende die Steuerung unten
        </div>
      )}

      {neutrons.length > 0 && !chainReactionActive && (
        <div className="absolute bottom-4 left-4 right-4 text-center bg-blue-100 p-2 rounded-lg text-sm">
          Ziehe ein Neutron auf den Atomkern, um die Kettenreaktion zu starten
        </div>
      )}
    </Card>
  );
};

export default GameArea;
