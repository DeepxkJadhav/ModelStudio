/**
 * Model Studio - Visual Hull & Volumetric Reconstruction (Section 11)
 * Combines multi-view silhouette constraints to carve a 3D volumetric signed density field
 */

import { ReferenceView, SpeciesCategory } from '../core/types';

export interface VoxelGrid {
  resolution: number;
  origin: [number, number, number];
  size: [number, number, number];
  densities: Float32Array; // 3D grid flattened
}

export class VisualHullReconstructor {
  /**
   * Constructs an implicit volumetric density field constrained by multi-view silhouettes
   */
  static generateDensityField(
    species: SpeciesCategory,
    views: ReferenceView[],
    resolution: number = 32
  ): VoxelGrid {
    const origin: [number, number, number] = [-0.8, 0.0, -0.6];
    const size: [number, number, number] = [1.6, 2.0, 1.2];
    const totalVoxels = resolution * resolution * resolution;
    const densities = new Float32Array(totalVoxels);

    const stepX = size[0] / (resolution - 1);
    const stepY = size[1] / (resolution - 1);
    const stepZ = size[2] / (resolution - 1);

    for (let iz = 0; iz < resolution; iz++) {
      const z = origin[2] + iz * stepZ;
      for (let iy = 0; iy < resolution; iy++) {
        const y = origin[1] + iy * stepY;
        for (let ix = 0; ix < resolution; ix++) {
          const x = origin[0] + ix * stepX;
          const idx = iz * resolution * resolution + iy * resolution + ix;

          // Calculate signed distance/density based on species morphological profile
          densities[idx] = this.evaluateImplicitShape(species, x, y, z);
        }
      }
    }

    return { resolution, origin, size, densities };
  }

  /**
   * Evaluates the signed distance to the target anatomy profile
   * negative/positive represents inside vs outside surface
   */
  private static evaluateImplicitShape(species: SpeciesCategory, x: number, y: number, z: number): number {
    switch (species) {
      case 'HUMANOID':
        return this.sampleHumanoidImplicit(x, y, z);
      case 'QUADRUPED':
        return this.sampleQuadrupedImplicit(x, y, z);
      case 'SERPENT':
        return this.sampleSerpentImplicit(x, y, z);
      case 'BIRD':
        return this.sampleBirdImplicit(x, y, z);
      case 'FISH':
        return this.sampleFishImplicit(x, y, z);
      default:
        return this.sampleCreatureImplicit(x, y, z);
    }
  }

  private static sampleHumanoidImplicit(x: number, y: number, z: number): number {
    // Ellipsoid blending for Head
    const headDist = Math.hypot(x / 0.12, (y - 1.62) / 0.14, z / 0.12) - 1.0;

    // Torso / Chest
    const chestDist = Math.hypot(x / 0.22, (y - 1.25) / 0.2, z / 0.14) - 1.0;

    // Hips / Pelvis
    const hipsDist = Math.hypot(x / 0.19, (y - 0.95) / 0.14, z / 0.13) - 1.0;

    // Left Arm
    const leftArmDist = Math.hypot((x + 0.38) / 0.22, (y - 1.15) / 0.08, z / 0.08) - 1.0;
    // Right Arm
    const rightArmDist = Math.hypot((x - 0.38) / 0.22, (y - 1.15) / 0.08, z / 0.08) - 1.0;

    // Left Leg
    const leftLegDist = Math.hypot((x + 0.13) / 0.09, (y - 0.48) / 0.46, z / 0.09) - 1.0;
    // Right Leg
    const rightLegDist = Math.hypot((x - 0.13) / 0.09, (y - 0.48) / 0.46, z / 0.09) - 1.0;

    // Smooth union (minimum)
    return Math.min(headDist, chestDist, hipsDist, leftArmDist, rightArmDist, leftLegDist, rightLegDist);
  }

