/**
 * Model Studio - Adaptive Locomotion Engine & Procedural Motion (Sections 28, 29)
 * Procedural species-specific locomotion: Humanoid, Quadruped, Serpent, Bird, Fish, Creature
 */

import { SpeciesCategory, SkeletonDefinition } from '../core/types';

export interface BoneTransformFrame {
  [boneName: string]: {
    position?: [number, number, number];
    rotation: [number, number, number, number]; // quaternion [x, y, z, w]
  };
}

export class LocomotionEngine {
  /**
   * Evaluates procedural skeletal poses for a given species and time t (seconds)
   */
  static evaluatePose(
    species: SpeciesCategory,
    action: string,
    t: number,
    skeleton: SkeletonDefinition,
    speed: number = 1.0
  ): BoneTransformFrame {
    switch (species) {
      case 'HUMANOID':
        return this.evaluateHumanoidPose(action, t * speed);
      case 'QUADRUPED':
        return this.evaluateQuadrupedPose(action, t * speed);
      case 'SERPENT':
        return this.evaluateSerpentPose(action, t * speed);
      case 'BIRD':
        return this.evaluateBirdPose(action, t * speed);
      case 'FISH':
        return this.evaluateFishPose(action, t * speed);
      case 'INSECT':
      case 'ARACHNID':
        return this.evaluateHexapodPose(action, t * speed);
      default:
        return this.evaluateCreaturePose(action, t * speed, skeleton);
    }
  }

  // Quaternions from Euler XYZ
  private static eulerToQuat(pitch: number, yaw: number, roll: number): [number, number, number, number] {
    const c1 = Math.cos(pitch / 2), s1 = Math.sin(pitch / 2);
    const c2 = Math.cos(yaw / 2), s2 = Math.sin(yaw / 2);
    const c3 = Math.cos(roll / 2), s3 = Math.sin(roll / 2);

    return [
      s1 * c2 * c3 + c1 * s2 * s3,
      c1 * s2 * c3 - s1 * c2 * s3,
      c1 * c2 * s3 + s1 * s2 * c3,
      c1 * c2 * c3 - s1 * s2 * s3,
    ];
  }

