import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import GameArea from './GameArea';
import GameControls from './GameControls';
import EnergyBar from './EnergyBar';
import EnrichmentLab from './EnrichmentLab';
import BombLab from './BombLab';
import NuclearExplosion from './NuclearExplosion';
import Explanation from './Explanation';
import ReactorLab from './ReactorLab';
import FusionLab from './FusionLab';
import ChainReactionSimulator from './ChainReactionSimulator';
import RadiationEffectsLab from './RadiationEffectsLab';
import { AtomProps } from './Atom';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown, ChevronUp, Atom, Zap, FlaskConical, BarChart3, Radiation, Flame } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';

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
  const [totalKnowledge, setTotalKnowledge] = useState(0);
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
    
    // Increment knowledge
    setTotalKnowledge(prev => Math.min(100, prev + energy / 100));
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
  
  const handleEnergyProduced = (amount: number) => {
    setTotalEnergy(prev => Math.min(MAX_ENERGY, prev + amount));
    // Also increment knowledge for energy production
    setTotalKnowledge(prev => Math.min(100, prev + amount / 20));
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
                <p>9. Im Reaktorlabor kannst du einen Kernreaktor bauen und betreiben.</p>
                <p>10. Experimentiere mit Fusion, um zu verstehen, wie Sterne funktionieren.</p>
                <p>11. Versuche, die Energieanzeige zu füllen!</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex justify-between items-center bg-blue-50 rounded-lg p-3 border border-blue-100">
        <div className="flex space-x-4 items-center">
          <div className="text-lg font-medium">Energie: {totalEnergy.toFixed(0)}/{MAX_ENERGY}</div>
          <EnergyBar 
            value={totalEnergy} 
            maxValue={MAX_ENERGY}
            className="w-40 h-4"
          />
        </div>
        
        <div className="flex space-x-4 items-center">
          <div className="text-lg font-medium">Wissen</div>
          <div className="w-40 flex items-center">
            <Progress value={totalKnowledge} className="h-4" />
            <span className="ml-2">{totalKnowledge.toFixed(0)}%</span>
          </div>
        </div>
        
        <div className="flex space-x-4 items-center">
          <div>
            <span className="font-medium">Neutronen:</span> {neutronCount}
          </div>
          <div>
            <span className="font-medium">Material:</span> 
            <span className="ml-2">{enrichedUranium.toFixed(1)} kg U</span>
            <span className="ml-2">{plutoniumAmount.toFixed(1)} kg Pu</span>
          </div>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-7 mb-4">
          <TabsTrigger value="fission" className="flex items-center">
            <Atom className="h-4 w-4 mr-1" />
            <span>Kernspaltung</span>
          </TabsTrigger>
          <TabsTrigger value="enrichment" className="flex items-center">
            <Radiation className="h-4 w-4 mr-1" />
            <span>Anreicherung</span>
          </TabsTrigger>
          <TabsTrigger value="bomb" className="flex items-center">
            <Flame className="h-4 w-4 mr-1" />
            <span>Atombombe</span>
          </TabsTrigger>
          <TabsTrigger value="reactor" className="flex items-center">
            <Zap className="h-4 w-4 mr-1" />
            <span>Reaktor</span>
          </TabsTrigger>
          <TabsTrigger value="fusion" className="flex items-center">
            <Flame className="h-4 w-4 mr-1" />
            <span>Fusion</span>
          </TabsTrigger>
          <TabsTrigger value="chain-reaction" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-1" />
            <span>Kettenreaktion</span>
          </TabsTrigger>
          <TabsTrigger value="radiation" className="flex items-center">
            <FlaskConical className="h-4 w-4 mr-1" />
            <span>Strahlung</span>
          </TabsTrigger>
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
        
        <TabsContent value="reactor">
          <ReactorLab 
            energy={totalEnergy}
            onEnergyProduced={handleEnergyProduced}
          />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-2">Kernreaktoren erklärt:</h3>
            <p className="text-sm">
              Kernreaktoren nutzen kontrollierte Kernspaltung, um Wärme zu erzeugen und 
              Wasser zu erhitzen, das Turbinen antreibt und Elektrizität erzeugt. 
              Die Reaktion wird durch Steuerstäbe reguliert, die Neutronen absorbieren. 
              Verschiedene Reaktortypen nutzen unterschiedliche Brennstoffe und Kühlmittel, 
              haben aber alle das Ziel, eine stabile, kontrollierte Kettenreaktion aufrechtzuerhalten.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="fusion">
          <FusionLab 
            energy={totalEnergy}
            onEnergyProduced={handleEnergyProduced}
          />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-2">Kernfusion erklärt:</h3>
            <p className="text-sm">
              Bei der Kernfusion verschmelzen leichte Atomkerne wie Wasserstoff zu schwereren Kernen 
              wie Helium und setzen dabei enorme Energiemengen frei. Dieser Prozess treibt Sterne an 
              und könnte eine nahezu unerschöpfliche, saubere Energiequelle darstellen. 
              Auf der Erde sind extrem hohe Temperaturen (Millionen Grad) und starke Magnetfelder 
              nötig, um die elektrostatische Abstoßung zwischen den Kernen zu überwinden.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="chain-reaction">
          <ChainReactionSimulator />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-2">Kettenreaktionen und exponentielle Prozesse erklärt:</h3>
            <p className="text-sm">
              Eine Kettenreaktion entsteht, wenn jede Kernspaltung durchschnittlich mehr als ein 
              Neutron erzeugt, das weitere Spaltungen auslöst. Der Multiplikationsfaktor k 
              beschreibt dieses Verhältnis: Bei k &lt; 1 stirbt die Reaktion ab, bei k = 1 bleibt 
              sie stabil und bei k &gt; 1 wächst sie exponentiell an. Ähnliche exponentielle Muster 
              finden wir in vielen Bereichen, von der Bevölkerungsentwicklung bis zum Zinseszins.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="radiation">
          <RadiationEffectsLab />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-2">Strahlung und Materie erklärt:</h3>
            <p className="text-sm">
              Ionisierende Strahlung (Alpha, Beta, Gamma und Neutronen) kann Atome ionisieren, 
              chemische Bindungen aufbrechen und biologisches Gewebe schädigen. In der Medizin 
              wird sie zur Krebsbehandlung eingesetzt, in der Industrie zur Materialprüfung. 
              Die Halbwertszeit beschreibt, wie lange radioaktive Stoffe aktiv bleiben, und reicht 
              von Sekundenbruchteilen bei kurzlebigen Isotopen bis zu Milliarden von Jahren.
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
                Wähle auf den Tabs oben zwischen verschiedenen Laboren, um tiefer in die Kernphysik einzutauchen:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Baue und steuere verschiedene Reaktortypen im Reaktor-Labor</li>
                <li>Entdecke Kernfusion und wie Sterne funktionieren im Fusions-Labor</li>
                <li>Verstehe die Mathematik hinter Kettenreaktionen im Simulator</li>
                <li>Erforsche die Auswirkungen von Strahlung auf verschiedene Materialien</li>
              </ul>
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
