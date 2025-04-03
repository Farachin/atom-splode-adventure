
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Activity, 
  Zap, 
  Radiation,
  Sparkles,
  CircleOff,
  HelpCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RadiationEffectsLabProps {
  className?: string;
}

type RadiationType = 'alpha' | 'beta' | 'gamma' | 'neutron';
type MaterialType = 'dna' | 'metal' | 'plastic' | 'crystal';

interface RadiationProperties {
  symbol: string;
  penetration: number;
  ionization: number;
  color: string;
  description: string;
}

const radiationProperties: Record<RadiationType, RadiationProperties> = {
  alpha: {
    symbol: 'α',
    penetration: 10,
    ionization: 90,
    color: '#f87171',
    description: 'Heliumkerne (α) - Geringe Reichweite, hohe Ionisationskraft'
  },
  beta: {
    symbol: 'β',
    penetration: 40,
    ionization: 50,
    color: '#60a5fa',
    description: 'Elektronen (β) - Mittlere Reichweite, mittlere Ionisationskraft'
  },
  gamma: {
    symbol: 'γ',
    penetration: 95,
    ionization: 20,
    color: '#34d399',
    description: 'Energiereiche Photonen (γ) - Hohe Reichweite, geringe Ionisationskraft'
  },
  neutron: {
    symbol: 'n',
    penetration: 80,
    ionization: 30,
    color: '#f59e0b',
    description: 'Neutronen (n) - Hohe Reichweite, können Kerne umwandeln'
  }
};

interface MaterialProperties {
  resistance: number;
  effect: string;
  description: string;
}

const materialProperties: Record<MaterialType, MaterialProperties> = {
  dna: {
    resistance: 15,
    effect: 'Strangbruch',
    description: 'DNA ist sehr empfindlich gegenüber Strahlung, die Mutation und Schäden verursachen kann.'
  },
  metal: {
    resistance: 70,
    effect: 'Materialermüdung',
    description: 'Metalle widerstehen Strahlung gut, können aber bei hoher Dosis spröde werden.'
  },
  plastic: {
    resistance: 30,
    effect: 'Versprödung',
    description: 'Kunststoffe können durch Strahlung brüchig werden und ihre Struktur verlieren.'
  },
  crystal: {
    resistance: 50,
    effect: 'Farbzentren',
    description: 'Kristalle können Farbzentren bilden und durch Strahlung zum Leuchten gebracht werden.'
  }
};

