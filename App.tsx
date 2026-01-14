
import React, { useState, useEffect, useMemo } from 'react';
import { View, RunHistory, Split } from './types';
import { formatTime, formatTimeWithMs, calculateSplits } from './utils';
import CalculatorView from './components/CalculatorView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('calculator');
  const [history, setHistory] = useState<RunHistory[]>([]);
  const [sessionData, setSessionData] = useState<RunHistory | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('runner_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('runner_history', JSON.stringify(history));
  }, [history]);

  const saveRun = (run: Omit<RunHistory, 'id' | 'date'>) => {
    const now = new Date();
    const newRun: RunHistory = {
      ...run,
      id: Date.now().toString(),
      // Using 'en-GB' or user locale to ensure a clean 24h or localized format including exact time
      date: now.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    setHistory(prev => [newRun, ...prev]);
    setCurrentView('history');
  };

  const deleteRuns = (ids: string[]) => {
    setHistory(prev => prev.filter(run => !ids.includes(run.id)));
  };

  const updateRun = (updatedRun: RunHistory) => {
    setHistory(prev => prev.map(run => run.id === updatedRun.id ? updatedRun : run));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('runner_history');
  };

  const loadSession = (run: RunHistory) => {
    setSessionData(run);
    setCurrentView('calculator');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-950 w-full overflow-x-hidden">
      <div className="w-full max-w-[402px] min-h-screen flex flex-col bg-slate-950 relative border-x border-slate-900 shadow-2xl">

        {/* Main Content - Padded for Dynamic Island and Bottom Bar */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-12 pb-32">
          {currentView === 'calculator' && (
            <CalculatorView onSave={saveRun} sessionData={sessionData} onClearSession={() => setSessionData(null)} />
          )}
          {currentView === 'history' && (
            <HistoryView
              history={history}
              onDelete={deleteRuns}
              onUpdate={updateRun}
              onBack={() => setCurrentView('calculator')}
              onLoadSession={loadSession}
            />
          )}
          {currentView === 'settings' && (
            <SettingsView
              onBack={() => setCurrentView('calculator')}
              onClearHistory={clearHistory}
            />
          )}
        </div>

        {/* Navigation Bar - Balanced for Home Indicator */}
        <div className="fixed bottom-0 w-full max-w-[402px] px-6 pb-10 pt-2 pointer-events-none z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl h-20 flex items-center justify-around px-4 pointer-events-auto shadow-2xl">
            <NavItem
              active={currentView === 'calculator'}
              icon="calculate"
              label="Calculator"
              onClick={() => setCurrentView('calculator')}
            />
            <NavItem
              active={currentView === 'history'}
              icon="history"
              label="History"
              onClick={() => setCurrentView('history')}
            />
            <NavItem
              active={currentView === 'settings'}
              icon="settings"
              label="Settings"
              onClick={() => setCurrentView('settings')}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center transition-all duration-300 ${active ? 'text-red-500' : 'text-slate-500'}`}
  >
    <span className={`material-symbols-outlined text-[28px] ${active ? 'fill-1' : ''}`}>{icon}</span>
    <span className={`text-[10px] uppercase tracking-tighter font-black mt-0.5`}>{label}</span>
  </button>
);

export default App;
