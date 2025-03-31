
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

const getExplanationForElement = (element: AtomProps['element'] | null): string => {
  switch (element) {
    case 'uranium235':
      return "Uran-235 ist ein Isotop, das gut für Kernspaltung geeignet ist. Wenn ein Neutron auf seinen Kern trifft, teilt er sich oft in zwei kleinere Kerne und setzt dabei Energie und neue Neutronen frei.";
    case 'uranium238':
      return "Uran-238 ist das häufigste Uran-Isotop, aber es ist schwer spaltbar. Neutronen werden meist absorbiert, ohne eine Spaltung auszulösen.";
    case 'plutonium239':
      return "Plutonium-239 ist ein künstliches Element, das sehr gut spaltbar ist. Es kann viel Energie freisetzen und wird in Kernkraftwerken genutzt.";
    case 'thorium232':
      return "Thorium-232 ist nicht direkt spaltbar. Es kann aber Neutronen einfangen und sich in spaltbares Uran-233 umwandeln.";
    default:
      return "Wähle ein Element aus, dann erkläre ich dir mehr darüber!";
  }
};

export const Game = ({ className }: GameProps) => {
  const [selectedElement, setSelectedElement] = useState<AtomProps['element'] | null>(null);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [neutronCount, setNeutronCount] = useState(0);
  const [canFireNeutron, setCanFireNeutron] = useState(false);

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
                <p>2. Klicke irgendwo im Spielfeld, um ein Neutron zu platzieren.</p>
                <p>3. Klicke auf das Neutron, um es auf den Atomkern zu schießen.</p>
                <p>4. Sieh zu, was passiert! Manche Elemente spalten leichter als andere.</p>
                <p>5. Wenn eine Spaltung stattfindet, werden neue Neutronen und Energie freigesetzt.</p>
                <p>6. Versuche, die Energieanzeige zu füllen!</p>
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
            />
          </div>
          <div className="flex flex-col space-y-6">
            <Explanation 
              text={getExplanationForElement(selectedElement)} 
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
          canFireNeutron={canFireNeutron}
        />
      </div>
    </div>
  );
};

export default Game;
