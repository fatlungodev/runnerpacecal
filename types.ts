
export interface Split {
  mark: number;
  interval: number;
  running: number;
}

export interface RunHistory {
  id: string;
  name: string;
  date: string;
  distance: number;
  speed: number;
  lane: number;
  totalTime: number;
  splits: Split[];
}

export type View = 'calculator' | 'history' | 'stats' | 'profile';
