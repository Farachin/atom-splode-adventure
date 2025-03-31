
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface NeutronProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  isAnimating?: boolean;
  isDraggable?: boolean;
  position?: { x: number, y: number };
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
  onDragStart,
  onDragEnd,
}: NeutronProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('neutron', 'true');
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
        'neutron bg-atom-neutron rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center',
        sizeClasses[size],
        fontSizeClasses[size],
        isAnimating ? 'animate-pulse' : '',
        isDragging ? 'opacity-50' : '',
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
    </div>
  );
};

export default Neutron;
