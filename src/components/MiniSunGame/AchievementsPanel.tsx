
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Zap, Sun, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementsPanelProps {
  achievements: string[];
  className?: string;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ 
  achievements,
  className 
}) => {
  const achievementData = [
    {
      id: 'first-fusion',
      name: 'Erster Lichtblick',
      description: 'Erste Fusion erfolgreich gestartet',
      icon: <Flame className="h-4 w-4 text-orange-500" />
    },
    {
      id: 'main-sequence',
      name: 'Sonnengleich',
      description: 'Einen Hauptreihenstern erzeugt',
      icon: <Sun className="h-4 w-4 text-yellow-500" />
    },
    {
      id: 'blue-giant',
      name: 'Gigantische Leistung',
      description: 'Einen Blauen Riesen erzeugt',
      icon: <Star className="h-4 w-4 text-blue-500" />
    },
    {
      id: 'perfect-stability',
      name: 'Plasma-Meister',
      description: 'Perfekte Plasmastabilität erreicht',
      icon: <CircleDot className="h-4 w-4 text-purple-500" />
    },
    {
      id: 'long-life',
      name: 'Mini-Sternenforscher',
      description: 'Einen Stern lange am Leben erhalten',
      icon: <Zap className="h-4 w-4 text-green-500" />
    },
    {
      id: 'supernova',
      name: 'Supernova-Entdecker',
      description: 'Eine Supernova-Explosion ausgelöst',
      icon: <Flame className="h-4 w-4 text-red-500" />
    }
  ];

  return (
    <Card className={cn("p-3 bg-gray-50", className)}>
      <h3 className="text-sm font-medium mb-2">Erfolge</h3>
      <div className="flex flex-wrap gap-2">
        {achievementData.map(achievement => {
          const isUnlocked = achievements.includes(achievement.id);
          
          return (
            <Badge 
              key={achievement.id}
              variant={isUnlocked ? "default" : "outline"}
              className={cn(
                "flex items-center gap-1 px-2 py-1",
                isUnlocked 
                  ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" 
                  : "text-gray-400 border-gray-300"
              )}
              title={achievement.description}
            >
              {achievement.icon}
              <span className="text-xs">{achievement.name}</span>
            </Badge>
          );
        })}
      </div>
    </Card>
  );
};

export default AchievementsPanel;
