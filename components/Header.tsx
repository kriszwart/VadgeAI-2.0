// components/Header.tsx
import React from 'react';
import { useVeoApiKey } from '../hooks/useVeoApiKey';

interface HeaderProps {
    page: 'home' | 'studio';
    onNavigate: (page: 'home' | 'studio') => void;
}

const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0L100 28.8675V86.6025L50 115.47L0 86.6025V28.8675L50 0Z" fill="url(#paint0_linear_1_2)"/>
        <path d="M50 15L85.5 35.5V76.5L50 97L14.5 76.5V35.5L50 15Z" fill="url(#paint1_linear_1_2)"/>
        <path d="M50 25L77.5 41V69L50 85L22.5 69V41L50 25Z" fill="#0D1117"/>
        <path d="M50 28L75 42.5V66.5L50 81L25 66.5V42.5L50 28Z" stroke="url(#paint2_linear_1_2)" strokeWidth="4"/>
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="50" y1="0" x2="50" y2="115.47" gradientUnits="userSpaceOnUse">
                <stop stopColor="#14B8A6"/>
                <stop offset="1" stopColor="#0F766E"/>
            </linearGradient>
            <linearGradient id="paint1_linear_1_2" x1="50" y1="15" x2="50" y2="97" gradientUnits="userSpaceOnUse">
                <stop stopColor="#042f2e"/>
                <stop offset="1" stopColor="#021413"/>
            </linearGradient>
            <linearGradient id="paint2_linear_1_2" x1="50" y1="28" x2="50" y2="81" gradientUnits="userSpaceOnUse">
                 <stop stopColor="#2DD4BF"/>
                <stop offset="1" stopColor="#14B8A6"/>
            </linearGradient>
        </defs>
    </svg>
);


const Header: React.FC<HeaderProps> = ({ page, onNavigate }) => {
    const { isKeySelected, isChecking, selectKey } = useVeoApiKey();

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-800 bg-slate-950/75">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => onNavigate('home')}
                    >
                        <Logo />
                        <span className="text-2xl font-bold tracking-tighter text-white">Vadge AI</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <nav>
                            <ul className="flex items-center gap-2 sm:gap-4">
                                <li>
                                    <button 
                                        onClick={() => onNavigate('home')} 
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${page === 'home' ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Home
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        onClick={() => onNavigate('studio')} 
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${page === 'studio' ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Studio
                                    </button>
                                </li>
                            </ul>
                        </nav>
                         {page === 'studio' && (
                             <button
                                onClick={selectKey}
                                className={`text-xs sm:text-sm px-3 py-2 border rounded-lg transition-colors ${isKeySelected ? 'border-teal-600 text-teal-400' : 'border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white'}`}
                            >
                                {isChecking ? 'Checking Key...' : isKeySelected ? 'API Key Set' : 'Select API Key'}
                            </button>
                         )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;