import * as THREE from 'three';
import { CarModelType, CarSpecs } from '../types/game';

export const CAR_PRESETS: CarSpecs[] = [
  {
    type: 'ducati',
    name: 'Ducati Desmosedici GP',
    subtitle: 'Bologna V4 Desmo • Top Speed 362 km/h • Aero Winglets',
    topSpeed: 362,
    acceleration: 9.8,
    handling: 9.3,
    nitroBoost: 1.6,
    primaryColor: '#dc2626', // Ducati Rosso Corsa
    accentColor: '#ffffff',
  },
  {
    type: 'yamaha',
    name: 'Yamaha YZR-M1 Factory',
    subtitle: 'Inline-4 Crossplane • Spesialis Tikungan • High Corner Speed',
    topSpeed: 348,
    acceleration: 9.4,
    handling: 9.9,
    nitroBoost: 1.5,
    primaryColor: '#1d4ed8', // Monster Deep Blue
    accentColor: '#06b6d4',
  },
  {
    type: 'honda',
    name: 'Honda RC213V Repsol',
    subtitle: 'HRC V4 Prototype • Akselerasi Kilat • Super Lincah',
    topSpeed: 356,
    acceleration: 9.7,
    handling: 9.2,
    nitroBoost: 1.55,
    primaryColor: '#ea580c', // Repsol Blaze Orange
    accentColor: '#dc2626',
  },
  {
    type: 'aprilia',
    name: 'Aprilia RS-GP Factory',
    subtitle: 'Noale Aerodynamics • Ground Effect Fairing • Carbon Frame',
    topSpeed: 354,
    acceleration: 9.5,
    handling: 9.6,
    nitroBoost: 1.6,
    primaryColor: '#18181b', // Stealth Carbon Black
    accentColor: '#a855f7',
  },
  {
    type: 'ktm',
    name: 'KTM RC16 Red Bull',
    subtitle: 'Steel Trellis V4 • Extreme Holeshot • Tenaga Brutal',
    topSpeed: 358,
    acceleration: 9.9,
    handling: 9.1,
    nitroBoost: 1.65,
    primaryColor: '#f97316', // Factory Racing Orange
    accentColor: '#0f172a',
  },
  {
    type: 'apex_gp',
    name: 'Apex GP World Champion',
    subtitle: 'Edisi Juara Dunia • Downforce Maksimal • Quantum Nitro',
    topSpeed: 365,
    acceleration: 9.9,
    handling: 9.8,
    nitroBoost: 1.75,
    primaryColor: '#06b6d4', // Electric Cyan
    accentColor: '#eab308',
  },
];

export const COLOR_OPTIONS = [
  { name: 'Ducati Rosso Corsa (Merah Balap)', hex: '#dc2626', accent: '#ffffff' },
  { name: 'Monster Blue (Biru Yamaha Factory)', hex: '#1d4ed8', accent: '#06b6d4' },
  { name: 'Repsol Blaze (Oranye Honda)', hex: '#ea580c', accent: '#dc2626' },
  { name: 'Stealth Carbon (Hitam Matte Aprilia)', hex: '#18181b', accent: '#a855f7' },
  { name: 'KTM Factory (Oranye & Navy)', hex: '#f97316', accent: '#0f172a' },
  { name: 'Gresini Cyan (Biru Langit Mandalika)', hex: '#06b6d4', accent: '#eab308' },
  { name: 'Neon Volt (Kuning Terang Balap)', hex: '#eab308', accent: '#18181b' },
  { name: 'Alpine Frost (Putih Kristal)', hex: '#f8fafc', accent: '#2563eb' },
];

/**
 * Procedural high-res twill carbon fiber weave texture
 */
