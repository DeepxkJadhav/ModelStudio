/**
 * Model Studio - Hair Physics & Inertial Dynamics (Section 35)
 * Simulates hair strands responding to skeletal motion, inertia, gravity, and collisions
 */

import { HairSimulationParams, CollisionEnvelope } from '../core/types';
import { CollisionSystem } from './collisionSystem';

export class HairSimulator {
  private params: HairSimulationParams;
  private restPositions: Float32Array;
  private currentPositions: Float32Array;
  private velocities: Float32Array;
  private envelopes: CollisionEnvelope[];

  constructor(
    vertices: Float32Array | number[],
    params: HairSimulationParams,
    envelopes: CollisionEnvelope[] = []
  ) {
    this.params = params;
    this.restPositions = new Float32Array(vertices);
    this.currentPositions = new Float32Array(vertices);
    this.velocities = new Float32Array(vertices.length);
    this.envelopes = envelopes;
  }

  step(dt: number = 0.016, headVelocity: [number, number, number] = [0, 0, 0]): void {
    if (!this.params.enabled) return;

    const vertexCount = this.restPositions.length / 3;
    const gravity = -9.81 * (this.params.gravity / 9.81);
    const damping = Math.max(0.8, 1.0 - this.params.damping * 0.15);
    const stiffness = this.params.stiffness;

    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const rx = this.restPositions[idx];
      const ry = this.restPositions[idx + 1];
      const rz = this.restPositions[idx + 2];

      // Hair roots on crown/scalp remain stationary
      const isRoot = ry > 1.68;
      if (isRoot) continue;

      // Spring force returning to rest pose
      const fx = (rx - this.currentPositions[idx]) * stiffness * 40;
      const fy = (ry - this.currentPositions[idx + 1]) * stiffness * 40 + gravity * 0.5;
      const fz = (rz - this.currentPositions[idx + 2]) * stiffness * 40;

      // Add head inertial reaction
      this.velocities[idx] = (this.velocities[idx] + (fx - headVelocity[0] * 5) * dt) * damping;
      this.velocities[idx + 1] = (this.velocities[idx + 1] + (fy - headVelocity[1] * 5) * dt) * damping;
      this.velocities[idx + 2] = (this.velocities[idx + 2] + (fz - headVelocity[2] * 5) * dt) * damping;

      this.currentPositions[idx] += this.velocities[idx] * dt;
      this.currentPositions[idx + 1] += this.velocities[idx + 1] * dt;
      this.currentPositions[idx + 2] += this.velocities[idx + 2] * dt;

      // Collision avoidance with head/shoulder collider
      const pt: [number, number, number] = [
        this.currentPositions[idx],
        this.currentPositions[idx + 1],
        this.currentPositions[idx + 2],
      ];
      const col = CollisionSystem.testPointCollision(pt, this.envelopes, this.params.collisionMargin);
      if (col.collided) {
        this.currentPositions[idx] = col.correctedPoint[0];
        this.currentPositions[idx + 1] = col.correctedPoint[1];
        this.currentPositions[idx + 2] = col.correctedPoint[2];
      }
    }
  }

  writePositionsToBuffer(outBuffer: Float32Array): void {
    outBuffer.set(this.currentPositions);
  }
}
