
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface EnergyBarProps {
  value: number;
  maxValue: number;
  className?: string;
  showMaxValue?: boolean;
}

export const EnergyBar = ({ value, maxValue, className, showMaxValue = true }: EnergyBarProps) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  return (
    <div className={cn('flex flex-col items-center space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <Flame className="w-6 h-6 text-orange-500" />
        <span className="font-bold text-lg">Energie: {value} MeV</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-4 w-full bg-gray-200" 
      />
      {showMaxValue && (
        <div className="flex w-full justify-between text-xs">
          <span>0</span>
          <span>{maxValue} MeV</span>
        </div>
      )}
    </div>
  );
};

export default EnergyBar;
