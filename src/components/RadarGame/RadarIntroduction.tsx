
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Circle } from 'lucide-react';
import RadarRobot from './RadarRobot';

interface RadarIntroductionProps {
  onComplete: () => void;
}

const RadarIntroduction = ({ onComplete }: RadarIntroductionProps) => {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Hallo! Ich bin Rada, der Radar-Roboter!",
      content: "Ich erkläre dir heute, wie Radar funktioniert. Das ist super spannend!"
    },
    {
      title: "Was ist eigentlich Radar?",
      content: "Radar ist wie unsichtbares Licht, das von einer Radar-Station ausgesendet wird und auf Objekte trifft. Wenn das Radar-Licht auf etwas trifft, kommt ein Teil zurück zur Station - und so wissen wir, dass dort etwas ist!"
    },
    {
      title: "Materialien und Radar",
      content: "Verschiedene Materialien verhalten sich unterschiedlich, wenn Radar auf sie trifft. Metall reflektiert Radar sehr stark - wie ein Spiegel! Kohlenstoff und spezielle Stealth-Materialien können Radar absorbieren und machen ein Flugzeug für Radar fast unsichtbar."
    },
    {
      title: "Unser Abenteuer",
      content: "Im Radar-Abenteuer kannst du verschiedene Jets auswählen und durch ein Radarfeld steuern. Dein Ziel ist es, unsichtbar für das feindliche Radar zu bleiben! Bist du bereit für das Abenteuer?"
    }
  ];
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };
  
  const renderRadarDiagram = () => {
    if (step === 1) {
      return (
        <div className="relative h-48 bg-blue-50 rounded-lg my-4 overflow-hidden">
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="animate-pulse w-6 h-6 bg-red-500 rounded-full"></div>
              <div className="absolute top-0 left-0 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>
          <div className="absolute w-full h-full">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="absolute left-8 top-1/2 -translate-y-1/2 border-2 border-red-500 rounded-full opacity-20"
                style={{
                  width: `${(i+1) * 20}%`,
                  height: `${(i+1) * 40}px`,
                  animationDelay: `${i * 0.5}s`,
                  animation: 'radarWave 3s infinite'
                }}
              ></div>
            ))}
          </div>
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-16 h-10 bg-gray-400 transform -rotate-12 rounded-md"></div>
          </div>
          <style jsx>{`
            @keyframes radarWave {
              0% { transform: scale(0.1); opacity: 0.8; }
              100% { transform: scale(3); opacity: 0; }
            }
          `}</style>
        </div>
      );
    } else if (step === 2) {
      return (
        <div className="flex justify-around items-center my-6 gap-4">
          <Card className="w-1/3 bg-gradient-to-b from-gray-200 to-gray-400">
            <CardContent className="flex flex-col items-center p-4">
              <div className="w-16 h-10 bg-gray-600 rounded-md mb-2"></div>
              <p className="text-center text-sm">Metall-Jet</p>
              <p className="text-center text-xs mt-2">Reflektiert Radar stark</p>
              <div className="mt-4 flex">
                {[...Array(5)].map((_, i) => (
                  <Circle key={i} className="w-3 h-3 fill-red-500 text-red-500" />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="w-1/3 bg-gradient-to-b from-gray-700 to-gray-900">
            <CardContent className="flex flex-col items-center p-4">
              <div className="w-16 h-10 bg-gray-800 rounded-md mb-2"></div>
              <p className="text-center text-sm text-white">Kohlenstoff-Jet</p>
              <p className="text-center text-xs mt-2 text-gray-300">Absorbiert etwas Radar</p>
              <div className="mt-4 flex">
                {[...Array(5)].map((_, i) => (
                  <Circle key={i} className={`w-3 h-3 ${i < 3 ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="w-1/3 bg-gradient-to-b from-blue-900 to-purple-900">
            <CardContent className="flex flex-col items-center p-4">
              <div className="w-16 h-10 bg-blue-950 rounded-md mb-2"></div>
              <p className="text-center text-sm text-white">Stealth-Jet</p>
              <p className="text-center text-xs mt-2 text-blue-300">Absorbiert fast alles Radar</p>
              <div className="mt-4 flex">
                {[...Array(5)].map((_, i) => (
                  <Circle key={i} className={`w-3 h-3 ${i < 1 ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <RadarRobot speaking={true} />
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-2xl font-bold mb-3 text-blue-800">{steps[step].title}</h3>
        <p className="text-lg">{steps[step].content}</p>
        
        {renderRadarDiagram()}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleNext} 
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {step < steps.length - 1 ? 'Weiter' : 'Los gehts!'}
        </Button>
      </div>
    </div>
  );
};

export default RadarIntroduction;
