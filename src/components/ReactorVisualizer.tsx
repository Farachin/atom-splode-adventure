
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ReactorVisualizerProps {
  className?: string;
  temperature: number;
  coolantFlow: number;
  controlRodLevel: number;
  isRunning: boolean;
  coolantType: 'water' | 'sodium' | 'helium' | 'molten-salt';
  efficiency: number;
  reactorType: 'pressurized-water' | 'fast-breeder' | 'fusion' | 'thorium-msr';
  isStable: boolean;
  warningLevel: 'none' | 'low' | 'medium' | 'high';
  emergencyDrainActive?: boolean;
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
  warningLevel,
  emergencyDrainActive = false
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
  }, [temperature, coolantFlow, controlRodLevel, isRunning, coolantType, reactorType, isStable, warningLevel, emergencyDrainActive]);
  
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
    
    // Different vessel color for thorium MSR
    if (reactorType === 'thorium-msr') {
      ctx.fillStyle = '#505050'; // Darker gray for MSR vessel
    } else {
      ctx.fillStyle = '#444'; // Regular vessel color
    }
    
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
    
    // Core color based on temperature and reactor type
    let coreColor;
    
    if (reactorType === 'thorium-msr') {
      // Orange glowing color for thorium MSR
      if (temperature > 1500) {
        coreColor = '#ff3300'; // Very hot - bright orange-red
      } else if (temperature > 1000) {
        coreColor = '#ff6600'; // Hot - orange
      } else if (temperature > 500) {
        coreColor = '#ff9933'; // Warm - light orange
      } else if (temperature > 100) {
        coreColor = '#ffcc66'; // Low heat - pale orange
      } else {
        coreColor = '#ffddaa'; // Cold - very pale orange
      }
    } else {
      // Regular reactor colors
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
    
    // Thorium MSR specific visualization - fuel spheres
    if (reactorType === 'thorium-msr' && isRunning) {
      const numSpheres = 15;
      for (let i = 0; i < numSpheres; i++) {
        // Random position within the core
        const sphereX = coreX + Math.random() * coreWidth;
        const sphereY = coreY + Math.random() * coreHeight;
        const sphereSize = 3 + Math.random() * 3;
        
        // Draw thorium fuel spheres
        ctx.beginPath();
        ctx.arc(sphereX, sphereY, sphereSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(70, 200, 80, 0.8)'; // Green for thorium
        ctx.fill();
        
        // Glow effect for active fuel
        const glowSize = sphereSize * (1.5 + 0.5 * Math.sin(frameCount * 0.05 + i));
        const gradient = ctx.createRadialGradient(
          sphereX, sphereY, sphereSize,
          sphereX, sphereY, glowSize
        );
        gradient.addColorStop(0, 'rgba(70, 200, 80, 0.4)');
        gradient.addColorStop(1, 'rgba(70, 200, 80, 0)');
        
        ctx.beginPath();
        ctx.arc(sphereX, sphereY, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }
    
    // Coolant flow visualization
    if (isRunning) {
      // Different coolant colors based on type
      const coolantColor = 
        coolantType === 'water' ? '#3b82f6' : 
        coolantType === 'sodium' ? '#f97316' : 
        coolantType === 'molten-salt' ? '#ff9933' : // Orange for molten salt
        '#a78bfa'; // Helium is purple
                          
      const numParticles = coolantFlow / 5; // 0-20 particles based on flow
      
      // Define inlet and outlet Y positions
      const inletY = reactorVesselY + reactorVesselHeight * 0.8;
      const outletY = reactorVesselY + reactorVesselHeight * 0.2;
      
      for (let i = 0; i < numParticles; i++) {
        const baseX = reactorVesselX - 10;
        
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
      
      // For Thorium MSR - draw emergency drain system if active
      if (reactorType === 'thorium-msr') {
        // Draw drain pipe at the bottom
        const drainY = reactorVesselY + reactorVesselHeight;
        const drainX = centerX;
        
        ctx.beginPath();
        ctx.moveTo(drainX, coreY + coreHeight);
        ctx.lineTo(drainX, drainY + 20);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Draw drain valve (closed by default)
        ctx.beginPath();
        ctx.arc(drainX, drainY, 6, 0, Math.PI * 2);
        
        if (emergencyDrainActive) {
          ctx.fillStyle = '#22c55e'; // Green when open
          
          // Draw flowing salt if emergency drain is active
          for (let i = 0; i < 10; i++) {
            const saltY = coreY + coreHeight + ((frameCount * 3 + i * 8) % 40);
            
            if (saltY < drainY + 20) {
              ctx.beginPath();
              ctx.arc(drainX, saltY, 3, 0, Math.PI * 2);
              ctx.fillStyle = coolantColor;
              ctx.fill();
            }
          }
          
          // Draw collection tank
          ctx.beginPath();
          ctx.rect(drainX - 25, drainY + 20, 50, 15);
          ctx.fillStyle = '#555';
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.stroke();
          
          // Draw collected salt in tank
          ctx.beginPath();
          ctx.rect(drainX - 23, drainY + 22, 46, 11);
          ctx.fillStyle = coolantColor;
          ctx.fill();
          
        } else {
          ctx.fillStyle = '#ef4444'; // Red when closed
        }
        
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    
    // Enhanced fusion visualization for kids
    if (reactorType === 'fusion' && isRunning) {
      // Draw plasma particles and fusion reactions
      const plasmaRadius = Math.min(coreWidth, coreHeight) * 0.4;
      
      // Draw plasma containment field (magnetic field lines)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          centerX, centerY,
          plasmaRadius * 1.2, plasmaRadius * 1.2,
          angle, 0, Math.PI * 2
        );
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.5 + 0.5 * Math.sin(frameCount * 0.05)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Draw nucleus particles (deuterium and tritium or other fusion fuels)
      const particleCount = Math.floor(20 + temperature / 1000000);
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * plasmaRadius;
        const particleX = centerX + Math.cos(angle + frameCount * 0.01) * distance;
        const particleY = centerY + Math.sin(angle + frameCount * 0.01) * distance;
        
        // Draw nuclei with different colors based on the fuel type
        const particleSize = 4 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        
        // Different colors for different fuel types
        if (Math.random() > 0.5) {
          ctx.fillStyle = '#ff9500'; // Deuterium (orange)
        } else {
          ctx.fillStyle = '#00b3ff'; // Tritium (blue)
        }
        ctx.fill();
        
        // Add proton and neutron details for educational visuals
        const miniParticleSize = particleSize / 2;
        
        // Proton (red)
        ctx.beginPath();
        ctx.arc(
          particleX - miniParticleSize/2, 
          particleY - miniParticleSize/2, 
          miniParticleSize, 0, Math.PI * 2
        );
        ctx.fillStyle = '#ff5555';
        ctx.fill();
        
        // Neutron (blue)
        ctx.beginPath();
        ctx.arc(
          particleX + miniParticleSize/2, 
          particleY + miniParticleSize/2, 
          miniParticleSize, 0, Math.PI * 2
        );
        ctx.fillStyle = '#5555ff';
        ctx.fill();
      }
      
      // Draw fusion reactions with glowing effects
      if (temperature > 100000000 && efficiency > 5) {
        const reactionCount = Math.floor(efficiency / 10) + 1;
        for (let i = 0; i < reactionCount; i++) {
          if (Math.random() > 0.7) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (plasmaRadius * 0.7);
            const reactionX = centerX + Math.cos(angle) * distance;
            const reactionY = centerY + Math.sin(angle) * distance;
            
            // Draw explosion-like glow
            const gradient = ctx.createRadialGradient(
              reactionX, reactionY, 0,
              reactionX, reactionY, 20 + Math.random() * 10
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.4, 'rgba(255, 220, 50, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
            
            ctx.beginPath();
            ctx.arc(reactionX, reactionY, 20 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw energy rays coming out
            const rayCount = 3 + Math.floor(Math.random() * 5);
            for (let j = 0; j < rayCount; j++) {
              const rayAngle = Math.random() * Math.PI * 2;
              const rayLength = 10 + Math.random() * 20;
              
              ctx.beginPath();
              ctx.moveTo(reactionX, reactionY);
              ctx.lineTo(
                reactionX + Math.cos(rayAngle) * rayLength,
                reactionY + Math.sin(rayAngle) * rayLength
              );
              ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            
            // Draw resulting helium nucleus
            ctx.beginPath();
            ctx.arc(reactionX, reactionY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffcc00';
            ctx.fill();
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      
      // Add pulsing energy glow around the plasma
      if (efficiency > 0) {
        const glowRadius = plasmaRadius * (1.1 + 0.1 * Math.sin(frameCount * 0.1));
        const glowGradient = ctx.createRadialGradient(
          centerX, centerY, plasmaRadius * 0.8,
          centerX, centerY, glowRadius
        );
        glowGradient.addColorStop(0, `rgba(255, 200, 50, ${efficiency/100})`);
        glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
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
        
        // Different energy colors for thorium
        if (reactorType === 'thorium-msr') {
          ctx.fillStyle = '#ffcc00'; // Yellow-orange for thorium energy
        } else {
          ctx.fillStyle = '#ffff00'; // Yellow for standard energy
        }
        ctx.fill();
        
        // Add energy rays
        if (Math.random() > 0.7) {
          const rayLength = 10 + Math.random() * 10;
          const rayEndX = particleX + Math.cos(angle) * rayLength;
          const rayEndY = particleY + Math.sin(angle) * rayLength;
          
          ctx.beginPath();
          ctx.moveTo(particleX, particleY);
          ctx.lineTo(rayEndX, rayEndY);
          
          if (reactorType === 'thorium-msr') {
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.7)'; // Yellow-orange for thorium
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Yellow for standard
          }
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
    
    // Special effect for Thorium MSR passive safety feature
    if (reactorType === 'thorium-msr' && temperature > 900 && temperature < 1400 && isRunning) {
      // Safety glow effect around core
      const safetyRadius = coreWidth * 0.6;
      const safetyGlow = ctx.createRadialGradient(
        centerX, centerY, coreWidth * 0.3,
        centerX, centerY, safetyRadius
      );
      
      safetyGlow.addColorStop(0, 'rgba(40, 180, 60, 0)');
      safetyGlow.addColorStop(0.5, `rgba(40, 180, 60, ${0.1 + 0.1 * Math.sin(frameCount * 0.1)})`);
      safetyGlow.addColorStop(1, 'rgba(40, 180, 60, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, safetyRadius, 0, Math.PI * 2);
      ctx.fillStyle = safetyGlow;
      ctx.fill();
      
      // Pulsing text for educational value
      if (frameCount % 90 < 45) {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(40, 180, 60, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Selbstregulierung aktiv', centerX, reactorVesselY + reactorVesselHeight + 30);
      }
    }
    
    // Label for reactor type
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const reactorLabel = reactorType === 'pressurized-water' ? 'Druckwasserreaktor' :
                        reactorType === 'fast-breeder' ? 'Schneller Brüter' : 
                        reactorType === 'fusion' ? 'Fusionsreaktor' :
                        'Thorium-Flüssigsalzreaktor';
    
    ctx.fillText(reactorLabel, centerX, reactorVesselY + reactorVesselHeight + 10);
    
    // Status indicator
    const statusText = !isRunning ? 'Inaktiv' : 
                      !isStable ? 'KRITISCH!' : 
                      emergencyDrainActive ? 'Notablauf!' :
                      efficiency > 30 ? 'Optimale Leistung' : 'Stabil';
    
    const statusColor = !isRunning ? '#aaa' : 
                       !isStable ? '#ff0000' : 
                       emergencyDrainActive ? '#ff9900' :
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

