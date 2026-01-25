
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
  const lapDistance = getEffectiveLapDistance(lane);

  const splits = [];
  
  // Create split points based on lap fractions (1/4, 1/2, 3/4, 1 lap)
  const lapFractions = [0.25, 0.5, 0.75, 1.0];
  const marks: Array<{ mark: number; label: string }> = [];
  
  let lapNumber = 0;
  
  while (true) {
    for (const fraction of lapFractions) {
      const markDistance = lapNumber * lapDistance + fraction * lapDistance;
      
      if (markDistance > distance) {
        break;
      }
      
      // Determine label
      let label = '';
      if (lapNumber === 0) {
        if (fraction === 0.25) label = '1/4 lap';
        else if (fraction === 0.5) label = '1/2 lap';
        else if (fraction === 0.75) label = '3/4 lap';
        else if (fraction === 1.0) label = '1 lap';
      } else {
        if (fraction === 0.25) label = `${lapNumber + 0.25} lap`;
        else if (fraction === 0.5) label = `${lapNumber + 0.5} lap`;
        else if (fraction === 0.75) label = `${lapNumber + 0.75} lap`;
        else if (fraction === 1.0) label = `${lapNumber + 1} lap`;
      }
      
      marks.push({
        mark: parseFloat(markDistance.toFixed(1)),
        label: label
      });
    }
    
    lapNumber++;
    
    // Check if we've exceeded the distance
    if (lapNumber * lapDistance >= distance) {
      break;
    }
  }
  
  // Always add the finish line if it's not already included
  const lastMark = marks[marks.length - 1];
  if (!lastMark || Math.abs(lastMark.mark - distance) > 0.1) {
    marks.push({
      mark: distance,
      label: 'Finish'
    });
  }

  marks.forEach(({ mark, label }) => {
    // mark is already the adjusted distance based on lane (from lapDistance calculation)
    // So we use it directly without multiplying by adjustment again
    const runningTime = mark / speedMs;
    const intervalTime = runningTime - (splits.length > 0 ? splits[splits.length - 1].running : 0);

    splits.push({
      mark,
      label: label || `${mark}m`,
      interval: intervalTime,
      running: runningTime
    });
  });

  return splits;
};
export const getEffectiveLapDistance = (lane: number): number => {
  return 400 * getLaneAdjustmentFactor(lane);
};
