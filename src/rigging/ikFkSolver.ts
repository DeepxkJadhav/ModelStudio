/**
 * Model Studio - IK / FK Solver & FABRIK Engine (Section 25)
 * Analytical 2-bone limb IK + FABRIK multi-segment chain solver with IK/FK blending
 */

export interface BoneJoint {
  position: [number, number, number];
  length: number;
}

export class IKFKSolver {
  /**
   * Solves 2-bone analytical IK (e.g. UpperArm -> Forearm -> Hand)
   * Returns intermediate joint (elbow/knee) position constrained by pole vector
   */
  static solveTwoBoneIK(
    root: [number, number, number],
    target: [number, number, number],
    l1: number, // upper bone length
    l2: number, // lower bone length
    poleVector: [number, number, number] = [0, 0, 1]
  ): { jointPosition: [number, number, number]; reached: boolean } {
    const dx = target[0] - root[0];
    const dy = target[1] - root[1];
    const dz = target[2] - root[2];
    const targetDist = Math.hypot(dx, dy, dz);

    // Clamped distance to prevent numerical singularity
    const maxReach = l1 + l2 - 1e-4;
    const minReach = Math.abs(l1 - l2) + 1e-4;
    const d = Math.max(minReach, Math.min(maxReach, targetDist));

    // Law of cosines for angle at root joint
    const cosAngle1 = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
    const clampedCos1 = Math.max(-1.0, Math.min(1.0, cosAngle1));
    const angle1 = Math.acos(clampedCos1);

    // Direction vector from root to target
    const dirX = dx / targetDist;
    const dirY = dy / targetDist;
    const dirZ = dz / targetDist;

    // Normal orthogonal vector pointing towards pole
    const pDotD = poleVector[0] * dirX + poleVector[1] * dirY + poleVector[2] * dirZ;
    let orthoX = poleVector[0] - pDotD * dirX;
    let orthoY = poleVector[1] - pDotD * dirY;
    let orthoZ = poleVector[2] - pDotD * dirZ;
    const orthoLen = Math.hypot(orthoX, orthoY, orthoZ) || 1.0;
    orthoX /= orthoLen;
    orthoY /= orthoLen;
    orthoZ /= orthoLen;

    // Intermediate joint position: l1 * (cos(angle1) * dir + sin(angle1) * ortho)
    const sin1 = Math.sin(angle1);
    const cos1 = Math.cos(angle1);

    const jx = root[0] + l1 * (cos1 * dirX + sin1 * orthoX);
    const jy = root[1] + l1 * (cos1 * dirY + sin1 * orthoY);
    const jz = root[2] + l1 * (cos1 * dirZ + sin1 * orthoZ);

    return {
      jointPosition: [jx, jy, jz],
      reached: targetDist <= maxReach,
    };
  }

  /**
   * FABRIK solver for multi-segment continuous chains (spines, serpent coils, tails, tentacles)
   */
  static solveFABRIK(
    joints: BoneJoint[],
    target: [number, number, number],
    tolerance: number = 0.005,
    maxIterations: number = 20
  ): [number, number, number][] {
    const n = joints.length;
    if (n === 0) return [];
    if (n === 1) return [[joints[0].position[0], joints[0].position[1], joints[0].position[2]]];

    const positions: [number, number, number][] = joints.map(j => [...j.position]);
    const lengths: number[] = [];
    let totalLength = 0;

    for (let i = 0; i < n - 1; i++) {
      const p1 = positions[i];
      const p2 = positions[i + 1];
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]) || joints[i].length || 0.1;
      lengths.push(segLen);
      totalLength += segLen;
    }

    const rootPos: [number, number, number] = [...positions[0]];
    const distToRoot = Math.hypot(target[0] - rootPos[0], target[1] - rootPos[1], target[2] - rootPos[2]);

    // If target is unreachable, stretch directly toward target
    if (distToRoot >= totalLength) {
      const dirX = (target[0] - rootPos[0]) / distToRoot;
      const dirY = (target[1] - rootPos[1]) / distToRoot;
      const dirZ = (target[2] - rootPos[2]) / distToRoot;

      for (let i = 0; i < n - 1; i++) {
        positions[i + 1] = [
          positions[i][0] + dirX * lengths[i],
          positions[i][1] + dirY * lengths[i],
          positions[i][2] + dirZ * lengths[i],
        ];
      }
      return positions;
    }

    for (let iter = 0; iter < maxIterations; iter++) {
      // Check current error to target
      const end = positions[n - 1];
      const distToTarget = Math.hypot(end[0] - target[0], end[1] - target[1], end[2] - target[2]);
      if (distToTarget < tolerance) break;

      // Backward Pass: set end effector to target
      positions[n - 1] = [...target];
      for (let i = n - 2; i >= 0; i--) {
        const cur = positions[i];
        const next = positions[i + 1];
        const dx = cur[0] - next[0];
        const dy = cur[1] - next[1];
        const dz = cur[2] - next[2];
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const lambda = lengths[i] / d;

        positions[i] = [
          next[0] + dx * lambda,
          next[1] + dy * lambda,
          next[2] + dz * lambda,
        ];
      }

      // Forward Pass: anchor root back to rootPos
      positions[0] = [...rootPos];
      for (let i = 0; i < n - 1; i++) {
        const cur = positions[i];
        const next = positions[i + 1];
        const dx = next[0] - cur[0];
        const dy = next[1] - cur[1];
        const dz = next[2] - cur[2];
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const lambda = lengths[i] / d;

        positions[i + 1] = [
          cur[0] + dx * lambda,
          cur[1] + dy * lambda,
          cur[2] + dz * lambda,
        ];
      }
    }

    return positions;
  }

  /**
   * Blends between FK position and IK position
   */
  static blendFKIK(
    fkPos: [number, number, number],
    ikPos: [number, number, number],
    weight: number // 0 = FK, 1 = IK
  ): [number, number, number] {
    const w = Math.max(0, Math.min(1, weight));
    return [
      fkPos[0] * (1 - w) + ikPos[0] * w,
      fkPos[1] * (1 - w) + ikPos[1] * w,
      fkPos[2] * (1 - w) + ikPos[2] * w,
    ];
  }
}