export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 4) {
      for (let x = 0; x < 128; x += 4) {
        const isOffset = ((x / 4) + (y / 4)) % 2 === 0;
        ctx.fillStyle = isOffset ? '#23262d' : '#0c0d0f';
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/**
 * Procedural drilled carbon-ceramic brake rotor texture with ventilation holes
 */
export function createBrakeRotorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2c2d30';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#0f1012';
    const c = 64;
    for (let r = 24; r <= 52; r += 9) {
      const count = Math.floor(r * 0.45);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural front racing board decal with rider number and sponsor badge
 */
export function createRaceDecalTexture(numberStr: string, teamName: string, primColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = primColor;
    ctx.fillRect(0, 0, 256, 256);

    // Accent speed stripes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 12, 224, 18);

    // Number plate oval/shield
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(36, 44, 184, 144, 20);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Bold race number
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 86px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numberStr, 128, 116);

    // Team badge text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(teamName.toUpperCase(), 128, 218);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates an authentic MotoGP racing wheel (front or rear).
 * Includes racing slick rubber tire, lightweight magnesium alloy rim,
 * carbon-ceramic brake disc, and golden Brembo radial caliper.
 */
function createMotoGPWheel(
  radius: number,
  width: number,
  isFront: boolean,
  rimColor = 0xd4d4d8,
  rotorTex?: THREE.CanvasTexture
): { wheelGroup: THREE.Group; tireMesh: THREE.Mesh } {
  const wheelGroup = new THREE.Group();

  // Racing slick tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.85,
    metalness: 0.15,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Lightweight 5-spoke magnesium rim center
  const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width * 0.92, 16);
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: 0.25,
    metalness: 0.85,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.z = Math.PI / 2;
  wheelGroup.add(rim);

  // Spokes
  for (let s = 0; s < 5; s++) {
    const angle = (s / 5) * Math.PI * 2;
    const spokeGeo = new THREE.BoxGeometry(radius * 0.65, 0.03, width * 0.4);
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.position.set(Math.cos(angle) * (radius * 0.32), Math.sin(angle) * (radius * 0.32), 0);
    spoke.rotation.z = angle;
    wheelGroup.add(spoke);
  }

  // Floating Carbon Brake Disc(s)
  const discRadius = radius * 0.62;
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    map: rotorTex || null,
    roughness: 0.35,
    metalness: 0.75,
  });

  const discOffsets = isFront ? [-width / 2 - 0.02, width / 2 + 0.02] : [-width / 2 - 0.02];
  discOffsets.forEach((xPos) => {
    const discGeo = new THREE.CylinderGeometry(discRadius, discRadius, 0.02, 20);
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = xPos;
    wheelGroup.add(disc);

    // Golden Brembo brake caliper
    const caliperGeo = new THREE.BoxGeometry(0.045, 0.12, 0.14);
    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Gold Brembo
      metalness: 0.9,
      roughness: 0.25,
    });
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(xPos > 0 ? xPos + 0.015 : xPos - 0.015, discRadius * 0.65, -0.05);
    wheelGroup.add(caliper);
  });

  return { wheelGroup, tireMesh: tire };
}

/**
 * Creates an articulated 3D MotoGP Rider (Pembalap) in racing leathers,
 * aerodynamic helmet, speed hump, arms on handlebars, and knee sliders.
 */
