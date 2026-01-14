
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
};

export const formatTimeWithMs = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

// Lane 1 = 400m
// Standard lane width is 1.22m
// Stagger formula: 2 * pi * (lane - 1) * 1.22
export const getLaneAdjustmentFactor = (lane: number): number => {
  if (lane === 1) return 1;
  const L1 = 400;
  const laneWidth = 1.22;
  const laneDistance = L1 + 2 * Math.PI * (lane - 1) * laneWidth;
  return laneDistance / L1;
};

export const calculateSplits = (distance: number, speedKmh: number, lane: number, basis: number = 200): any[] => {
  const speedMs = (speedKmh * 1000) / 3600;
  const adjustment = getLaneAdjustmentFactor(lane);

  const splits = [];
  let currentMark = 0;

  // Create split points
  const marks = [];
  for (let m = basis; m < distance; m += basis) {
    marks.push(m);
  }
  marks.push(distance);

  marks.forEach(mark => {
    // Total adjusted distance for this mark
    const adjustedMark = mark * adjustment;
    const runningTime = adjustedMark / speedMs;
    const intervalTime = runningTime - (splits.length > 0 ? splits[splits.length - 1].running : 0);

    splits.push({
      mark,
      interval: intervalTime,
      running: runningTime
    });
  });

  return splits;
};
export const getEffectiveLapDistance = (lane: number): number => {
  return 400 * getLaneAdjustmentFactor(lane);
};
