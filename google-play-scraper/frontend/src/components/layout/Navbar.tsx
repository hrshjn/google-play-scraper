import React from 'react';
import { BarChart2 } from 'lucide-react';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-indigo-500" />
              <span className="text-lg font-bold text-gray-900">AppIntel</span>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#pricing" className="text-sm text-gray-700 hover:text-indigo-500 transition-colors">
              Pricing
            </a>
            <a href="#examples" className="text-sm text-gray-700 hover:text-indigo-500 transition-colors">
              Examples
            </a>
            <Button variant="ghost" size="sm" className="ml-2">
              Log in
            </Button>
          </nav>
          
          <div className="md:hidden">
            <Button variant="ghost" size="sm" aria-label="Menu">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;