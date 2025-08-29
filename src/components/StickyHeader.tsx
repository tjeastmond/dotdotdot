'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'backdrop-blur-header shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">•••</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                DotDotDot
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors duration-200">
                Features
              </a>
              <a href="#about" className="text-foreground/80 hover:text-foreground transition-colors duration-200">
                About
              </a>
              <a href="#contact" className="text-foreground/80 hover:text-foreground transition-colors duration-200">
                Contact
              </a>
            </nav>

            {/* Right side - Theme toggle and CTA */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button className="hidden md:inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
