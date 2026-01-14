
import React from 'react';

interface SettingsViewProps {
    onBack: () => void;
    onClearHistory: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onClearHistory }) => {
    return (
        <div className="flex flex-col h-full bg-slate-950">
            <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 pt-8">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <button onClick={onBack} className="text-white flex size-12 shrink-0 items-center justify-start">
                        <span className="material-symbols-outlined">arrow_back_ios</span>
                    </button>
                    <h2 className="text-white text-lg font-bold leading-tight uppercase tracking-wider flex-1 text-center">Settings</h2>
                    <div className="size-12"></div>
                </div>
            </nav>

            <div className="p-6">
                <div className="w-full space-y-4">
                    <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2">Calculator Defaults</h4>

                    <div className="bg-slate-900 rounded-2xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400">straighten</span>
                                <span className="text-white text-sm">Lane Width (m)</span>
                            </div>
                            <span className="text-slate-500 text-sm font-bold">1.22</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400">timer</span>
                                <span className="text-white text-sm">Default Basis (m)</span>
                            </div>
                            <span className="text-slate-500 text-sm font-bold">100</span>
                        </div>
                    </div>

                    <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 pt-4">Data Management</h4>

                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                                    onClearHistory();
                                    alert('History cleared');
                                }
                            }}
                            className="w-full p-4 flex items-center gap-3 text-red-500 hover:bg-red-500/5 transition-colors"
                        >
                            <span className="material-symbols-outlined">delete_forever</span>
                            <span className="text-sm font-bold">Clear All History</span>
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mb-1">Refined Runner v1.0.0</p>
                        <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mb-4">Author: Alan Leung 🇭🇰</p>
                        <p className="text-slate-700 text-[9px] px-10 leading-relaxed">
                            Designed for performance-focused athletes and coaches who demand precision on the track.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
