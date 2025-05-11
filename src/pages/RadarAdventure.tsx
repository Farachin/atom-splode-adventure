
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RadarGame from '@/components/RadarGame/RadarGame';
import { ChevronLeft } from 'lucide-react';

const RadarAdventure = () => {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-cyan-50">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Zurück zum Hauptmenü
            </Button>
          </Link>
        </header>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-primary">
            Radar-Abenteuer: Das große Flugzeug-Rennen!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Erlebe die spannende Welt der Radartechnologie! Wähle den richtigen Jet
            und nutze verschiedene Materialien, um unsichtbar für das Radar zu werden.
          </p>
        </div>

        <main className="space-y-10">
          <RadarGame />
        </main>

        <footer className="mt-12 text-center text-gray-500 text-sm py-4">
          <p>Ein interaktives Lernspiel über Radar und Materialien für Kinder ab 5 Jahren</p>
        </footer>
      </div>
    </div>
  );
};

export default RadarAdventure;