function createMotoGPRider(
  suitColor: THREE.Color,
  accentColor: THREE.Color
): { riderGroup: THREE.Group; leftKneeSlider: THREE.Mesh; rightKneeSlider: THREE.Mesh } {
  const rider = new THREE.Group();

  const suitMaterial = new THREE.MeshStandardMaterial({
    color: suitColor,
    roughness: 0.45,
    metalness: 0.2,
  });

  const accentSuitMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.4,
    metalness: 0.3,
  });

  const blackLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.6,
    metalness: 0.1,
  });

  const helmetMaterial = new THREE.MeshStandardMaterial({
    color: suitColor,
    roughness: 0.15,
    metalness: 0.6,
  });

  const visorMaterial = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    emissive: 0x1e293b,
    emissiveIntensity: 0.5,
    roughness: 0.05,
    metalness: 0.95,
  });

  const kneeSliderMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // Bright yellow/fluo knee puck
    roughness: 0.2,
    metalness: 0.3,
  });

  // 1. Torso: Leaned forward in aerodynamic race crouch ("chin on the tank")
  const torsoGeo = new THREE.BoxGeometry(0.38, 0.32, 0.62);
  const torso = new THREE.Mesh(torsoGeo, suitMaterial);
  torso.position.set(0, 0.88, 0.05);
  torso.rotation.x = 0.5; // Aggressive forward racing lean
  torso.castShadow = true;
  rider.add(torso);

  // Aerodynamic speed hump on rider's back
  const humpGeo = new THREE.ConeGeometry(0.12, 0.4, 8);
  const hump = new THREE.Mesh(humpGeo, accentSuitMat);
  hump.rotation.x = Math.PI / 2 + 0.35;
  hump.position.set(0, 1.05, -0.12);
  rider.add(hump);

  // Suit chest accent stripe
  const stripeGeo = new THREE.BoxGeometry(0.1, 0.33, 0.63);
  const stripe = new THREE.Mesh(stripeGeo, accentSuitMat);
  stripe.position.set(0, 0.88, 0.05);
  stripe.rotation.x = 0.5;
  rider.add(stripe);

  // 2. Helmet & Visor
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.15, 0.36);

  // Aerodynamic oval helmet shell
  const helmetGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const helmet = new THREE.Mesh(helmetGeo, helmetMaterial);
  helmet.scale.set(0.9, 0.98, 1.18);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Helmet aerodynamic rear spoiler (MotoGP spec)
  const spoilerGeo = new THREE.ConeGeometry(0.1, 0.2, 6);
  const spoiler = new THREE.Mesh(spoilerGeo, accentSuitMat);
  spoiler.rotation.x = -Math.PI / 2 + 0.3;
  spoiler.position.set(0, 0.06, -0.19);
  headGroup.add(spoiler);

  // Tinted mirrored racing visor
  const visorGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.1, 16, 1, false, 0, Math.PI);
  const visor = new THREE.Mesh(visorGeo, visorMaterial);
  visor.rotation.y = -Math.PI / 2;
  visor.position.set(0, 0.02, 0.07);
  headGroup.add(visor);

  rider.add(headGroup);

  // 3. Arms holding clip-on handlebars
  [-0.19, 0.19].forEach((xSide) => {
    // Upper arm
    const armGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.38, 8);
    const arm = new THREE.Mesh(armGeo, suitMaterial);
    arm.position.set(xSide * 1.15, 0.94, 0.28);
    arm.rotation.x = Math.PI / 4;
    arm.rotation.z = xSide > 0 ? -0.32 : 0.32;
    arm.castShadow = true;
    rider.add(arm);

    // Elbow slider
    const elbowPuck = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.07), kneeSliderMat);
    elbowPuck.position.set(xSide * 1.35, 0.86, 0.24);
    rider.add(elbowPuck);

    // Forearm reaching to bar
    const foreArm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.045, 0.34, 8), blackLeatherMat);
    foreArm.position.set(xSide * 0.95, 0.82, 0.52);
    foreArm.rotation.x = 0.85;
    foreArm.rotation.y = xSide > 0 ? -0.22 : 0.22;
    rider.add(foreArm);

    // Gloved hand
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blackLeatherMat);
    glove.position.set(xSide * 0.82, 0.74, 0.7);
    rider.add(glove);
  });

  // 4. Legs tucked into rearsets with knee sliders (pucks)
  const leftKnee = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.12), kneeSliderMat);
  leftKnee.position.set(0.32, 0.58, 0.02);
  rider.add(leftKnee);

  const rightKnee = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.12), kneeSliderMat);
  rightKnee.position.set(-0.32, 0.58, 0.02);
  rider.add(rightKnee);

  // Thighs
  [-0.18, 0.18].forEach((xSide) => {
    const thighGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8);
    const thigh = new THREE.Mesh(thighGeo, suitMaterial);
    thigh.position.set(xSide * 1.25, 0.7, -0.05);
    thigh.rotation.x = 0.9;
    thigh.rotation.z = xSide > 0 ? 0.32 : -0.32;
    rider.add(thigh);

    // Racing boots on rearset pegs
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.22), blackLeatherMat);
    boot.position.set(xSide * 1.1, 0.42, -0.32);
    boot.rotation.x = 0.25;
    rider.add(boot);
  });

  return { riderGroup: rider, leftKneeSlider: leftKnee, rightKneeSlider: rightKnee };
}

