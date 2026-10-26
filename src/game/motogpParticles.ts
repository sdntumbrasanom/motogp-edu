import * as THREE from 'three';
import { WeatherType } from '../types/game';

interface SparkParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  active: boolean;
}

/**
 * Procedural glow texture for titanium sparks, rain droplets, and tire smoke
 */
function createSparkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 240, 160, 0.9)');
    grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function createSmokeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(240, 244, 248, 0.6)');
    grad.addColorStop(0.5, 'rgba(203, 213, 225, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/**
 * High-performance titanium knee sparks system.
 * Simulates intense yellow/white glowing sparks showering onto asphalt when knee slider touches down!
 */
export class KneeSparksSystem {
  private points: THREE.Points;
  private particles: SparkParticle[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private maxParticles = 120;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private sparkLight: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.35,
        size: 0,
        r: 1,
        g: 0.95,
        b: 0.7,
        active: false,
      });
      this.positions[i * 3 + 1] = -100;
      this.sizes[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.45,
      map: createSparkTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // Dynamic yellow spark flash light directly under knee
    this.sparkLight = new THREE.PointLight(0xfef08a, 0, 4.5);
    scene.add(this.sparkLight);
  }

  public emit(kneeX: number, kneeY: number, kneeZ: number, bikeSpeed: number, count = 3) {
    const speedRatio = Math.max(0.5, bikeSpeed / 120);
    for (let c = 0; c < count; c++) {
      const p = this.particles.find((item) => !item.active);
      if (!p) break;

      p.active = true;
      p.maxLife = 0.15 + Math.random() * 0.25;
      p.life = p.maxLife;

      // Spawn at road contact patch of the knee puck
      p.x = kneeX + (Math.random() - 0.5) * 0.08;
      p.y = 0.04 + Math.random() * 0.06;
      p.z = kneeZ + (Math.random() - 0.5) * 0.1;

      // Shower backward with bounce trajectory
      p.vx = (Math.random() - 0.5) * 1.8;
      p.vy = 0.4 + Math.random() * 1.2; // upward bounce off tarmac
      p.vz = -speedRatio * 6.5 - (Math.random() * 3.5 + 2.0); // spray backwards

      p.size = 0.35 + Math.random() * 0.45;
      p.r = 1.0;
      p.g = 0.9 + Math.random() * 0.1;
      p.b = 0.4 + Math.random() * 0.4;
    }
  }

  public update(dt: number, isSparking: boolean, kneeX = 0, kneeZ = 0) {
    let activeCount = 0;

    if (isSparking) {
      this.sparkLight.position.set(kneeX, 0.2, kneeZ);
      this.sparkLight.intensity = THREE.MathUtils.damp(this.sparkLight.intensity, 2.8, 20, dt);
    } else {
      this.sparkLight.intensity = THREE.MathUtils.damp(this.sparkLight.intensity, 0, 18, dt);
    }

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.geometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      activeCount++;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      // Physics: gravity pulls sparks down onto tarmac
      p.vy -= 9.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Bounce on tarmac if hit Y <= 0.02
      if (p.y <= 0.02) {
        p.y = 0.02;
        p.vy = Math.abs(p.vy) * 0.35; // lossy bounce
      }

      const progress = 1 - p.life / p.maxLife;
      const fade = Math.max(0, 1 - progress);

      this.positions[i * 3 + 0] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;

      // Color transition from white-hot to orange-red spark
      this.colors[i * 3 + 0] = p.r * fade;
      this.colors[i * 3 + 1] = (p.g * (1 - progress * 0.7)) * fade;
      this.colors[i * 3 + 2] = (p.b * (1 - progress * 0.95)) * fade;

      this.sizes[i] = p.size * (1 - progress * 0.6);
    }

    if (activeCount > 0 || isSparking) {
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.points);
    scene.remove(this.sparkLight);
    this.geometry.dispose();
    this.material.dispose();
    this.sparkLight.dispose();
  }
}

/**
 * Dynamic tire smoke & rain spray (rooster tail) system
 */