  private static evaluateHumanoidPose(action: string, t: number): BoneTransformFrame {
    const frame: BoneTransformFrame = {};
    const norm = (val: number) => val;

    if (action === 'WALK' || action === 'RUN') {
      const freq = action === 'RUN' ? 7.0 : 4.5;
      const amp = action === 'RUN' ? 0.75 : 0.45;

      const phase = t * freq;
      const lLegAngle = Math.sin(phase) * amp;
      const rLegAngle = -Math.sin(phase) * amp;

      // Hips vertical bounce and sway
      frame['Hips'] = {
        position: [Math.sin(phase * 2) * 0.02, 0.95 + Math.abs(Math.sin(phase)) * 0.03, 0],
        rotation: this.eulerToQuat(0, Math.sin(phase) * 0.08, 0),
      };

      // Legs
      frame['LeftUpperLeg'] = { rotation: this.eulerToQuat(lLegAngle, 0, 0) };
      frame['LeftLowerLeg'] = { rotation: this.eulerToQuat(Math.max(0, -lLegAngle * 1.2), 0, 0) };
      frame['LeftFoot'] = { rotation: this.eulerToQuat(Math.sin(phase + 0.5) * 0.2, 0, 0) };

      frame['RightUpperLeg'] = { rotation: this.eulerToQuat(rLegAngle, 0, 0) };
      frame['RightLowerLeg'] = { rotation: this.eulerToQuat(Math.max(0, -rLegAngle * 1.2), 0, 0) };
      frame['RightFoot'] = { rotation: this.eulerToQuat(Math.sin(phase + Math.PI + 0.5) * 0.2, 0, 0) };

      // Arms counter-swing
      frame['LeftUpperArm'] = { rotation: this.eulerToQuat(-lLegAngle * 0.8, 0, 0.1) };
      frame['LeftLowerArm'] = { rotation: this.eulerToQuat(0.3 + Math.abs(lLegAngle * 0.4), 0, 0) };

      frame['RightUpperArm'] = { rotation: this.eulerToQuat(-rLegAngle * 0.8, 0, -0.1) };
      frame['RightLowerArm'] = { rotation: this.eulerToQuat(0.3 + Math.abs(rLegAngle * 0.4), 0, 0) };

      // Spine & Head
      frame['Spine'] = { rotation: this.eulerToQuat(0.05, -Math.sin(phase) * 0.05, 0) };
      frame['Head'] = { rotation: this.eulerToQuat(0, Math.sin(phase) * 0.03, 0) };
    } else if (action === 'CROUCH') {
      frame['Hips'] = {
        position: [0, 0.62, 0],
        rotation: this.eulerToQuat(0.2, 0, 0),
      };
      frame['LeftUpperLeg'] = { rotation: this.eulerToQuat(1.2, 0, -0.1) };
      frame['LeftLowerLeg'] = { rotation: this.eulerToQuat(-1.8, 0, 0) };
      frame['LeftFoot'] = { rotation: this.eulerToQuat(0.6, 0, 0) };

      frame['RightUpperLeg'] = { rotation: this.eulerToQuat(1.2, 0, 0.1) };
      frame['RightLowerLeg'] = { rotation: this.eulerToQuat(-1.8, 0, 0) };
      frame['RightFoot'] = { rotation: this.eulerToQuat(0.6, 0, 0) };

      frame['Spine'] = { rotation: this.eulerToQuat(0.3, 0, 0) };
      frame['LeftUpperArm'] = { rotation: this.eulerToQuat(0.4, 0, 0.2) };
      frame['RightUpperArm'] = { rotation: this.eulerToQuat(0.4, 0, -0.2) };
    } else if (action === 'JUMP') {
      const jumpCycle = (t % 1.5) / 1.5;
      const jumpHeight = Math.sin(jumpCycle * Math.PI) * 0.6;
      frame['Hips'] = {
        position: [0, 0.95 + jumpHeight, 0],
        rotation: this.eulerToQuat(-0.1, 0, 0),
      };
      frame['LeftUpperLeg'] = { rotation: this.eulerToQuat(0.4, 0, 0) };
      frame['RightUpperLeg'] = { rotation: this.eulerToQuat(0.4, 0, 0) };
      frame['LeftUpperArm'] = { rotation: this.eulerToQuat(-1.2, 0, 0) };
      frame['RightUpperArm'] = { rotation: this.eulerToQuat(-1.2, 0, 0) };
    } else if (action === 'WAVE') {
      const waveAngle = Math.sin(t * 7.0) * 0.45;
      frame['Hips'] = { rotation: [0, 0, 0, 1] };
      frame['Spine'] = { rotation: this.eulerToQuat(0, 0.05, 0) };
      frame['Head'] = { rotation: this.eulerToQuat(0, -0.1, 0) };
      frame['LeftUpperArm'] = { rotation: this.eulerToQuat(0.1, 0, 0.1) };
      // Right arm raised with hand waving left/right
      frame['RightUpperArm'] = { rotation: this.eulerToQuat(0.4, 0, -1.3) };
      frame['RightLowerArm'] = { rotation: this.eulerToQuat(0.8, waveAngle, 0.2) };
      frame['RightHand'] = { rotation: this.eulerToQuat(0, waveAngle * 0.6, 0) };
    } else if (action === 'TURN_LEFT' || action === 'TURN') {
      const yaw = action === 'TURN' ? Math.sin(t * 2.0) * 0.8 : -0.7;
      frame['Hips'] = { rotation: this.eulerToQuat(0, yaw * 0.6, 0) };
      frame['Spine'] = { rotation: this.eulerToQuat(0, yaw * 0.4, 0) };
      frame['Head'] = { rotation: this.eulerToQuat(0, yaw * 0.3, 0) };
    } else if (action === 'TURN_RIGHT') {
      const yaw = 0.7;
      frame['Hips'] = { rotation: this.eulerToQuat(0, yaw * 0.6, 0) };
      frame['Spine'] = { rotation: this.eulerToQuat(0, yaw * 0.4, 0) };
      frame['Head'] = { rotation: this.eulerToQuat(0, yaw * 0.3, 0) };
    } else {
      // IDLE breathing
      const breath = Math.sin(t * 2.0);
      frame['Hips'] = { rotation: [0, 0, 0, 1] };
      frame['Spine'] = { rotation: this.eulerToQuat(breath * 0.02, 0, 0) };
      frame['Chest'] = { rotation: this.eulerToQuat(breath * 0.03, 0, 0) };
      frame['Head'] = { rotation: this.eulerToQuat(-breath * 0.015, 0, 0) };
      frame['LeftUpperArm'] = { rotation: this.eulerToQuat(0.05, 0, 0.08) };
      frame['RightUpperArm'] = { rotation: this.eulerToQuat(0.05, 0, -0.08) };
    }

    return frame;
  }