export interface ProceduralBikeResult {
  root: THREE.Group;
  bikeBody: THREE.Group; // Group that tilts/banks dynamically with lean angle!
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  forkGroup: THREE.Group; // Front fork steering assembly
  rider: THREE.Group;
  leftKneeSlider: THREE.Mesh;
  rightKneeSlider: THREE.Mesh;
  exhaustPipes: THREE.Mesh[];
  headlights: THREE.Mesh[];
  nitroFlames: THREE.Mesh[];
  // Backward compatibility alias handles
  wheels: THREE.Group[];
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  bodyMesh: THREE.Mesh;
}

export type ProceduralCarResult = ProceduralBikeResult;

/**
 * Builds an authentic, highly detailed 3D MotoGP Racing Prototype Motorcycle
 * complete with aerodynamic downforce winglets, titanium race exhaust, and leaning rider!
 */
export function buildProceduralCar(
  modelType: CarModelType,
  primaryColorHex: string,
  accentColorHex: string
): ProceduralBikeResult {
  const root = new THREE.Group();

  // Sub-group that leans/tilts on cornering (pivots along contact patch at Y = 0)
  const bikeBody = new THREE.Group();
  root.add(bikeBody);

  const wheels: THREE.Group[] = [];
  const headlights: THREE.Mesh[] = [];
  const exhaustPipes: THREE.Mesh[] = [];
  const nitroFlames: THREE.Mesh[] = [];

  const primColor = new THREE.Color(primaryColorHex);
  const accColor = new THREE.Color(accentColorHex);

  const teamInfoMap: Record<string, { num: string; team: string }> = {
    ducati: { num: '#63', team: 'Ducati Lenovo' },
    yamaha: { num: '#20', team: 'Monster Yamaha' },
    honda: { num: '#93', team: 'Repsol Honda' },
    aprilia: { num: '#12', team: 'Aprilia Factory' },
    ktm: { num: '#33', team: 'Red Bull KTM' },
    apex_gp: { num: '#1', team: 'Apex Champion' },
  };
  const currentTeam = teamInfoMap[modelType] || { num: '#1', team: 'MotoGP Edu' };

  // High-res procedural textures
  const carbonTex = createCarbonFiberTexture();
  const rotorTex = createBrakeRotorTexture();
  const decalTex = createRaceDecalTexture(currentTeam.num, currentTeam.team, primaryColorHex);

  // PBR Materials for MotoGP Prototype
  const fairingMaterial = new THREE.MeshStandardMaterial({
    color: primColor,
    roughness: 0.16,
    metalness: 0.7,
  });

  const accentFairingMat = new THREE.MeshStandardMaterial({
    color: accColor,
    roughness: 0.2,
    metalness: 0.65,
  });

  const carbonFiberMat = new THREE.MeshStandardMaterial({
    map: carbonTex,
    color: 0x26272b,
    roughness: 0.42,
    metalness: 0.6,
  });

  const aluminumFrameMat = new THREE.MeshStandardMaterial({
    color: 0xc4c4c8, // Brushed Twin-Spar Aluminum
    roughness: 0.25,
    metalness: 0.9,
  });

  const goldOhlinsMat = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Anodized Gold Öhlins Inverted Stanchions
    roughness: 0.15,
    metalness: 0.95,
  });

  const titaniumExhaustMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Titanium with blue heat-tint
    roughness: 0.3,
    metalness: 0.9,
  });

  const windscreenMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.9,
    transparent: true,
    opacity: 0.65,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xef4444,
    emissiveIntensity: 1.5,
    roughness: 0.1,
  });

  // Wheel positions: Front at +Z = 1.05, Rear at -Z = 1.05, axle height Y = 0.35
  const frontZ = 1.05;
  const rearZ = -1.05;
  const axleY = 0.35;

  // --- 1. REAR WHEEL & SWINGARM ---
  const { wheelGroup: rearWheel } = createMotoGPWheel(0.35, 0.2, false, 0xd4d4d8, rotorTex);
  rearWheel.position.set(0, axleY, rearZ);
  bikeBody.add(rearWheel);
  wheels.push(rearWheel);

  // Asymmetrical Gull-Wing Swingarm
  const swingarmL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 1.1), aluminumFrameMat);
  swingarmL.position.set(0.12, axleY + 0.08, rearZ + 0.52);
  swingarmL.rotation.x = 0.15;
  bikeBody.add(swingarmL);

  const swingarmR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 1.1), aluminumFrameMat);
  swingarmR.position.set(-0.12, axleY + 0.08, rearZ + 0.52);
  swingarmR.rotation.x = 0.15;
  bikeBody.add(swingarmR);

  // Gold rear sprocket & drive chain on left swingarm
  const sprocketGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.015, 20);
  const sprocketMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
  const sprocket = new THREE.Mesh(sprocketGeo, sprocketMat);
  sprocket.rotation.z = Math.PI / 2;
  sprocket.position.set(0.14, axleY, rearZ);
  bikeBody.add(sprocket);

  const chainGeo = new THREE.BoxGeometry(0.02, 0.035, 1.05);
  const chainMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.85, roughness: 0.3 });
  const chainTop = new THREE.Mesh(chainGeo, chainMat);
  chainTop.position.set(0.14, axleY + 0.12, rearZ + 0.52);
  chainTop.rotation.x = 0.15;
  bikeBody.add(chainTop);

  // Rear Mono-shock damper
  const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45, 8), goldOhlinsMat);
  shock.position.set(0, 0.56, rearZ + 0.95);
  shock.rotation.x = -0.4;
  bikeBody.add(shock);

  // --- 2. FRONT FORK & STEERING ASSEMBLY ---
  const forkGroup = new THREE.Group();
  forkGroup.position.set(0, axleY, frontZ);
  bikeBody.add(forkGroup);

  const { wheelGroup: frontWheel } = createMotoGPWheel(0.34, 0.13, true, 0xd4d4d8, rotorTex);
  forkGroup.add(frontWheel);
  wheels.push(frontWheel);

  // Twin Gold Öhlins Inverted Fork Tubes
  [-0.11, 0.11].forEach((xSide) => {
    const forkTube = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.95, 12), goldOhlinsMat);
    forkTube.position.set(xSide, 0.35, -0.1);
    forkTube.rotation.x = -0.42; // Rake angle ~24 degrees
    forkTube.castShadow = true;
    forkGroup.add(forkTube);
  });

  // Carbon Front Mudguard (Fender)
  const fenderGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.16, 16, 1, false, 0, Math.PI * 0.7);
  const fender = new THREE.Mesh(fenderGeo, carbonFiberMat);
  fender.rotation.z = Math.PI / 2;
  fender.rotation.x = 0.6;
  fender.position.set(0, 0.08, -0.04);
  forkGroup.add(fender);

  // Triple clamp bracket
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.12), carbonFiberMat);
  clamp.position.set(0, 0.72, -0.22);
  forkGroup.add(clamp);

  // Clip-on racing handlebars
  const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.58, 8);
  const bar = new THREE.Mesh(barGeo, carbonFiberMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 0.74, -0.2);
  forkGroup.add(bar);

  // Right brake lever guard (MotoGP safety requirement)
  const guardGeo = new THREE.TorusGeometry(0.055, 0.009, 6, 12, Math.PI * 0.75);
  const guardMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3, metalness: 0.8 });
  const leverGuard = new THREE.Mesh(guardGeo, guardMat);
  leverGuard.position.set(-0.31, 0.73, -0.16);
  leverGuard.rotation.y = Math.PI / 2;
  leverGuard.rotation.z = -0.2;
  forkGroup.add(leverGuard);

  // --- 3. MAIN DELTA-BOX CHASSIS & V4 ENGINE ---
  const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 1.3), aluminumFrameMat);
  frameL.position.set(0.18, 0.58, 0.05);
  frameL.rotation.x = -0.25;
  bikeBody.add(frameL);

  const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 1.3), aluminumFrameMat);
  frameR.position.set(-0.18, 0.58, 0.05);
  frameR.rotation.x = -0.25;
  bikeBody.add(frameR);

  // Sculpted Engine Block & Dry Clutch Cover
  const engineGeo = new THREE.BoxGeometry(0.34, 0.34, 0.62);
  const engineBlock = new THREE.Mesh(engineGeo, carbonFiberMat);
  engineBlock.position.set(0, 0.42, 0.05);
  bikeBody.add(engineBlock);

  // Gold Dry Clutch Cover on right side
  const clutchGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16);
  const clutch = new THREE.Mesh(clutchGeo, goldOhlinsMat);
  clutch.rotation.z = Math.PI / 2;
  clutch.position.set(-0.19, 0.4, -0.05);
  bikeBody.add(clutch);

  // Curved Racing Radiator behind front wheel
  const radGeo = new THREE.BoxGeometry(0.32, 0.26, 0.08);
  const rad = new THREE.Mesh(radGeo, carbonFiberMat);
  rad.position.set(0, 0.44, 0.5);
  rad.rotation.x = 0.2;
  bikeBody.add(rad);

  // --- 4. AERODYNAMIC MAIN FAIRING & TANK ---
  // Lower belly pan fairing
  const bellyPanGeo = new THREE.BoxGeometry(0.42, 0.22, 1.45);
  const bellyPan = new THREE.Mesh(bellyPanGeo, carbonFiberMat);
  bellyPan.position.set(0, 0.26, 0.05);
  bikeBody.add(bellyPan);

  // Sculpted Fuel Tank
  const tankGeo = new THREE.BoxGeometry(0.42, 0.3, 0.88);
  const tank = new THREE.Mesh(tankGeo, fairingMaterial);
  tank.position.set(0, 0.74, 0.2);
  tank.rotation.x = -0.15;
  tank.castShadow = true;
  bikeBody.add(tank);

  // Main aerodynamic nose fairing (cowl)
  const noseCowlGeo = new THREE.BoxGeometry(0.46, 0.42, 0.98);
  const noseCowl = new THREE.Mesh(noseCowlGeo, fairingMaterial);
  noseCowl.position.set(0, 0.68, 0.82);
  noseCowl.rotation.x = -0.25;
  noseCowl.castShadow = true;
  bikeBody.add(noseCowl);

  // Front Race Number Decal Board (MotoGP Spec Plate)
  const numberPlateGeo = new THREE.PlaneGeometry(0.28, 0.28);
  const numberPlateMat = new THREE.MeshStandardMaterial({
    map: decalTex,
    roughness: 0.25,
    metalness: 0.4,
  });
  const numberPlate = new THREE.Mesh(numberPlateGeo, numberPlateMat);
  numberPlate.position.set(0, 0.76, 1.22);
  numberPlate.rotation.x = -0.45;
  bikeBody.add(numberPlate);

  // Front Ram-Air Intake mouth
  const intakeGeo = new THREE.BoxGeometry(0.22, 0.09, 0.1);
  const intake = new THREE.Mesh(intakeGeo, carbonFiberMat);
  intake.position.set(0, 0.58, 1.3);
  bikeBody.add(intake);

  // Transparent Bubble Windscreen
  const screenGeo = new THREE.ConeGeometry(0.24, 0.65, 8, 1, false, 0, Math.PI);
  const windscreen = new THREE.Mesh(screenGeo, windscreenMat);
  windscreen.rotation.x = -Math.PI / 2 + 0.32;
  windscreen.rotation.y = -Math.PI / 2;
  windscreen.position.set(0, 0.86, 0.82);
  bikeBody.add(windscreen);

  // --- 5. SIGNATURE MOTOGP AERODYNAMIC WINGLETS (FRONT DOWNFORCE AERO WINGS) ---
  // Left and Right dual-tier carbon downforce wings
  [-0.28, 0.28].forEach((xSide) => {
    // Upper primary winglet
    const wingGeo = new THREE.BoxGeometry(0.24, 0.035, 0.34);
    const wing = new THREE.Mesh(wingGeo, accentFairingMat);
    wing.position.set(xSide > 0 ? xSide + 0.06 : xSide - 0.06, 0.68, 0.98);
    wing.rotation.y = xSide > 0 ? -0.22 : 0.22;
    wing.rotation.z = xSide > 0 ? -0.15 : 0.15;
    wing.castShadow = true;
    bikeBody.add(wing);

    // Vertical endplate winglet tip
    const endplateGeo = new THREE.BoxGeometry(0.025, 0.1, 0.3);
    const endplate = new THREE.Mesh(endplateGeo, carbonFiberMat);
    endplate.position.set(xSide > 0 ? xSide + 0.18 : xSide - 0.18, 0.7, 0.99);
    bikeBody.add(endplate);
  });

  // --- 6. AERODYNAMIC SEAT & TAIL UNIT ---
  const tailGeo = new THREE.BoxGeometry(0.34, 0.2, 0.85);
  const tail = new THREE.Mesh(tailGeo, fairingMaterial);
  tail.position.set(0, 0.72, -0.6);
  tail.rotation.x = 0.22; // Uplifted aerodynamic tail
  tail.castShadow = true;
  bikeBody.add(tail);

  // Under-tail aerodynamic air diffuser channel
  const aeroTunnel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.5), carbonFiberMat);
  aeroTunnel.position.set(0, 0.66, -0.78);
  bikeBody.add(aeroTunnel);

  // Seat Pad (Alcantara / racing foam)
  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.44), carbonFiberMat);
  seatPad.position.set(0, 0.71, -0.18);
  bikeBody.add(seatPad);

  // Tail-light LED bar
  const tl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.04), taillightMat);
  tl.position.set(0, 0.82, -1.02);
  bikeBody.add(tl);

  // Headlight LED projector slits
  [-0.12, 0.12].forEach((xSide) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.04), headlightMat);
    hl.position.set(xSide, 0.62, 1.28);
    bikeBody.add(hl);
    headlights.push(hl);
  });

  // --- 7. TITANIUM AKRAPOVIČ RACE EXHAUST WITH HEAT-BLUED TIP ---
  const pipeGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.78, 12);
  const exhaust = new THREE.Mesh(pipeGeo, titaniumExhaustMat);
  exhaust.rotation.x = Math.PI / 2 + 0.35;
  exhaust.position.set(-0.21, 0.4, -0.76);
  exhaust.castShadow = true;
  bikeBody.add(exhaust);
  exhaustPipes.push(exhaust);

  // Slash-cut blue heat-tinted muffler tip
  const tipGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.14, 12);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6, // Blue heat-treated titanium
    metalness: 0.95,
    roughness: 0.15,
  });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.rotation.x = Math.PI / 2 + 0.35;
  tip.position.set(-0.22, 0.45, -1.1);
  bikeBody.add(tip);

  // Dual Nitro Flame Emitters (Outer blue fire + Inner bright plasma cone)
  const flameGeo = new THREE.ConeGeometry(0.1, 1.1, 10);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotation.x = -Math.PI / 2 + 0.35;
  flame.position.set(-0.23, 0.49, -1.65);
  flame.visible = false;
  bikeBody.add(flame);
  nitroFlames.push(flame);

  const coreGeo = new THREE.ConeGeometry(0.05, 0.7, 8);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = -Math.PI / 2 + 0.35;
  core.position.set(-0.23, 0.49, -1.45);
  core.visible = false;
  bikeBody.add(core);
  nitroFlames.push(core);

  // --- 8. MOUNT 3D MOTOGP RIDER (PEMBALAP) ---
  const { riderGroup, leftKneeSlider, rightKneeSlider } = createMotoGPRider(primColor, accColor);
  bikeBody.add(riderGroup);

  // Soft Contact Shadow Plane directly beneath the motorcycle wheels
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d');
  if (sCtx) {
    const gradient = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = gradient;
    sCtx.fillRect(0, 0, 128, 128);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 3.2),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  return {
    root,
    bikeBody,
    frontWheel,
    rearWheel,
    forkGroup,
    rider: riderGroup,
    leftKneeSlider,
    rightKneeSlider,
    exhaustPipes,
    headlights,
    nitroFlames,
    wheels,
    frontLeftWheel: frontWheel, // backward compatibility
    frontRightWheel: frontWheel,
    bodyMesh: noseCowl,
  };
}