export class TireSpraySystem {
  private points: THREE.Points;
  private particles: SparkParticle[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private maxParticles = 90;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.6,
        size: 0,
        r: 1,
        g: 1,
        b: 1,
        active: false,
      });
      this.positions[i * 3 + 1] = -100;
      this.sizes[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 1.2,
      map: createSmokeTexture(),
      transparent: true,
      depthWrite: false,
      vertexColors: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  public emit(tireX: number, tireZ: number, bikeSpeed: number, isRain = false, count = 2) {
    for (let c = 0; c < count; c++) {
      const p = this.particles.find((item) => !item.active);
      if (!p) break;

      p.active = true;
      p.maxLife = isRain ? 0.35 + Math.random() * 0.3 : 0.45 + Math.random() * 0.35;
      p.life = p.maxLife;

      p.x = tireX + (Math.random() - 0.5) * 0.2;
      p.y = 0.08 + Math.random() * 0.1;
      p.z = tireZ - 1.1 + (Math.random() - 0.5) * 0.2;

      const speedFactor = Math.max(0.4, bikeSpeed / 100);
      p.vx = (Math.random() - 0.5) * 0.8;
      // High arching rooster tail in rain
      p.vy = isRain ? 1.5 + Math.random() * 2.5 : 0.3 + Math.random() * 0.5;
      p.vz = -speedFactor * 6.0 - Math.random() * 3.0;

      p.size = isRain ? 0.8 + Math.random() * 0.6 : 1.2 + Math.random() * 0.8;

      if (isRain) {
        // Translucent white water droplets
        p.r = 0.85;
        p.g = 0.92;
        p.b = 0.98;
      } else {
        // Soft tire burnout smoke
        p.r = 0.88;
        p.g = 0.88;
        p.b = 0.9;
      }
    }
  }

  public update(dt: number) {
    let activeCount = 0;
    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.geometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      activeCount++;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Expand cloud as it rises
      const progress = 1 - p.life / p.maxLife;
      const fade = Math.max(0, 1 - progress) * 0.7;

      this.positions[i * 3 + 0] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;

      this.colors[i * 3 + 0] = p.r * fade;
      this.colors[i * 3 + 1] = p.g * fade;
      this.colors[i * 3 + 2] = p.b * fade;

      this.sizes[i] = p.size * (1 + progress * 2.0);
    }

    if (activeCount > 0) {
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * Violent collision sparks & carbon fiber debris explosion system
 */
export class CollisionSparksSystem {
  private points: THREE.Points;
  private particles: SparkParticle[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private maxParticles = 80;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.5,
        size: 0,
        r: 1,
        g: 0.5,
        b: 0.1,
        active: false,
      });
      this.positions[i * 3 + 1] = -100;
      this.sizes[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.55,
      map: createSparkTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  public triggerImpact(impactX: number, impactY: number, impactZ: number, count = 35) {
    for (let c = 0; c < count; c++) {
      const p = this.particles.find((item) => !item.active);
      if (!p) break;

      p.active = true;
      p.maxLife = 0.25 + Math.random() * 0.45;
      p.life = p.maxLife;

      p.x = impactX + (Math.random() - 0.5) * 0.3;
      p.y = impactY + (Math.random() - 0.5) * 0.3;
      p.z = impactZ + (Math.random() - 0.5) * 0.3;

      // Radial spherical burst
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = 4.0 + Math.random() * 8.0;

      p.vx = Math.cos(theta) * Math.cos(phi) * speed;
      p.vy = Math.sin(phi) * speed + 2.5; // upward kick
      p.vz = Math.sin(theta) * Math.cos(phi) * speed;

      p.size = 0.4 + Math.random() * 0.5;
      p.r = 1.0;
      p.g = 0.5 + Math.random() * 0.4;
      p.b = 0.1;
    }
  }

  public update(dt: number) {
    let activeCount = 0;
    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.geometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      activeCount++;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      p.vy -= 14.0 * dt; // gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      if (p.y <= 0.02) {
        p.y = 0.02;
        p.vy = Math.abs(p.vy) * 0.4;
      }

      const progress = 1 - p.life / p.maxLife;
      const fade = Math.max(0, 1 - progress);

      this.positions[i * 3 + 0] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;

      this.colors[i * 3 + 0] = p.r * fade;
      this.colors[i * 3 + 1] = p.g * fade;
      this.colors[i * 3 + 2] = p.b * fade;

      this.sizes[i] = p.size * (1 - progress * 0.5);
    }

    if (activeCount > 0) {
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * Atmospheric 3D rain system centered around the player's camera
 */
export class RainAtmosphereSystem {
  private points: THREE.Points;
  private positions: Float32Array;
  private count = 900;
  private boxWidth = 55;
  private boxHeight = 28;
  private boxDepth = 75;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3 + 0] = (Math.random() - 0.5) * this.boxWidth;
      this.positions[i * 3 + 1] = Math.random() * this.boxHeight;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * this.boxDepth;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Linear elongated rain streaks
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.5, 'rgba(186, 230, 253, 0.6)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(2, 0, 4, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.6,
      map: tex,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  public update(dt: number, camX: number, camZ: number, bikeSpeed: number) {
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const fallSpeed = 38 + (bikeSpeed / 100) * 12;

    for (let i = 0; i < this.count; i++) {
      // Falling down and trailing slightly backwards
      this.positions[i * 3 + 1] -= fallSpeed * dt;
      this.positions[i * 3 + 2] -= (bikeSpeed * 0.28) * dt;

      // Wrap around relative to camera
      if (this.positions[i * 3 + 1] < 0) {
        this.positions[i * 3 + 1] = this.boxHeight;
        this.positions[i * 3 + 0] = camX + (Math.random() - 0.5) * this.boxWidth;
        this.positions[i * 3 + 2] = camZ + (Math.random() - 0.5) * this.boxDepth;
      }
    }
    pos.needsUpdate = true;
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.points);
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
