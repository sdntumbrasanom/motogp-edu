import React from 'react';
import { PlayerState, GameControls, CircuitId, WeatherType } from '../types/game';
import { getCircuitById } from '../game/circuitData';
import { Heart, Trophy, Flag, Volume2, VolumeX } from 'lucide-react';

interface RacingHudProps {
  playerState: PlayerState;
  playerId: 'p1' | 'p2';
  isBattleMode: boolean;
  onControlChange: (key: keyof GameControls, active: boolean) => void;
  controls: GameControls;
  onToggleMute?: () => void;
  isMuted?: boolean;
  circuitId?: CircuitId;
  weather?: WeatherType;
  targetDistanceMeters?: number;
  totalQuestions?: number;
}

export const RacingHud: React.FC<RacingHudProps> = ({
  playerState,
  playerId,
  isBattleMode,
  onControlChange,
  controls,
  onToggleMute,
  isMuted,
  circuitId = 'mandalika',
  weather = 'cerah',
  targetDistanceMeters = 3000,
  totalQuestions = 4,
}) => {
  const isP1 = playerId === 'p1';

  // In Battle mode, split horizontally: P1 on LEFT half, P2 on RIGHT half
  const battlePositionClass = isBattleMode
    ? isP1
      ? 'w-1/2 left-0 right-auto top-0 bottom-0'
      : 'w-1/2 left-1/2 right-0 top-0 bottom-0'
    : 'inset-0';

  const rpmPercent = playerState.rpmPercent ?? 0.1;
  const gear = playerState.gear ?? (playerState.speed > 5 ? 1 : 'N');
  const leanDeg = playerState.leanAngleDeg ?? 0;
  const isLeaningLeft = controls.steerLeft;
  const isLeaningRight = controls.steerRight;

  // Number of active RPM LEDs (out of 10)
  const activeLeds = Math.min(10, Math.floor(rpmPercent * 10));

  return (
    <div className={`pointer-events-none absolute flex flex-col justify-between p-2.5 sm:p-4 select-none ${battlePositionClass}`}>
      {/* Top Status Bar with clearance for center dock */}
      <div className={`flex items-center justify-between w-full gap-2 ${isBattleMode && !isP1 ? 'pl-20 sm:pl-28' : isBattleMode && isP1 ? 'pr-20 sm:pr-28' : ''}`}>
        {/* Player Badge & Lives */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`pointer-events-auto px-2.5 py-1 rounded-lg border shadow-lg flex items-center gap-2 ${
            isP1 ? 'bg-slate-900/90 border-cyan-500/70 shadow-cyan-950/50' : 'bg-slate-900/90 border-amber-500/70 shadow-amber-950/50'
          }`}>
            <div
              className="w-3 h-3 rounded-full border border-white/60 shadow shrink-0"
              style={{ backgroundColor: playerState.car.primaryColor }}
            />
            <div className="flex flex-col">
              <span className={`text-[10px] font-black tracking-wider uppercase ${isP1 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {isBattleMode ? (isP1 ? '🏍️ P1 (Kiri)' : 'P2 (Kanan) 🏍️') : '🏍️ Rider MotoGP'}
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                {playerState.name || 'Rider'}
              </span>
            </div>
          </div>

          {/* Lives (Nyawa) */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
            <span className="text-[9px] uppercase font-bold text-slate-400 hidden sm:inline">Nyawa:</span>
            {Array.from({ length: playerState.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                  i < playerState.lives
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)] scale-100'
                    : 'text-slate-600 scale-90 opacity-40'
                }`}
              />
            ))}
          </div>

          {/* Solo Target Missions Indicator */}
          {!isBattleMode && (
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-indigo-500/50 px-2.5 py-1 rounded-lg shadow-lg text-[11px]">
              <div className="flex items-center gap-1 text-cyan-300">
                <Flag className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono font-bold">{(playerState.distance / 1000).toFixed(1)} / {(targetDistanceMeters / 1000).toFixed(1)} KM</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-emerald-300">
                <span className="font-mono font-bold">Soal: {playerState.questionsAnswered} / {totalQuestions}</span>
              </div>
            </div>
          )}

          {/* MotoGP Circuit & Weather Broadcast Telemetry Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg">
            <span>{getCircuitById(circuitId).flag}</span>
            <span className="text-slate-200">{getCircuitById(circuitId).name.split(' ')[0]} GP</span>
            <span className="text-slate-600">·</span>
            <span className={weather === 'hujan' ? 'text-sky-400 font-black animate-pulse' : weather === 'kabut' ? 'text-indigo-300' : 'text-amber-300'}>
              {weather === 'hujan' ? '🌧️ WET (78% Grip)' : weather === 'kabut' ? '🌫️ MIST (90% Grip)' : weather === 'mendung' ? '⛅ MENDUNG' : '☀️ CERAH'}
            </span>
          </div>
        </div>

        {/* Score & Sound Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Score */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold text-slate-400">Poin</span>
              <span className="text-xs sm:text-sm font-black font-mono tracking-tight text-white tabular-nums">
                {playerState.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Sound Toggle (only shown on P1) */}
          {isP1 && onToggleMute && !isBattleMode && (
            <button
              onClick={onToggleMute}
              className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
              title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Simplified Reflex Controls: Left (◄ KIRI) and Right (► KANAN), MotoGP Auto-Accelerates */}
      <div className="flex items-end justify-between w-full px-1 pb-1">
        {/* Left Side: Steering Left Touch Button */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('steerLeft', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('steerLeft', false); }}
            onMouseDown={() => onControlChange('steerLeft', true)}
            onMouseUp={() => onControlChange('steerLeft', false)}
            onMouseLeave={() => onControlChange('steerLeft', false)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black border-2 transition-all active:scale-95 shadow-2xl select-none cursor-pointer ${
              controls.steerLeft
                ? isP1
                  ? 'bg-cyan-500 text-slate-950 border-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.9)] scale-95'
                  : 'bg-amber-500 text-slate-950 border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.9)] scale-95'
                : 'bg-slate-900/95 text-cyan-400 border-cyan-500/50 hover:bg-slate-800/95 hover:border-cyan-400'
            }`}
          >
            <span className="text-2xl sm:text-3xl leading-none">◄</span>
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase mt-0.5">KIRI</span>
          </button>
        </div>

        {/* Center: Authentic MotoGP Telemetry Dashboard (RPM Shift Light, Gear, Speed & Real-time Lean Angle) */}
        <div className="flex flex-col items-center pb-0.5">
          <div
            className={`px-3.5 sm:px-5 py-2 rounded-2xl shadow-2xl flex flex-col items-center backdrop-blur-md transition-all duration-300 border-2 ${
              playerState.isOffTrack
                ? 'bg-rose-950/95 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-slate-900/95 border-slate-700/85'
            }`}
          >
            {/* 1. MotoGP Shift Light LED Bar (10 LEDs: Green -> Yellow -> Red Flashing) */}
            <div className="flex items-center gap-1 mb-1.5 w-full justify-center">
              {Array.from({ length: 10 }).map((_, i) => {
                const isActive = i < activeLeds;
                let colorClass = 'bg-slate-700/60 opacity-30';
                if (isActive) {
                  if (i < 4) {
                    colorClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
                  } else if (i < 7) {
                    colorClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
                  } else {
                    colorClass = 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.95)]';
                  }
                }
                return (
                  <div
                    key={i}
                    className={`h-1.5 w-2 sm:w-2.5 rounded-xs transition-all duration-100 ${colorClass}`}
                  />
                );
              })}
            </div>

            {/* 2. Speed and Gear Readout */}
            <div className="flex items-baseline gap-2">
              {/* Gear Badge */}
              <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono font-black text-xs text-amber-400 shadow-inner">
                G{gear}
              </div>

              {/* Speedometer */}
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] ${
                    playerState.isOffTrack ? 'text-rose-200' : 'text-white'
                  }`}
                >
                  {playerState.speed}
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${
                    playerState.isOffTrack ? 'text-rose-400' : 'text-cyan-400'
                  }`}
                >
                  KM/H
                </span>
              </div>

              {/* 3. Real-time MotoGP Lean Angle Badge */}
              <div
                className={`px-2 py-0.5 rounded border text-[10px] font-mono font-black tracking-tight flex items-center gap-0.5 ${
                  leanDeg > 35
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                    : leanDeg > 15
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
                title="Sudut Kemiringan Motor (Lean Angle)"
              >
                <span>{leanDeg}°</span>
                <span className="text-[9px]">
                  {isLeaningLeft ? '◄L' : isLeaningRight ? 'R►' : '—'}
                </span>
              </div>
            </div>

            {/* Status notification */}
            {playerState.isOffTrack ? (
              <div className="mt-1 flex items-center gap-1.5 text-[9px] font-black text-amber-300 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>⚠️ Keluar Sirkuit (Melambat)</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Auto-Gas • 18,000 RPM V4</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Steering Right Touch Button */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={(e) => { e.preventDefault(); onControlChange('steerRight', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onControlChange('steerRight', false); }}
            onMouseDown={() => onControlChange('steerRight', true)}
            onMouseUp={() => onControlChange('steerRight', false)}
            onMouseLeave={() => onControlChange('steerRight', false)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black border-2 transition-all active:scale-95 shadow-2xl select-none cursor-pointer ${
              controls.steerRight
                ? isP1
                  ? 'bg-cyan-500 text-slate-950 border-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.9)] scale-95'
                  : 'bg-amber-500 text-slate-950 border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.9)] scale-95'
                : 'bg-slate-900/95 text-cyan-400 border-cyan-500/50 hover:bg-slate-800/95 hover:border-cyan-400'
            }`}
          >
            <span className="text-2xl sm:text-3xl leading-none">►</span>
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase mt-0.5">KANAN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
