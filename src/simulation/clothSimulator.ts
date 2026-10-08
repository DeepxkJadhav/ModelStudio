/**
 * Model Studio - Verlet Mass-Spring Cloth Simulator (Section 20)
 * Simulates cloth dynamics with distance constraints, gravity, damping, wind, and body collision
 */

import { ClothSimulationParams, CollisionEnvelope } from '../core/types';
import { CollisionSystem } from './collisionSystem';

export interface ClothParticle {
  pos: [number, number, number];
  oldPos: [number, number, number];
  pinned: boolean;
}

export interface ClothSpringConstraint {
  p1: number;
  p2: number;
  restLength: number;
  stiffness: number;
}

export class ClothSimulator {
  private particles: ClothParticle[] = [];
  private constraints: ClothSpringConstraint[] = [];
  private params: ClothSimulationParams;
  private envelopes: CollisionEnvelope[] = [];

  constructor(
    vertices: Float32Array | number[],
    params: ClothSimulationParams,
    envelopes: CollisionEnvelope[] = []
  ) {
    this.params = params;
    this.envelopes = envelopes;
    this.initializeFromMesh(vertices);
  }

  private initializeFromMesh(vertices: Float32Array | number[]): void {
    const vertexCount = vertices.length / 3;
    this.particles = [];
    this.constraints = [];

    // Initialize particles
    for (let i = 0; i < vertexCount; i++) {
      const x = vertices[i * 3];
      const y = vertices[i * 3 + 1];
      const z = vertices[i * 3 + 2];

      // Pin waist/collar top vertices
      const pinned = y > 1.35 || (y > 0.98 && y < 1.05);

      this.particles.push({
        pos: [x, y, z],
        oldPos: [x, y, z],
        pinned,
      });
    }

    // Connect neighbouring particles as distance springs
    const sampleLimit = Math.min(vertexCount, 400);
    for (let i = 0; i < sampleLimit; i++) {
      for (let j = i + 1; j < Math.min(sampleLimit, i + 8); j++) {
        const p1 = this.particles[i].pos;
        const p2 = this.particles[j].pos;
        const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);

        if (d > 0.01 && d < 0.12) {
          this.constraints.push({
            p1: i,
            p2: j,
            restLength: d,
            stiffness: this.params.stiffness,
          });
        }
      }
    }
  }

  step(dt: number = 0.016): void {
    if (!this.params.enabled) return;

    const gravityAcc = -9.81 * (this.params.gravity / 9.81);
    const damping = Math.max(0.9, Math.min(0.99, 1.0 - this.params.damping * 0.1));
    const [windX, windY, windZ] = this.params.wind;

    // 1. Verlet Integration
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;

      const vx = (p.pos[0] - p.oldPos[0]) * damping + windX * dt * dt;
      const vy = (p.pos[1] - p.oldPos[1]) * damping + (gravityAcc + windY) * dt * dt;
      const vz = (p.pos[2] - p.oldPos[2]) * damping + windZ * dt * dt;

      p.oldPos = [...p.pos];
      p.pos[0] += vx;
      p.pos[1] += vy;
      p.pos[2] += vz;
    }

    // 2. Solve Distance Constraints (Gauss-Seidel iterations)
    const iterations = 4;
    for (let iter = 0; iter < iterations; iter++) {
      for (const c of this.constraints) {
        const p1 = this.particles[c.p1];
        const p2 = this.particles[c.p2];

        const dx = p2.pos[0] - p1.pos[0];
        const dy = p2.pos[1] - p1.pos[1];
        const dz = p2.pos[2] - p1.pos[2];
        const currentDist = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = (currentDist - c.restLength) / currentDist;

        const factor = 0.5 * c.stiffness;
        if (!p1.pinned) {
          p1.pos[0] += dx * factor * diff;
          p1.pos[1] += dy * factor * diff;
          p1.pos[2] += dz * factor * diff;
        }
        if (!p2.pinned) {
          p2.pos[0] -= dx * factor * diff;
          p2.pos[1] -= dy * factor * diff;
          p2.pos[2] -= dz * factor * diff;
        }
      }

      // 3. Solve Body Collisions
      for (const p of this.particles) {
        if (!p.pinned) {
          const res = CollisionSystem.testPointCollision(p.pos, this.envelopes, this.params.collisionMargin);
          if (res.collided) {
            p.pos = res.correctedPoint;
          }
        }
      }
    }
  }

  writePositionsToBuffer(outBuffer: Float32Array): void {
    for (let i = 0; i < this.particles.length; i++) {
      outBuffer[i * 3] = this.particles[i].pos[0];
      outBuffer[i * 3 + 1] = this.particles[i].pos[1];
      outBuffer[i * 3 + 2] = this.particles[i].pos[2];
    }
  }
}
