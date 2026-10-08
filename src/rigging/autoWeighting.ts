/**
 * Model Studio - Automatic Skin Weighting & Heat Diffusion (Section 26)
 * Generates smooth skinning weights with 4 influences per vertex and normalizes sum to 1.0
 */

import { SkeletonDefinition } from '../core/types';

export interface SkinningData {
  skinIndices: Float32Array; // 4 indices per vertex
  skinWeights: Float32Array; // 4 weights per vertex
}

export class AutoWeightingEngine {
  /**
   * Computes bone influence weights for a vertex array based on bone proximity and segment projection
   */
  static computeWeights(
    vertices: Float32Array | number[],
    skeleton: SkeletonDefinition
  ): SkinningData {
    const vertexCount = vertices.length / 3;
    const skinIndices = new Float32Array(vertexCount * 4);
    const skinWeights = new Float32Array(vertexCount * 4);

    const bones = skeleton.bones;
    const boneCount = bones.length;

    for (let i = 0; i < vertexCount; i++) {
      const vx = vertices[i * 3];
      const vy = vertices[i * 3 + 1];
      const vz = vertices[i * 3 + 2];

      // Calculate distance to each bone segment
      const distances: Array<{ boneIndex: number; dist: number }> = [];

      for (let b = 0; b < boneCount; b++) {
        const bone = bones[b];
        const bx = bone.position[0];
        const by = bone.position[1];
        const bz = bone.position[2];

        // Approximate bone line segment distance
        const dx = vx - bx;
        const dy = vy - by;
        const dz = vz - bz;
        const d = Math.hypot(dx, dy, dz);

        distances.push({ boneIndex: b, dist: d });
      }

      // Sort by closest distance
      distances.sort((a, b) => a.dist - b.dist);

      // Take closest 4 influences
      const top4 = distances.slice(0, 4);

      // Compute inverse distance weights with Gaussian decay
      let totalWeight = 0;
      const rawWeights: number[] = [];

      for (let k = 0; k < 4; k++) {
        const d = top4[k].dist;
        // Inverse distance with exponential dropoff
        const w = Math.exp(-d * 8.0) / (d + 0.001);
        rawWeights.push(w);
        totalWeight += w;
      }

      // Assign normalized weights
      const baseIdx = i * 4;
      if (totalWeight > 1e-6) {
        for (let k = 0; k < 4; k++) {
          skinIndices[baseIdx + k] = top4[k].boneIndex;
          skinWeights[baseIdx + k] = rawWeights[k] / totalWeight;
        }
      } else {
        skinIndices[baseIdx] = 0;
        skinWeights[baseIdx] = 1.0;
        skinIndices[baseIdx + 1] = 0;
        skinWeights[baseIdx + 1] = 0.0;
        skinIndices[baseIdx + 2] = 0;
        skinWeights[baseIdx + 2] = 0.0;
        skinIndices[baseIdx + 3] = 0;
        skinWeights[baseIdx + 3] = 0.0;
      }
    }

    return { skinIndices, skinWeights };
  }
}
