import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { JetType } from './RadarGame';
import RadarRobot from './RadarRobot';
import { Circle, Shield, Plane, Radar } from 'lucide-react';
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
  const [playerRotation, setPlayerRotation] = useState(0);
  const [radarPosition, setRadarPosition] = useState<Position>({ x: 0, y: 50 });
  const [radarDetection, setRadarDetection] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [obstacles, setObstacles] = useState<FieldObject[]>([]);
  const fieldRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [jetDetectionLevel, setJetDetectionLevel] = useState(0);
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const { toast } = useToast();
  const [waveRadius, setWaveRadius] = useState(30);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [detectionCounter, setDetectionCounter] = useState(0);
  
  // Movement state
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [lastMoveTimestamp, setLastMoveTimestamp] = useState(0);
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({});
  
  // Jet properties based on type
  const jetProperties = {
    metal: { speed: 1.5, detection: 0.8, turnRate: 8 },
    carbon: { speed: 1.2, detection: 0.5, turnRate: 6 },
    stealth: { speed: 1, detection: 0.3, turnRate: 5 }
  };
  
  // Initialize game field
  useEffect(() => {
    if (!fieldRef.current) return;
    
    const fieldWidth = fieldRef.current.clientWidth;
    const fieldHeight = fieldRef.current.clientHeight;
    
    // Generate random obstacles and materials
    const generatedObstacles: FieldObject[] = [];
    
    // Target at the end of the field
    const targetObj = {
      type: 'target' as MaterialType,
      position: { x: fieldWidth - 60, y: fieldHeight / 2 - 25 },
      width: 50,
      height: 50
    };
    
    generatedObstacles.push(targetObj);
    setTargetPosition({ x: targetObj.position.x / fieldWidth * 100, y: targetObj.position.y / fieldHeight * 100 });
    
    // Metal obstacles
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
    
    // Carbon areas
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
    
    // Stealth areas
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
    
    // Normal obstacles
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
  
  // Start game after clicking Start
  const handleStartGame = () => {
    setShowStartScreen(false);
    setIsPlaying(true);
    
    // Set initial jet position to start position
    setPlayerPosition({ x: 10, y: 50 });
    
    // Reset velocity and acceleration
    setVelocity({ x: 0, y: 0 });
    setAcceleration({ x: 0, y: 0 });
    
    // Start the game loop immediately
    startGameLoop();
    
    toast({
      title: "Los geht's!",
      description: "Steuere deinen Jet mit den Pfeiltasten oder durch Klicken/Tippen.",
    });
  };
  
  // Game loop
  const startGameLoop = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    let lastTime = performance.now();
    
    const loop = (time: number) => {
      if (!isPlaying) return;
      
      const deltaTime = time - lastTime;
      lastTime = time;
      
      // Update game physics
      updateGamePhysics(deltaTime);
      
      // Move the radar
      moveRadar(deltaTime);
      
      // Animate radar waves
      animateRadarWaves(deltaTime);
      
      // Check if radar detects the player
      checkRadarDetection();
      
      // Time decrease
      if (timeLeft > 0) {
        setTimeLeft((prev) => Math.max(0, prev - deltaTime / 1000));
      } else {
        handleLose();
      }
      
      // Increase score if player isn't detected
      if (!radarDetection) {
        // Speed-based scoring
        const speedFactor = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        setScore((prev) => prev + deltaTime / 100 * (speedFactor + 1));
      }
      
      // Increase game speed
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
  
  // Physics update
  const updateGamePhysics = (deltaTime: number) => {
    // Process keyboard input
    processKeyboardInput();
    
    // Apply drag to gradually slow down
    const dragFactor = 0.97;
    setVelocity(prev => ({
      x: prev.x * dragFactor,
      y: prev.y * dragFactor
    }));
    
    // Apply acceleration to velocity
    setVelocity(prev => ({
      x: prev.x + acceleration.x * (deltaTime / 16),
      y: prev.y + acceleration.y * (deltaTime / 16)
    }));
    
    // Apply velocity to position with collision detection
    setPlayerPosition(prev => {
      // Calculate new position based on velocity
      const speedMultiplier = jetProperties[jetType].speed;
      const newX = Math.max(0, Math.min(100, prev.x + velocity.x * speedMultiplier * (deltaTime / 16)));
      const newY = Math.max(0, Math.min(100, prev.y + velocity.y * speedMultiplier * (deltaTime / 16)));
      
      // Check collision with obstacles
      if (!fieldRef.current) return { x: newX, y: newY };
      
      const fieldWidth = fieldRef.current.clientWidth;
      const fieldHeight = fieldRef.current.clientHeight;
      
      const playerAbsX = newX / 100 * fieldWidth;
      const playerAbsY = newY / 100 * fieldHeight;
      
      // Collision check
      for (const obj of obstacles) {
        if (obj.type === 'obstacle') {
          const hitBox = 10;
          if (
            playerAbsX > obj.position.x - hitBox && 
            playerAbsX < obj.position.x + obj.width + hitBox &&
            playerAbsY > obj.position.y - hitBox && 
            playerAbsY < obj.position.y + obj.height + hitBox
          ) {
            // Bounce on collision
            setVelocity(prev => ({
              x: -prev.x * 0.5,
              y: -prev.y * 0.5
            }));
            return prev;
          }
        }
      }
      
      // Target detection
      const targetObj = obstacles.find(obj => obj.type === 'target');
      if (targetObj) {
        const playerX = newX / 100 * fieldWidth;
        const playerY = newY / 100 * fieldHeight;
        
        if (
          playerX > targetObj.position.x - 15 && 
          playerX < targetObj.position.x + targetObj.width + 15 &&
          playerY > targetObj.position.y - 15 && 
          playerY < targetObj.position.y + targetObj.height + 15
        ) {
          // Will trigger win in useEffect
        }
      }
      
      return { x: newX, y: newY };
    });
    
    // Update movement state for visual effects
    const isCurrentlyMoving = Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1;
    if (isCurrentlyMoving) {
      setIsMoving(true);
      setLastMoveTimestamp(Date.now());
    } else if (isMoving && Date.now() - lastMoveTimestamp > 200) {
      setIsMoving(false);
    }
  };
  
  // Process keyboard input
  const processKeyboardInput = () => {
    if (!isPlaying) return;
    
    let dirX = 0;
    let dirY = 0;
    
    // Calculate direction based on keys pressed
    if (keysPressed['ArrowUp']) dirY -= 1;
    if (keysPressed['ArrowDown']) dirY += 1;
    if (keysPressed['ArrowLeft']) dirX -= 1;
    if (keysPressed['ArrowRight']) dirX += 1;
    
    // Normalize diagonal movement
    if (dirX !== 0 && dirY !== 0) {
      const norm = 1 / Math.sqrt(2);
      dirX *= norm;
      dirY *= norm;
    }
    
    // Set acceleration based on direction
    if (dirX !== 0 || dirY !== 0) {
      // Calculate rotation angle based on direction
      const angle = Math.atan2(dirY, dirX) * (180 / Math.PI);
      setPlayerRotation(angle);
      
      // Set acceleration in the chosen direction
      const accelerationValue = 0.1 * jetProperties[jetType].speed;
      setAcceleration({
        x: dirX * accelerationValue,
        y: dirY * accelerationValue
      });
    } else {
      // No keys pressed, stop accelerating
      setAcceleration({ x: 0, y: 0 });
    }
  };
  
  // Animate the radar waves
  const animateRadarWaves = (deltaTime: number) => {
    setWaveRadius((prev) => {
      const newRadius = prev + deltaTime / 50;
      return newRadius > 80 ? 30 : newRadius;
    });
  };
  
  // Move the radar
  const moveRadar = (deltaTime: number) => {
    setRadarPosition((prev) => {
      // Radar moves horizontally from left to right
      let newX = prev.x + (deltaTime / 50) * gameSpeed;
      if (newX > 100) newX = 0;
      
      // Radar moves up and down a bit to follow the player
      let newY = prev.y;
      if (radarDetection) {
        // If player is detected, follow them
        newY = prev.y + (playerPosition.y > prev.y ? 1 : -1) * (deltaTime / 100);
      } else {
        // Otherwise move randomly
        newY = prev.y + (Math.random() - 0.5) * (deltaTime / 50);
      }
      
      // Limit vertical position
      newY = Math.max(0, Math.min(100, newY));
      
      return { x: newX, y: newY };
    });
  };
  
  // Check if radar detects the player
  const checkRadarDetection = () => {
    // Determine detection level based on jet type and current material
    let detectionLevel = getJetDetectionLevel();
    setJetDetectionLevel(detectionLevel);
    
    // Horizontal distance to radar
    const distanceX = Math.abs(radarPosition.x - playerPosition.x);
    
    // The closer to the radar, the higher the probability of being detected
    const detectionProbability = Math.max(0, 1 - distanceX / 30) * detectionLevel;
    
    // Set detection status
    const detected = Math.random() < detectionProbability;
    setRadarDetection(detected);
    
    // If player is detected for too long, lose
    if (detected && detectionLevel > 0.3) {
      // Counter for detected time
      setDetectionCounter((prev) => {
        const newVal = prev + 1;
        if (newVal >= 60) { // about 1 second at 60 FPS
          handleLose();
          return 0;
        }
        return newVal;
      });
    } else {
      setDetectionCounter(0);
    }
  };
  
  // Determine jet detection level based on type and current material
  const getJetDetectionLevel = (): number => {
    // Base values based on jet type
    let baseDetection = jetProperties[jetType].detection;
    
    // Increase detection based on speed
    const speedFactor = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    baseDetection *= (1 + speedFactor * 0.3);
    
    // Check if player is on a material
    for (const obj of obstacles) {
      if (isPlayerOnObject(obj)) {
        switch (obj.type) {
          case 'metal': return baseDetection * 1.5;
          case 'carbon': return baseDetection * 0.6;
          case 'stealth': return baseDetection * 0.3;
          case 'target': return 0; // Target reached, no longer detectable
          case 'obstacle': return baseDetection;
        }
      }
    }
    
    return baseDetection;
  };
  
  // Check if player is on an object
  const isPlayerOnObject = (obj: FieldObject): boolean => {
    if (!fieldRef.current) return false;
    
    const fieldWidth = fieldRef.current.clientWidth;
    const fieldHeight = fieldRef.current.clientHeight;
    
    const playerX = playerPosition.x / 100 * fieldWidth;
    const playerY = playerPosition.y / 100 * fieldHeight;
    
    return (
      playerX > obj.position.x - 15 && 
      playerX < obj.position.x + obj.width + 15 &&
      playerY > obj.position.y - 15 && 
      playerY < obj.position.y + obj.height + 15
    );
  };
  
  // Check if player has reached the target
  useEffect(() => {
    const targetObj = obstacles.find(obj => obj.type === 'target');
    if (targetObj && isPlayerOnObject(targetObj)) {
      handleWin();
    }
  }, [playerPosition, obstacles]);
  
  // Player wins
  const handleWin = () => {
    if (!isPlaying) return;
    
    setIsPlaying(false);
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    // Bonus for remaining time
    const timeBonus = Math.floor(timeLeft * 10);
    const finalScore = Math.floor(score) + timeBonus;
    
    toast({
      title: "Ziel erreicht!",
      description: `Du hast das Rennen gewonnen! Zeitbonus: +${timeBonus} Punkte`,
    });
    
    onGameOver(finalScore);
  };
  
  // Player loses
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
  
  // Handle field click for movement
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying || !fieldRef.current) return;
    
    const rect = fieldRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Calculate direction to clicked point
    const dirX = clickX - playerPosition.x;
    const dirY = clickY - playerPosition.y;
    
    // Calculate angle to clicked point
    const angle = Math.atan2(dirY, dirX) * 180 / Math.PI;
    setPlayerRotation(angle);
    
    // Set velocity in the direction of the click
    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
    const normalizedDirX = dirX / distance;
    const normalizedDirY = dirY / distance;
    
    // Set acceleration and velocity
    const speed = jetProperties[jetType].speed * 1.5;
    setVelocity({
      x: normalizedDirX * speed,
      y: normalizedDirY * speed
    });
  };
  
  // Keyboard controls
  useEffect(() => {
    // Handle key press down
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      // Save pressed key
      setKeysPressed(prev => ({ ...prev, [e.key]: true }));
      
      // Space key for boost
      if (e.key === ' ') {
        // Apply boost in current direction
        setVelocity(prev => {
          const angle = playerRotation * Math.PI / 180;
          const boostFactor = jetProperties[jetType].speed * 2;
          return {
            x: prev.x + Math.cos(angle) * boostFactor,
            y: prev.y + Math.sin(angle) * boostFactor
          };
        });
      }
    };
    
    // Handle key release
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      // Remove key from pressed keys
      setKeysPressed(prev => {
        const newKeys = { ...prev };
        delete newKeys[e.key];
        return newKeys;
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, jetType, playerRotation]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);
  
  return (
    <div className="space-y-6">
      {showStartScreen ? (
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
            className="bg-blue-600 hover:bg-blue-700 animate-pulse"
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
              <div className="flex items-center">
                <Circle 
                  className={`w-4 h-4 ${isMoving ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} 
                />
                <span className="ml-1 text-sm">Geschwindigkeit</span>
                <div className="ml-1 w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, (Math.abs(velocity.x) + Math.abs(velocity.y)) * 33)}%` }}
                  ></div>
                </div>
              </div>
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
            className="relative w-full h-80 bg-blue-100 rounded-xl border-2 border-blue-200 overflow-hidden cursor-crosshair"
            onClick={handleFieldClick}
          >
            {/* Radar-Station */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
              <Radar className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
            
            {/* Radar beam - more intense */}
            <div 
              className="absolute h-full w-3 bg-red-500 opacity-90"
              style={{ left: `${radarPosition.x}%` }}
            ></div>
            
            {/* Radar waves - multiple for better visibility */}
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="absolute rounded-full border-2 border-red-500 opacity-70"
                style={{ 
                  left: `${radarPosition.x}%`, 
                  top: `${radarPosition.y}%`,
                  width: `${waveRadius * i}px`,
                  height: `${waveRadius * i}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              ></div>
            ))}
            
            {/* Target arrow when out of sight */}
            {targetPosition && (
              <div 
                className={cn(
                  "absolute w-6 h-6 bg-yellow-400 border-2 border-yellow-500 rounded-full flex items-center justify-center",
                  "animate-pulse transition-opacity",
                  isPlayerOnObject(obstacles.find(o => o.type === 'target') as FieldObject) ? "opacity-0" : "opacity-100"
                )}
                style={{ 
                  left: `${playerPosition.x}%`, 
                  top: `${playerPosition.y}%`,
                  transform: `translate(${Math.cos(Math.atan2(targetPosition.y - playerPosition.y, targetPosition.x - playerPosition.x)) * 40}px, ${Math.sin(Math.atan2(targetPosition.y - playerPosition.y, targetPosition.x - playerPosition.x)) * 40}px)`,
                  display: Math.abs(targetPosition.x - playerPosition.x) > 30 || Math.abs(targetPosition.y - playerPosition.y) > 30 ? 'flex' : 'none'
                }}
              >
                ⮊
              </div>
            )}
            
            {/* Materials and obstacles */}
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
            
            {/* Player jet with improved visual effects */}
            <div 
              className={cn(
                "absolute transform transition-transform",
                radarDetection && "ring-4 ring-red-500 ring-opacity-80",
                isMoving && "animate-pulse"
              )}
              style={{ 
                left: `${playerPosition.x}%`, 
                top: `${playerPosition.y}%`,
                transform: `translate(-50%, -50%) rotate(${playerRotation}deg)`,
                zIndex: 20
              }}
            >
              <div className="relative">
                {/* Jet silhouette */}
                <Plane 
                  className={cn(
                    "w-16 h-16",
                    jetType === 'metal' && "text-gray-600",
                    jetType === 'carbon' && "text-gray-800",
                    jetType === 'stealth' && "text-blue-950"
                  )}
                  fill={jetType === 'metal' ? '#4B5563' : jetType === 'carbon' ? '#1F2937' : '#172554'}
                  strokeWidth={1}
                />
                
                {/* Enhanced movement indicator */}
                {isMoving && (
                  <div className="absolute -inset-2 border-2 border-white opacity-40 rounded-full animate-ping"></div>
                )}
                
                {/* Exhaust effect based on velocity */}
                {isMoving && (
                  <div
                    className={cn(
                      "absolute top-1/2 right-0 -translate-y-1/2 rotate-180",
                      "h-3 rounded-full",
                      Math.abs(velocity.x) + Math.abs(velocity.y) > 1.5 ? "bg-red-500" : 
                      Math.abs(velocity.x) + Math.abs(velocity.y) > 0.8 ? "bg-orange-400" : "bg-yellow-300"
                    )}
                    style={{ 
                      width: `${15 + (Math.abs(velocity.x) + Math.abs(velocity.y)) * 10}px`,
                      opacity: 0.9
                    }}
                  ></div>
                )}
              </div>
            </div>
            
            {/* Movement hint */}
            <div className="absolute bottom-2 right-2 text-sm bg-white bg-opacity-80 p-2 rounded font-medium">
              Klicke auf dem Spielfeld, wohin dein Jet fliegen soll! <br />
              Oder drücke die Pfeiltasten ↑ → ↓ ← für Richtung und Leertaste für Extra-Schub.
            </div>
          </div>
          
          {/* Control hints */}
          <div className="text-sm text-center text-gray-600 bg-blue-50 p-2 rounded-md">
            <strong>STEUERUNG:</strong> Pfeiltasten für Richtung, 
            Leertaste für Extra-Schub, oder einfach klicken/tippen!
          </div>
        </div>
      )}
    </div>
  );
};

export default RadarField;
