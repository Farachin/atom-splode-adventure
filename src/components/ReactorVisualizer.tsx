
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ReactorVisualizerProps {
  className?: string;
  temperature: number;
  coolantFlow: number;
  controlRodLevel: number;
  isRunning: boolean;
  coolantType: 'water' | 'sodium' | 'helium';
  efficiency: number;
  reactorType: 'pressurized-water' | 'fast-breeder' | 'fusion';
  isStable: boolean;
  warningLevel: 'none' | 'low' | 'medium' | 'high';
}

const ReactorVisualizer: React.FC<ReactorVisualizerProps> = ({
  className,
  temperature,
  coolantFlow,
  controlRodLevel,
  isRunning,
  coolantType,
  efficiency,
  reactorType,
  isStable,
  warningLevel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw reactor animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Animation frame counter
    let frameCount = 0;
    
    // Animation loop
    const animate = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const reactorWidth = canvas.width * 0.8;
      const reactorHeight = canvas.height * 0.6;
      
      drawReactor(ctx, centerX, centerY, reactorWidth, reactorHeight, frameCount);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [temperature, coolantFlow, controlRodLevel, isRunning, coolantType, reactorType, isStable, warningLevel]);
  
  const drawReactor = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    width: number, 
    height: number,
    frameCount: number
  ) => {
    // Calculate dimensions
    const reactorVesselX = centerX - width / 2;
    const reactorVesselY = centerY - height / 2;
    const reactorVesselWidth = width;
    const reactorVesselHeight = height;
    
    // Reactor vessel
    ctx.beginPath();
    ctx.rect(reactorVesselX, reactorVesselY, reactorVesselWidth, reactorVesselHeight);
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Reactor core
    const coreWidth = reactorVesselWidth * 0.6;
    const coreHeight = reactorVesselHeight * 0.7;
    const coreX = centerX - coreWidth / 2;
    const coreY = centerY - coreHeight / 2;
    
    ctx.beginPath();
    ctx.rect(coreX, coreY, coreWidth, coreHeight);
    
    // Core color based on temperature
    let coreColor;
    if (temperature > 1500) {
      coreColor = '#ff4500'; // Very hot - red-orange
    } else if (temperature > 1000) {
      coreColor = '#ff8c00'; // Hot - dark orange
    } else if (temperature > 500) {
      coreColor = '#ffa500'; // Warm - orange
    } else if (temperature > 100) {
      coreColor = '#ffcc00'; // Low heat - yellow
    } else {
      coreColor = '#aaa'; // Cold - gray
    }
    
    ctx.fillStyle = coreColor;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Control rods
    const numRods = 5;
    const rodWidth = coreWidth / (numRods + 1);
    const rodFullHeight = coreHeight * 0.9;
    const rodHeight = rodFullHeight * (controlRodLevel / 100); // Height based on control level
    
    for (let i = 0; i < numRods; i++) {
      const rodX = coreX + rodWidth * (i + 1) - rodWidth / 4;
      const rodY = coreY + (coreHeight - rodHeight) / 2;
      
      ctx.beginPath();
      ctx.rect(rodX, rodY, rodWidth / 2, rodHeight);
      ctx.fillStyle = '#555';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Coolant flow visualization
    if (isRunning) {
      const coolantColor = coolantType === 'water' ? '#3b82f6' : 
                          coolantType === 'sodium' ? '#f97316' : '#a78bfa';
                          
      const numParticles = coolantFlow / 5; // 0-20 particles based on flow
      
      for (let i = 0; i < numParticles; i++) {
        const baseX = reactorVesselX - 10;
        // Inlet pipe - bottom left
        const inletY = reactorVesselY + reactorVesselHeight * 0.8;
        
        // Outlet pipe - top left
        const outletY = reactorVesselY + reactorVesselHeight * 0.2;
        
        // Particles in inlet pipe
        const inletParticleX = baseX + ((frameCount * 2 + i * 20) % 100);
        if (inletParticleX < reactorVesselX + reactorVesselWidth * 0.2) {
          ctx.beginPath();
          ctx.arc(inletParticleX, inletY, 3, 0, Math.PI * 2);
          ctx.fillStyle = coolantColor;
          ctx.fill();
        }
        
        // Particles in outlet pipe
        const outletParticleX = baseX + reactorVesselWidth - ((frameCount * 2 + i * 20) % 100);
        if (outletParticleX > reactorVesselX + reactorVesselWidth * 0.8) {
          ctx.beginPath();
          ctx.arc(outletParticleX, outletY, 3, 0, Math.PI * 2);
          ctx.fillStyle = coolantColor;
          ctx.globalAlpha = 0.7; // Slightly transparent for "used" coolant
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
      
      // Draw coolant pipes
      // Inlet pipe
      ctx.beginPath();
      ctx.moveTo(reactorVesselX - 30, inletY);
      ctx.lineTo(reactorVesselX, inletY);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 10;
      ctx.stroke();
      
      // Outlet pipe
      ctx.beginPath();
      ctx.moveTo(reactorVesselX - 30, outletY);
      ctx.lineTo(reactorVesselX, outletY);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 10;
      ctx.stroke();
      
      // Connecting pipe
      ctx.beginPath();
      ctx.moveTo(reactorVesselX - 30, outletY);
      ctx.lineTo(reactorVesselX - 30, inletY);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 10;
      ctx.stroke();
    }
    
    // Generate energy particles for visual effect when running
    if (isRunning && temperature > 100) {
      const numEnergyParticles = Math.floor(efficiency / 10) + 1; // 1-10 particles based on efficiency
      
      for (let i = 0; i < numEnergyParticles; i++) {
        const angle = (frameCount / 20 + i * (Math.PI * 2 / numEnergyParticles)) % (Math.PI * 2);
        const distance = 20 + Math.sin(frameCount / 10 + i) * 10;
        const particleX = centerX + Math.cos(angle) * distance;
        const particleY = centerY + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        
        // Add energy rays
        if (Math.random() > 0.7) {
          const rayLength = 10 + Math.random() * 10;
          const rayEndX = particleX + Math.cos(angle) * rayLength;
          const rayEndY = particleY + Math.sin(angle) * rayLength;
          
          ctx.beginPath();
          ctx.moveTo(particleX, particleY);
          ctx.lineTo(rayEndX, rayEndY);
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    
    // Warning indicators for high temperature
    if (warningLevel !== 'none' && isRunning) {
      const warningBlinkRate = warningLevel === 'high' ? 15 : 
                              warningLevel === 'medium' ? 30 : 45;
      
      if (frameCount % warningBlinkRate < warningBlinkRate / 2) {
        const warningColor = warningLevel === 'high' ? '#ff0000' : 
                            warningLevel === 'medium' ? '#ff8c00' : '#ffcc00';
        
        // Draw warning indicators at the top of the reactor
        for (let i = 0; i < 3; i++) {
          const warningX = centerX - 30 + i * 30;
          const warningY = reactorVesselY - 15;
          
          ctx.beginPath();
          ctx.arc(warningX, warningY, 7, 0, Math.PI * 2);
          ctx.fillStyle = warningColor;
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    
    // Label for reactor type
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const reactorLabel = reactorType === 'pressurized-water' ? 'Druckwasserreaktor' :
                        reactorType === 'fast-breeder' ? 'Schneller Brüter' : 'Fusionsreaktor';
    
    ctx.fillText(reactorLabel, centerX, reactorVesselY + reactorVesselHeight + 10);
    
    // Status indicator
    const statusText = !isRunning ? 'Inaktiv' : 
                      !isStable ? 'KRITISCH!' : 
                      efficiency > 30 ? 'Optimale Leistung' : 'Stabil';
    
    const statusColor = !isRunning ? '#aaa' : 
                       !isStable ? '#ff0000' : 
                       efficiency > 30 ? '#00ff00' : '#ffcc00';
    
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, centerX, reactorVesselY + reactorVesselHeight + 30);
  };

  return (
    <div className={cn("w-full bg-gray-800 rounded-lg overflow-hidden", className)}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
        style={{ minHeight: '250px' }}
      />
    </div>
  );
};

export default ReactorVisualizer;
