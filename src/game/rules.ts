import { Question } from '../types/game';

/**
 * Pure logic rules for MotoGP racing mechanics, gear shifting, telemetry, and scoring.
 * Fully decoupled from Three.js and DOM for fast deterministic testing.
 */

export interface TelemetryData {
  gear: number | 'N';
  rpm: number;
  rpmPercent: number;
  leanAngleDeg: number;
}

/**
 * Calculates current transmission gear based on motorcycle speed in km/h.
 * MotoGP 6-speed seamless gearbox simulation.
 */
export function calculateGear(speedKmH: number): number | 'N' {
  if (speedKmH <= 5) return 'N';
  if (speedKmH < 75) return 1;
  if (speedKmH < 135) return 2;
  if (speedKmH < 195) return 3;
  if (speedKmH < 255) return 4;
  if (speedKmH < 310) return 5;
  return 6;
}

/**
 * Calculates engine RPM and RPM percentage within each gear (typical 9,000 - 18,000 RPM for MotoGP V4).
 */
export function calculateRpm(speedKmH: number, maxSpeedKmH: number = 360): { rpm: number; rpmPercent: number } {
  if (speedKmH <= 5) {
    return { rpm: 4500, rpmPercent: 0.1 }; // Idle rumble
  }

  const gear = calculateGear(speedKmH);
  if (gear === 'N') {
    return { rpm: 4500, rpmPercent: 0.1 };
  }

  // Gear speed intervals
  const gearBands: Record<number, [number, number]> = {
    1: [5, 75],
    2: [75, 135],
    3: [135, 195],
    4: [195, 255],
    5: [255, 310],
    6: [310, maxSpeedKmH],
  };

  const [minSpd, maxSpd] = gearBands[gear] || [310, maxSpeedKmH];
  const progressInGear = Math.min(1, Math.max(0, (speedKmH - minSpd) / (maxSpd - minSpd)));

  // RPM rises from 10,500 to 18,000 in each gear
  const minRpm = 10500;
  const maxRpm = 18000;
  const rpm = Math.round(minRpm + progressInGear * (maxRpm - minRpm));
  const rpmPercent = Math.min(1, Math.max(0, (rpm - 4000) / (maxRpm - 4000)));

  return { rpm, rpmPercent };
}

/**
 * Calculates authentic MotoGP lean angle in degrees (-60° to +60°) from steering angle.
 * Positive steerAngle means turning left (leaning left), negative means right.
 */
export function calculateLeanAngleDeg(steerAngle: number): number {
  // Clamp steerAngle between -0.45 and +0.45
  const clampedSteer = Math.max(-0.5, Math.min(0.5, steerAngle));
  // Scale to realistic maximum MotoGP lean angle (~58-60 degrees)
  const degrees = Math.round(clampedSteer * 125);
  return Math.max(-60, Math.min(60, degrees));
}

/**
 * Calculates score for answering questions in Solo vs Battle mode.
 */
export function calculateAnswerScore(isCorrect: boolean, isSolo: boolean): number {
  if (!isCorrect) return 0;
  return isSolo ? 150 : 100;
}

/**
 * Calculates overall accuracy percentage.
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((correct / total) * 100);
}

/**
 * Shuffles array deterministically or with pseudo-randomness for testing.
 */
export function shuffleOptions<T>(options: T[], rng = Math.random): T[] {
  const result = [...options];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Creates anti-cheat randomized question options while preserving correctness check.
 */
export function randomizeQuestion(q: Question, rng = Math.random): Question {
  return {
    ...q,
    options: shuffleOptions(q.options, rng),
  };
}

/**
 * Calculates dynamic track grip coefficient based on weather.
 * Cerah gives full 1.0 grip, Hujan causes wet slick reduction to 0.78, Kabut 0.90, Mendung 0.95.
 */
export function calculateGripFactor(weather: string): number {
  switch (weather) {
    case 'hujan':
      return 0.78; // Wet asphalt: longer braking distance, reduced traction
    case 'kabut':
      return 0.90; // Damp cool track
    case 'mendung':
      return 0.95;
    case 'cerah':
    default:
      return 1.0;
  }
}

/**
 * Determines whether MotoGP rider's knee slider is dragging on the asphalt and showering titanium sparks.
 * Triggered when motorcycle lean angle >= 42° and bike speed >= 60 km/h.
 */
export function shouldEmitKneeSparks(leanAngleDeg: number, speedKmH: number): boolean {
  return Math.abs(leanAngleDeg) >= 42 && speedKmH >= 60;
}

/**
 * Determines whether rear tire should emit smoke puffs during aggressive acceleration or hard braking.
 */
export function shouldEmitTireSmoke(speedKmH: number, isAccelerating: boolean, isBraking: boolean): boolean {
  if (isBraking && speedKmH > 70) return true;
  if (isAccelerating && speedKmH < 85) return true;
  return false;
}

/**
 * Calculates effective top speed considering aerodynamic wet-drag in rain and dense air in fog.
 */
export function getEffectiveTopSpeed(baseTopSpeed: number, weather: string): number {
  if (weather === 'hujan') {
    return Math.round(baseTopSpeed * 0.94);
  }
  if (weather === 'kabut') {
    return Math.round(baseTopSpeed * 0.97);
  }
  return baseTopSpeed;
}

