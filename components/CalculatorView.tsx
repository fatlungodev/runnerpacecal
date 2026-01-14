
import React, { useState, useMemo, useEffect } from 'react';
import { RunHistory } from '../types';
import { calculateSplits, formatTime, formatTimeWithMs } from '../utils';

interface CalculatorViewProps {
  onSave: (run: Omit<RunHistory, 'id' | 'date'>) => void;
}

const CalculatorView: React.FC<CalculatorViewProps> = ({ onSave }) => {
  const [distance, setDistance] = useState<number>(800);
  const [speed, setSpeed] = useState<number>(15.0); // Internal state kept as km/h
  const [lane, setLane] = useState<number>(1);
  const [basis, setBasis] = useState<number>(100); // Default set to 100m
  const [isDistanceLocked, setIsDistanceLocked] = useState(true);
  
  // Input mode: 'pace' or 'time'
  const [inputMode, setInputMode] = useState<'pace' | 'time'>('pace');
  
  // Pace inputs (min:sec per km)
  const [paceMins, setPaceMins] = useState<string>('4');
  const [paceSecs, setPaceSecs] = useState<string>('00.0');

  // Time inputs (total for distance)
  const [inputMins, setInputMins] = useState<string>('3');
  const [inputSecs, setInputSecs] = useState<string>('12');

  // Logic: Convert Pace/km to Speed (km/h)
  useEffect(() => {
    if (inputMode === 'pace') {
      const totalSecsPerKm = (parseFloat(paceMins || '0') * 60) + parseFloat(paceSecs || '0');
      if (totalSecsPerKm > 0) {
        // speed (km/h) = 3600 / totalSecsPerKm
        const speedKmh = 3600 / totalSecsPerKm;
        setSpeed(parseFloat(speedKmh.toFixed(2)));
      }
    }
  }, [paceMins, paceSecs, inputMode]);

  // Logic: Sync Pace and Time when speed changes
  useEffect(() => {
    const speedMs = (speed * 1000) / 3600;
    if (speedMs > 0) {
      // Update Total Time inputs
      const totalSeconds = distance / speedMs;
      const tMins = Math.floor(totalSeconds / 60);
      const tSecs = (totalSeconds % 60).toFixed(1);
      
      // Update Pace inputs (sec per km)
      // Pace (sec/km) = 3600 / speed(km/h)
      const secsPerKm = 3600 / speed;
      const pMins = Math.floor(secsPerKm / 60);
      const pSecs = (secsPerKm % 60).toFixed(1);

      if (inputMode === 'time') {
        setPaceMins(pMins.toString());
        setPaceSecs(pSecs.padStart(4, '0'));
      } else if (inputMode === 'pace') {
        setInputMins(tMins.toString());
        setInputSecs(tSecs);
      }
    }
  }, [speed, distance, inputMode]);

  // Logic: Sync Speed when Total Time changes
  useEffect(() => {
    if (inputMode === 'time') {
      const totalSeconds = (parseFloat(inputMins || '0') * 60) + parseFloat(inputSecs || '0');
      if (totalSeconds > 0 && distance > 0) {
        const speedMs = distance / totalSeconds;
        const speedKmh = speedMs * 3.6;
        setSpeed(parseFloat(speedKmh.toFixed(2)));
      }
    }
  }, [inputMins, inputSecs, distance, inputMode]);

  const splits = useMemo(() => {
    return calculateSplits(distance, speed, lane, basis);
  }, [distance, speed, lane, basis]);

  const handleSave = () => {
    onSave({
      name: `Session ${distance}m`,
      distance,
      speed,
      lane,
      totalTime: splits[splits.length - 1].running,
      splits
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center bg-slate-950 p-4 pb-2 justify-between sticky top-0 z-20 border-b border-slate-900">
        <div className="text-red-600 flex size-10 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined">directions_run</span>
        </div>
        <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">Refined Runner</h2>
        <div className="size-10 flex items-center justify-center">
          <button className="size-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Distance Input */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-slate-300 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">straighten</span>
              Distance (meters)
            </p>
            <button 
              onClick={() => setIsDistanceLocked(!isDistanceLocked)}
              className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${
                isDistanceLocked ? 'text-red-500 bg-red-500/10' : 'text-slate-400 bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-xs">{isDistanceLocked ? 'lock' : 'lock_open'}</span> 
              {isDistanceLocked ? 'Locked' : 'Unlock'}
            </button>
          </div>
          <input 
            type="number"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            readOnly={isDistanceLocked}
            className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none transition-all"
          />
        </div>

        {/* Input Mode Toggle */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setInputMode('pace')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${inputMode === 'pace' ? 'bg-red-600 text-white' : 'text-slate-50'}`}
          >
            By Pacing (/km)
          </button>
          <button 
            onClick={() => setInputMode('time')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${inputMode === 'time' ? 'bg-red-600 text-white' : 'text-slate-500'}`}
          >
            By Target Time
          </button>
        </div>

        {/* Dynamic Pacing/Time Input */}
        {inputMode === 'pace' ? (
          <div className="relative animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">speed</span>
                Pacing (min:sec/km)
              </p>
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                {speed.toFixed(1)} km/h
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input 
                  type="number"
                  value={paceMins}
                  onChange={(e) => setPaceMins(e.target.value)}
                  className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Min</span>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="number"
                  step="0.1"
                  value={paceSecs}
                  onChange={(e) => setPaceSecs(e.target.value)}
                  className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Sec</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">timer</span>
                Total Time for {distance}m
              </p>
              <div className="text-[10px] font-bold text-red-500 uppercase">
                {speed.toFixed(1)} km/h
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input 
                  type="number"
                  placeholder="Min"
                  value={inputMins}
                  onChange={(e) => setInputMins(e.target.value)}
                  className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Min</span>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Sec"
                  value={inputSecs}
                  onChange={(e) => setInputSecs(e.target.value)}
                  className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Sec</span>
              </div>
            </div>
          </div>
        )}

        {/* Lane Selector */}
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-white text-sm font-bold">Track Lane (1-8)</h3>
            <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded uppercase text-slate-400">Stagger Adjust</span>
          </div>
          <div className="bg-slate-900 p-1.5 rounded-2xl overflow-hidden shadow-inner">
            <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                <button
                  key={l}
                  onClick={() => setLane(l)}
                  className={`flex flex-col items-center justify-center min-w-[52px] h-14 rounded-xl transition-all duration-200 ${
                    lane === l 
                      ? 'bg-white text-red-600 shadow-lg ring-2 ring-white/50' 
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase">L{l}</span>
                  <span className="text-lg font-black">{l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Split Times */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-1 mb-4">
            <h3 className="text-white text-base font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">timer_10_alt_1</span>
              Split Times
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSave}
                className="size-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center active:scale-95 transition-transform" 
                title="Save Result"
              >
                <span className="material-symbols-outlined text-lg">save</span>
              </button>
              <button 
                onClick={() => setBasis(basis === 100 ? 200 : 100)}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
              >
                {basis}m Basis
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm mb-4">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Mark</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Interval</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 text-right">Running</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {splits.map((split, i) => {
                  const isLast = i === splits.length - 1;
                  return (
                    <tr key={split.mark} className={isLast ? 'bg-red-500/5' : ''}>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{split.mark}m</span>
                          {isLast && <span className="text-[9px] uppercase font-bold text-red-500">Finish</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-slate-500 italic">{split.interval.toFixed(2)}s</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-black tabular-nums ${isLast ? 'text-lg text-red-500' : 'text-slate-300'}`}>
                          {formatTimeWithMs(split.running)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 font-medium px-8 leading-relaxed mb-8">
          Calculated for Lane {lane} on a standard 400m track. Pacing is based on time per kilometer.
        </p>
      </div>
    </div>
  );
};

export default CalculatorView;
