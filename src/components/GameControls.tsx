
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AtomProps } from './Atom';
import { Atom, Zap, Play, RefreshCw } from 'lucide-react';

interface GameControlsProps {
  onSelectElement: (element: AtomProps['element']) => void;
  selectedElement: AtomProps['element'] | null;
  onReset: () => void;
  onFireNeutron: () => void;
  canFireNeutron: boolean;
  className?: string;
}

export const GameControls = ({
  onSelectElement,
  selectedElement,
  onReset,
  onFireNeutron,
  canFireNeutron,
  className,
}: GameControlsProps) => {
  const elements: { value: AtomProps['element']; label: string }[] = [
    { value: 'uranium235', label: 'Uran-235' },
    { value: 'uranium238', label: 'Uran-238' },
    { value: 'plutonium239', label: 'Plutonium-239' },
    { value: 'thorium232', label: 'Thorium-232' },
  ];

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <div className="flex flex-wrap gap-2 justify-center">
        {elements.map((element) => (
          <Button
            key={element.value}
            onClick={() => onSelectElement(element.value)}
            variant={selectedElement === element.value ? 'default' : 'outline'}
            className={cn(
              'transition-all',
              selectedElement === element.value 
                ? 'ring-2 ring-offset-2 ring-primary'
                : ''
            )}
          >
            <Atom className="mr-2 h-4 w-4" />
            {element.label}
          </Button>
        ))}
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={onFireNeutron}
          disabled={!canFireNeutron}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Zap className="mr-2 h-5 w-5" />
          Neutron abschießen
        </Button>
        
        <Button 
          onClick={onReset}
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Zurücksetzen
        </Button>
      </div>
    </div>
  );
};

export default GameControls;
