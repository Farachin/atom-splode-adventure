
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
  
  // Calculate color based on percentage
  const getBarColor = () => {
    if (percentage < 30) return "bg-blue-500";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-orange-500";
  };
  
  return (
    <div className={cn('flex flex-col items-center space-y-1', className)}>
      <div className="flex items-center space-x-2">
        <Flame className={cn(
          "w-6 h-6", 
          percentage < 30 ? "text-blue-500" : 
          percentage < 70 ? "text-yellow-500" : "text-orange-500"
        )} />
        <span className="font-bold text-lg">Energie: {value.toFixed(0)} MeV</span>
      </div>
      <Progress 
        value={percentage} 
        className={cn("h-4 w-full bg-gray-200", getBarColor())}
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