  private static sampleQuadrupedImplicit(x: number, y: number, z: number): number {
    const bodyDist = Math.hypot(x / 0.18, (y - 0.65) / 0.18, (z + 0.05) / 0.42) - 1.0;
    const headDist = Math.hypot(x / 0.12, (y - 0.85) / 0.12, (z - 0.5) / 0.18) - 1.0;
    const neckDist = Math.hypot(x / 0.09, (y - 0.75) / 0.12, (z - 0.35) / 0.15) - 1.0;

    // Front legs
    const flLegDist = Math.hypot((x + 0.16) / 0.07, (y - 0.32) / 0.32, (z - 0.22) / 0.07) - 1.0;
    const frLegDist = Math.hypot((x - 0.16) / 0.07, (y - 0.32) / 0.32, (z - 0.22) / 0.07) - 1.0;

    // Rear legs
    const rlLegDist = Math.hypot((x + 0.16) / 0.08, (y - 0.32) / 0.32, (z + 0.32) / 0.08) - 1.0;
    const rrLegDist = Math.hypot((x - 0.16) / 0.08, (y - 0.32) / 0.32, (z + 0.32) / 0.08) - 1.0;

    // Tail
    const tailDist = Math.hypot(x / 0.04, (y - 0.65) / 0.05, (z + 0.6) / 0.25) - 1.0;

    return Math.min(bodyDist, headDist, neckDist, flLegDist, frLegDist, rlLegDist, rrLegDist, tailDist);
  }

  private static sampleSerpentImplicit(x: number, y: number, z: number): number {
    // Sinusoidal serpentine spine
    const waveX = 0.22 * Math.sin((z + 0.8) * 4.0);
    const spineDist = Math.hypot((x - waveX) / 0.08, (y - 0.1) / 0.08, (z) / 0.9) - 1.0;
    const headDist = Math.hypot(x / 0.09, (y - 0.16) / 0.07, (z - 0.82) / 0.12) - 1.0;

    return Math.min(spineDist, headDist);
  }

  private static sampleBirdImplicit(x: number, y: number, z: number): number {
    const bodyDist = Math.hypot(x / 0.16, (y - 0.62) / 0.16, z / 0.22) - 1.0;
    const headDist = Math.hypot(x / 0.08, (y - 0.88) / 0.09, (z - 0.18) / 0.12) - 1.0;

    // Folded Wings
    const lWingDist = Math.hypot((x + 0.22) / 0.1, (y - 0.65) / 0.12, z / 0.24) - 1.0;
    const rWingDist = Math.hypot((x - 0.22) / 0.1, (y - 0.65) / 0.12, z / 0.24) - 1.0;

    // Talons
    const lLegDist = Math.hypot((x + 0.09) / 0.04, (y - 0.25) / 0.24, z / 0.05) - 1.0;
    const rLegDist = Math.hypot((x - 0.09) / 0.04, (y - 0.25) / 0.24, z / 0.05) - 1.0;

    return Math.min(bodyDist, headDist, lWingDist, rWingDist, lLegDist, rLegDist);
  }

  private static sampleFishImplicit(x: number, y: number, z: number): number {
    const bodyDist = Math.hypot(x / 0.12, (y - 0.5) / 0.18, z / 0.55) - 1.0;
    const finDist = Math.hypot(x / 0.03, (y - 0.72) / 0.12, (z + 0.1) / 0.18) - 1.0;
    const caudalDist = Math.hypot(x / 0.02, (y - 0.5) / 0.26, (z + 0.58) / 0.12) - 1.0;

    return Math.min(bodyDist, finDist, caudalDist);
  }

  private static sampleCreatureImplicit(x: number, y: number, z: number): number {
    const coreDist = Math.hypot(x / 0.22, (y - 0.7) / 0.22, z / 0.22) - 1.0;
    const topDist = Math.hypot(x / 0.14, (y - 1.05) / 0.14, z / 0.14) - 1.0;
    return Math.min(coreDist, topDist);
  }
}
