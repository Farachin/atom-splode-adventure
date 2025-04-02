import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Atom, 
  Dna, 
  Flask, 
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
  const [electronEmission, setElectronEmission] = useState<number>(0);
  const [materialDegradation, setMaterialDegradation] = useState<number>(0);
  const [crystalLuminescence, setCrystalLuminescence] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, size: number, life: number, maxLife: number}>>([]);
  const { toast } = useToast();

  // Initialize experiment
  useEffect(() => {
    resetExperiment();
    initCanvas();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [selectedMaterial, selectedRadiation]);

  // Timer for radiation exposure
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

  // Initialize canvas and animation
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    particlesRef.current = [];
    cancelAnimationFrame(animationRef.current);
    
    // Start animation loop
    const animate = () => {
      drawRadiationEffect();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Draw radiation effect on canvas
  const drawRadiationEffect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create new particles if exposing
    if (isExposing) {
      const effectiveIntensity = Math.max(0, radiationIntensity - shieldingLevel * 0.5);
      const particlesToCreate = Math.round(effectiveIntensity / 10);
      
      for (let i = 0; i < particlesToCreate; i++) {
        if (Math.random() < 0.3) { // Only create new particles occasionally
          createRadiationParticle();
        }
      }
    }
    
    // Update and draw existing particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Update lifespan
      p.life--;
      
      // Remove dead particles
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      // Calculate opacity based on remaining life
      const opacity = p.life / p.maxLife;
      
      // Draw particle
      ctx.beginPath();
      
      // Different visuals for different radiation types
      if (selectedRadiation === 'alpha') {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 100, ${opacity})`;
      } else if (selectedRadiation === 'beta') {
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 100, 255, ${opacity})`;
      } else if (selectedRadiation === 'gamma') {
        // Draw zigzag line for gamma
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
    }
    
    // Draw material being exposed
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

  // Create a new radiation particle
  const createRadiationParticle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create particle at edge of canvas and aim toward center
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;
    
    switch (side) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -5;
        break;
      case 1: // right
        x = canvas.width + 5;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 5;
        break;
      case 3: // left
        x = -5;
        y = Math.random() * canvas.height;
        break;
      default:
        x = 0;
        y = 0;
    }
    
    // Aim toward center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const dx = centerX - x;
    const dy = centerY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let speedFactor = 1;
    let sizeFactor = 1;
    let lifeFactor = 1;
    
    // Different properties for different radiation types
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
    
    // Add some randomness to direction
    const randomAngle = (Math.random() - 0.5) * 0.5;
    const vx = (dx / dist) * speedFactor * 2;
    const vy = (dy / dist) * speedFactor * 2;
    
    // Rotate velocity vector by random angle
    const cosTerm = Math.cos(randomAngle);
    const sinTerm = Math.sin(randomAngle);
    const newVx = vx * cosTerm - vy * sinTerm;
    const newVy = vx * sinTerm + vy * cosTerm;
    
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

  // Draw DNA helix
  const drawDNA = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const width = 100;
    const height = 150;
    
    // Draw DNA backbones
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
    
    // Draw other backbone
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
    
    // Draw base pairs
    const numRungs = 10;
    for (let i = 0; i < numRungs; i++) {
      const t = i / (numRungs - 1);
      const y = centerY - height/2 + height * t;
      
      // Calculate x positions along the bezier curves
      const t1 = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
      const x1 = centerX - width/2 * t1;
      const x2 = centerX + width/2 * (1 - t1);
      
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      
      // Check for damaged bases
      const isDamaged = dnaStrands.some(strand => 
        strand.damaged.length > i && strand.damaged[i]
      );
      
      const isMutated = dnaStrands.some(strand => 
        strand.mutated.length > i && strand.mutated[i]
      );
      
      if (isMutated) {
        ctx.strokeStyle = 'rgba(255, 50, 255, 0.9)';
      } else if (isDamaged) {
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
      } else {
        ctx.strokeStyle = isExposing ? 'rgba(50, 200, 50, 0.5)' : 'rgba(50, 200, 50, 0.8)';
      }
      
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Draw metal surface
  const drawMetal = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const width = 120;
    const height = 80;
    
    // Draw metal plate
    ctx.fillStyle = 'rgba(180, 180, 180, 0.9)';
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    // Add some metallic shading
    const gradient = ctx.createLinearGradient(
      centerX - width/2, centerY - height/2,
      centerX + width/2, centerY + height/2
    );
    gradient.addColorStop(0, 'rgba(220, 220, 220, 0.8)');
    gradient.addColorStop(0.5, 'rgba(150, 150, 150, 0.3)');
    gradient.addColorStop(1, 'rgba(180, 180, 180, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    // Draw electrons if emitting
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
        
        // Add electron trail
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 10, centerY + Math.sin(angle) * 10);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  };

  // Draw plastic material
  const drawPlastic = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const width = 100;
    const height = 80;
    
    // Draw plastic sheet
    ctx.fillStyle = 'rgba(230, 230, 250, 0.9)';
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    // Add transparent effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
    
    // Add degradation cracks if damaged
    if (materialDegradation > 0) {
      const numCracks = Math.floor(materialDegradation / 10);
      
      ctx.strokeStyle = 'rgba(100, 50, 50, 0.5)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < numCracks; i++) {
        const startX = centerX - width/2 + Math.random() * width;
        const startY = centerY - height/2 + Math.random() * height;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Create jagged crack
        let currentX = startX;
        let currentY = startY;
        const crackLength = 5 + Math.random() * 15;
        
        for (let j = 0; j < crackLength; j++) {
          const angle = Math.random() * Math.PI * 2;
          const segLength = 2 + Math.random() * 3;
          
          currentX += Math.cos(angle) * segLength;
          currentY += Math.sin(angle) * segLength;
          
          // Keep crack within bounds
          currentX = Math.max(centerX - width/2, Math.min(centerX + width/2, currentX));
          currentY = Math.max(centerY - height/2, Math.min(centerY + height/2, currentY));
          
          ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
      }
      
      // Add yellowing
      if (materialDegradation > 50) {
        ctx.fillStyle = `rgba(200, 180, 0, ${materialDegradation / 200})`;
        ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
      }
    }
  };

  // Draw crystal structure
  const drawCrystal = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const size = 60;
    
    // Draw crystal structure (a hexagon)
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
    
    // Fill with semi-transparent color
    ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
    ctx.fill();
    
    // Add outline
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw internal structure (crystal lattice)
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
    
    // Add luminescence effect if active
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
      
      // Add some glowing particles
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

  // Start radiation exposure
  const handleStartExposure = () => {
    if (isExposing) return;
    
    setIsExposing(true);
    
    toast({
      title: "Bestrahlung gestartet",
      description: `${getRadiationName(selectedRadiation)} Strahlung auf ${getMaterialName(selectedMaterial)}, ${radiationTime} Sekunden.`,
    });
    
    // Reset material effects
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

  // Create initial DNA structure
  const createInitialDNA = () => {
    const newStrands: DnaStrand[] = [];
    
    // Create 3 strands with random sequences
    for (let i = 0; i < 3; i++) {
      const sequence = generateDNASequence(10);
      newStrands.push({
        id: i,
        sequence,
        damaged: new Array(10).fill(false),
        mutated: new Array(10).fill(false)
      });
    }
    
    setDnaStrands(newStrands);
  };

  // Generate random DNA sequence
  const generateDNASequence = (length: number): string => {
    const bases = ['A', 'T', 'G', 'C'];
    let sequence = '';
    
    for (let i = 0; i < length; i++) {
      sequence += bases[Math.floor(Math.random() * bases.length)];
    }
    
    return sequence;
  };

  // Finish radiation exposure
  const finishExposure = () => {
    setIsExposing(false);
    applyRadiationEffects();
    
    toast({
      title: "Bestrahlung abgeschlossen",
      description: "Die Auswirkungen der Strahlung sind jetzt sichtbar.",
    });
  };

  // Apply radiation effects based on material and radiation type
  const applyRadiationEffects = () => {
    // Calculate effective radiation dose
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

  // Apply DNA damage
  const applyDNADamage = (intensity: number) => {
    // Copy current DNA strands
    const newStrands = [...dnaStrands];
    
    // Apply damage based on radiation type and intensity
    newStrands.forEach(strand => {
      const damageChance = intensity / 100;
      
      // Different radiation types affect DNA differently
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
      
      // Apply damage to bases
      for (let i = 0; i < strand.sequence.length; i++) {
        // Damage chance
        if (Math.random() < damageChance * baseDamageMultiplier / 10) {
          strand.damaged[i] = true;
        }
        
        // Mutation chance (only if already damaged)
        if (strand.damaged[i] && Math.random() < damageChance * baseMutationMultiplier / 20) {
          strand.mutated[i] = true;
        }
      }
    });
    
    setDnaStrands(newStrands);
  };

  // Apply photoelectric effect to metal
  const applyPhotoelectricEffect = (intensity: number) => {
    // Gamma and X-rays cause photoelectric effect in metals
    let effectMultiplier = 0;
    
    switch (selectedRadiation) {
      case 'alpha':
        effectMultiplier = 0.2; // Poor at ejecting electrons
        break;
      case 'beta':
        effectMultiplier = 0.8; // Moderate
        break;
      case 'gamma':
        effectMultiplier = 1.5; // Best at causing photoelectric effect
        break;
      case 'neutron':
        effectMultiplier = 0.1; // Very poor
        break;
    }
    
    const newEmission = Math.min(100, intensity * effectMultiplier);
    setElectronEmission(newEmission);
  };

  // Apply material degradation to plastic
  const applyMaterialDegradation = (intensity: number) => {
    // Different radiation types damage materials differently
    let degradationMultiplier = 1;
    
    switch (selectedRadiation) {
      case 'alpha':
        degradationMultiplier = 1.0;
        break;
      case 'beta':
        degradationMultiplier = 0.7;
        break;
      case 'gamma':
        degradationMultiplier = 2.0; // Gamma rays are very damaging to plastics
        break;
      case 'neutron':
        degradationMultiplier = 3.0; // Neutrons cause severe damage
        break;
    }
    
    const newDegradation = Math.min(100, intensity * degradationMultiplier);
    setMaterialDegradation(newDegradation);
  };

  // Apply luminescence to crystal
  const applyCrystalLuminescence = (intensity: number) => {
    // Different radiation types cause different luminescence patterns
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

  // Reset experiment
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

  // Get radiation name in German
  const getRadiationName = (type: RadiationType): string => {
    switch(type) {
      case 'alpha': return 'Alpha';
      case 'beta': return 'Beta';
      case 'gamma': return 'Gamma';
      case 'neutron': return 'Neutronen';
      default: return '';
    }
  };

  // Get material name in German
  const getMaterialName = (type: MaterialType): string => {
    switch(type) {
      case 'dna': return 'DNA';
      case 'metal': return 'Metall';
      case 'plastic': return 'Kunststoff';
      case 'crystal': return 'Kristall';
      default: return '';
    }
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
