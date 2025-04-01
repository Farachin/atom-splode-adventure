
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import GameArea from './GameArea';
import GameControls from './GameControls';
import EnergyBar from './EnergyBar';
import Explanation from './Explanation';
import { AtomProps } from './Atom';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface GameProps {
  className?: string;
}

const MAX_ENERGY = 1000;

const getExplanationForElement = (element: AtomProps['element'] | null, neutronSpeed: 'slow' | 'fast'): string => {
  switch (element) {
    case 'uranium235':
      return "Uran-235 ist ein Isotop, das gut für Kernspaltung geeignet ist. Es reagiert auf schnelle und langsame Neutronen, wobei langsame etwas effektiver sind.";
    case 'uranium238':
      return neutronSpeed === 'slow' 
        ? "Uran-238 absorbiert langsame Neutronen und wandelt sich in Uran-239 um, das über Neptunium-239 zu Plutonium-239 zerfällt." 
        : "Uran-238 reagiert kaum auf schnelle Neutronen. Versuche es mit langsamen Neutronen!";
    case 'plutonium239':
      return "Plutonium-239 ist ein künstliches Element, das sehr gut spaltbar ist. Es reagiert gut auf schnelle und langsame Neutronen und setzt beim Spalten viel Energie frei.";
    case 'thorium232':
      return neutronSpeed === 'slow'
        ? "Thorium-232 kann mit langsamen Neutronen Thorium-233 bilden, das über Protactinium-233 zu Uran-233 zerfällt."
        : "Thorium-232 reagiert kaum auf schnelle Neutronen. Verwende langsame Neutronen für bessere Ergebnisse.";
    default:
      return "Wähle ein Element aus, dann erkläre ich dir mehr darüber!";
  }
};

export const Game = ({ className }: GameProps) => {
  const [selectedElement, setSelectedElement] = useState<AtomProps['element'] | null>(null);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [neutronCount, setNeutronCount] = useState(0);
  const [canFireNeutron, setCanFireNeutron] = useState(false);
  const [neutronSpeed, setNeutronSpeed] = useState<'slow' | 'fast'>('fast');

  useEffect(() => {
    setCanFireNeutron(!!selectedElement && neutronCount > 0);
  }, [selectedElement, neutronCount]);

  const handleElementSelect = (element: AtomProps['element']) => {
    setSelectedElement(element);
    setNeutronCount(1); // Give one neutron to start with
  };

  const handleFission = (energy: number, neutrons: number) => {
    setTotalEnergy(prev => Math.min(MAX_ENERGY, prev + energy));
    setNeutronCount(prev => prev + neutrons - 1); // -1 because we used one
  };

  const handleFireNeutron = () => {
    if (!canFireNeutron) return;
    
    setNeutronCount(prev => prev - 1);
    setCanFireNeutron(false);
  };

  const handleReset = () => {
    setSelectedElement(null);
    setTotalEnergy(0);
    setNeutronCount(0);
    setCanFireNeutron(false);
  };
  
  const handleSpeedChange = (speed: 'slow' | 'fast') => {
    setNeutronSpeed(speed);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Atom-Abenteuer</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Wie man spielt</DialogTitle>
              <DialogDescription className="text-lg pt-4 space-y-2">
                <p>1. Wähle ein Element aus den Knöpfen unten.</p>
                <p>2. Wähle zwischen schnellen und langsamen Neutronen.</p>
                <p>3. Klicke irgendwo im Spielfeld, um ein Neutron zu platzieren.</p>
                <p>4. Ziehe das Neutron auf den Atomkern, um eine Reaktion auszulösen.</p>
                <p>5. Sieh zu, was passiert! Verschiedene Elemente reagieren unterschiedlich auf schnelle und langsame Neutronen.</p>
                <p>6. Uran-238 absorbiert langsame Neutronen und startet eine Umwandlungskette zu Plutonium.</p>
                <p>7. Versuche, die Energieanzeige zu füllen!</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <GameArea 
              selectedElement={selectedElement}
              onFission={handleFission}
              neutronSpeed={neutronSpeed}
            />
          </div>
          <div className="flex flex-col space-y-6">
            <Explanation 
              text={getExplanationForElement(selectedElement, neutronSpeed)} 
            />
            <div className="flex flex-col space-y-2">
              <EnergyBar 
                value={totalEnergy} 
                maxValue={MAX_ENERGY}
              />
              <div className="text-center">
                <span className="font-medium">Neutronen: {neutronCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <GameControls 
          selectedElement={selectedElement}
          onSelectElement={handleElementSelect}
          onReset={handleReset}
          onFireNeutron={handleFireNeutron}
          onSpeedChange={handleSpeedChange}
          neutronSpeed={neutronSpeed}
          canFireNeutron={canFireNeutron}
        />
      </div>
    </div>
  );
};

export default Game;
