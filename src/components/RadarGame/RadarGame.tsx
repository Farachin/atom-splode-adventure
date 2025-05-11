
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RadarIntroduction from './RadarIntroduction';
import JetSelection from './JetSelection';
import RadarField from './RadarField';
import ResultScreen from './ResultScreen';
import { useToast } from '@/hooks/use-toast';

export type JetType = 'metal' | 'carbon' | 'stealth';
export type GameStage = 'intro' | 'selection' | 'field' | 'result';

const RadarGame = () => {
  const [currentStage, setCurrentStage] = useState<GameStage>('intro');
  const [selectedJet, setSelectedJet] = useState<JetType | null>(null);
  const [score, setScore] = useState(0);
  const [currentTab, setCurrentTab] = useState<GameStage>('intro');
  const { toast } = useToast();
  
  const handleJetSelect = (jetType: JetType) => {
    setSelectedJet(jetType);
    toast({
      title: "Jet ausgewählt!",
      description: `Du hast einen ${getJetName(jetType)} ausgewählt.`,
    });
    
    // Automatisch zum nächsten Schritt
    setCurrentStage('field');
    setCurrentTab('field');
  };
  
  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setCurrentStage('result');
    setCurrentTab('result');
  };
  
  const restartGame = () => {
    setSelectedJet(null);
    setScore(0);
    setCurrentStage('intro');
    setCurrentTab('intro');
  };
  
  const getJetName = (type: JetType): string => {
    switch (type) {
      case 'metal': return 'Metall-Jet';
      case 'carbon': return 'Kohlenstoff-Jet';
      case 'stealth': return 'Stealth-Jet';
    }
  };
  
  const handleChangeTab = (tab: string) => {
    const newTab = tab as GameStage;
    setCurrentTab(newTab);
    
    // Nur vorwärts erlauben, wenn die Stage bereits erreicht wurde
    if ((newTab === 'selection' && currentStage === 'intro') || 
        (newTab === 'field' && selectedJet) || 
        (newTab === 'result' && currentStage === 'result')) {
      setCurrentStage(newTab);
    }
  };
  
  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl">
      <Tabs value={currentTab} onValueChange={handleChangeTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="intro" disabled={currentStage === 'result'}>
            1. Einführung
          </TabsTrigger>
          <TabsTrigger value="selection" disabled={currentStage === 'intro' || currentStage === 'result'}>
            2. Jet wählen
          </TabsTrigger>
          <TabsTrigger value="field" disabled={!selectedJet || currentStage === 'result'}>
            3. Radar-Rennen
          </TabsTrigger>
          <TabsTrigger value="result" disabled={currentStage !== 'result'}>
            4. Ergebnis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="intro" className="space-y-4">
          <RadarIntroduction 
            onComplete={() => {
              setCurrentStage('selection');
              setCurrentTab('selection');
            }} 
          />
        </TabsContent>
        
        <TabsContent value="selection" className="space-y-4">
          <JetSelection 
            onSelect={handleJetSelect}
          />
        </TabsContent>
        
        <TabsContent value="field" className="space-y-4">
          {selectedJet && (
            <RadarField 
              jetType={selectedJet} 
              onGameOver={handleGameOver}
            />
          )}
        </TabsContent>
        
        <TabsContent value="result" className="space-y-4">
          <ResultScreen 
            jetType={selectedJet || 'metal'} 
            score={score}
            onRestart={restartGame}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default RadarGame;
