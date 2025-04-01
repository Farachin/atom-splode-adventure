
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface NeutronProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  isAnimating?: boolean;
  isDraggable?: boolean;
  position?: { x: number, y: number };
  speed?: 'slow' | 'fast';
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const fontSizeClasses = {
  sm: 'text-[8px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export const Neutron = ({
  size = 'md',
  onClick,
  className,
  isAnimating = false,
  isDraggable = false,
  position,
  speed = 'fast',
  onDragStart,
  onDragEnd,
}: NeutronProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('neutron', 'true');
    e.dataTransfer.setData('neutronSpeed', speed);
    setIsDragging(true);
    if (onDragStart) onDragStart(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd(e);
  };

  return (
    <div
      className={cn(
        'neutron rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center',
        sizeClasses[size],
        fontSizeClasses[size],
        isAnimating ? 'animate-pulse' : '',
        isDragging ? 'opacity-50' : '',
        speed === 'slow' ? 'bg-blue-500' : 'bg-atom-neutron',
        className
      )}
      style={position ? { 
        position: 'absolute',
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      } : undefined}
      onClick={onClick}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
    >
      <span className="font-bold text-white select-none">n</span>
      
      {/* Optional visual indicator for neutron speed */}
      {speed === 'slow' && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-[6px] text-blue-700 whitespace-nowrap">
          langsam
        </div>
      )}
      {speed === 'fast' && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-[6px] text-orange-700 whitespace-nowrap">
          schnell
        </div>
      )}
    </div>
  );
};

export default Neutron;
