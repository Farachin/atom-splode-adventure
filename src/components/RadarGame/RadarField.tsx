
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { JetType } from './RadarGame';
import RadarRobot from './RadarRobot';
import { Circle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RadarFieldProps {
  jetType: JetType;
  onGameOver: (score: number) => void;
}

type Position = {
  x: number;
  y: number;
};

type MaterialType = 'metal' | 'carbon' | 'stealth' | 'obstacle' | 'target';

type FieldObject = {
  type: MaterialType;
  position: Position;
  width: number;
  height: number;
};

const RadarField = ({ jetType, onGameOver }: RadarFieldProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 10, y: 50 });
  const [radarPosition, setRadarPosition] = useState<Position>({ x: 0, y: 50 });
  const [radarDetection, setRadarDetection] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [obstacles, setObstacles] = useState<FieldObject[]>([]);
  const fieldRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [jetDetectionLevel, setJetDetectionLevel] = useState(0);
  const { toast } = useToast();
  
  // Initialisiere das Spielfeld
  useEffect(() => {
    if (!fieldRef.current) return;
    
    const fieldWidth = fieldRef.current.clientWidth;
    const fieldHeight = fieldRef.current.clientHeight;
    
    // Generiere zufällige Hindernisse und Materialien
    const generatedObstacles: FieldObject[] = [];
    
    // Ziel am Ende des Feldes
    generatedObstacles.push({
      type: 'target',
      position: { x: fieldWidth - 30, y: fieldHeight / 2 - 25 },
      width: 30,
      height: 50
    });
    
    // Metall-Hindernisse
    for (let i = 0; i < 3; i++) {
      generatedObstacles.push({
        type: 'metal',
        position: { 
          x: Math.random() * (fieldWidth - 150) + 100, 
          y: Math.random() * (fieldHeight - 40)
        },
        width: 30 + Math.random() * 20,
        height: 30 + Math.random() * 20
      });
    }
    
    // Kohlenstoff-Gebiete
    for (let i = 0; i < 3; i++) {
      generatedObstacles.push({
        type: 'carbon',
        position: { 
          x: Math.random() * (fieldWidth - 150) + 100, 
          y: Math.random() * (fieldHeight - 40)
        },
        width: 40 + Math.random() * 30,
        height: 40 + Math.random() * 30
      });
    }
    
    // Stealth-Gebiete
    for (let i = 0; i < 2; i++) {
      generatedObstacles.push({
        type: 'stealth',
        position: { 
          x: Math.random() * (fieldWidth - 150) + 100, 
          y: Math.random() * (fieldHeight - 40)
        },
        width: 50 + Math.random() * 30,
        height: 50 + Math.random() * 30
      });
    }
    
    // Normale Hindernisse
    for (let i = 0; i < 4; i++) {
      generatedObstacles.push({
        type: 'obstacle',
        position: { 
          x: Math.random() * (fieldWidth - 150) + 100, 
          y: Math.random() * (fieldHeight - 40)
        },
        width: 20 + Math.random() * 40,
        height: 20 + Math.random() * 40
      });
    }
    
    setObstacles(generatedObstacles);
  }, []);
  
  // Starte das Spiel
  const handleStartGame = () => {
    setIsPlaying(true);
    startGameLoop();
    toast({
      title: "Los geht's!",
      description: "Steuere deinen Jet mit den Pfeiltasten oder durch Klicken/Tippen.",
    });
  };
  
  // Spielloop
  const startGameLoop = () => {
    if (gameLoopRef.current) return;
    
    let lastTime = 0;
    const loop = (time: number) => {
      if (!isPlaying) return;
      
      const deltaTime = time - lastTime;
      lastTime = time;
      
      // Bewege den Radar
      moveRadar(deltaTime);
      
      // Überprüfe, ob der Radar den Spieler erkennt
      checkRadarDetection();
      
      // Zeitabnahme
      if (timeLeft > 0) {
        setTimeLeft((prev) => Math.max(0, prev - deltaTime / 1000));
      } else {
        handleWin();
      }
      
      // Erhöhe den Punktestand, wenn der Spieler nicht erkannt wird
      if (!radarDetection) {
        setScore((prev) => prev + deltaTime / 100);
      }
      
      // Spielgeschwindigkeit erhöhen
      if (timeLeft < 20 && gameSpeed < 1.5) {
        setGameSpeed(1.5);
      } else if (timeLeft < 10 && gameSpeed < 2) {
        setGameSpeed(2);
        toast({
          title: "Schneller!",
          description: "Die Radargeschwindigkeit erhöht sich!",
        });
      }
      
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    
    gameLoopRef.current = requestAnimationFrame(loop);
  };
  
  // Bewege den Radar
  const moveRadar = (deltaTime: number) => {
    setRadarPosition((prev) => {
      // Radar bewegt sich horizontal von links nach rechts
      let newX = prev.x + (deltaTime / 50) * gameSpeed;
      if (newX > 100) newX = 0;
      
      // Radar bewegt sich etwas auf und ab, um den Spieler zu verfolgen
      let newY = prev.y;
      if (radarDetection) {
        // Wenn der Spieler erkannt wird, folge ihm
        newY = prev.y + (playerPosition.y > prev.y ? 1 : -1) * (deltaTime / 100);
      } else {
        // Ansonsten bewege dich zufällig
        newY = prev.y + (Math.random() - 0.5) * (deltaTime / 50);
      }
      
      // Begrenze die vertikale Position
      newY = Math.max(0, Math.min(100, newY));
      
      return { x: newX, y: newY };
    });
  };
  
  // Überprüfe, ob der Radar den Spieler erkennt
  const checkRadarDetection = () => {
    // Bestimme die Erkennungsstufe je nach Jettyp und aktuellem Material
    let detectionLevel = getJetDetectionLevel();
    setJetDetectionLevel(detectionLevel);
    
    // Horizontale Entfernung zum Radar
    const distanceX = Math.abs(radarPosition.x - playerPosition.x);
    
    // Je näher zum Radar, desto höher die Wahrscheinlichkeit, erkannt zu werden
    const detectionProbability = Math.max(0, 1 - distanceX / 20) * detectionLevel;
    
    // Setze den Erkennungsstatus
    const detected = Math.random() < detectionProbability;
    setRadarDetection(detected);
    
    // Wenn der Spieler lange genug erkannt wird, verliere
    if (detected && detectionLevel > 0.3) {
      handleLose();
    }
  };
  
  // Ermittle die Erkennungsstufe des Jets basierend auf Typ und aktuellem Material
  const getJetDetectionLevel = (): number => {
    // Grundwerte je nach Jettyp
    let baseDetection = 0;
    switch (jetType) {
      case 'metal': baseDetection = 0.8; break;
      case 'carbon': baseDetection = 0.4; break;
      case 'stealth': baseDetection = 0.2; break;
    }
    
    // Überprüfe, ob der Spieler auf einem Material steht
    for (const obj of obstacles) {
      if (isPlayerOnObject(obj)) {
        switch (obj.type) {
          case 'metal': return baseDetection * 1.5;
          case 'carbon': return baseDetection * 0.6;
          case 'stealth': return baseDetection * 0.3;
          case 'target': return 0; // Ziel erreicht, nicht mehr erkennbar
          case 'obstacle': return baseDetection;
        }
      }
    }
    
    return baseDetection;
  };
  
  // Überprüfe, ob der Spieler auf einem Objekt steht
  const isPlayerOnObject = (obj: FieldObject): boolean => {
    if (!fieldRef.current) return false;
    
    const fieldWidth = fieldRef.current.clientWidth;
    const fieldHeight = fieldRef.current.clientHeight;
    
    const playerX = playerPosition.x / 100 * fieldWidth;
    const playerY = playerPosition.y / 100 * fieldHeight;
    
    return (
      playerX > obj.position.x && 
      playerX < obj.position.x + obj.width &&
      playerY > obj.position.y && 
      playerY < obj.position.y + obj.height
    );
  };
  
  // Überprüfe, ob der Spieler das Ziel erreicht hat
  useEffect(() => {
    const targetObj = obstacles.find(obj => obj.type === 'target');
    if (targetObj && isPlayerOnObject(targetObj)) {
      handleWin();
    }
  }, [playerPosition, obstacles]);
  
  // Spieler gewinnt
  const handleWin = () => {
    if (!isPlaying) return;
    
    setIsPlaying(false);
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    // Bonus für verbleibende Zeit
    const timeBonus = Math.floor(timeLeft * 10);
    const finalScore = Math.floor(score) + timeBonus;
    
    toast({
      title: "Ziel erreicht!",
      description: `Du hast das Rennen gewonnen! Zeitbonus: +${timeBonus} Punkte`,
    });
    
    onGameOver(finalScore);
  };
  
  // Spieler verliert
  const handleLose = () => {
    if (!isPlaying) return;
    
    setIsPlaying(false);
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    toast({
      title: "Vom Radar entdeckt!",
      description: "Dein Jet wurde vom Radar erfasst!",
      variant: "destructive",
    });
    
    onGameOver(Math.floor(score));
  };
  
  // Spieler-Bewegung
  const movePlayer = (newX: number, newY: number) => {
    if (!isPlaying || !fieldRef.current) return;
    
    // Begrenze die Position innerhalb des Spielfelds
    const boundedX = Math.max(0, Math.min(100, newX));
    const boundedY = Math.max(0, Math.min(100, newY));
    
    // Überprüfe Kollisionen mit Hindernissen
    for (const obj of obstacles) {
      if (obj.type === 'obstacle') {
        const fieldWidth = fieldRef.current.clientWidth;
        const fieldHeight = fieldRef.current.clientHeight;
        
        const playerX = boundedX / 100 * fieldWidth;
        const playerY = boundedY / 100 * fieldHeight;
        
        // Wenn Kollision, dann Bewegung nicht erlauben
        if (
          playerX > obj.position.x - 10 && 
          playerX < obj.position.x + obj.width + 10 &&
          playerY > obj.position.y - 10 && 
          playerY < obj.position.y + obj.height + 10
        ) {
          return;
        }
      }
    }
    
    setPlayerPosition({ x: boundedX, y: boundedY });
  };
  
  // Mausklick/Touch auf dem Spielfeld
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying || !fieldRef.current) return;
    
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    movePlayer(x, y);
  };
  
  // Tastatursteuerung
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      const step = 5;
      switch (e.key) {
        case 'ArrowUp':
          movePlayer(playerPosition.x, playerPosition.y - step);
          break;
        case 'ArrowDown':
          movePlayer(playerPosition.x, playerPosition.y + step);
          break;
        case 'ArrowLeft':
          movePlayer(playerPosition.x - step, playerPosition.y);
          break;
        case 'ArrowRight':
          movePlayer(playerPosition.x + step, playerPosition.y);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, playerPosition]);
  
  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);
  
  return (
    <div className="space-y-6">
      {!isPlaying ? (
        <div className="text-center space-y-6">
          <RadarRobot speaking={true} className="mx-auto" />
          
          <div className="bg-blue-50 p-6 rounded-lg max-w-xl mx-auto">
            <h3 className="text-2xl font-bold mb-3">Bereit für das Radar-Rennen?</h3>
            <p className="mb-4">
              Steuere deinen Jet durch das Radar-Feld und versuche, unentdeckt zum Ziel zu gelangen!
              Benutze die Pfeiltasten oder klicke/tippe auf dem Spielfeld, wohin dein Jet fliegen soll.
            </p>
            <p className="font-medium">
              Tipps für deinen {jetType === 'metal' ? 'Metall-Jet' : jetType === 'carbon' ? 'Kohlenstoff-Jet' : 'Stealth-Jet'}:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              {jetType === 'metal' ? (
                <>
                  <li>Dein Jet ist sehr schnell, aber leicht zu erkennen</li>
                  <li>Versuche, dich in Stealth-Gebieten (dunkelblau) zu verstecken</li>
                  <li>Meide Metall-Objekte, sie machen dich noch sichtbarer!</li>
                </>
              ) : jetType === 'carbon' ? (
                <>
                  <li>Dein Jet ist ausgewogen in Geschwindigkeit und Stealth</li>
                  <li>Kohlenstoff-Gebiete (grau) verbessern deine Tarnung</li>
                  <li>Nutze Stealth-Gebiete für maximale Tarnung</li>
                </>
              ) : (
                <>
                  <li>Dein Jet ist langsamer, aber deutlich schwerer zu erkennen</li>
                  <li>In Stealth-Gebieten bist du fast unsichtbar</li>
                  <li>Selbst in normalen Gebieten bist du schwer zu entdecken</li>
                </>
              )}
            </ul>
          </div>
          
          <Button 
            onClick={handleStartGame}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Starte das Rennen!
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-blue-50 p-2 rounded-md">
            <div className="flex items-center">
              <div className="mr-4">
                <span className="block text-xs">Radar-Sichtbarkeit:</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Circle 
                      key={i} 
                      className={`w-3 h-3 ${i < Math.ceil(jetDetectionLevel * 5) ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Shield className={cn("w-5 h-5", radarDetection ? "text-red-500 fill-red-500" : "text-green-500")} />
                <span className={radarDetection ? "text-red-500" : "text-green-500"}>
                  {radarDetection ? "Erfasst!" : "Versteckt"}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div>
                <span className="text-sm font-medium">Zeit:</span>
                <span className="ml-2 font-bold">{Math.ceil(timeLeft)}s</span>
              </div>
              <div>
                <span className="text-sm font-medium">Punkte:</span>
                <span className="ml-2 font-bold">{Math.floor(score)}</span>
              </div>
            </div>
          </div>
          
          <div 
            ref={fieldRef}
            className="relative w-full h-80 bg-blue-100 rounded-xl border-2 border-blue-200 overflow-hidden"
            onClick={handleFieldClick}
          >
            {/* Radar-Strahl */}
            <div 
              className="absolute h-full w-2 bg-red-500 opacity-40"
              style={{ left: `${radarPosition.x}%` }}
            ></div>
            
            {/* Radar-Wellen */}
            <div 
              className="absolute w-40 h-40 rounded-full border-2 border-red-500 opacity-30"
              style={{ 
                left: `${radarPosition.x}%`, 
                top: `${radarPosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            ></div>
            
            {/* Materialien und Hindernisse */}
            {obstacles.map((obj, index) => (
              <div
                key={index}
                className={cn(
                  "absolute rounded-md",
                  obj.type === 'metal' && "bg-gray-400 border border-gray-500",
                  obj.type === 'carbon' && "bg-gray-800 border border-gray-900",
                  obj.type === 'stealth' && "bg-blue-900 border border-blue-800",
                  obj.type === 'obstacle' && "bg-green-800 border border-green-900",
                  obj.type === 'target' && "bg-yellow-300 border-2 border-yellow-500 animate-pulse"
                )}
                style={{
                  left: `${obj.position.x}px`,
                  top: `${obj.position.y}px`,
                  width: `${obj.width}px`,
                  height: `${obj.height}px`
                }}
              >
                {obj.type === 'target' && (
                  <div className="flex items-center justify-center h-full text-yellow-800 font-bold">
                    ZIEL
                  </div>
                )}
              </div>
            ))}
            
            {/* Spieler-Jet */}
            <div 
              className={cn(
                "absolute w-10 h-6 transform -translate-x-1/2 -translate-y-1/2",
                jetType === 'metal' && "bg-gray-600",
                jetType === 'carbon' && "bg-gray-800",
                jetType === 'stealth' && "bg-blue-950",
                radarDetection && "ring-2 ring-red-500 ring-opacity-80"
              )}
              style={{ 
                left: `${playerPosition.x}%`, 
                top: `${playerPosition.y}%`,
                clipPath: "polygon(0% 50%, 20% 0%, 100% 30%, 100% 70%, 20% 100%)"
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadarField;
