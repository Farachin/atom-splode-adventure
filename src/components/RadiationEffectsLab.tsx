import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Atom, 
  Dna, 
  FlaskConical, 
  Zap, 
  Timer, 
  Shield, 
  BellRing,
  Microscope,
  Loader2,
  Backpack,
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Effect from './Effect';

interface RadiationEffectsLabProps {
  className?: string;
}

type RadiationType = 'alpha' | 'beta' | 'gamma' | 'neutron';
type MaterialType = 'dna' | 'metal' | 'plastic' | 'crystal';

interface DnaStrand {
  id: number;
  sequence: string;
  damaged: boolean[];
  mutated: boolean[];
  damageEffects: Array<{
    x: number;
    y: number;
    type: 'minor' | 'severe' | 'mutation';
    active: boolean;
  }>;
}

const RadiationEffectsLab: React.FC<RadiationEffectsLabProps> = ({ className }) => {
  const [selectedRadiation, setSelectedRadiation] = useState<RadiationType>('gamma');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('dna');
  const [radiationIntensity, setRadiationIntensity] = useState<number>(50);
  const [radiationTime, setRadiationTime] = useState<number>(5); // in seconds
  const [shieldingLevel, setShieldingLevel] = useState<number>(0);
  const [isExposing, setIsExposing] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [dnaStrands, setDnaStrands] = useState<DnaStrand[]>([]);
  const [dnaRungPositions, setDnaRungPositions] = useState<Array<{x1: number, y1: number, x2: number, y2: number}>>([]);
  const [electronEmission, setElectronEmission] = useState<number>(0);
  const [materialDegradation, setMaterialDegradation] = useState<number>(0);
  const [crystalLuminescence, setCrystalLuminescence] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, size: number, life: number, maxLife: number}>>([]);
  const { toast } = useToast();

  useEffect(() => {
    resetExperiment();
    initCanvas();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [selectedMaterial, selectedRadiation]);

  useEffect(() => {
    if (!isExposing) return;
    
    setTimeRemaining(radiationTime);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExposure();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isExposing, radiationTime]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    particlesRef.current = [];
    cancelAnimationFrame(animationRef.current);
    
    const animate = () => {
      drawRadiationEffect();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const drawRadiationEffect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isExposing) {
      const effectiveIntensity = Math.max(0, radiationIntensity - shieldingLevel * 0.5);
      const particlesToCreate = Math.round(effectiveIntensity / 10);
      
      for (let i = 0; i < particlesToCreate; i++) {
        if (Math.random() < 0.3) {
          createRadiationParticle();
        }
      }
    }
    
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      p.x += p.vx;
      p.y += p.vy;
      
      p.life--;
      
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      const opacity = p.life / p.maxLife;
      
      ctx.beginPath();
      
      if (selectedRadiation === 'alpha') {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 100, ${opacity})`;
      } else if (selectedRadiation === 'beta') {
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 100, 255, ${opacity})`;
      } else if (selectedRadiation === 'gamma') {
        const startX = p.x - p.vx * 5;
        const startY = p.y - p.vy * 5;
        ctx.moveTo(startX, startY);
        
        for (let j = 0; j < 3; j++) {
          const t = j / 2;
          const midX = startX + p.vx * 5 * t + (j % 2 === 0 ? 3 : -3);
          const midY = startY + p.vy * 5 * t;
          ctx.lineTo(midX, midY);
        }
        
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(100, 255, 100, ${opacity})`;
        ctx.lineWidth = p.size * 0.5;
        ctx.stroke();
        ctx.fillStyle = 'transparent';
      } else if (selectedRadiation === 'neutron') {
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 100, ${opacity})`;
      }
      
      ctx.fill();
      
      // Prüfen, ob ein Teilchen mit der DNA kollidiert
      if (selectedMaterial === 'dna' && isExposing) {
        checkParticleCollisionWithDNA(p);
      }
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    if (selectedMaterial === 'dna') {
      drawDNA(ctx, centerX, centerY);
    } else if (selectedMaterial === 'metal') {
      drawMetal(ctx, centerX, centerY);
    } else if (selectedMaterial === 'plastic') {
      drawPlastic(ctx, centerX, centerY);
    } else if (selectedMaterial === 'crystal') {
      drawCrystal(ctx, centerX, centerY);
    }
  };

  const checkParticleCollisionWithDNA = (particle: {x: number, y: number}) => {
    if (dnaRungPositions.length === 0) return;
    
    // Prüfe Kollision mit DNA-Sprossen
    for (let i = 0; i < dnaRungPositions.length; i++) {
      const rung = dnaRungPositions[i];
      const distanceToline = distancePointToLineSegment(
        particle.x, particle.y,
        rung.x1, rung.y1,
        rung.x2, rung.y2
      );
      
      if (distanceToline < 10) { // Kollisionsradius
        // Nur manchmal Schaden anrichten, basierend auf Strahlungstyp
        if (Math.random() < 0.4) {
          const strandIndex = Math.floor(Math.random() * dnaStrands.length);
          const strand = dnaStrands[strandIndex];
          
          if (!strand.damaged[i]) {
            const newStrands = [...dnaStrands];
            newStrands[strandIndex].damaged[i] = true;
            
            const midX = (rung.x1 + rung.x2) / 2;
            const midY = (rung.y1 + rung.y2) / 2;
            
            // Füge einen Effekt hinzu, um die Beschädigung zu visualisieren
            newStrands[strandIndex].damageEffects.push({
              x: midX,
              y: midY,
              type: 'minor',
              active: true
            });
            
            // Geringe Chance auf Mutation
            if (Math.random() < 0.2) {
              newStrands[strandIndex].mutated[i] = true;
              newStrands[strandIndex].damageEffects[newStrands[strandIndex].damageEffects.length - 1].type = 'mutation';
            }
            
            setDnaStrands(newStrands);
            
            // Entferne das Teilchen
            particle.x = -100;
            particle.y = -100;
            particle.life = 0;
            break;
          }
        }
      }
    }
  };

  // Hilfsfunktion zur Berechnung des Abstands von einem Punkt zu einer Linie
  const distancePointToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = len_sq !== 0 ? dot / len_sq : -1;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  const createRadiationParticle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
      case 0:
        x = Math.random() * canvas.width;
        y = -5;
        break;
      case 1:
        x = canvas.width + 5;
        y = Math.random() * canvas.height;
        break;
      case 2:
        x = Math.random() * canvas.width;
        y = canvas.height + 5;
        break;
      case 3:
        x = -5;
        y = Math.random() * canvas.height;
        break;
      default:
        x = 0;
        y = 0;
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const dx = centerX - x;
    const dy = centerY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let speedFactor = 1;
    let sizeFactor = 1;
    let lifeFactor = 1;
    
    switch (selectedRadiation) {
      case 'alpha':
        speedFactor = 0.6;
        sizeFactor = 1.5;
        lifeFactor = 0.7;
        break;
      case 'beta':
        speedFactor = 1.3;
        sizeFactor = 0.7;
        lifeFactor = 0.9;
        break;
      case 'gamma':
        speedFactor = 2.0;
        sizeFactor = 0.5;
        lifeFactor = 1.3;
        break;
      case 'neutron':
        speedFactor = 1.0;
        sizeFactor = 1.0;
        lifeFactor = 1.0;
        break;
    }
    
    const randomAngle = (Math.random() - 0.5) * 0.5;
    const vx = (dx / dist) * speedFactor * 2;
    const vy = (dy / dist) * speedFactor * 2;
    
    const cosTerm = Math.cos(randomAngle);
    const sinTerm = Math.sin(randomAngle);
    const newVx = vx * cosTerm - vy * sinTerm;
    const newVy = vx * sinTerm + vy * sinTerm;
    
    const maxLife = Math.round(dist * lifeFactor);
    
    particlesRef.current.push({
      x,
      y,
      vx: newVx,
      vy: newVy,
      size: 2 * sizeFactor,
      life: maxLife,
      maxLife
    });
  };

  const drawDNA = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const width = 100;
    const height = 150;
    
    // Berechne DNA-Helixdaten für Kollisionserkennung
    const rungPositions: Array<{x1: number, y1: number, x2: number, y2: number}> = [];
    
    ctx.beginPath();
    ctx.moveTo(centerX - width/2, centerY - height/2);
    ctx.bezierCurveTo(
      centerX + width/2, centerY - height/2 * 0.7,
      centerX - width/2, centerY,
      centerX + width/2, centerY + height/2 * 0.3
    );
    ctx.bezierCurveTo(
      centerX - width/2, centerY + height/2 * 0.7,
      centerX + width/2, centerY + height/2,
      centerX - width/2, centerY + height/2
    );
    
    ctx.strokeStyle = isExposing ? 'rgba(0, 100, 200, 0.5)' : 'rgba(0, 100, 200, 0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + width/2, centerY - height/2);
    ctx.bezierCurveTo(
      centerX - width/2, centerY - height/2 * 0.7,
      centerX + width/2, centerY,
      centerX - width/2, centerY + height/2 * 0.3
    );
    ctx.bezierCurveTo(
      centerX + width/2, centerY + height/2 * 0.7,
      centerX - width/2, centerY + height/2,
      centerX + width/2, centerY + height/2
    );
    
    ctx.strokeStyle = isExposing ? 'rgba(0, 100, 200, 0.5)' : 'rgba(0, 100, 200, 0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    const numRungs = 10;
    for (let i = 0; i < numRungs; i++) {
      const t = i / (numRungs - 1);
      const y = centerY - height/2 + height * t;
      
      const t1 = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
      const x1 = centerX - width/2 * t1;
      const x2 = centerX + width/2 * (1 - t1);
      
      // Speichere Sprossenposition für Kollisionserkennung
      rungPositions.push({x1, y1: y, x2, y2: y});
      
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      
      const isDamaged = dnaStrands.some(strand => 
        strand.damaged.length > i && strand.damaged[i]
      );
      
      const isMutated = dnaStrands.some(strand => 
        strand.mutated.length > i && strand.mutated[i]
      );
      
      if (isMutated) {
        // Für mutierte DNA-Elemente einen pulsierenden, lila Effekt zeigen
        ctx.strokeStyle = 'rgba(255, 50, 255, 0.9)';
        
        // Zusätzliche Visualisierung für Mutationen
        ctx.shadowColor = 'rgba(255, 50, 255, 0.8)';
        ctx.shadowBlur = 8;
      } else if (isDamaged) {
        // Für beschädigte DNA-Elemente einen roten Effekt zeigen
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
        
        // Zusätzliche Visualisierung für Beschädigungen
        ctx.shadowColor = 'rgba(255, 50, 50, 0.8)';
        ctx.shadowBlur = 5;
      } else {
        ctx.strokeStyle = isExposing ? 'rgba(50, 200, 50, 0.5)' : 'rgba(50, 200, 50, 0.8)';
        ctx.shadowBlur = 0;
      }
      
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0; // Setze Shadow-Effekt zurück
      
      // Zeichne zusätzliche visuelle Effekte für Schäden/Mutationen
      if (isDamaged || isMutated) {
        const midX = (x1 + x2) / 2;
        const midY = y;
        
        ctx.beginPath();
        ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        ctx.fillStyle = isMutated ? 'rgba(255, 50, 255, 0.9)' : 'rgba(255, 50, 50, 0.9)';
        ctx.fill();
      }
    }
    
    // Speichere Rung-Positionen für Kollisionserkennung
    setDnaRungPositions(rungPositions);
    
    // Zeichne aktive Schadenseffekte
    dnaStrands.forEach(strand => {
      strand.damageEffects.forEach((effect, index) => {
        if (effect.active) {
          // Animierte Schadensvisualisierung
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, 5, 0, Math.PI * 2);
          
          if (effect.type === 'mutation') {
            ctx.fillStyle = 'rgba(255, 50, 255, 0.7)';
          } else {
            ctx.fillStyle = 'rgba(255, 50, 50, 0.7)';
          }
          
          ctx.fill();
        }
      });
    });
  };

  const drawMetal = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const width = 120;
    const height = 80;
    
    ctx.fillStyle = 'rgba(180, 180, 180, 0.9)';
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    const gradient = ctx.createLinearGradient(
      centerX - width/2, centerY - height/2,
      centerX + width/2, centerY + height/2
    );
    gradient.addColorStop(0, 'rgba(220, 220, 220, 0.8)');
    gradient.addColorStop(0.5, 'rgba(150, 150, 150, 0.3)');
    gradient.addColorStop(1, 'rgba(180, 180, 180, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    if (electronEmission > 0) {
      const numElectrons = Math.floor(electronEmission / 10);
      
      for (let i = 0; i < numElectrons; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        const ex = centerX + Math.cos(angle) * distance;
        const ey = centerY + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 100, 255, 0.8)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 10, centerY + Math.sin(angle) * 10);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  };

  const drawPlastic = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const width = 100;
    const height = 80;
    
    ctx.fillStyle = 'rgba(230, 230, 250, 0.9)';
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    if (materialDegradation > 0) {
      const numCracks = Math.floor(materialDegradation / 10);
      
      ctx.strokeStyle = 'rgba(100, 50, 50, 0.5)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < numCracks; i++) {
        const startX = centerX - width/2 + Math.random() * width;
        const startY = centerY - height/2 + Math.random() * height;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        const crackLength = 5 + Math.random() * 15;
        let currentX = startX;
        let currentY = startY;
        
        for (let j = 0; j < crackLength; j++) {
          const angle = Math.random() * Math.PI * 2;
          const segLength = 2 + Math.random() * 3;
          
          currentX += Math.cos(angle) * segLength;
          currentY += Math.sin(angle) * segLength;
          
          currentX = Math.max(centerX - width/2, Math.min(centerX + width/2, currentX));
          currentY = Math.max(centerY - height/2, Math.min(centerY + height/2, currentY));
          
          ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
      }
      
      if (materialDegradation > 50) {
        ctx.fillStyle = `rgba(200, 180, 0, ${materialDegradation / 200})`;
        ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
      }
    }
  };

  const drawCrystal = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const size = 60;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const x = centerX + Math.cos(angle) * size;
      const y = centerY + Math.sin(angle) * size;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI / 3;
      const x1 = centerX + Math.cos(angle) * size;
      const y1 = centerY + Math.sin(angle) * size;
      const x2 = centerX + Math.cos(angle + Math.PI) * size;
      const y2 = centerY + Math.sin(angle + Math.PI) * size;
      
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    if (crystalLuminescence > 0) {
      const glow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, size * 1.2
      );
      
      const intensity = crystalLuminescence / 100;
      const color = selectedRadiation === 'alpha' ? [255, 150, 150] :
                    selectedRadiation === 'beta' ? [150, 150, 255] :
                    selectedRadiation === 'gamma' ? [150, 255, 150] :
                    [255, 255, 150];
      
      glow.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${intensity * 0.7})`);
      glow.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
      
      ctx.fillStyle = glow;
      ctx.fillRect(centerX - size * 1.5, centerY - size * 1.5, size * 3, size * 3);
      
      const numParticles = Math.floor(intensity * 10);
      
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = size * 0.2 + Math.random() * size * 0.8;
        
        const px = centerX + Math.cos(angle) * distance;
        const py = centerY + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(px, py, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.5 + Math.random() * 0.5})`;
        ctx.fill();
      }
    }
  };

  const handleStartExposure = () => {
    if (isExposing) return;
    
    setIsExposing(true);
    
    toast({
      title: "Bestrahlung gestartet",
      description: `${getRadiationName(selectedRadiation)} Strahlung auf ${getMaterialName(selectedMaterial)}, ${radiationTime} Sekunden.`,
    });
    
    if (selectedMaterial === 'dna') {
      createInitialDNA();
    } else if (selectedMaterial === 'metal') {
      setElectronEmission(0);
    } else if (selectedMaterial === 'plastic') {
      setMaterialDegradation(0);
    } else if (selectedMaterial === 'crystal') {
      setCrystalLuminescence(0);
    }
  };

  const createInitialDNA = () => {
    const newStrands: DnaStrand[] = [];
    
    for (let i = 0; i < 3; i++) {
      const sequence = generateDNASequence(10);
      newStrands.push({
        id: i,
        sequence,
        damaged: new Array(10).fill(false),
        mutated: new Array(10).fill(false),
        damageEffects: []
      });
    }
    
    setDnaStrands(newStrands);
  };

  const generateDNASequence = (length: number): string => {
    const bases = ['A', 'T', 'G', 'C'];
    let sequence = '';
    
    for (let i = 0; i < length; i++) {
      sequence += bases[Math.floor(Math.random() * bases.length)];
    }
    
    return sequence;
  };

  const finishExposure = () => {
    setIsExposing(false);
    applyRadiationEffects();
    
    toast({
      title: "Bestrahlung abgeschlossen",
      description: "Die Auswirkungen der Strahlung sind jetzt sichtbar.",
    });
  };

  const applyRadiationEffects = () => {
    const effectiveIntensity = Math.max(0, radiationIntensity - shieldingLevel * 0.5);
    
    if (selectedMaterial === 'dna') {
      applyDNADamage(effectiveIntensity);
    } else if (selectedMaterial === 'metal') {
      applyPhotoelectricEffect(effectiveIntensity);
    } else if (selectedMaterial === 'plastic') {
      applyMaterialDegradation(effectiveIntensity);
    } else if (selectedMaterial === 'crystal') {
      applyCrystalLuminescence(effectiveIntensity);
    }
  };

  const applyDNADamage = (intensity: number) => {
    const newStrands = [...dnaStrands];
    
    newStrands.forEach(strand => {
      const damageChance = intensity / 100;
      
      let baseDamageMultiplier = 1;
      let baseMutationMultiplier = 1;
      
      switch (selectedRadiation) {
        case 'alpha':
          baseDamageMultiplier = 2.0;
          baseMutationMultiplier = 0.5;
          break;
        case 'beta':
          baseDamageMultiplier = 1.0;
          baseMutationMultiplier = 1.0;
          break;
        case 'gamma':
          baseDamageMultiplier = 1.5;
          baseMutationMultiplier = 1.5;
          break;
        case 'neutron':
          baseDamageMultiplier = 3.0;
          baseMutationMultiplier = 2.0;
          break;
      }
      
      for (let i = 0; i < strand.sequence.length; i++) {
        if (Math.random() < damageChance * baseDamageMultiplier / 10) {
          strand.damaged[i] = true;
          
          // Wenn Rungpositionen bereits berechnet wurden
          if (dnaRungPositions.length > i) {
            const rungPos = dnaRungPositions[i];
            const midX = (rungPos.x1 + rungPos.x2) / 2;
            const midY = (rungPos.y1 + rungPos.y2) / 2;
            
            // Visuellen Effekt für die Beschädigung hinzufügen
            strand.damageEffects.push({
              x: midX,
              y: midY,
              type: 'minor',
              active: true
            });
          }
        }
        
        if (strand.damaged[i] && Math.random() < damageChance * baseMutationMultiplier / 20) {
          strand.mutated[i] = true;
          
          // Falls ein Schadenseffekt für diesen Index existiert, ändere ihn zu einer Mutation
          const effectIndex = strand.damageEffects.findIndex(
            effect => dnaRungPositions.length > i && 
            Math.abs(effect.x - (dnaRungPositions[i].x1 + dnaRungPositions[i].x2) / 2) < 10 &&
            Math.abs(effect.y - dnaRungPositions[i].y1) < 10
          );
          
          if (effectIndex >= 0) {
            strand.damageEffects[effectIndex].type = 'mutation';
          } else if (dnaRungPositions.length > i) {
            // Falls kein Effekt existiert, füge einen neuen hinzu
            const rungPos = dnaRungPositions[i];
            const midX = (rungPos.x1 + rungPos.x2) / 2;
            const midY = (rungPos.y1 + rungPos.y2) / 2;
            
            strand.damageEffects.push({
              x: midX,
              y: midY,
              type: 'mutation',
              active: true
            });
          }
        }
      }
    });
    
    setDnaStrands(newStrands);
  };

  const applyPhotoelectricEffect = (intensity: number) => {
    let effectMultiplier = 0;
    
    switch (selectedRadiation) {
      case 'alpha':
        effectMultiplier = 0.2;
        break;
      case 'beta':
        effectMultiplier = 0.8;
        break;
      case 'gamma':
        effectMultiplier = 1.5;
        break;
      case 'neutron':
        effectMultiplier = 0.1;
        break;
    }
    
    const newEmission = Math.min(100, intensity * effectMultiplier);
    setElectronEmission(newEmission);
  };

  const applyMaterialDegradation = (intensity: number) => {
    let degradationMultiplier = 1;
    
    switch (selectedRadiation) {
      case 'alpha':
        degradationMultiplier = 1.0;
        break;
      case 'beta':
        degradationMultiplier = 0.7;
        break;
      case 'gamma':
        degradationMultiplier = 2.0;
        break;
      case 'neutron':
        degradationMultiplier = 3.0;
        break;
    }
    
    const newDegradation = Math.min(100, intensity * degradationMultiplier);
    setMaterialDegradation(newDegradation);
  };

  const applyCrystalLuminescence = (intensity: number) => {
    let luminescenceMultiplier = 1;
    
    switch (selectedRadiation) {
      case 'alpha':
        luminescenceMultiplier = 0.8;
        break;
      case 'beta':
        luminescenceMultiplier = 1.2;
        break;
      case 'gamma':
        luminescenceMultiplier = 1.5;
        break;
      case 'neutron':
        luminescenceMultiplier = 1.0;
        break;
    }
    
    const newLuminescence = Math.min(100, intensity * luminescenceMultiplier);
    setCrystalLuminescence(newLuminescence);
  };

  const resetExperiment = () => {
    setIsExposing(false);
    setTimeRemaining(0);
    
    if (selectedMaterial === 'dna') {
      createInitialDNA();
    } else if (selectedMaterial === 'metal') {
      setElectronEmission(0);
    } else if (selectedMaterial === 'plastic') {
      setMaterialDegradation(0);
    } else if (selectedMaterial === 'crystal') {
      setCrystalLuminescence(0);
    }
    
    particlesRef.current = [];
  };

  const getRadiationName = (type: RadiationType): string => {
    switch(type) {
      case 'alpha': return 'Alpha';
      case 'beta': return 'Beta';
      case 'gamma': return 'Gamma';
      case 'neutron': return 'Neutronen';
      default: return '';
    }
  };

  const getMaterialName = (type: MaterialType): string => {
    switch(type) {
      case 'dna': return 'DNA';
      case 'metal': return 'Metall';
      case 'plastic': return 'Kunststoff';
      case 'crystal': return 'Kristall';
      default: return '';
    }
  };

  // Rendern Sie DNA-Schäden als eigene Komponenten außerhalb des Canvas
  const renderDNADamageEffects = () => {
    return dnaStrands.flatMap(strand => 
      strand.damageEffects
        .filter(effect => effect.active)
        .map((effect, idx) => (
          <Effect 
            key={`damage-${strand.id}-${idx}`}
            type="dna-damage"
            x={effect.x}
            y={effect.y}
            damageLevel={effect.type}
            onComplete={() => {
              // Effekt nach der Animation entfernen
              const updatedStrands = [...dnaStrands];
              const effectIndex = updatedStrands[strand.id].damageEffects.findIndex(
                (e, i) => i === idx
              );
              if (effectIndex >= 0) {
                updatedStrands[strand.id].damageEffects[effectIndex].active = false;
                setDnaStrands(updatedStrands);
              }
            }}
          />
        ))
    );
  };

  return (
    <Card className={cn("p-6 bg-white", className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Strahlungs-Labor</h2>
          <Badge variant={isExposing ? "default" : "outline"}>
            {isExposing ? "Bestrahlung läuft..." : "Bereit"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Tabs defaultValue="radiation" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="radiation">Strahlung</TabsTrigger>
                <TabsTrigger value="material">Material</TabsTrigger>
              </TabsList>
              
              <TabsContent value="radiation" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedRadiation === 'alpha' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedRadiation('alpha')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <Atom className="h-5 w-5 mr-2 text-red-500" />
                      <span className="font-bold">Alpha</span>
                    </div>
                    <p className="text-xs text-gray-500">Schwere Heliumkerne, geringe Reichweite</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedRadiation === 'beta' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedRadiation('beta')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-bold">Beta</span>
                    </div>
                    <p className="text-xs text-gray-500">Schnelle Elektronen, mittlere Reichweite</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedRadiation === 'gamma' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedRadiation('gamma')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-green-500" />
                      <span className="font-bold">Gamma</span>
                    </div>
                    <p className="text-xs text-gray-500">Elektromagnetische Wellen, hohe Reichweite</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedRadiation === 'neutron' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedRadiation('neutron')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <Atom className="h-5 w-5 mr-2 text-yellow-500" />
                      <span className="font-bold">Neutronen</span>
                    </div>
                    <p className="text-xs text-gray-500">Neutrale Teilchen, tief eindringend</p>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Intensität: {radiationIntensity}%
                  </label>
                  <Slider 
                    value={[radiationIntensity]} 
                    min={1} 
                    max={100} 
                    step={1} 
                    onValueChange={values => !isExposing && setRadiationIntensity(values[0])} 
                    disabled={isExposing}
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Bestrahlungszeit: {radiationTime} Sekunden
                  </label>
                  <Slider 
                    value={[radiationTime]} 
                    min={1} 
                    max={10} 
                    step={1} 
                    onValueChange={values => !isExposing && setRadiationTime(values[0])} 
                    disabled={isExposing}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="material" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedMaterial === 'dna' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedMaterial('dna')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <Dna className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-bold">DNA</span>
                    </div>
                    <p className="text-xs text-gray-500">Kann mutieren oder beschädigt werden</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedMaterial === 'metal' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedMaterial('metal')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-bold">Metall</span>
                    </div>
                    <p className="text-xs text-gray-500">Kann Elektronen freisetzen</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedMaterial === 'plastic' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedMaterial('plastic')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <FlaskConical className="h-5 w-5 mr-2 text-purple-500" />
                      <span className="font-bold">Kunststoff</span>
                    </div>
                    <p className="text-xs text-gray-500">Kann durch Strahlung degradieren</p>
                  </Button>
                  
                  <Button 
                    className={cn(
                      "h-20 flex-col items-center justify-center space-y-2 text-left",
                      selectedMaterial === 'crystal' ? "border-4 border-primary" : "border"
                    )}
                    variant="outline"
                    onClick={() => !isExposing && setSelectedMaterial('crystal')}
                    disabled={isExposing}
                  >
                    <div className="flex items-center">
                      <BellRing className="h-5 w-5 mr-2 text-cyan-500" />
                      <span className="font-bold">Kristall</span>
                    </div>
                    <p className="text-xs text-gray-500">Kann durch Strahlung leuchten</p>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Abschirmung: {shieldingLevel}%
                  </label>
                  <Slider 
                    value={[shieldingLevel]} 
                    min={0} 
                    max={100} 
                    step={5} 
                    onValueChange={values => !isExposing && setShieldingLevel(values[0])} 
                    disabled={isExposing}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="pt-2 space-y-3">
              {isExposing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Verbleibende Zeit:</span>
                    <span>{timeRemaining} Sekunden</span>
                  </div>
                  <Progress value={(timeRemaining / radiationTime) * 100} />
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={isExposing ? undefined : handleStartExposure}
                disabled={isExposing}
              >
                {isExposing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bestrahlung läuft...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Bestrahlung starten
                  </>
                )}
              </Button>
              
              {isExposing && (
                <Button
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsExposing(false);
                    resetExperiment();
                  }}
                >
                  <Hand className="mr-2 h-4 w-4" />
                  Abbrechen
                </Button>
              )}
              
              {!isExposing && (timeRemaining === 0) && (
                <Button
                  variant="outline" 
                  className="w-full"
                  onClick={resetExperiment}
                >
                  <Backpack className="mr-2 h-4 w-4" />
                  Zurücksetzen
                </Button>
              )}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square w-full bg-slate-50 rounded-lg overflow-hidden">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full"
              />
              
              {/* DNA-Schadenseffekte über dem Canvas */}
              {selectedMaterial === 'dna' && renderDNADamageEffects()}
            </div>
            
            {!isExposing && selectedMaterial === 'dna' && dnaStrands.length > 0 && (
              <div className="mt-2 p-2 bg-white rounded border text-xs">
                <div className="font-semibold mb-1">DNA-Analyse:</div>
                {dnaStrands.map(strand => {
                  const damagedCount = strand.damaged.filter(Boolean).length;
                  const mutatedCount = strand.mutated.filter(Boolean).length;
                  return (
                    <div key={strand.id} className="flex justify-between">
                      <span>Strang {strand.id + 1}: {strand.sequence}</span>
                      {(damagedCount > 0 || mutatedCount > 0) && (
                        <span>
                          {damagedCount > 0 && (
                            <Badge variant="outline" className="ml-1 text-red-500 text-[10px] h-4 px-1">
                              {damagedCount} beschädigt
                            </Badge>
                          )}
                          {mutatedCount > 0 && (
                            <Badge variant="outline" className="ml-1 text-purple-500 text-[10px] h-4 px-1">
                              {mutatedCount} mutiert
                            </Badge>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {!isExposing && selectedMaterial === 'metal' && electronEmission > 0 && (
              <div className="mt-2 p-2 bg-white rounded border text-xs">
                <div className="font-semibold mb-1">Photoelektrischer Effekt:</div>
                <div className="flex justify-between">
                  <span>Elektronenemission:</span>
                  <span>{electronEmission.toFixed(1)}%</span>
                </div>
                <Progress value={electronEmission} className="h-2 mt-1" />
              </div>
            )}
            
            {!isExposing && selectedMaterial === 'plastic' && materialDegradation > 0 && (
              <div className="mt-2 p-2 bg-white rounded border text-xs">
                <div className="font-semibold mb-1">Materialdegradation:</div>
                <div className="flex justify-between">
                  <span>Schädigungsgrad:</span>
                  <span>{materialDegradation.toFixed(1)}%</span>
                </div>
                <Progress value={materialDegradation} className="h-2 mt-1" />
              </div>
            )}
            
            {!isExposing && selectedMaterial === 'crystal' && crystalLuminescence > 0 && (
              <div className="mt-2 p-2 bg-white rounded border text-xs">
                <div className="font-semibold mb-1">Lumineszenz:</div>
                <div className="flex justify-between">
                  <span>Leuchtintensität:</span>
                  <span>{crystalLuminescence.toFixed(1)}%</span>
                </div>
                <Progress value={crystalLuminescence} className="h-2 mt-1" />
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-500 border-t pt-4">
          <Microscope className="inline-block h-4 w-4 mr-1" />
          <span className="align-middle">
            Dieses Labor zeigt die Effekte verschiedener Strahlungsarten auf unterschiedliche Materialien.
            Experimentiere mit den Einstellungen, um mehr zu lernen.
          </span>
        </div>
      </div>
    </Card>
  );
};

export default RadiationEffectsLab;