  private static evaluateQuadrupedPose(action: string, t: number): BoneTransformFrame {
    const frame: BoneTransformFrame = {};
    const freq = action === 'RUN' ? 6.0 : 4.0;
    const phase = t * freq;
    const amp = 0.4;

    // Diagonal pair gait: FL + RR vs FR + RL
    const flAngle = Math.sin(phase) * amp;
    const rrAngle = Math.sin(phase) * amp;
    const frAngle = Math.sin(phase + Math.PI) * amp;
    const rlAngle = Math.sin(phase + Math.PI) * amp;

    frame['RootPelvis'] = {
      position: [0, 0.68 + Math.abs(Math.sin(phase * 2)) * 0.02, 0],
      rotation: this.eulerToQuat(0, Math.sin(phase) * 0.04, 0),
    };

    frame['FL_Humerus'] = { rotation: this.eulerToQuat(flAngle, 0, 0) };
    frame['FR_Humerus'] = { rotation: this.eulerToQuat(frAngle, 0, 0) };
    frame['RL_Femur'] = { rotation: this.eulerToQuat(rlAngle, 0, 0) };
    frame['RR_Femur'] = { rotation: this.eulerToQuat(rrAngle, 0, 0) };

    // Wagging tail
    frame['Tail1'] = { rotation: this.eulerToQuat(0, Math.sin(phase * 2) * 0.3, 0) };
    frame['Tail2'] = { rotation: this.eulerToQuat(0, Math.sin(phase * 2 + 0.4) * 0.4, 0) };

    return frame;
  }

  private static evaluateSerpentPose(action: string, t: number): BoneTransformFrame {
    const frame: BoneTransformFrame = {};
    const waveFreq = action === 'STRIKE' ? 6.0 : 3.0;

    // Propagate traveling sinusoidal yaw wave along vertebrae
    for (let i = 0; i < 16; i++) {
      const boneName = i === 0 ? 'SerpentHead' : `SpineVertebra_${i}`;
      const phaseOffset = i * 0.4;
      const yawAngle = Math.sin(t * waveFreq - phaseOffset) * (action === 'COIL' ? 0.6 : 0.35);

      if (action === 'STRIKE' && i === 0) {
        // Strike lunge forward
        frame[boneName] = { rotation: this.eulerToQuat(0.4, 0, 0) };
      } else {
        frame[boneName] = { rotation: this.eulerToQuat(0, yawAngle, 0) };
      }
    }

    return frame;
  }

  private static evaluateBirdPose(action: string, t: number): BoneTransformFrame {
    const frame: BoneTransformFrame = {};
    const freq = action === 'FLAP' || action === 'FLY' ? 5.5 : 2.0;
    const flapAngle = Math.sin(t * freq) * 0.65;

    frame['KeelBody'] = {
      position: [0, 0.62 + (action === 'FLY' ? 0.4 : 0), 0],
      rotation: this.eulerToQuat(action === 'FLY' ? 0.15 : 0, 0, 0),
    };

    // Wings flapping symmetrically along roll/pitch
    frame['LeftHumerusWing'] = { rotation: this.eulerToQuat(0, 0, -flapAngle) };
    frame['LeftRadiusWing'] = { rotation: this.eulerToQuat(0, 0, -flapAngle * 0.8) };
    frame['RightHumerusWing'] = { rotation: this.eulerToQuat(0, 0, flapAngle) };
    frame['RightRadiusWing'] = { rotation: this.eulerToQuat(0, 0, flapAngle * 0.8) };

    return frame;
  }