const RadiationEffectsLab: React.FC<RadiationEffectsLabProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('dna');
  const [selectedRadiation, setSelectedRadiation] = useState<RadiationType>('alpha');
  const [radiationDose, setRadiationDose] = useState(50);
  const [isRadiating, setIsRadiating] = useState(false);
  const [cumDose, setCumDose] = useState(0);
  const [damageLevel, setDamageLevel] = useState(0);
  const [showEffects, setShowEffects] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Reset dose when changing material
  useEffect(() => {
    setCumDose(0);
    setDamageLevel(0);
    setShowEffects(false);
  }, [activeTab]);
  
  // Reset effects when changing radiation type
  useEffect(() => {
    setShowEffects(false);
  }, [selectedRadiation]);
  
  // Animation and effects handling
  useEffect(() => {
    const material = activeTab as MaterialType;
    
    if (isRadiating) {
      // Calculate penetration based on radiation and material
      const penetration = radiationProperties[selectedRadiation].penetration;
      const materialResistance = materialProperties[material].resistance;
      
      // Calculate how much radiation actually affects the material
      const effectiveDose = (radiationDose * penetration * (100 - materialResistance)) / 10000;
      
      // Accumulate dose
      const newCumDose = cumDose + effectiveDose;
      setCumDose(newCumDose);
      
      // Calculate damage level (non-linear)
      const newDamage = Math.min(100, Math.pow(newCumDose / 10, 1.5));
      setDamageLevel(newDamage);
      
      // Show effects after threshold
      if (newDamage > 20 && !showEffects) {
        setShowEffects(true);
      }
      
      // Draw the visualization
      drawVisualization();
      
      // Create animation loop
      animationRef.current = requestAnimationFrame(() => setIsRadiating(true));
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRadiating, selectedRadiation, radiationDose, cumDose, activeTab, showEffects]);
  
  // Draw the visualization
  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw based on selected material
    switch (activeTab as MaterialType) {
      case 'dna':
        drawDNA(ctx, canvas.width, canvas.height);
        break;
      case 'metal':
        drawMetal(ctx, canvas.width, canvas.height);
        break;
      case 'plastic':
        drawPlastic(ctx, canvas.width, canvas.height);
        break;
      case 'crystal':
        drawCrystal(ctx, canvas.width, canvas.height);
        break;
    }
    
    // Draw radiation particles if radiating
    if (isRadiating) {
      drawRadiationParticles(ctx, canvas.width, canvas.height);
    }
  };
  
  // Start radiation
  const startRadiation = () => {
    setIsRadiating(true);
  };
  
  // Stop radiation
  const stopRadiation = () => {
    setIsRadiating(false);
  };
  
  // Reset experiment
  const resetExperiment = () => {
    setIsRadiating(false);
    setCumDose(0);
    setDamageLevel(0);
    setShowEffects(false);
    
    // Redraw visualization
    drawVisualization();
  };
  
  // Draw DNA visualization with 3D helix effect
  const drawDNA = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw DNA helix
    const helixWidth = Math.min(width * 0.3, 150);
    const helixHeight = height * 0.7;
    const startY = (height - helixHeight) / 2;
    
    // Draw the backbone
    const numSteps = 20;
    const stepHeight = helixHeight / numSteps;
    
    for (let i = 0; i < numSteps; i++) {
      const y = startY + i * stepHeight;
      const phase = i / 2;
      
      // Left backbone
      const leftX1 = centerX - helixWidth / 2 * Math.cos(phase);
      const leftX2 = centerX - helixWidth / 2 * Math.cos(phase + 0.5);
      
      ctx.beginPath();
      ctx.moveTo(leftX1, y);
      ctx.lineTo(leftX2, y + stepHeight);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Right backbone
      const rightX1 = centerX + helixWidth / 2 * Math.cos(phase);
      const rightX2 = centerX + helixWidth / 2 * Math.cos(phase + 0.5);
      
      ctx.beginPath();
      ctx.moveTo(rightX1, y);
      ctx.lineTo(rightX2, y + stepHeight);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Base pairs
      ctx.beginPath();
      ctx.moveTo(leftX1, y);
      ctx.lineTo(rightX1, y);
      ctx.strokeStyle = damageLevel > 30 && i % 3 === 0 ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add nucleotide bases (circles)
      const baseColors = ['#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
      
      // Left base
      ctx.beginPath();
      ctx.arc(leftX1, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = baseColors[i % 4];
      ctx.fill();
      
      // Right base
      ctx.beginPath();
      ctx.arc(rightX1, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = baseColors[(i + 2) % 4];
      ctx.fill();
    }
    
    // Draw damage effects
    if (showEffects) {
      // Strand breaks
      const breakCount = Math.floor(damageLevel / 20);
      for (let i = 0; i < breakCount; i++) {
        const breakYPos = startY + (Math.random() * 0.8 + 0.1) * helixHeight;
        const side = Math.random() > 0.5 ? 1 : -1;
        const breakX = centerX + side * helixWidth / 2 * Math.cos(breakYPos / stepHeight);
        
        // Break visualization
        ctx.beginPath();
        ctx.arc(breakX, breakYPos, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(breakX - 5, breakYPos - 5);
        ctx.lineTo(breakX + 5, breakYPos + 5);
        ctx.moveTo(breakX + 5, breakYPos - 5);
        ctx.lineTo(breakX - 5, breakYPos + 5);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };
  
  // Draw metal visualization
  const drawMetal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw metal lattice
    const gridSize = 30;
    const numRows = Math.floor(height * 0.7 / gridSize);
    const numCols = Math.floor(width * 0.7 / gridSize);
    const startX = centerX - (numCols * gridSize) / 2;
    const startY = centerY - (numRows * gridSize) / 2;
    
    // Draw lattice points
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = startX + col * gridSize;
        const y = startY + row * gridSize;
        
        // Lattice point
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#6b7280';
        ctx.fill();
        
        // Distorted lattice for damage
        if (showEffects && Math.random() < damageLevel / 200) {
          ctx.beginPath();
          ctx.arc(
            x + (Math.random() - 0.5) * 10,
            y + (Math.random() - 0.5) * 10,
            3,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        }
        
        // Connect lattice points
        if (col < numCols - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + gridSize, y);
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        if (row < numRows - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + gridSize);
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    
    // Draw electrons if showing effects for metal
    if (showEffects) {
      const electronCount = Math.floor(damageLevel / 5);
      
      for (let i = 0; i < electronCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * width * 0.3;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        
        // Add electron trail
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - Math.cos(angle) * 10,
          y - Math.sin(angle) * 10
        );
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  };
  
  // Draw plastic visualization
  const drawPlastic = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw polymer chains
    const chainCount = 7;
    const chainSpacing = height * 0.6 / chainCount;
    const chainLength = width * 0.6;
    const startX = centerX - chainLength / 2;
    const startY = centerY - (chainCount * chainSpacing) / 2 + chainSpacing / 2;
    
    for (let i = 0; i < chainCount; i++) {
      const y = startY + i * chainSpacing;
      
      // Draw polymer backbone
      const segments = 20;
      const segmentLength = chainLength / segments;
      
      for (let j = 0; j < segments; j++) {
        const x = startX + j * segmentLength;
        
        // Backbone
        ctx.beginPath();
        if (showEffects && damageLevel > 40 && Math.random() < damageLevel / 300) {
          // Break in chain to show damage
          if (j > 0 && j < segments - 1) {
            // Draw break
            ctx.moveTo(x - segmentLength, y);
            ctx.lineTo(x - segmentLength / 3, y);
            ctx.moveTo(x + segmentLength / 3, y);
            ctx.lineTo(x + segmentLength, y);
          } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + segmentLength, y);
          }
        } else {
          ctx.moveTo(x, y);
          ctx.lineTo(x + segmentLength, y);
        }
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add side groups every other segment
        if (j % 2 === 0) {
          const sideLength = chainSpacing * 0.4;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - sideLength);
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Side group "molecule"
          ctx.beginPath();
          ctx.arc(x, y - sideLength, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
        }
      }
    }
    
    // Draw damage effects for plastic
    if (showEffects) {
      // Discoloration and cracking
      const crackCount = Math.floor(damageLevel / 15);
      
      for (let i = 0; i < crackCount; i++) {
        const x = startX + Math.random() * chainLength;
        const y = startY + Math.random() * (chainCount * chainSpacing);
        
        // Draw crack
        const crackLength = 10 + Math.random() * 20;
        const angle = Math.random() * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(angle) * crackLength,
          y + Math.sin(angle) * crackLength
        );
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Discoloration
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
        ctx.fill();
      }
    }
  };
  
  // Draw crystal visualization
  const drawCrystal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw crystal lattice
    const crystalSize = Math.min(width, height) * 0.4;
    
    // Base crystal shape
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - crystalSize / 2);
    ctx.lineTo(centerX + crystalSize / 2, centerY);
    ctx.lineTo(centerX, centerY + crystalSize / 2);
    ctx.lineTo(centerX - crystalSize / 2, centerY);
    ctx.closePath();
    
    // Crystal fill based on damage level
    let crystalFill;
    if (showEffects) {
      // Create a gradient that gets more intense with damage
      const intensity = Math.min(0.8, damageLevel / 100);
      crystalFill = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, crystalSize / 2
      );
      crystalFill.addColorStop(0, `rgba(167, 139, 250, ${intensity})`);
      crystalFill.addColorStop(1, 'rgba(167, 139, 250, 0.1)');
    } else {
      crystalFill = 'rgba(203, 213, 225, 0.3)';
    }
    
    ctx.fillStyle = crystalFill;
    ctx.fill();
    
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw inner crystal structure
    const innerSize = crystalSize * 0.6;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - innerSize / 2);
    ctx.lineTo(centerX + innerSize / 2, centerY);
    ctx.lineTo(centerX, centerY + innerSize / 2);
    ctx.lineTo(centerX - innerSize / 2, centerY);
    ctx.closePath();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw crystalline planes
    ctx.beginPath();
    ctx.moveTo(centerX - innerSize / 2, centerY);
    ctx.lineTo(centerX + innerSize / 2, centerY);
    ctx.moveTo(centerX, centerY - innerSize / 2);
    ctx.lineTo(centerX, centerY + innerSize / 2);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw glowing if showing effects
    if (showEffects) {
      // Add glowing particles
      const particleCount = Math.floor(damageLevel / 5);
      for (let i = 0; i < particleCount; i++) {
        // Random position within crystal
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * innerSize / 2;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Glow effect
        const glow = ctx.createRadialGradient(
          x, y, 0,
          x, y, 5 + Math.random() * 5
        );
        glow.addColorStop(0, 'rgba(167, 139, 250, 0.8)');
        glow.addColorStop(1, 'rgba(167, 139, 250, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, 5 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }
    }
  };
  
  // Draw radiation particles
  const drawRadiationParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const particleCount = Math.ceil(radiationDose / 10);
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.min(width, height) * 0.4;
    
    for (let i = 0; i < particleCount; i++) {
      // Generate random position outside target
      const angle = Math.random() * Math.PI * 2;
      const distance = maxDistance + 50 + Math.random() * 50;
      const startX = centerX + Math.cos(angle) * distance;
      const startY = centerY + Math.sin(angle) * distance;
      
      // Target position with some variance
      const targetAngle = angle + (Math.random() - 0.5) * 0.5;
      const targetDistance = Math.random() * maxDistance * 0.8;
      const targetX = centerX + Math.cos(targetAngle) * targetDistance;
      const targetY = centerY + Math.sin(targetAngle) * targetDistance;
      
      // Get particle properties
      const properties = radiationProperties[selectedRadiation];
      
      // Draw particle path
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = `rgba(${hexToRgb(properties.color)}, 0.3)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(
        startX + (targetX - startX) * 0.7,
        startY + (targetY - startY) * 0.7,
        3,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = properties.color;
      ctx.fill();
      
      // Draw symbol at end point
      ctx.font = "bold 10px Arial";
      ctx.fillStyle = properties.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(properties.symbol, targetX, targetY);
    }
  };
  
  // Helper function to convert hex to rgb for opacity
  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };
  
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Strahlungslabor</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dna">DNA</TabsTrigger>
            <TabsTrigger value="metal">Metall</TabsTrigger>
            <TabsTrigger value="plastic">Kunststoff</TabsTrigger>
            <TabsTrigger value="crystal">Kristall</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            
            {isRadiating && (
              <div className="absolute top-4 left-4 bg-red-100 border border-red-300 text-red-800 px-3 py-1 rounded-full text-sm animate-pulse">
                <Activity className="inline-block mr-1 h-4 w-4" />
                Strahlung aktiv
              </div>
            )}
            
            {showEffects && (
              <div className="absolute bottom-4 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Sparkles className="inline-block mr-1 h-4 w-4" />
                Effekte sichtbar
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              {activeTab === 'dna' ? 'DNA-Strang' : 
               activeTab === 'metal' ? 'Metallgitter' : 
               activeTab === 'plastic' ? 'Polymer-Ketten' : 'Kristallstruktur'}
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button 
              className={cn("flex-1", isRadiating ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600")}
              onClick={isRadiating ? stopRadiation : startRadiation}
            >
              {isRadiating ? (
                <>
                  <CircleOff className="mr-2 h-4 w-4" />
                  Bestrahlung stoppen
                </>
              ) : (
                <>
                  <Radiation className="mr-2 h-4 w-4" />
                  Mit {radiationProperties[selectedRadiation].symbol} bestrahlen
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={resetExperiment} disabled={isRadiating}>
              Zurücksetzen
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Strahlungsparameter</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Strahlungsart</label>
                <Select 
                  value={selectedRadiation}
                  onValueChange={(value) => setSelectedRadiation(value as RadiationType)}
                  disabled={isRadiating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alpha">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-red-500">{radiationProperties.alpha.symbol}</Badge>
                        <span>Alpha-Strahlung</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="beta">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-500">{radiationProperties.beta.symbol}</Badge>
                        <span>Beta-Strahlung</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gamma">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-500">{radiationProperties.gamma.symbol}</Badge>
                        <span>Gamma-Strahlung</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="neutron">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-amber-500">{radiationProperties.neutron.symbol}</Badge>
                        <span>Neutronen</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="mt-2 text-xs bg-blue-50 p-2 rounded">
                  {radiationProperties[selectedRadiation].description}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1 items-center">
                  <span className="text-sm font-medium">Strahlungsdosis</span>
                  <span className="text-sm">{radiationDose} mSv/h</span>
                </div>
                <Slider 
                  value={[radiationDose]}
                  min={10}
                  max={100}
                  step={1}
                  onValueChange={(values) => setRadiationDose(values[0])}
                  disabled={isRadiating}
                />
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Gering</span>
                  <span>Mittel</span>
                  <span>Hoch</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Materialeigenschaften</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Strahlungsresistenz</span>
                  <span>{materialProperties[activeTab as MaterialType].resistance}%</span>
                </div>
                <Progress value={materialProperties[activeTab as MaterialType].resistance} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Kumulative Dosis</span>
                  <span>{cumDose.toFixed(1)} mSv</span>
                </div>
                <Progress value={Math.min(100, cumDose)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Schadensgrad</span>
                  <span className={cn(
                    damageLevel < 30 ? "text-green-500" :
                    damageLevel < 70 ? "text-amber-500" :
                    "text-red-500"
                  )}>
                    {damageLevel.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={damageLevel} 
                  className={cn(
                    "h-2",
                    damageLevel < 30 ? "bg-green-100" :
                    damageLevel < 70 ? "bg-amber-100" :
                    "bg-red-100"
                  )}
                  indicatorClassName={cn(
                    damageLevel < 30 ? "bg-green-500" :
                    damageLevel < 70 ? "bg-amber-500" :
                    "bg-red-500"
                  )}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Sichtbare Auswirkung</span>
                  <span>{showEffects ? materialProperties[activeTab as MaterialType].effect : "Keine"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <TabsContent value="dna" className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium mb-2">DNA und Strahlung</h3>
        <p className="text-sm">
          DNA ist besonders empfindlich gegenüber ionisierender Strahlung. Alpha-Strahlung (α) kann bei direktem Kontakt 
          schwere Schäden verursachen, während Gamma-Strahlung (γ) tiefer eindringt. Strahlenschäden an der DNA 
          können zu Einzel- und Doppelstrangbrüchen führen, die wiederum zu Mutationen oder Zelltod führen können.
        </p>
      </TabsContent>
      
      <TabsContent value="metal" className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium mb-2">Metalle und Strahlung</h3>
        <p className="text-sm">
          Metalle sind relativ strahlungsresistent, besonders gegenüber Alpha- (α) und Beta-Strahlung (β). 
          Bei hohen Dosen können jedoch Elektronen aus der Metallgitterstruktur freigesetzt werden, was die 
          mechanischen Eigenschaften des Metalls verändern kann. Langfristige Bestrahlung führt zu Versprödung 
          und Materialermüdung.
        </p>
      </TabsContent>
      
      <TabsContent value="plastic" className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium mb-2">Kunststoffe und Strahlung</h3>
        <p className="text-sm">
          Kunststoffe sind anfällig für Strahlungsschäden, da energiereiche Strahlung Polymerketten brechen kann. 
          Dies führt zu Versprödung, Verfärbung und Strukturverlust. Gamma-Strahlung (γ) wird oft gezielt eingesetzt, 
          um Kunststoffe zu sterilisieren oder ihre Eigenschaften zu modifizieren.
        </p>
      </TabsContent>
      
      <TabsContent value="crystal" className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium mb-2">Kristalle und Strahlung</h3>
        <p className="text-sm">
          In Kristallen kann Strahlung Farbzentren erzeugen, indem Elektronen in Gitterfehlstellen eingefangen werden. 
          Diese Zentren absorbieren Licht und können zum Leuchten angeregt werden. Dieses Phänomen wird in der 
          Dosimetrie genutzt, um Strahlungsdosen zu messen. Es erklärt auch, warum manche Edelsteine ihre Farbe durch 
          natürliche Bestrahlung über Millionen von Jahren erhalten haben.
        </p>
      </TabsContent>
    </Card>
  );
};

export default RadiationEffectsLab;
