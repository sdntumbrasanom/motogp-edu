import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameMode, PlayerState, GameControls, WeatherType, GameDifficulty, CircuitId } from '../types/game';
import { buildProceduralCar, ProceduralCarResult } from './carModels';
import { buildRaceCircuit, TrackData, BonusOrb } from './trackEnvironment';
import { NitroParticleTrail } from './nitroParticles';
import { sound } from '../services/soundService';
import {
  calculateGear,
  calculateRpm,
  calculateLeanAngleDeg,
  calculateGripFactor,
  shouldEmitKneeSparks,
  shouldEmitTireSmoke,
} from './rules';
import {
  KneeSparksSystem,
  TireSpraySystem,
  CollisionSparksSystem,
  RainAtmosphereSystem,
} from './motogpParticles';

interface RacingCanvasProps {
  mode: GameMode;
  p1State: PlayerState;
  p2State?: PlayerState;
  onUpdateP1: (updater: (prev: PlayerState) => PlayerState) => void;
  onUpdateP2?: (updater: (prev: PlayerState) => PlayerState) => void;
  onTriggerQuestion: (playerId: 'p1' | 'p2', orbIndex: number) => void;
  onGameOver: (winnerId?: string) => void;
  p1Controls: GameControls;
  p2Controls?: GameControls;
  isPaused: boolean;
  isCountdown?: boolean;
  isP1Answering?: boolean;
  isP2Answering?: boolean;
  weather?: WeatherType;
  difficulty?: GameDifficulty;
  circuitId?: CircuitId;
  targetDistanceMeters?: number;
  totalQuestions?: number;
}

