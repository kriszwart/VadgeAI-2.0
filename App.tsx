import React, { useState } from 'react';
import Header from './components/Header';
import StudioPage from './pages/StudioPage';
import HomePage from './pages/HomePage';

function App() {
  const [page, setPage] = useState<'home' | 'studio'>('home');

  const handleNavigate = (newPage: 'home' | 'studio') => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen font-sans flex flex-col">
      <Header page={page} onNavigate={handleNavigate} />
      {page === 'home' && <HomePage onNavigate={() => handleNavigate('studio')} />}
      {page === 'studio' && <StudioPage />}
      <footer className="text-center p-4 text-xs text-slate-600 border-t border-slate-800 mt-auto">
        Generated with Vadge AI & Google AI. For demonstration purposes only.
      </footer>
    </div>
  );
}

export default App;