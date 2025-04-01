
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AtomProps } from './Atom';
import { Atom, Zap, Play, RefreshCw, Waves, Flame } from 'lucide-react';

interface GameControlsProps {
  onSelectElement: (element: AtomProps['element']) => void;
  selectedElement: AtomProps['element'] | null;
  onReset: () => void;
  onFireNeutron: () => void;
  onSpeedChange: (speed: 'slow' | 'fast') => void;
  neutronSpeed: 'slow' | 'fast';
  canFireNeutron: boolean;
  className?: string;
}

export const GameControls = ({
  onSelectElement,
  selectedElement,
  onReset,
  onFireNeutron,
  onSpeedChange,
  neutronSpeed,
  canFireNeutron,
  className,
}: GameControlsProps) => {
  const elements: { value: AtomProps['element']; label: string; description: string }[] = [
    { value: 'uranium235', label: 'Uran-235', description: 'Gut spaltbar' },
    { value: 'uranium238', label: 'Uran-238', description: 'Absorbiert langsame Neutronen' },
    { value: 'plutonium239', label: 'Plutonium-239', description: 'Sehr gut spaltbar' },
    { value: 'thorium232', label: 'Thorium-232', description: 'Brutelement' },
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
            <div className="flex flex-col items-start">
              <span>{element.label}</span>
              <span className="text-xs opacity-80">{element.description}</span>
            </div>
          </Button>
        ))}
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={onFireNeutron}
          disabled={!canFireNeutron}
          className="bg-orange-500 hover:bg-orange-600 animate-pulse"
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
      
      <div className="flex justify-center gap-2">
        <Button
          onClick={() => onSpeedChange('slow')}
          variant={neutronSpeed === 'slow' ? 'default' : 'outline'}
          className={cn(
            'bg-blue-500 hover:bg-blue-600',
            neutronSpeed === 'slow' ? 'ring-2 ring-offset-2 ring-blue-300' : ''
          )}
        >
          <Waves className="mr-2 h-4 w-4" />
          <div className="flex flex-col items-start">
            <span>Langsame Neutronen</span>
            <span className="text-xs opacity-80">Für U-238 Absorption</span>
          </div>
        </Button>
        
        <Button
          onClick={() => onSpeedChange('fast')}
          variant={neutronSpeed === 'fast' ? 'default' : 'outline'}
          className={cn(
            'bg-red-500 hover:bg-red-600',
            neutronSpeed === 'fast' ? 'ring-2 ring-offset-2 ring-red-300' : ''
          )}
        >
          <Flame className="mr-2 h-4 w-4" />
          <div className="flex flex-col items-start">
            <span>Schnelle Neutronen</span>
            <span className="text-xs opacity-80">Besser für Spaltung</span>
          </div>
        </Button>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Tipp: Uran-238 absorbiert nur langsame Neutronen, während Plutonium-239 auf beide Arten reagiert.
        </p>
      </div>
    </div>
  );
};

export default GameControls;
