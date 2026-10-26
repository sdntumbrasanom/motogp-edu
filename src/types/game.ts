export interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  options: string[]; // 4 options (including correct answer, shuffled for display)
}

export type CarModelType =
  | 'ducati'
  | 'yamaha'
  | 'honda'
  | 'aprilia'
  | 'ktm'
  | 'apex_gp'
  // Legacy aliases for backward-compatibility
  | 'f1'
  | 'gt'
  | 'cyber'
  | 'muscle'
  | 'rally'
  | 'prototype';

export interface CarSpecs {
  type: CarModelType;
  name: string;
  subtitle: string;
  topSpeed: number; // in km/h
  acceleration: number; // 1-10
  handling: number; // 1-10
  nitroBoost: number; // multiplier
  primaryColor: string;
  accentColor: string;
}

export interface PlayerCarConfig {
  type: CarModelType;
  name: string;
  primaryColor: string;
  accentColor: string;
}

export interface PlayerState {
  id: string;
  name: string;
  car: PlayerCarConfig;
  lives: number;
  maxLives: number;
  score: number;
  distance: number;
  speed: number; // km/h
  nitro: number; // 0 to 100
  isNitroActive: boolean;
  isInvulnerable: boolean; // after hit
  invulnerableTimer: number;
  questionsAnswered: number;
  correctAnswers: number;
  isGameOver: boolean;
  position: { x: number; y: number; z: number };
  steerAngle: number;
  leanAngleDeg?: number;
  gear?: number | 'N';
  rpmPercent?: number;
  isOffTrack?: boolean;
  rank?: number;
}

export type GameMode = 'solo' | 'battle';
export type WeatherType = 'cerah' | 'mendung' | 'hujan' | 'kabut';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type CircuitId = 'mandalika' | 'mugello' | 'motegi' | 'silverstone';

export interface CircuitSpecs {
  id: CircuitId;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  lengthMeters: number;
  description: string;
  turnHighlight: string;
  curbStyle: 'mandalika_batik' | 'mugello_tricolore' | 'motegi_standard' | 'silverstone_national';
  defaultWeather: WeatherType;
  accentColor: string;
  skyColor: number;
  fogColor: number;
}

export interface TeacherRoom {
  token: string;
  title: string;
  teacherName: string;
  teacherPhone?: string;
  spreadsheetUrl: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  token: string;
  mode: GameMode;
  score: number;
  maxSpeedKmH: number;
  accuracy: number;
  timeSec: number;
  carModel: string;
  carColor: string;
  date: string;
}

export interface GameControls {
  steerLeft: boolean;
  steerRight: boolean;
  accelerate: boolean;
  brake: boolean;
  nitro: boolean;
}
