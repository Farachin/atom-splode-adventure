
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JetType } from './RadarGame';
import RadarRobot from './RadarRobot';
import { Circle } from 'lucide-react';

interface ResultScreenProps {
  jetType: JetType;
  score: number;
  onRestart: () => void;
}

const ResultScreen = ({ jetType, score, onRestart }: ResultScreenProps) => {
  const getRank = (): { title: string; description: string; color: string } => {
    if (score >= 800) {
      return { 
        title: "Stealth-Meister", 
        description: "Du bist ein Experte in Radar-Technologie! Du weißt genau, wie man sich vor Radar versteckt.",
        color: "bg-purple-600"
      };
    } else if (score >= 500) {
      return { 
        title: "Radar-Profi", 
        description: "Du verstehst sehr gut, wie Radar funktioniert und wie man sich tarnt!",
        color: "bg-blue-600"
      };
    } else if (score >= 300) {
      return { 
        title: "Fortgeschrittener Pilot", 
        description: "Du hast viel über Radar und Materialien gelernt!",
        color: "bg-green-600"
      };
    } else {
      return { 
        title: "Radar-Entdecker", 
        description: "Du hast die Grundlagen von Radar-Technologie kennengelernt!",
        color: "bg-yellow-600"
      };
    }
  };
  
  const rank = getRank();
  
  const getJetTip = (): string => {
    switch (jetType) {
      case 'metal':
        return "Metallflugzeuge sind sehr schnell, aber reflektieren Radar stark. Stealth-Materialien könnten dir beim nächsten Mal helfen, unsichtbarer zu sein!";
      case 'carbon':
        return "Kohlenstoff-Jets bieten eine gute Balance zwischen Geschwindigkeit und Radar-Absorption. Mit etwas Übung wirst du noch besser werden!";
      case 'stealth':
        return "Stealth-Jets sind hervorragend darin, Radar zu absorbieren. Du hast eine gute Wahl getroffen!";
    }
  };
  
  const getLearningPoints = (): string[] => {
    return [
      "Radar sendet unsichtbare Wellen aus, die von Objekten zurückgeworfen werden",
      "Metall reflektiert Radar sehr stark - wie ein Spiegel für Radar-Wellen",
      "Kohlenstoff-Materialien absorbieren etwas Radar und machen Objekte schwerer zu erkennen",
      "Spezielle Stealth-Materialien absorbieren fast alle Radar-Wellen",
      "Flugzeuge nutzen verschiedene Materialien, um sich vor Radar zu verstecken"
    ];
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-2">Radar-Abenteuer abgeschlossen!</h2>
          <p className="text-gray-600">
            Toll gemacht! Du hast gelernt, wie Radar funktioniert und wie verschiedene 
            Materialien Radar-Wellen reflektieren oder absorbieren.
          </p>
        </div>
        <RadarRobot speaking={true} />
      </div>
      
      <div className="w-full max-w-2xl mx-auto bg-blue-50 rounded-lg p-6 text-center">
        <h3 className="text-2xl font-bold mb-1">Dein Ergebnis</h3>
        <div className="text-4xl font-bold mb-4">{score} Punkte</div>
        
        <Badge className={`${rank.color} text-white text-lg py-1 px-4 mb-2`}>
          {rank.title}
        </Badge>
        
        <p className="mb-6">{rank.description}</p>
        
        <div className="bg-white rounded-lg p-4 mb-6">
          <h4 className="font-semibold mb-2">Dein Flugzeug:</h4>
          <div className="flex justify-center items-center space-x-3">
            <div 
              className={`w-16 h-10 
                ${jetType === 'metal' ? 'bg-gray-600' : 
                  jetType === 'carbon' ? 'bg-gray-800' : 'bg-blue-950'} 
                rounded-md`}
              style={{
                clipPath: "polygon(0% 50%, 20% 0%, 100% 30%, 100% 70%, 20% 100%)"
              }}
            ></div>
            <div>
              <span className="block font-medium">
                {jetType === 'metal' ? 'Metall-Jet' : 
                 jetType === 'carbon' ? 'Kohlenstoff-Jet' : 'Stealth-Jet'}
              </span>
              <div className="flex mt-1">
                {[...Array(5)].map((_, i) => (
                  <Circle 
                    key={i} 
                    className={`w-3 h-3 ${
                      i < (jetType === 'metal' ? 5 : jetType === 'carbon' ? 3 : 1) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm mt-3">{getJetTip()}</p>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <h4 className="font-bold text-lg mb-3">Das hast du gelernt:</h4>
            <ul className="text-left space-y-2 text-sm">
              {getLearningPoints().map((point, index) => (
                <li key={index} className="flex items-start">
                  <div className="mr-2 mt-1 text-green-500">✓</div>
                  <div>{point}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <div className="flex justify-center space-x-4 mt-8">
          <Button 
            onClick={onRestart}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Nochmal spielen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