  private static evaluateFishPose(action: string, t: number): BoneTransformFrame {
    const frame: BoneTransformFrame = {};
    const freq = 4.0;

    for (let i = 0; i < 8; i++) {
      const boneName = i === 0 ? 'FishCranium' : `FishSpine_${i}`;
      const yaw = Math.sin(t * freq - i * 0.5) * (0.15 + i * 0.05);
      frame[boneName] = { rotation: this.eulerToQuat(0, yaw, 0) };
    }

    return frame;
  }

  private static evaluateHexapodPose(action: string, t: number): BoneTransformFrame {
    const frame: BoneTransformFrame = {};
    const freq = action === 'RUN' ? 8.0 : 5.0;
    const phase = t * freq;
    const amp = 0.35;

    // Alternating Tripod Gait:
    // Tripod 1: FL, MR, RL
    // Tripod 2: FR, ML, RR
    const t1 = Math.sin(phase) * amp;
    const t2 = -Math.sin(phase) * amp;

    ['FL_Femur', 'MR_Femur', 'RL_Femur'].forEach(b => {
      frame[b] = { rotation: this.eulerToQuat(t1, 0, 0) };
    });
    ['FR_Femur', 'ML_Femur', 'RR_Femur'].forEach(b => {
      frame[b] = { rotation: this.eulerToQuat(t2, 0, 0) };
    });

    frame['Thorax_Root'] = {
      position: [0, 0.4 + Math.abs(Math.sin(phase * 2)) * 0.02, 0],
      rotation: this.eulerToQuat(0, Math.sin(phase) * 0.05, 0),
    };
    frame['Head_Cranium'] = { rotation: this.eulerToQuat(0, -Math.sin(phase) * 0.03, 0) };

    return frame;
  }

  private static evaluateCreaturePose(action: string, t: number, skeleton?: SkeletonDefinition): BoneTransformFrame {
    const frame: BoneTransformFrame = {};
    const freq = 4.0;
    const phase = t * freq;
    const sway = Math.sin(t * 3.0) * 0.2;

    // Core body sway
    frame['CreatureChest'] = { rotation: this.eulerToQuat(0, sway * 0.4, 0) };
    frame['CoreChest'] = { rotation: this.eulerToQuat(0, sway * 0.5, 0) };
    frame['CreatureHead'] = { rotation: this.eulerToQuat(0, -sway * 0.2, 0) };

    // Multi-leg gait (Leg1..Leg3 pairs)
    for (let i = 1; i <= 4; i++) {
      const legPhase = phase + (i * Math.PI) / 3;
      const angleL = Math.sin(legPhase) * 0.35;
      const angleR = -Math.sin(legPhase) * 0.35;
      frame[`Leg${i}_L_Hip`] = { rotation: this.eulerToQuat(angleL, 0, 0) };
      frame[`Leg${i}_R_Hip`] = { rotation: this.eulerToQuat(angleR, 0, 0) };
    }

    // Wings flapping
    const flap = Math.sin(t * 6.0) * 0.45;
    frame['Wing_L_Humerus'] = { rotation: this.eulerToQuat(0, 0, -flap) };
    frame['Wing_R_Humerus'] = { rotation: this.eulerToQuat(0, 0, flap) };

    // Upper Arms
    frame['UpperArm_L_Shoulder'] = { rotation: this.eulerToQuat(Math.sin(t * 2) * 0.2, 0, 0.1) };
    frame['UpperArm_R_Shoulder'] = { rotation: this.eulerToQuat(-Math.sin(t * 2) * 0.2, 0, -0.1) };

    // Tail wave
    for (let s = 1; s <= 6; s++) {
      const tailAngle = Math.sin(t * 4.0 - s * 0.4) * 0.25;
      frame[`CreatureTail_${s}`] = { rotation: this.eulerToQuat(0, tailAngle, 0) };
    }

    // Fallback appendage bones
    frame['AppendageL'] = { rotation: this.eulerToQuat(sway, 0, 0.3) };
    frame['AppendageR'] = { rotation: this.eulerToQuat(-sway, 0, -0.3) };
    frame['CaudalAppendage'] = { rotation: this.eulerToQuat(0, Math.sin(t * 4.0) * 0.4, 0) };

    return frame;
  }
}
