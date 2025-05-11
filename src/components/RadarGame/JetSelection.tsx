
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';
import { JetType } from './RadarGame';
import RadarRobot from './RadarRobot';

interface JetSelectionProps {
  onSelect: (jetType: JetType) => void;
}

const JetSelection = ({ onSelect }: JetSelectionProps) => {
  const jets = [
    {
      type: 'metal' as JetType,
      name: 'Metall-Jet',
      description: 'Reflektiert Radar sehr stark. Wie ein fliegender Spiegel!',
      strength: 'Sehr schnell und wendig',
      weakness: 'Leicht vom Radar zu entdecken',
      radarVisibility: 5, // 5/5 - sehr sichtbar
      color: 'from-gray-200 to-gray-400',
      jetColor: 'bg-gray-600'
    },
    {
      type: 'carbon' as JetType,
      name: 'Kohlenstoff-Jet',
      description: 'Absorbiert etwas Radar. Wird manchmal vom Radar gesehen.',
      strength: 'Ausgewogen in Geschwindigkeit und Stealth',
      weakness: 'Kann immer noch vom Radar entdeckt werden',
      radarVisibility: 3, // 3/5 - mittel sichtbar
      color: 'from-gray-700 to-gray-900',
      jetColor: 'bg-gray-800',
      textColor: 'text-white'
    },
    {
      type: 'stealth' as JetType,
      name: 'Stealth-Jet',
      description: 'Neueste Technologie! Absorbiert fast alle Radarstrahlen.',
      strength: 'Fast unsichtbar für Radar',
      weakness: 'Etwas langsamer als andere Jets',
      radarVisibility: 1, // 1/5 - kaum sichtbar
      color: 'from-blue-900 to-purple-900',
      jetColor: 'bg-blue-950',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-2">Wähle deinen Jet!</h2>
          <p className="text-gray-600">
            Jeder Jet hat unterschiedliche Eigenschaften. Einige sind schneller, 
            während andere besser darin sind, sich vor dem Radar zu verstecken.
            Wähle weise!
          </p>
        </div>
        <RadarRobot />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {jets.map((jet) => (
          <Card 
            key={jet.type}
            className={`bg-gradient-to-b ${jet.color} hover:shadow-lg transition-shadow cursor-pointer`}
            onClick={() => onSelect(jet.type)}
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className={`w-full h-24 ${jet.jetColor} rounded-lg mb-4 relative`}>
                {/* Jet shape */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-1/3 bg-white opacity-20 rounded-xl transform -rotate-6"></div>
                </div>
                <div className="absolute -right-2 -bottom-2">
                  <Badge className="bg-blue-600">{jet.name}</Badge>
                </div>
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${jet.textColor || ''}`}>{jet.name}</h3>
              <p className={`text-sm mb-4 ${jet.textColor ? 'text-gray-300' : 'text-gray-700'}`}>
                {jet.description}
              </p>
              
              <div className={`mt-auto ${jet.textColor ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs">Radar-Sichtbarkeit:</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Circle 
                        key={i} 
                        className={`w-3 h-3 ${i < jet.radarVisibility ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex">
                    <span className="font-semibold mr-2">Stärke:</span>
                    <span>{jet.strength}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold mr-2">Schwäche:</span>
                    <span>{jet.weakness}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => onSelect(jet.type)}
              >
                Diesen Jet wählen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JetSelection;
