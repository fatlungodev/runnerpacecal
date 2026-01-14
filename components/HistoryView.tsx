
import React, { useState } from 'react';
import { RunHistory } from '../types';
import { formatTimeWithMs, formatTime } from '../utils';

interface HistoryViewProps {
  history: RunHistory[];
  onDelete: (ids: string[]) => void;
  onUpdate: (run: RunHistory) => void;
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onDelete, onUpdate, onBack }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredHistory = history.filter(run => 
    run.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    run.distance.toString().includes(searchQuery) ||
    run.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} records?`)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const startEdit = (run: RunHistory) => {
    setEditingId(run.id);
    setEditName(run.name);
  };

  const saveEdit = (run: RunHistory) => {
    onUpdate({ ...run, name: editName });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button onClick={onBack} className="text-white flex size-12 shrink-0 items-center justify-start">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <h2 className="text-white text-lg font-bold leading-tight uppercase tracking-wider flex-1 text-center">History</h2>
          <div className="flex w-12 items-center justify-end">
            <button 
              onClick={() => setSelectedIds([])}
              className="text-red-500 text-sm font-bold uppercase"
            >
              Clear
            </button>
          </div>
        </div>
      </nav>

      <div className="px-4 py-3">
        <label className="flex flex-col w-full h-11">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
            <div className="text-slate-500 flex items-center justify-center pl-4">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 px-4 pl-2 text-base outline-none" 
              placeholder="Search distance, date or time" 
            />
          </div>
        </label>
      </div>

      <main className="flex-1 px-4 space-y-3 pb-48">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <span className="material-symbols-outlined text-4xl block mb-2">history_toggle_off</span>
            No records found
          </div>
        ) : (
          filteredHistory.map(run => (
            <div key={run.id} className="relative flex overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-sm transition-all group">
              <div className="flex items-center justify-center pl-4 pr-1 shrink-0">
                <input 
                  type="checkbox"
                  checked={selectedIds.includes(run.id)}
                  onChange={() => toggleSelect(run.id)}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500" 
                />
              </div>
              
              <div className="flex-1 p-4 pr-12">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 mr-2">
                    {editingId === run.id ? (
                      <input 
                        value={editName}
                        autoFocus
                        onBlur={() => saveEdit(run)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(run)}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-slate-800 text-red-500 text-[10px] font-bold uppercase tracking-widest px-1 rounded border-none outline-none w-full"
                      />
                    ) : (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest truncate">{run.name}</p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[10px] text-slate-500">schedule</span>
                      <p className="text-slate-500 text-[10px] font-normal">{run.date}</p>
                    </div>
                  </div>
                  <div className="bg-red-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                    <p className="text-red-500 text-[10px] font-bold uppercase">Lane {run.lane}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Result Time</span>
                    <p className="text-white text-2xl font-bold leading-tight tracking-tight">
                      {formatTimeWithMs(run.totalTime)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-950/20 flex items-center justify-center rounded-lg border border-red-500/20">
                    <span className="material-symbols-outlined text-red-500">bolt</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/50">
                  <div className="flex flex-col">
                    <p className="text-slate-500 text-[9px] uppercase font-bold">Distance</p>
                    <p className="text-slate-200 text-xs font-bold">{run.distance}m</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-slate-500 text-[9px] uppercase font-bold">Pacing (/km)</p>
                    <p className="text-slate-200 text-xs font-bold">
                      {formatTime(3600 / run.speed)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col border-l border-slate-800/50">
                <button 
                  onClick={() => startEdit(run)}
                  className="flex-1 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors bg-white/5 active:bg-red-500/10"
                >
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <button 
                  onClick={() => onDelete([run.id])}
                  className="flex-1 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors bg-white/10 active:bg-red-500/10"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 z-[60] px-4 pointer-events-none">
          <div className="max-w-[430px] mx-auto pointer-events-auto">
            <button 
              onClick={handleBulkDelete}
              className="w-full flex items-center justify-between px-6 h-14 bg-red-600 text-white rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">delete_sweep</span>
                <span className="font-bold uppercase tracking-wide">Delete Selected</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">{selectedIds.length}</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