export const RacingCanvas: React.FC<RacingCanvasProps> = ({
  mode,
  p1State,
  p2State,
  onUpdateP1,
  onUpdateP2,
  onTriggerQuestion,
  onGameOver,
  p1Controls,
  p2Controls,
  isPaused,
  isCountdown = false,
  isP1Answering = false,
  isP2Answering = false,
  weather = 'cerah',
  difficulty = 'medium',
  circuitId = 'mandalika',
  targetDistanceMeters = 3000,
  totalQuestions = 4,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const controlsRef = useRef({ p1: p1Controls, p2: p2Controls });
  controlsRef.current = { p1: p1Controls, p2: p2Controls };

  const p1QuestionsAnsweredRef = useRef(p1State.questionsAnswered);
  p1QuestionsAnsweredRef.current = p1State.questionsAnswered;

  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;

  const isCountdownRef = useRef(isCountdown);
  isCountdownRef.current = isCountdown;

  const answeringRef = useRef({ p1: isP1Answering, p2: isP2Answering });
  answeringRef.current = { p1: isP1Answering, p2: isP2Answering };

  const callbacksRef = useRef({ onUpdateP1, onUpdateP2, onTriggerQuestion, onGameOver });
  callbacksRef.current = { onUpdateP1, onUpdateP2, onTriggerQuestion, onGameOver };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Dynamic Weather Lighting & Fog ---
    let skyColor = 0x38bdf8;
    let fogColor = 0xbae6fd;
    let fogDensity = 0.0012;
    let sunIntensity = 2.5;
    let hemiIntensity = 1.6;

    if (weather === 'mendung') {
      skyColor = 0x475569;
      fogColor = 0x64748b;
      fogDensity = 0.0022;
      sunIntensity = 1.3;
      hemiIntensity = 1.1;
    } else if (weather === 'hujan') {
      skyColor = 0x1e293b;
      fogColor = 0x334155;
      fogDensity = 0.0035;
      sunIntensity = 0.95;
      hemiIntensity = 0.9;
    } else if (weather === 'kabut') {
      skyColor = 0x475569;
      fogColor = 0x64748b;
      fogDensity = 0.0068;
      sunIntensity = 0.85;
      hemiIntensity = 1.0;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = weather === 'cerah' ? 1.25 : 1.05;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    const isSoftware = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu) || isHeadless;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Lighting adjusted for weather
    const hemiLight = new THREE.HemisphereLight(
      weather === 'cerah' ? 0x60a5fa : 0x64748b,
      weather === 'cerah' ? 0x15803d : 0x1e293b,
      hemiIntensity
    );
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      weather === 'cerah' ? 0xfffbeb : 0x94a3b8,
      sunIntensity
    );
    sunLight.position.set(60, 110, 80);
    sunLight.castShadow = !isHeadless;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Build the expansive circuit tailored to selected MotoGP venue
    const trackData: TrackData = buildRaceCircuit(
      scene,
      10000,
      weather,
      targetDistanceMeters,
      difficulty,
      circuitId
    );

    // Cameras
    const aspect = container.clientWidth / container.clientHeight;
    const camera1 = new THREE.PerspectiveCamera(65, aspect, 0.5, 750);
    const camera2 = new THREE.PerspectiveCamera(65, aspect, 0.5, 750);

    // Build Player 1 3D MotoGP Motorcycle scaled up to 1.3x for heroic presence
    const p1CarResult: ProceduralCarResult = buildProceduralCar(
      p1State.car.type,
      p1State.car.primaryColor,
      p1State.car.accentColor
    );
    p1CarResult.root.scale.set(1.3, 1.3, 1.3);
    scene.add(p1CarResult.root);

    // Dynamic Nitro Flame and Particle Trail Emitter for Player 1
    const p1NitroTrail = new NitroParticleTrail(
      scene,
      p1State.car.type === 'cyber' ? 'plasma' : 'fire'
    );

    // Dedicated MotoGP Particle Systems
    const p1KneeSparks = new KneeSparksSystem(scene);
    const p1TireSpray = new TireSpraySystem(scene);
    const collisionSparks = new CollisionSparksSystem(scene);

    let rainSystem: RainAtmosphereSystem | null = null;
    if (weather === 'hujan') {
      rainSystem = new RainAtmosphereSystem(scene);
    }

    // Build Player 2 3D Motorcycle & Particle Emitters (if battle mode)
    let p2CarResult: ProceduralCarResult | null = null;
    let p2NitroTrail: NitroParticleTrail | null = null;
    let p2KneeSparks: KneeSparksSystem | null = null;
    let p2TireSpray: TireSpraySystem | null = null;

    if (mode === 'battle' && p2State) {
      p2CarResult = buildProceduralCar(
        p2State.car.type,
        p2State.car.primaryColor,
        p2State.car.accentColor
      );
      p2CarResult.root.scale.set(1.3, 1.3, 1.3);
      scene.add(p2CarResult.root);
      p2NitroTrail = new NitroParticleTrail(
        scene,
        p2State.car.type === 'cyber' ? 'plasma' : 'fire'
      );
      p2KneeSparks = new KneeSparksSystem(scene);
      p2TireSpray = new TireSpraySystem(scene);
    }

    // Starting positions: In world coordinates, +X is left on screen, -X is right on screen
    const p1Sim = {
      x: trackData.getTrackXAtZ(0) + (mode === 'battle' ? 2.8 : 0), // P1 starts on left lane
      z: 0,
      speed: 0,
      steerAngle: 0,
      lives: p1State.lives,
      score: p1State.score,
      nitro: p1State.nitro,
      isNitro: false,
      invulnerableTimer: 0,
      shake: 0,
      distance: 0,
      isGameOver: false,
    };

    const p2Sim = {
      x: trackData.getTrackXAtZ(0) - (mode === 'battle' ? 2.8 : 0), // P2 starts on right lane
      z: 0,
      speed: 0,
      steerAngle: 0,
      lives: p2State ? p2State.lives : 3,
      score: p2State ? p2State.score : 0,
      nitro: p2State ? p2State.nitro : 100,
      isNitro: false,
      invulnerableTimer: 0,
      shake: 0,
      distance: 0,
      isGameOver: false,
    };

    const _camTarget = new THREE.Vector3();

    sound.startEngine();

    const clock = new THREE.Clock();
    let animFrameId: number;
    let lastFrameTime = performance.now();

    const checkCapture = () => {
      if ((window as any).__captureNextFrame) {
        try {
          (window as any).__capturedFrame = renderer.domElement.toDataURL('image/png');
        } catch {
          // ignore
        }
        (window as any).__captureNextFrame = false;
      }
    };

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      if (isSoftware) {
        const now = performance.now();
        if (now - lastFrameTime < 30) return;
        lastFrameTime = now;
      }

      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      if (pausedRef.current) {
        sound.updateEnginePitch(0, false);
        return;
      }

      // --- COUNTDOWN FREEZE: 3, 2, 1, GO! ---
      if (isCountdownRef.current) {
        sound.updateEnginePitch(0.08, false);

        // Keep cars poised at starting line with subtle idling vibration
        const idleVibe = Math.sin(clock.getElapsedTime() * 30) * 0.01;
        p1CarResult.root.position.set(p1Sim.x, idleVibe, 0);
        p1CarResult.root.rotation.set(0, 0, 0);
        camera1.position.set(p1Sim.x, 2.5, -6.8);
        _camTarget.set(p1Sim.x, 1.2, 10);
        camera1.lookAt(_camTarget);
        camera1.fov = 65;
        camera1.updateProjectionMatrix();

        if (mode === 'battle' && p2CarResult) {
          p2CarResult.root.position.set(p2Sim.x, idleVibe, 0);
          p2CarResult.root.rotation.set(0, 0, 0);
          camera2.position.set(p2Sim.x, 2.5, -6.8);
          _camTarget.set(p2Sim.x, 1.2, 10);
          camera2.lookAt(_camTarget);
          camera2.fov = 65;
          camera2.updateProjectionMatrix();
        }

        // Render starting grid viewports
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (mode === 'battle') {
          const halfW = Math.floor(w / 2);
          renderer.setScissorTest(true);
          camera1.aspect = halfW / h;
          camera1.updateProjectionMatrix();
          renderer.setViewport(0, 0, halfW, h);
          renderer.setScissor(0, 0, halfW, h);
          renderer.render(scene, camera1);

          camera2.aspect = halfW / h;
          camera2.updateProjectionMatrix();
          renderer.setViewport(halfW, 0, halfW, h);
          renderer.setScissor(halfW, 0, halfW, h);
          renderer.render(scene, camera2);
        } else {
          renderer.setScissorTest(false);
          camera1.aspect = w / h;
          camera1.updateProjectionMatrix();
          renderer.setViewport(0, 0, w, h);
          renderer.render(scene, camera1);
        }
        checkCapture();
        return;
      }

      const p1IsAnswering = answeringRef.current.p1;
      const p2IsAnswering = answeringRef.current.p2;

      let p1IsOffTrack = false;
      let p2IsOffTrack = false;

      // --- 1. SIMULATE PLAYER 1 (LAYAR KIRI) ---
      if (!p1Sim.isGameOver) {
        const baseMaxSpd =
          p1State.car.type === 'apex_gp' ? 365 :
          p1State.car.type === 'ducati' ? 362 :
          p1State.car.type === 'ktm' ? 358 :
          p1State.car.type === 'honda' ? 356 :
          p1State.car.type === 'aprilia' ? 354 :
          p1State.car.type === 'yamaha' ? 348 : 355;
        const diffSpeedMult = difficulty === 'easy' ? 0.85 : difficulty === 'hard' ? 1.15 : 1.0;
        const maxSpd = Math.round(baseMaxSpd * diffSpeedMult);

        if (p1IsAnswering) {
          // Player 1 is answering question on Layar Kiri:
          // Safe cruise, maintain lane, temporary shield, NO control interference with P2!
          p1Sim.speed = THREE.MathUtils.damp(p1Sim.speed, 45, 4, dt);
          p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, 0, 8, dt);
          p1Sim.invulnerableTimer = Math.max(p1Sim.invulnerableTimer, 1.5);

          const worldSpeed = (p1Sim.speed / 3.6) * 1.5;
          p1Sim.z += worldSpeed * dt;
          p1Sim.distance += worldSpeed * dt;

          p1CarResult.root.position.set(p1Sim.x, 0, p1Sim.z);
          p1CarResult.bikeBody.rotation.y = 0;
          p1CarResult.bikeBody.rotation.z = 0;
          p1CarResult.forkGroup.rotation.y = 0;
          p1CarResult.rider.rotation.z = 0;

          const wheelRotSpeed = (worldSpeed / 0.35) * dt;
          p1CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed;
            });
          });

          const camDist = 6.4 + (p1Sim.speed / maxSpd) * 1.6;
          const camHeight = 2.3 + (p1Sim.speed / maxSpd) * 0.35;
          camera1.position.set(
            THREE.MathUtils.damp(camera1.position.x, p1Sim.x, 8, dt),
            THREE.MathUtils.damp(camera1.position.y, camHeight, 8, dt),
            p1Sim.z - camDist
          );
          _camTarget.set(p1Sim.x, 1.1, p1Sim.z + 10);
          camera1.lookAt(_camTarget);
          camera1.fov = 65;
          camera1.updateProjectionMatrix();
        } else {
          // Normal active racing simulation for P1:
          // Check if motorcycle has gone off-track beyond the apex kerb limits
          const trackCenter = trackData.getTrackXAtZ(p1Sim.z);
          const distFromCenter = Math.abs(p1Sim.x - trackCenter);
          const trackEdge = trackData.trackWidth / 2 + 0.85; // Outside edge of kerb
          p1IsOffTrack = distFromCenter > trackEdge;

          const ctrl1 = controlsRef.current.p1;
          const grip = calculateGripFactor(weather);

          if (p1IsOffTrack) {
            // OFF-TRACK: Motor keluar lintasan di atas rumput/kerikil
            p1Sim.speed = THREE.MathUtils.damp(p1Sim.speed, 50, weather === 'hujan' ? 2.2 : 3.2, dt);
            p1Sim.shake = THREE.MathUtils.damp(p1Sim.shake, 0.25, 6, dt);
          } else {
            // ON-TRACK: Akselerasi otomatis motor MotoGP dipengaruhi cuaca
            const diffAccelMult = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.25 : 1.0;
            const rawAccel = p1Sim.speed < 120 ? 60 : p1Sim.speed < 240 ? 35 : 18;
            const accelRate = rawAccel * diffAccelMult * grip;
            p1Sim.speed = Math.min(maxSpd, p1Sim.speed + accelRate * dt);
          }

          // Steering (KIRI moves left +X, KANAN moves right -X)
          const steerSpeed = (p1IsOffTrack ? 2.6 : 3.2) * (weather === 'hujan' ? 0.88 : 1.0);
          if (ctrl1.steerLeft) {
            p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, 0.45, 12, dt);
            p1Sim.x += steerSpeed * (p1Sim.speed / 100 + 0.35) * 6 * dt;
            if (p1Sim.speed > 160 && !p1IsOffTrack) sound.playTireSkid();
          } else if (ctrl1.steerRight) {
            p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, -0.45, 12, dt);
            p1Sim.x -= steerSpeed * (p1Sim.speed / 100 + 0.35) * 6 * dt;
            if (p1Sim.speed > 160 && !p1IsOffTrack) sound.playTireSkid();
          } else {
            p1Sim.steerAngle = THREE.MathUtils.damp(p1Sim.steerAngle, 0, 9, dt);
          }

          const worldSpeed = (p1Sim.speed / 3.6) * 1.5;
          p1Sim.z += worldSpeed * dt;
          p1Sim.distance += worldSpeed * dt;
          p1Sim.score += Math.floor(worldSpeed * dt * 0.8);

          p1CarResult.root.position.set(p1Sim.x, 0, p1Sim.z);

          // MotoGP Dynamic Motorcycle & Rider Banking (Lean Angle up to ~55-60 degrees)
          p1CarResult.bikeBody.rotation.z = -p1Sim.steerAngle * 1.18;
          p1CarResult.bikeBody.rotation.y = p1Sim.steerAngle * 0.45;
          p1CarResult.forkGroup.rotation.y = p1Sim.steerAngle * 0.35;
          p1CarResult.rider.rotation.z = -p1Sim.steerAngle * 0.38;

          // Extend knee slider (puck) into turn
          if (p1Sim.steerAngle > 0.15) {
            p1CarResult.leftKneeSlider.position.x = 0.45;
            p1CarResult.rightKneeSlider.position.x = -0.34;
          } else if (p1Sim.steerAngle < -0.15) {
            p1CarResult.leftKneeSlider.position.x = 0.34;
            p1CarResult.rightKneeSlider.position.x = -0.45;
          } else {
            p1CarResult.leftKneeSlider.position.x = 0.38;
            p1CarResult.rightKneeSlider.position.x = -0.38;
          }

          // Titanium Knee Sparks emission when grounded
          const leanDeg1 = p1Sim.steerAngle * 125;
          const isSparking1 = shouldEmitKneeSparks(leanDeg1, p1Sim.speed);
          if (isSparking1) {
            const kneeX = p1Sim.steerAngle > 0 ? p1Sim.x + 0.48 : p1Sim.x - 0.48;
            p1KneeSparks.emit(kneeX, 0.05, p1Sim.z, p1Sim.speed, 3);
          }
          p1KneeSparks.update(dt, isSparking1, p1Sim.x, p1Sim.z);

          // Rear tire burnout smoke or torrential rain rooster tail
          const isEmittingTire1 = shouldEmitTireSmoke(p1Sim.speed, true, false) || (weather === 'hujan' && p1Sim.speed > 25);
          if (isEmittingTire1) {
            p1TireSpray.emit(p1Sim.x, p1Sim.z, p1Sim.speed, weather === 'hujan', weather === 'hujan' ? 3 : 1);
          }
          p1TireSpray.update(dt);

          const wheelRotSpeed = (worldSpeed / 0.35) * dt;
          p1CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed;
            });
          });

          if (p1Sim.invulnerableTimer > 0) {
            p1Sim.invulnerableTimer -= dt;
            p1CarResult.root.visible = Math.floor(p1Sim.invulnerableTimer * 10) % 2 === 0;
          } else {
            p1CarResult.root.visible = true;
          }

          p1Sim.shake = THREE.MathUtils.damp(p1Sim.shake, 0, 8, dt);

          // Scaled camera distance and height for the larger 1.3x motorcycle
          const camDist = 7.4 + (p1Sim.speed / maxSpd) * 1.9;
          const camHeight = 2.65 + (p1Sim.speed / maxSpd) * 0.45;
          const shakeX = (Math.random() - 0.5) * p1Sim.shake;
          const shakeY = (Math.random() - 0.5) * p1Sim.shake;

          camera1.position.set(
            THREE.MathUtils.damp(camera1.position.x, p1Sim.x + shakeX, 8, dt),
            THREE.MathUtils.damp(camera1.position.y, camHeight + shakeY, 8, dt),
            p1Sim.z - camDist
          );
          _camTarget.set(p1Sim.x, 1.25, p1Sim.z + 10);
          camera1.lookAt(_camTarget);

          camera1.fov = 65 + (p1Sim.speed / maxSpd) * 12;
          camera1.updateProjectionMatrix();

          // Outer runoff barrier collision check: soft bumper at outer perimeter of the runoff verge!
          const maxRunoffWidth = trackData.trackWidth / 2 + 10.8;
          if (distFromCenter > maxRunoffWidth) {
            p1Sim.speed = Math.max(35, p1Sim.speed * 0.85);
            p1Sim.shake = 0.35;
            collisionSparks.triggerImpact(p1Sim.x, 0.5, p1Sim.z, 20);
            p1Sim.x = THREE.MathUtils.damp(
              p1Sim.x,
              trackCenter + Math.sign(p1Sim.x - trackCenter) * maxRunoffWidth,
              12,
              dt
            );
            sound.playCrash();
          }
        }
      }

      // --- 2. SIMULATE PLAYER 2 (LAYAR KANAN) ---
      if (mode === 'battle' && p2CarResult && p2State && !p2Sim.isGameOver) {
        const p2BaseMaxSpd =
          p2State.car.type === 'apex_gp' ? 365 :
          p2State.car.type === 'ducati' ? 362 :
          p2State.car.type === 'ktm' ? 358 :
          p2State.car.type === 'honda' ? 356 :
          p2State.car.type === 'aprilia' ? 354 :
          p2State.car.type === 'yamaha' ? 348 : 355;
        const p2DiffSpeedMult = difficulty === 'easy' ? 0.85 : difficulty === 'hard' ? 1.15 : 1.0;
        const maxSpd = Math.round(p2BaseMaxSpd * p2DiffSpeedMult);

        if (p2IsAnswering) {
          // Player 2 is answering on Layar Kanan:
          // Safe cruise, temporary shield, NO disruption to Player 1's racing!
          p2Sim.speed = THREE.MathUtils.damp(p2Sim.speed, 45, 4, dt);
          p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, 0, 8, dt);
          p2Sim.invulnerableTimer = Math.max(p2Sim.invulnerableTimer, 1.5);

          const worldSpeed2 = (p2Sim.speed / 3.6) * 1.5;
          p2Sim.z += worldSpeed2 * dt;
          p2Sim.distance += worldSpeed2 * dt;

          p2CarResult.root.position.set(p2Sim.x, 0, p2Sim.z);
          p2CarResult.bikeBody.rotation.y = 0;
          p2CarResult.bikeBody.rotation.z = 0;
          p2CarResult.forkGroup.rotation.y = 0;
          p2CarResult.rider.rotation.z = 0;

          const wheelRotSpeed2 = (worldSpeed2 / 0.35) * dt;
          p2CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed2;
            });
          });

          const camDist2 = 6.4 + (p2Sim.speed / maxSpd) * 1.6;
          const camHeight2 = 2.3 + (p2Sim.speed / maxSpd) * 0.35;
          camera2.position.set(
            THREE.MathUtils.damp(camera2.position.x, p2Sim.x, 8, dt),
            THREE.MathUtils.damp(camera2.position.y, camHeight2, 8, dt),
            p2Sim.z - camDist2
          );
          _camTarget.set(p2Sim.x, 1.1, p2Sim.z + 10);
          camera2.lookAt(_camTarget);
          camera2.fov = 65;
          camera2.updateProjectionMatrix();
        } else {
          // Normal active racing simulation for P2 with auto-acceleration
          const trackCenter2 = trackData.getTrackXAtZ(p2Sim.z);
          const distFromCenter2 = Math.abs(p2Sim.x - trackCenter2);
          const trackEdge2 = trackData.trackWidth / 2 + 0.85; // Outside edge of kerb
          p2IsOffTrack = distFromCenter2 > trackEdge2;

          const ctrl2 = controlsRef.current.p2 || {
            steerLeft: false,
            steerRight: false,
            accelerate: false,
            brake: false,
            nitro: false,
          };

          if (p2IsOffTrack) {
            // OFF-TRACK P2: Motor keluar lintasan di atas rumput/kerikil,
            // hambatan permukaan menurunkan kecepatan secara drastis
            p2Sim.speed = THREE.MathUtils.damp(p2Sim.speed, 55, 3.2, dt);
            p2Sim.shake = THREE.MathUtils.damp(p2Sim.shake, 0.22, 6, dt);
          } else {
            // ON-TRACK: Akselerasi otomatis normal
            const p2DiffAccelMult = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.25 : 1.0;
            const rawAccel2 = p2Sim.speed < 120 ? 60 : p2Sim.speed < 240 ? 35 : 18;
            const accelRate2 = rawAccel2 * p2DiffAccelMult;
            p2Sim.speed = Math.min(maxSpd, p2Sim.speed + accelRate2 * dt);
          }

          const steerSpeed2 = p2IsOffTrack ? 2.6 : 3.2;
          if (ctrl2.steerLeft) {
            p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, 0.45, 12, dt);
            p2Sim.x += steerSpeed2 * (p2Sim.speed / 100 + 0.35) * 6 * dt;
          } else if (ctrl2.steerRight) {
            p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, -0.45, 12, dt);
            p2Sim.x -= steerSpeed2 * (p2Sim.speed / 100 + 0.35) * 6 * dt;
          } else {
            p2Sim.steerAngle = THREE.MathUtils.damp(p2Sim.steerAngle, 0, 9, dt);
          }

          const worldSpeed2 = (p2Sim.speed / 3.6) * 1.5;
          p2Sim.z += worldSpeed2 * dt;
          p2Sim.distance += worldSpeed2 * dt;
          p2Sim.score += Math.floor(worldSpeed2 * dt * 0.8);

          p2CarResult.root.position.set(p2Sim.x, 0, p2Sim.z);

          // MotoGP Dynamic Motorcycle & Rider Banking (Lean Angle up to ~55-60 degrees)
          p2CarResult.bikeBody.rotation.z = -p2Sim.steerAngle * 1.18;
          p2CarResult.bikeBody.rotation.y = p2Sim.steerAngle * 0.45;
          p2CarResult.forkGroup.rotation.y = p2Sim.steerAngle * 0.35;
          p2CarResult.rider.rotation.z = -p2Sim.steerAngle * 0.38;

          // Extend knee slider (puck) into turn
          if (p2Sim.steerAngle > 0.15) {
            p2CarResult.leftKneeSlider.position.x = 0.45;
            p2CarResult.rightKneeSlider.position.x = -0.34;
          } else if (p2Sim.steerAngle < -0.15) {
            p2CarResult.leftKneeSlider.position.x = 0.34;
            p2CarResult.rightKneeSlider.position.x = -0.45;
          } else {
            p2CarResult.leftKneeSlider.position.x = 0.38;
            p2CarResult.rightKneeSlider.position.x = -0.38;
          }

          // P2 Knee sparks and tire spray
          if (p2KneeSparks) {
            const leanDeg2 = p2Sim.steerAngle * 125;
            const isSparking2 = shouldEmitKneeSparks(leanDeg2, p2Sim.speed);
            if (isSparking2) {
              const kneeX2 = p2Sim.steerAngle > 0 ? p2Sim.x + 0.48 : p2Sim.x - 0.48;
              p2KneeSparks.emit(kneeX2, 0.05, p2Sim.z, p2Sim.speed, 3);
            }
            p2KneeSparks.update(dt, isSparking2, p2Sim.x, p2Sim.z);
          }

          if (p2TireSpray) {
            const isEmittingTire2 = shouldEmitTireSmoke(p2Sim.speed, true, false) || (weather === 'hujan' && p2Sim.speed > 25);
            if (isEmittingTire2) {
              p2TireSpray.emit(p2Sim.x, p2Sim.z, p2Sim.speed, weather === 'hujan', weather === 'hujan' ? 3 : 1);
            }
            p2TireSpray.update(dt);
          }

          const wheelRotSpeed2 = (worldSpeed2 / 0.35) * dt;
          p2CarResult.wheels.forEach((w) => {
            w.children.forEach((c) => {
              c.rotation.x += wheelRotSpeed2;
            });
          });

          if (p2Sim.invulnerableTimer > 0) {
            p2Sim.invulnerableTimer -= dt;
            p2CarResult.root.visible = Math.floor(p2Sim.invulnerableTimer * 10) % 2 === 0;
          } else {
            p2CarResult.root.visible = true;
          }

          p2Sim.shake = THREE.MathUtils.damp(p2Sim.shake, 0, 8, dt);

          const camDist2 = 7.4 + (p2Sim.speed / maxSpd) * 1.9;
          const camHeight2 = 2.65 + (p2Sim.speed / maxSpd) * 0.45;
          const sX2 = (Math.random() - 0.5) * p2Sim.shake;
          const sY2 = (Math.random() - 0.5) * p2Sim.shake;

          camera2.position.set(
            THREE.MathUtils.damp(camera2.position.x, p2Sim.x + sX2, 8, dt),
            THREE.MathUtils.damp(camera2.position.y, camHeight2 + sY2, 8, dt),
            p2Sim.z - camDist2
          );
          _camTarget.set(p2Sim.x, 1.25, p2Sim.z + 10);
          camera2.lookAt(_camTarget);

          camera2.fov = 65 + (p2Sim.speed / maxSpd) * 12;
          camera2.updateProjectionMatrix();

          // Outer runoff barrier collision check for P2
          const maxRunoffWidth2 = trackData.trackWidth / 2 + 10.8;
          if (distFromCenter2 > maxRunoffWidth2) {
            p2Sim.speed = Math.max(35, p2Sim.speed * 0.85);
            p2Sim.shake = 0.35;
            collisionSparks.triggerImpact(p2Sim.x, 0.5, p2Sim.z, 20);
            p2Sim.x = THREE.MathUtils.damp(
              p2Sim.x,
              trackCenter2 + Math.sign(p2Sim.x - trackCenter2) * maxRunoffWidth2,
              12,
              dt
            );
            sound.playCrash();
          }
        }

        // Check bump between P1 and P2 (only if neither is answering)
        if (!p1IsAnswering && !p2IsAnswering) {
          const p1p2Dist = Math.hypot(p1Sim.x - p2Sim.x, p1Sim.z - p2Sim.z);
          if (p1p2Dist < 1.7) {
            const pushX = p1Sim.x > p2Sim.x ? 1 : -1;
            p1Sim.x += pushX * 0.45;
            p2Sim.x -= pushX * 0.45;
            collisionSparks.triggerImpact((p1Sim.x + p2Sim.x) / 2, 0.6, p1Sim.z, 25);
            sound.playCrash();
          }
        }
      }

      // --- Audio Engine Pitch ---
      if (mode === 'battle') {
        const p1Norm = p1IsAnswering ? 0.15 : p1Sim.speed / 365;
        const p2Norm = p2IsAnswering ? 0.15 : p2Sim.speed / 365;
        const maxNorm = Math.max(p1Norm, p2Norm);
        sound.updateEnginePitch(maxNorm, false);
      } else {
        const p1BaseMax =
          p1State.car.type === 'apex_gp' ? 365 :
          p1State.car.type === 'ducati' ? 362 :
          p1State.car.type === 'ktm' ? 358 :
          p1State.car.type === 'honda' ? 356 : 350;
        sound.updateEnginePitch(p1Sim.speed / p1BaseMax, false);
      }

      // --- 3. ANIMATE COMPETITOR MOTOGP BIKES ("PEMBALAP LAIN") ---
      trackData.rivals.forEach((rival) => {
        const rivalSpeedWorld = (rival.baseSpeed / 3.6) * 1.5;
        rival.z += rivalSpeedWorld * dt;

        const roadCenter = trackData.getTrackXAtZ(rival.z);
        rival.laneChangeTimer -= dt;
        if (rival.laneChangeTimer <= 0) {
          rival.targetX = roadCenter + (Math.random() * 8.5 - 4.25);
          rival.laneChangeTimer = 2.5 + Math.random() * 3.5;
        }
        const prevX = rival.x;
        rival.x = THREE.MathUtils.damp(rival.x, rival.targetX, 2, dt);

        // Competitor MotoGP motorcycle banks into lane change
        const rivalLateralVel = (rival.x - prevX) / Math.max(0.001, dt);
        const rivalSteerAngle = Math.max(-0.4, Math.min(0.4, rivalLateralVel * 0.2));
        rival.modelResult.bikeBody.rotation.z = -rivalSteerAngle * 1.15;
        rival.modelResult.bikeBody.rotation.y = rivalSteerAngle * 0.4;
        rival.modelResult.forkGroup.rotation.y = rivalSteerAngle * 0.35;
        rival.modelResult.rider.rotation.z = -rivalSteerAngle * 0.35;

        rival.modelResult.root.position.set(rival.x, 0, rival.z);

        rival.modelResult.wheels.forEach((w) => {
          w.children.forEach((c) => {
            c.rotation.x += (rivalSpeedWorld / 0.35) * dt;
          });
        });

        // Collision with P1 (Layar Kiri) - motorcycle hitbox
        if (p1Sim.invulnerableTimer <= 0 && !p1Sim.isGameOver && !p1IsAnswering) {
          const dx = Math.abs(p1Sim.x - rival.x);
          const dz = Math.abs(p1Sim.z - rival.z);
          if (dx < 1.15 && dz < 2.5) {
            p1Sim.lives -= 1;
            p1Sim.speed = Math.max(25, p1Sim.speed * 0.45);
            p1Sim.shake = 0.55;
            p1Sim.invulnerableTimer = 2.0;
            collisionSparks.triggerImpact(rival.x, 0.6, rival.z, 35);
            sound.playCrash();

            if (p1Sim.lives <= 0) {
              p1Sim.isGameOver = true;
              p1Sim.lives = 0;
              callbacksRef.current.onGameOver(mode === 'battle' ? 'Pemain 2 (Kanan)' : undefined);
            }
          }
        }

        // Collision with P2 (Layar Kanan) - motorcycle hitbox
        if (
          mode === 'battle' &&
          p2CarResult &&
          p2Sim.invulnerableTimer <= 0 &&
          !p2Sim.isGameOver &&
          !p2IsAnswering
        ) {
          const dx = Math.abs(p2Sim.x - rival.x);
          const dz = Math.abs(p2Sim.z - rival.z);
          if (dx < 1.15 && dz < 2.5) {
            p2Sim.lives -= 1;
            p2Sim.speed = Math.max(25, p2Sim.speed * 0.45);
            p2Sim.shake = 0.55;
            p2Sim.invulnerableTimer = 2.0;
            collisionSparks.triggerImpact(rival.x, 0.6, rival.z, 35);
            sound.playCrash();

            if (p2Sim.lives <= 0) {
              p2Sim.isGameOver = true;
              p2Sim.lives = 0;
              callbacksRef.current.onGameOver('Pemain 1 (Kiri)');
            }
          }
        }
      });

      // Update global collision sparks and rain atmospheric droplets
      collisionSparks.update(dt);
      if (rainSystem) {
        rainSystem.update(dt, camera1.position.x, camera1.position.z, p1Sim.speed);
      }

      // --- 4. BONUS QUESTION ORBS ---
      trackData.bonusOrbs.forEach((orb: BonusOrb, idx: number) => {
        if (!orb.collected) {
          orb.mesh.rotation.y += dt * 1.5;
          orb.mesh.position.y = 1.25 + Math.sin(clock.getElapsedTime() * 3 + idx) * 0.2;

          // Pickup by P1 (Kiri) - only if P1 is not already answering
          if (!p1IsAnswering) {
            const distP1 = Math.hypot(p1Sim.x - orb.x, p1Sim.z - orb.z);
            if (distP1 < 2.2) {
              orb.collected = true;
              orb.mesh.visible = false;
              sound.playBonusPickup();
              callbacksRef.current.onTriggerQuestion('p1', idx);
            }
          }

          // Pickup by P2 (Kanan) - only if P2 is not already answering
          if (mode === 'battle' && !orb.collected && !p2IsAnswering) {
            const distP2 = Math.hypot(p2Sim.x - orb.x, p2Sim.z - orb.z);
            if (distP2 < 2.2) {
              orb.collected = true;
              orb.mesh.visible = false;
              sound.playBonusPickup();
              callbacksRef.current.onTriggerQuestion('p2', idx);
            }
          }
        }
      });

      // Check finish conditions
      if (mode === 'solo') {
        const kmReached = p1Sim.distance >= targetDistanceMeters;
        const allQuestionsAnswered = p1QuestionsAnsweredRef.current >= totalQuestions;

        // Finish condition: Both target KM reached AND all questions answered
        if (kmReached && allQuestionsAnswered && !p1Sim.isGameOver) {
          p1Sim.isGameOver = true;
          sound.playVictory();
          callbacksRef.current.onGameOver();
        } else if (kmReached && !allQuestionsAnswered && !p1IsAnswering) {
          // If km reached but still has unanswered questions, trigger next question so player can finish
          callbacksRef.current.onTriggerQuestion('p1', Math.floor(clock.getElapsedTime()));
        }
      } else {
        // Battle mode finish
        const p1Finished = p1Sim.distance >= targetDistanceMeters;
        const p2Finished = p2Sim && p2Sim.distance >= targetDistanceMeters;

        if ((p1Finished || p2Finished) && !p1Sim.isGameOver) {
          p1Sim.isGameOver = true;
          sound.playVictory();
          callbacksRef.current.onGameOver(
            p1Sim.score >= p2Sim.score ? 'Pemain 1 (Kiri)' : 'Pemain 2 (Kanan)'
          );
        }
      }

      callbacksRef.current.onUpdateP1((prev) => {
        const gear = calculateGear(p1Sim.speed);
        const p1BaseMax =
          p1State.car.type === 'apex_gp' ? 365 :
          p1State.car.type === 'ducati' ? 362 :
          p1State.car.type === 'ktm' ? 358 :
          p1State.car.type === 'honda' ? 356 : 350;
        const { rpmPercent } = calculateRpm(p1Sim.speed, p1BaseMax);
        const leanAngleDeg = Math.abs(calculateLeanAngleDeg(p1Sim.steerAngle));

        return {
          ...prev,
          speed: Math.round(p1Sim.speed),
          nitro: 0,
          isNitroActive: false,
          distance: Math.round(p1Sim.distance),
          score: p1Sim.score,
          lives: p1Sim.lives,
          isGameOver: p1Sim.isGameOver,
          isOffTrack: p1IsOffTrack,
          gear,
          rpmPercent,
          leanAngleDeg,
        };
      });

      if (mode === 'battle' && callbacksRef.current.onUpdateP2) {
        callbacksRef.current.onUpdateP2((prev) => {
          const p2BaseMax =
            p2State?.car.type === 'apex_gp' ? 365 :
            p2State?.car.type === 'ducati' ? 362 :
            p2State?.car.type === 'ktm' ? 358 :
            p2State?.car.type === 'honda' ? 356 : 350;
          const gear = calculateGear(p2Sim.speed);
          const { rpmPercent } = calculateRpm(p2Sim.speed, p2BaseMax);
          const leanAngleDeg = Math.abs(calculateLeanAngleDeg(p2Sim.steerAngle));

          return {
            ...prev,
            speed: Math.round(p2Sim.speed),
            nitro: 0,
            isNitroActive: false,
            distance: Math.round(p2Sim.distance),
            score: p2Sim.score,
            lives: p2Sim.lives,
            isGameOver: p2Sim.isGameOver,
            isOffTrack: p2IsOffTrack,
            gear,
            rpmPercent,
            leanAngleDeg,
          };
        });
      }

      // --- 5. RENDER VIEWPORTS: LEFT (P1) AND RIGHT (P2) FOR BATTLE ---
      const w = container.clientWidth;
      const h = container.clientHeight;

      if (mode === 'battle') {
        const halfW = Math.floor(w / 2);
        renderer.setScissorTest(true);

        // --- LAYAR KIRI: Pemain 1 ---
        camera1.aspect = halfW / h;
        camera1.updateProjectionMatrix();
        renderer.setViewport(0, 0, halfW, h);
        renderer.setScissor(0, 0, halfW, h);
        renderer.render(scene, camera1);

        // --- LAYAR KANAN: Pemain 2 ---
        camera2.aspect = halfW / h;
        camera2.updateProjectionMatrix();
        renderer.setViewport(halfW, 0, halfW, h);
        renderer.setScissor(halfW, 0, halfW, h);
        renderer.render(scene, camera2);
      } else {
        // Solo: Full Screen
        renderer.setScissorTest(false);
        camera1.aspect = w / h;
        camera1.updateProjectionMatrix();
        renderer.setViewport(0, 0, w, h);
        renderer.render(scene, camera1);
      }

      checkCapture();
    };

    animFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      sound.stopEngine();
      p1NitroTrail.dispose(scene);
      p1KneeSparks.dispose(scene);
      p1TireSpray.dispose(scene);
      collisionSparks.dispose(scene);
      if (rainSystem) {
        rainSystem.dispose(scene);
      }
      if (p2NitroTrail) {
        p2NitroTrail.dispose(scene);
      }
      if (p2KneeSparks) {
        p2KneeSparks.dispose(scene);
      }
      if (p2TireSpray) {
        p2TireSpray.dispose(scene);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    mode,
    weather,
    circuitId,
    difficulty,
    targetDistanceMeters,
    totalQuestions,
    p1State.car.type,
    p1State.car.primaryColor,
    p1State.car.accentColor,
    p2State?.car.type,
    p2State?.car.primaryColor,
    p2State?.car.accentColor,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Vertical split screen divider line for battle mode (Layar Kiri & Kanan) */}
      {mode === 'battle' && (
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-cyan-400 via-amber-400 to-rose-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-30 pointer-events-none flex flex-col items-center justify-center">
          <div className="bg-slate-900 border border-cyan-400 text-cyan-300 px-2 py-1 text-[10px] font-black tracking-widest uppercase rounded shadow whitespace-nowrap -rotate-90">
            ◄ KIRI (P1) | KANAN (P2) ►
          </div>
        </div>
      )}
    </div>
  );
};
