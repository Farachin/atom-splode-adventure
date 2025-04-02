
import React from 'react';
import Game from '@/components/Game';

const Index = () => {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-primary">
            Atom-Splode Abenteuer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Entdecke die spannende Welt der Kernphysik! 
            Experimentiere mit verschiedenen Elementen und sieh, 
            was passiert, wenn du Neutronen auf Atomkerne schießt.
          </p>
        </header>

        <main>
          <Game />
        </main>

        <footer className="mt-12 text-center text-gray-500 text-sm py-4">
          <p>Ein interaktives Lernspiel über Kernphysik für Kinder ab 5 Jahren</p>
          <p className="mt-2">© {new Date().getFullYear()} - Alle Rechte vorbehalten</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
