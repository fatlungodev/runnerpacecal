
import React, { useState, useMemo, useEffect } from 'react';
import { RunHistory } from '../types';
import { calculateSplits, formatTime, formatTimeWithMs, getEffectiveLapDistance } from '../utils';

interface CalculatorViewProps {
  onSave: (run: Omit<RunHistory, 'id' | 'date'>) => void;
  sessionData: RunHistory | null;
  onClearSession: () => void;
}

const CalculatorView: React.FC<CalculatorViewProps> = ({ onSave, sessionData, onClearSession }) => {
  const [distance, setDistance] = useState<number>(800);
  const [speed, setSpeed] = useState<number>(15.0); // Internal state kept as km/h
  const [lane, setLane] = useState<number>(1);
  const [basis, setBasis] = useState<number>(100); // Default set to 100m


  // Input mode: 'pace' or 'time'
  const [inputMode, setInputMode] = useState<'pace' | 'time'>('pace');

  // Pace inputs (min:sec per km)
  const [paceMins, setPaceMins] = useState<string>('4');
  const [paceSecs, setPaceSecs] = useState<string>('00');

  // Time inputs (total for distance)
  const [inputMins, setInputMins] = useState<string>('3');
  const [inputSecs, setInputSecs] = useState<string>('12');

  // Calculation Basis: 'distance' or 'laps'
  const [calcBasis, setCalcBasis] = useState<'distance' | 'laps'>('distance');
  const [laps, setLaps] = useState<string>('2'); // Using string for better input handling

  // Sync Distance from Laps when in 'laps' mode
  useEffect(() => {
    if (calcBasis === 'laps') {
      const lapCount = parseFloat(laps) || 0;
      if (lapCount > 0) {
        const lapDist = getEffectiveLapDistance(lane);
        const newDist = lapCount * lapDist;
        setDistance(parseFloat(newDist.toFixed(1)));
      }
    }
  }, [laps, lane, calcBasis]);

  // Load session data when provided
  useEffect(() => {
    if (sessionData) {
      setDistance(sessionData.distance);
      setSpeed(sessionData.speed);
      setLane(sessionData.lane);

      // Calculate pace from speed
      const secsPerKm = 3600 / sessionData.speed;
      const pMins = Math.floor(secsPerKm / 60);
      const pSecs = (secsPerKm % 60).toFixed(1);
      setPaceMins(pMins.toString());
      setPaceSecs(pSecs);

      // Calculate total time
      const speedMs = (sessionData.speed * 1000) / 3600;
      const totalSeconds = sessionData.distance / speedMs;
      const tMins = Math.floor(totalSeconds / 60);
      const tSecs = (totalSeconds % 60).toFixed(1);
      setInputMins(tMins.toString());
      setInputSecs(tSecs);

      // Clear the session data after loading
      onClearSession();
    }
  }, [sessionData, onClearSession]);

  // Logic: Convert Pace/km to Speed (km/h)
  useEffect(() => {
    if (inputMode === 'pace') {
      const pm = parseFloat(paceMins) || 0;
      const ps = parseFloat(paceSecs) || 0;
      const totalSecsPerKm = (pm * 60) + ps;

      if (totalSecsPerKm > 0) {
        const speedKmh = 3600 / totalSecsPerKm;
        // Only update if significantly different to avoid loops
        if (Math.abs(speed - speedKmh) > 0.001) {
          setSpeed(parseFloat(speedKmh.toFixed(3)));
        }
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
      const secsPerKm = 3600 / speed;
      const pMins = Math.floor(secsPerKm / 60);
      const pSecs = (secsPerKm % 60).toFixed(1);

      if (inputMode === 'time') {
        const currentPaceTotal = (parseFloat(paceMins) * 60) + parseFloat(paceSecs);
        if (Math.abs(currentPaceTotal - secsPerKm) > 0.1) {
          setPaceMins(pMins.toString());
          setPaceSecs(pSecs);
        }
      } else if (inputMode === 'pace') {
        const currentTimeTotal = (parseFloat(inputMins) * 60) + parseFloat(inputSecs);
        if (Math.abs(currentTimeTotal - totalSeconds) > 0.1) {
          setInputMins(tMins.toString());
          setInputSecs(tSecs);
        }
      }
    }
  }, [speed, distance, inputMode]);

  // Logic: Sync Speed when Total Time changes
  useEffect(() => {
    if (inputMode === 'time') {
      const im = parseFloat(inputMins) || 0;
      const is = parseFloat(inputSecs) || 0;
      const totalSeconds = (im * 60) + is;

      if (totalSeconds > 0 && distance > 0) {
        const speedMs = distance / totalSeconds;
        const speedKmh = speedMs * 3.6;
        if (Math.abs(speed - speedKmh) > 0.001) {
          setSpeed(parseFloat(speedKmh.toFixed(3)));
        }
      }
    }
  }, [inputMins, inputSecs, distance, inputMode]);

  const splits = useMemo(() => {
    return calculateSplits(distance, speed, lane, basis);
  }, [distance, speed, lane, basis]);

  const buildShareText = () => {
    if (!splits.length) return 'No pacing data calculated.';

    const lastSplit = splits[splits.length - 1];
    const totalTime = formatTimeWithMs(lastSplit.running);

    const pacePerKmSeconds = 3600 / speed;
    const paceMinutes = Math.floor(pacePerKmSeconds / 60);
    const paceSeconds = (pacePerKmSeconds % 60).toFixed(1);
    const paceText = `${paceMinutes}:${parseFloat(paceSeconds) < 10 ? '0' : ''}${paceSeconds} /km`;

    const header = [
      'Track Pacing Result',
      `Distance: ${distance.toFixed(1)}m`,
      `Lane: ${lane}`,
      `Total Time: ${totalTime}`,
      `Pacing: ${paceText}`,
      '',
      'Splits:'
    ].join('\n');

    const splitsText = splits
      .map((s, index) => {
        const mark = `${s.mark}m`;
        const interval = `${s.interval.toFixed(2)}s`;
        const running = formatTimeWithMs(s.running);
        const finishFlag = index === splits.length - 1 ? ' (Finish)' : '';
        return `${mark}: interval ${interval}, running ${running}${finishFlag}`;
      })
      .join('\n');

    return `${header}\n${splitsText}`;
  };

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
      <div className="flex items-center bg-slate-950 p-4 pb-2 justify-between sticky top-0 z-20 border-b border-slate-900 safe-top">
        <div className="text-red-600 flex size-10 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined">directions_run</span>
        </div>
        <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">Track Pacing</h2>
        <div className="size-10 flex items-center justify-center">
          <button className="size-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basis Toggle */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCalcBasis('distance')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${calcBasis === 'distance' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
          >
            Distance Base
          </button>
          <button
            onClick={() => setCalcBasis('laps')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${calcBasis === 'laps' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
          >
            Lap Base
          </button>
        </div>

        {/* Distance / Laps Input */}
        {calcBasis === 'distance' ? (
          <div className="relative animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">straighten</span>
                Distance (meters)
              </p>

            </div>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}

              onFocus={(e) => e.target.select()}
              className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none transition-all"
            />
          </div>
        ) : (
          <div className="relative animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">repeat</span>
                Number of Laps
              </p>
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                Total: {distance.toFixed(1)}m
              </div>
            </div>
            <input
              type="number"
              value={laps}
              onChange={(e) => setLaps(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none transition-all"
            />
          </div>
        )}

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
              <div className="flex flex-col items-end">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {speed.toFixed(1)} km/h
                </div>
                <div className="text-[10px] font-bold text-red-500 uppercase">
                  {inputMins}:{parseFloat(inputSecs) < 10 ? '0' : ''}{parseFloat(inputSecs || '0').toFixed(1)} Total
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={paceMins}
                  onChange={(e) => setPaceMins(e.target.value)}
                  onFocus={(e) => e.target.select()}
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
                  onFocus={(e) => e.target.select()}
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
              <div className="flex flex-col items-end">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {speed.toFixed(1)} km/h
                </div>
                <div className="text-[10px] font-bold text-red-500 uppercase">
                  {paceMins}:{parseFloat(paceSecs) < 10 ? '0' : ''}{parseFloat(paceSecs || '0').toFixed(1)} /km
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="Min"
                  value={inputMins}
                  onChange={(e) => setInputMins(e.target.value)}
                  onFocus={(e) => e.target.select()}
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
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-2xl text-white focus:ring-2 focus:ring-red-500 border-slate-800 bg-slate-900 h-16 px-4 text-xl font-bold tabular-nums outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Sec</span>
              </div>
            </div>
          </div>
        )}

        {/* Lane Selector - Only visible in Laps mode */}
        {calcBasis === 'laps' && (
          <div className="px-1 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-[11px] font-bold uppercase tracking-widest opacity-50">Track Lane</h3>
              <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                {getEffectiveLapDistance(lane).toFixed(1)}m Lap
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                <button
                  key={l}
                  onClick={() => setLane(l)}
                  className={`relative flex items-center justify-center size-9 rounded-xl transition-all duration-300 group ${lane === l
                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] scale-110 z-10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                >
                  <span className="text-sm font-black italic">{l}</span>
                  {lane === l && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 bg-white rounded-full shadow-[0_0_5px_white]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Split Times */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-1 mb-4">
            <h3 className="text-white text-base font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">timer_10_alt_1</span>
              Split Times
            </h3>
            <div className="flex items-center gap-2">
              <SaveButton onSave={handleSave} />
              <CopyButton getText={buildShareText} />
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


interface SaveButtonProps {
  onSave: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onSave }) => {
  const [saved, setSaved] = useState(false);

  const handleClick = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={`size-8 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 ${saved ? 'bg-emerald-500 text-white' : 'bg-red-500/10 text-red-500'
        }`}
      title="Save Result"
    >
      <span className="material-symbols-outlined text-lg">
        {saved ? 'check' : 'save'}
      </span>
    </button>
  );
};

interface CopyButtonProps {
  getText: () => string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ getText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = getText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
      alert('Copy failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`size-8 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 ${copied ? 'bg-emerald-500 text-white' : 'bg-red-500/10 text-red-500'
        }`}
      title="Copy to clipboard"
    >
      <span className="material-symbols-outlined text-lg">
        {copied ? 'check' : 'content_copy'}
      </span>
    </button>
  );
};

export default CalculatorView;
