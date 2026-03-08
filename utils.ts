
const normalizeSeconds = (seconds: number): number => {
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, seconds);
};

const normalizeDistance = (distance: number): number => {
  if (!Number.isFinite(distance)) return 0;
  return Math.max(0, distance);
};

const splitToTenths = (seconds: number): { mins: number; secs: string } => {
  const totalTenths = Math.round(normalizeSeconds(seconds) * 10);
  const mins = Math.floor(totalTenths / 600);
  const secsTenths = totalTenths % 600;
  const secs = (secsTenths / 10).toFixed(1).padStart(4, '0');
  return { mins, secs };
};

export const formatTime = (seconds: number): string => {
  const { mins, secs } = splitToTenths(seconds);
  return `${mins.toString().padStart(2, '0')}:${secs}`;
};

export const formatTimeWithMs = (seconds: number): string => {
  const totalHundredths = Math.round(normalizeSeconds(seconds) * 100);
  const mins = Math.floor(totalHundredths / 6000);
  const secs = Math.floor((totalHundredths % 6000) / 100);
  const hundredths = totalHundredths % 100;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
};

// Lane 1 = 400m
// Standard lane width is 1.22m
// Stagger formula: 2 * pi * (lane - 1) * 1.22
export const getLaneAdjustmentFactor = (lane: number): number => {
  const safeLane = Math.max(1, Math.round(Number.isFinite(lane) ? lane : 1));
  if (safeLane === 1) return 1;
  const L1 = 400;
  const laneWidth = 1.22;
  const laneDistance = L1 + 2 * Math.PI * (safeLane - 1) * laneWidth;
  return laneDistance / L1;
};

export const calculateSplits = (distance: number, speedKmh: number, lane: number, basis: number = 200): any[] => {
  const safeDistance = normalizeDistance(distance);
  const safeSpeedKmh = Number.isFinite(speedKmh) ? speedKmh : 0;
  const speedMs = (safeSpeedKmh * 1000) / 3600;
  if (speedMs <= 0 || safeDistance <= 0) return [];

  const lapDistance = getEffectiveLapDistance(lane);
  const roundedDistance = parseFloat(safeDistance.toFixed(1));

  const splits = [];
  
  // Create split points based on lap fractions (1/4, 1/2, 3/4, 1 lap)
  const lapFractions = [0.25, 0.5, 0.75, 1.0];
  const marks: Array<{ mark: number; timingDistance: number; label: string }> = [];
  
  let lapNumber = 0;
  
  while (true) {
    for (const fraction of lapFractions) {
      const markDistance = lapNumber * lapDistance + fraction * lapDistance;
      
      if (markDistance > safeDistance) {
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
        timingDistance: markDistance,
        label: label
      });
    }
    
    lapNumber++;
    
    // Check if we've exceeded the distance
    if (lapNumber * lapDistance >= safeDistance) {
      break;
    }
  }
  
  // Always preserve exact finish timing while preventing duplicate visible marks.
  const lastMark = marks[marks.length - 1];
  if (!lastMark) {
    marks.push({
      mark: roundedDistance,
      timingDistance: safeDistance,
      label: 'Finish'
    });
  } else if (Math.abs(lastMark.timingDistance - safeDistance) > 0.000001) {
    if (Math.abs(lastMark.mark - roundedDistance) < 0.000001) {
      lastMark.timingDistance = safeDistance;
      lastMark.label = 'Finish';
    } else {
      marks.push({
        mark: roundedDistance,
        timingDistance: safeDistance,
        label: 'Finish'
      });
    }
  }

  marks.forEach(({ mark, timingDistance, label }) => {
    const runningTime = timingDistance / speedMs;
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
