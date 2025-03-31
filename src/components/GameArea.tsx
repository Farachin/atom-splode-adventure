
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
  type: 'explosion' | 'neutron-release' | 'energy-release' | 'split-product';
  position: Position;
  productType?: string;
}

interface AtomicElement {
  position: Position;
  type: string;
  id: string;
  isProduct?: boolean;
}

interface NeutronObject {
  id: string;
  position: Position;
  isMoving: boolean;
  targetPosition?: Position;
}

const elementFissionProperties = {
  uranium235: {
    canFission: true,
    energyReleased: 200,
    neutronReleased: 3,
    probability: 0.95,
    products: ['barium', 'krypton'],
  },
  uranium238: {
    canFission: false,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0.05,
    products: [],
  },
  plutonium239: {
    canFission: true,
    energyReleased: 210,
    neutronReleased: 3,
    probability: 0.9,
    products: ['xenon', 'zirconium'],
  },
  thorium232: {
    canFission: false,
    energyReleased: 0,
    neutronReleased: 0,
    probability: 0.1,
    products: [],
  },
  // Add fission properties for product elements
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
  // Secondary products (with lower energy and probability)
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

export const GameArea = ({ selectedElement, onFission, className }: GameAreaProps) => {
  const [elements, setElements] = useState<AtomicElement[]>([]);
  const [neutrons, setNeutrons] = useState<NeutronObject[]>([]);
  const [effects, setEffects] = useState<FissionEffect[]>([]);
  const [draggingNeutronId, setDraggingNeutronId] = useState<string | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedElement && gameAreaRef.current) {
      const area = gameAreaRef.current;
      const centerX = area.clientWidth / 2;
      const centerY = area.clientHeight / 2;
      
      // Clear existing elements and add new main element
      setElements([{
        id: `element-${Date.now()}`,
        position: { x: centerX, y: centerY },
        type: selectedElement,
        isProduct: false
      }]);
      setNeutrons([]);
      setEffects([]);
    }
  }, [selectedElement]);

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedElement) return;
    
    const rect = gameAreaRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Don't place neutron on top of elements
    const clickedOnElement = elements.some(element => {
      const distance = Math.sqrt(
        Math.pow(clickX - element.position.x, 2) + Math.pow(clickY - element.position.y, 2)
      );
      return distance < 40; // Approximate radius of atom
    });
    
    if (clickedOnElement) return;
    
    // Add a new neutron at the clicked position
    const newNeutron = {
      id: `neutron-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      position: { x: clickX, y: clickY },
      isMoving: false
    };
    
    setNeutrons(prev => [...prev, newNeutron]);
  };

  const handleNeutronDragStart = (id: string) => {
    setDraggingNeutronId(id);
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
    
    // Find if dropped on an element
    const targetElement = elements.find(element => {
      const distance = Math.sqrt(
        Math.pow(dropX - element.position.x, 2) + Math.pow(dropY - element.position.y, 2)
      );
      return distance < 40; // Approximate radius of atom
    });
    
    if (targetElement) {
      // Move neutron to the element and initiate fission process
      setNeutrons(prev => prev.map(neutron => 
        neutron.id === draggingNeutronId 
          ? { ...neutron, isMoving: true, targetPosition: targetElement.position } 
          : neutron
      ));
      
      // Schedule fission after animation
      setTimeout(() => {
        processElementFission(targetElement, draggingNeutronId!);
      }, 500);
    } else {
      // Just move the neutron to the new position
      setNeutrons(prev => prev.map(neutron => 
        neutron.id === draggingNeutronId 
          ? { ...neutron, position: { x: dropX, y: dropY }, isMoving: false, targetPosition: undefined } 
          : neutron
      ));
    }
    
    setDraggingNeutronId(null);
  };

  const processElementFission = (element: AtomicElement, neutronId: string) => {
    const elementType = element.type as keyof typeof elementFissionProperties;
    const fissionProperties = elementFissionProperties[elementType];
    const willFission = Math.random() < fissionProperties.probability;
    
    // Remove the neutron used for this attempt
    setNeutrons(prev => prev.filter(n => n.id !== neutronId));
    
    if (willFission && fissionProperties.canFission) {
      // Successful fission
      setEffects(prev => [...prev, {
        id: `explosion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'explosion',
        position: element.position
      }]);
      
      // Remove the element that was split
      setElements(prev => prev.filter(e => e.id !== element.id));
      
      // Create split products and released neutrons
      setTimeout(() => {
        // Add split products
        if (fissionProperties.products.length > 0) {
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
        }
        
        // Create new neutrons - ensure ALL neutrons are visualized
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
            isMoving: false
          });
        }
        setNeutrons(prev => [...prev, ...newNeutrons]);
        
        // Add visual effects
        const newEffects: FissionEffect[] = [];
        // Energy release effects
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
        
        // Notify about fission event
        onFission(fissionProperties.energyReleased, fissionProperties.neutronReleased);
        
        toast({
          title: "Kernspaltung!",
          description: `${fissionProperties.energyReleased} MeV Energie und ${fissionProperties.neutronReleased} Neutronen freigesetzt! Neue Elemente: ${fissionProperties.products.join(', ')}`,
          duration: 3000,
        });
      }, 800);
    } else {
      // Failed fission
      toast({
        title: "Keine Kernspaltung",
        description: !fissionProperties.canFission
          ? `${elementType} ist nicht gut spaltbar.`
          : "Das Neutron hat den Kern nicht richtig getroffen.",
        duration: 3000,
      });
    }
  };

  const fireNeutron = () => {
    if (neutrons.length === 0 || elements.length === 0) return;
    
    // Find the first non-moving neutron
    const neutronToFire = neutrons.find(n => !n.isMoving);
    if (!neutronToFire) return;
    
    // Find the first element to target
    const targetElement = elements[0];
    
    // Set neutron to move towards the element
    setNeutrons(prev => prev.map(neutron => 
      neutron.id === neutronToFire.id 
        ? { ...neutron, isMoving: true, targetPosition: targetElement.position } 
        : neutron
    ));
    
    // Schedule fission after animation
    setTimeout(() => {
      processElementFission(targetElement, neutronToFire.id);
    }, 500);
  };

  const removeEffect = (id: string) => {
    setEffects(effects.filter(effect => effect.id !== id));
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
      {/* Main Elements and Fission Products */}
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
            </div>
          );
        } else {
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
              <Atom element={element.type as AtomProps['element']} size="lg" />
            </div>
          );
        }
      })}
      
      {/* Neutrons - each with 'n' label */}
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
            onDragStart={() => handleNeutronDragStart(neutron.id)}
          />
        </div>
      ))}
      
      {/* Visual Effects */}
      {effects.map(effect => (
        <Effect
          key={effect.id}
          type={effect.type}
          x={effect.position.x}
          y={effect.position.y}
          productType={effect.productType}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}
      
      {/* Empty state message */}
      {elements.length === 0 && (
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
