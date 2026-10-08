/**
 * Model Studio - Collision Envelopes & Body Proxies (Section 21)
 * Bone-attached collision capsules and spheres to prevent penetration with cloth and hair
 */

import { CollisionEnvelope } from '../core/types';

export class CollisionSystem {
  static createDefaultHumanoidEnvelopes(): CollisionEnvelope[] {
    return [
      { name: 'HeadCollider', type: 'sphere', boneAttachment: 'Head', center: [0, 1.62, 0], radius: 0.14 },
      { name: 'TorsoCollider', type: 'capsule', boneAttachment: 'Chest', center: [0, 1.25, 0], radius: 0.18, height: 0.35 },
      { name: 'PelvisCollider', type: 'capsule', boneAttachment: 'Hips', center: [0, 0.95, 0], radius: 0.16, height: 0.22 },

      // Limbs
      { name: 'LeftArmCollider', type: 'capsule', boneAttachment: 'LeftUpperArm', center: [-0.32, 1.24, 0], radius: 0.08, height: 0.24 },
      { name: 'RightArmCollider', type: 'capsule', boneAttachment: 'RightUpperArm', center: [0.32, 1.24, 0], radius: 0.08, height: 0.24 },
      { name: 'LeftThighCollider', type: 'capsule', boneAttachment: 'LeftUpperLeg', center: [-0.12, 0.68, 0], radius: 0.1, height: 0.38 },
      { name: 'RightThighCollider', type: 'capsule', boneAttachment: 'RightUpperLeg', center: [0.12, 0.68, 0], radius: 0.1, height: 0.38 },
    ];
  }

  /**
   * Tests whether a point penetrates any collision envelope and returns push-out displacement
   */
  static testPointCollision(
    point: [number, number, number],
    envelopes: CollisionEnvelope[],
    margin: number = 0.01
  ): { collided: boolean; correctedPoint: [number, number, number] } {
    let [px, py, pz] = point;
    let collided = false;

    for (const env of envelopes) {
      const [cx, cy, cz] = env.center;
      let targetY = cy;

      if (env.type === 'capsule' && env.height) {
        const halfH = env.height * 0.5;
        targetY = Math.max(cy - halfH, Math.min(cy + halfH, py));
      }

      const dx = px - cx;
      const dy = py - targetY;
      const dz = pz - cz;
      const dist = Math.hypot(dx, dy, dz);
      const totalRadius = env.radius + margin;

      if (dist < totalRadius) {
        collided = true;
        if (dist < 1e-5) {
          // Point is right on the center axis: push outward along forward Z axis
          pz = cz + totalRadius;
        } else {
          const factor = totalRadius / dist;
          px = cx + dx * factor;
          py = targetY + dy * factor;
          pz = cz + dz * factor;
        }
      }
    }

    return { collided, correctedPoint: [px, py, pz] };
  }
}
