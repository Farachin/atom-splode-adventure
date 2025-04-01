
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import GameArea from './GameArea';
import GameControls from './GameControls';
import EnergyBar from './EnergyBar';
import EnrichmentLab from './EnrichmentLab';
import BombLab from './BombLab';
import NuclearExplosion from './NuclearExplosion';
import Explanation from './Explanation';
import { AtomProps } from './Atom';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from '@/hooks/use-toast';

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
  const [currentTab, setCurrentTab] = useState("fission");
  const [enrichedUranium, setEnrichedUranium] = useState(0);
  const [uraniumEnrichment, setUraniumEnrichment] = useState(0);
  const [plutoniumAmount, setPlutoniumAmount] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionYield, setExplosionYield] = useState(0);
  const [bombType, setBombType] = useState("");
  const [isAdvancedLabsOpen, setIsAdvancedLabsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCanFireNeutron(!!selectedElement && neutronCount > 0);
  }, [selectedElement, neutronCount]);

  useEffect(() => {
    const checkPlutoniumProduction = () => {
      // Simulation of plutonium production is already handled in the GameArea component
      // This is just a placeholder for any additional game logic
    };
    
    checkPlutoniumProduction();
  }, [totalEnergy]);

  const handleElementSelect = (element: AtomProps['element']) => {
    setSelectedElement(element);
    setNeutronCount(1); // Give one neutron to start with
  };

  const handleFission = (energy: number, neutrons: number) => {
    setTotalEnergy(prev => Math.min(MAX_ENERGY, prev + energy));
    setNeutronCount(prev => prev + neutrons - 1); // -1 because we used one
    
    if (selectedElement === 'uranium238' && Math.random() < 0.1) {
      const newPlutonium = 0.01; // Small amount
      setPlutoniumAmount(prev => prev + newPlutonium);
      toast({
        title: "Plutonium erzeugt!",
        description: `${newPlutonium.toFixed(2)}kg Plutonium-239 durch Neutroneneinfang und Zerfall.`,
      });
    }
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
  
  const handleEnrichedUraniumCreated = (amount: number, enrichmentLevel: number) => {
    setEnrichedUranium(prev => prev + amount);
    setUraniumEnrichment(enrichmentLevel);
    
    toast({
      title: "Angereichertes Uran erhalten",
      description: `${amount.toFixed(2)}kg Uran mit ${enrichmentLevel.toFixed(1)}% U-235 wurde hinzugefügt.`,
    });
  };
  
  const handleDetonation = (yieldValue: number, type: string) => {
    setShowExplosion(true);
    setExplosionYield(yieldValue);
    setBombType(type);
    
    if (type.includes('Uran')) {
      setEnrichedUranium(0);
    } else {
      setPlutoniumAmount(0);
    }
  };
  
  const handleExplosionComplete = () => {
    setShowExplosion(false);
    toast({
      title: "Detonation abgeschlossen",
      description: `${bombType}-Bombe mit ${explosionYield.toFixed(1)} Kilotonnen Sprengkraft.`,
    });
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
                <p>7. Nutze das Anreicherungslabor, um Uran-235 anzureichern.</p>
                <p>8. Mit ausreichend Material kannst du eine Atombombe bauen.</p>
                <p>9. Versuche, die Energieanzeige zu füllen!</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="fission">Kernspaltung</TabsTrigger>
          <TabsTrigger value="enrichment">Anreicherung</TabsTrigger>
          <TabsTrigger value="bomb">Atombombe</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fission" className="space-y-4">
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
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium mb-2">Materialübersicht:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Angereichertes Uran:</span>
                    <span>{enrichedUranium.toFixed(2)} kg ({uraniumEnrichment.toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plutonium-239:</span>
                    <span>{plutoniumAmount.toFixed(2)} kg</span>
                  </div>
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
        </TabsContent>
        
        <TabsContent value="enrichment">
          <EnrichmentLab 
            onEnrichedUraniumCreated={handleEnrichedUraniumCreated}
          />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-2">Anreicherung erklärt:</h3>
            <p className="text-sm">
              Uran kommt in der Natur hauptsächlich als U-238 (99,3%) vor, 
              mit nur 0,7% des spaltbaren U-235. Für Kernwaffen wird 
              hochangereichertes Uran mit über 90% U-235 benötigt. 
              Zentrifugen trennen die leicht unterschiedlich schweren 
              Isotope, indem sie bei extrem hohen Geschwindigkeiten rotieren.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="bomb">
          <BombLab 
            availableUranium235={enrichedUranium}
            uranium235Enrichment={uraniumEnrichment}
            availablePlutonium239={plutoniumAmount}
            totalEnergy={totalEnergy}
            onDetonation={handleDetonation}
          />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-2">Atombomben erklärt:</h3>
            <p className="text-sm">
              Atombomben setzen enorme Energiemengen durch eine sich selbst 
              erhaltende Kettenreaktion frei. Sie benötigen eine kritische Masse 
              an spaltbarem Material wie Uran-235 oder Plutonium-239. Bei 
              einer Uran-Bombe werden zwei unterkritische Massen zusammengeschossen 
              (Kanonendesign), während Plutoniumbomben eine präzise Implosionswelle 
              verwenden, um das Material zu komprimieren und die Kettenreaktion auszulösen.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center">
        <Collapsible open={isAdvancedLabsOpen} onOpenChange={setIsAdvancedLabsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost" 
              size="sm"
              className="text-sm"
            >
              {isAdvancedLabsOpen ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Erweiterte Labore ausblenden
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Erweiterte Labore anzeigen
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-medium mb-2">Fortgeschrittene Kernphysik:</h3>
              <p className="text-sm">
                Hier könnten zusätzliche Experimente und Informationen zur Kernphysik angezeigt werden.
                Diese Funktion wird in zukünftigen Updates freigeschaltet.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {showExplosion && (
        <NuclearExplosion 
          isActive={showExplosion}
          yield={explosionYield}
          onComplete={handleExplosionComplete}
        />
      )}
    </div>
  );
};

export default Game;
