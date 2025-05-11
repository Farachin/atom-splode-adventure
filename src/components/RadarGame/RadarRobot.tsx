
import React from 'react';
import { cn } from '@/lib/utils';

interface RadarRobotProps {
  speaking?: boolean;
  className?: string;
}

const RadarRobot = ({ speaking = false, className }: RadarRobotProps) => {
  return (
    <div className={cn("relative", className)}>
      {/* Robot head */}
      <div className="w-32 h-32 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full relative shadow-lg border-4 border-blue-300">
        {/* Eyes */}
        <div className="absolute top-8 left-6 w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <div className={`w-3 h-3 bg-blue-900 rounded-full ${speaking ? 'animate-pulse' : ''}`}></div>
        </div>
        <div className="absolute top-8 right-6 w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <div className={`w-3 h-3 bg-blue-900 rounded-full ${speaking ? 'animate-pulse' : ''}`}></div>
        </div>
        
        {/* Mouth */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-3 bg-white rounded-md">
          {speaking && (
            <div className="absolute inset-0 flex items-center justify-around">
              <div className="w-1 h-1 bg-blue-500 animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
        
        {/* Antenna */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-2 h-6 bg-gray-400"></div>
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Radar dish */}
      <div className="absolute -right-4 top-4">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center transform rotate-45">
          <div className="w-8 h-8 border-4 border-gray-500 rounded-full border-t-0 border-l-0 animate-spin" style={{ animationDuration: '3s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default RadarRobot;
