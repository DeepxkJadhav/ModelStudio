/**
 * Model Studio - Adaptive Skeleton Generator (Sections 10, 23)
 * Constructs species-specific skeletal rigs (Humanoid, Quadruped, Serpent, Bird, Fish, Creature)
 */

import { SpeciesCategory, SkeletonDefinition, BoneDefinition } from '../core/types';

export class SkeletonGenerator {
  /**
   * Generates a fully articulated skeleton definition matching the model's species and anatomy
   */
  static generateSkeleton(species: SpeciesCategory, customAnatomy?: any): SkeletonDefinition {
    switch (species) {
      case 'HUMANOID':
        return this.createHumanoidSkeleton();
      case 'QUADRUPED':
        return this.createQuadrupedSkeleton();
      case 'SERPENT':
        return this.createSerpentSkeleton();
      case 'BIRD':
        return this.createBirdSkeleton();
      case 'FISH':
        return this.createFishSkeleton();
      case 'INSECT':
        return this.createInsectSkeleton();
      case 'ARACHNID':
        return this.createArachnidSkeleton();
      default:
        return this.createCustomCreatureRig(species, customAnatomy);
    }
  }

  private static createInsectSkeleton(): SkeletonDefinition {
    const bones: BoneDefinition[] = [];
    bones.push({ name: 'Thorax_Root', parentName: null, position: [0, 0.4, 0], rotation: [0, 0, 0, 1], length: 0.15, role: 'root' });
    bones.push({ name: 'Head_Cranium', parentName: 'Thorax_Root', position: [0, 0.45, 0.22], rotation: [0, 0, 0, 1], length: 0.12, role: 'head' });
    bones.push({ name: 'Abdomen_Body', parentName: 'Thorax_Root', position: [0, 0.38, -0.25], rotation: [0, 0, 0, 1], length: 0.25, role: 'spine' });

    // 6 legs: Front, Middle, Rear (Left & Right)
    const legPairs = [
      { prefix: 'FL', name: 'FrontLeft', z: 0.12, sign: -1 },
      { prefix: 'ML', name: 'MidLeft', z: 0.0, sign: -1 },
      { prefix: 'RL', name: 'RearLeft', z: -0.12, sign: -1 },
      { prefix: 'FR', name: 'FrontRight', z: 0.12, sign: 1 },
      { prefix: 'MR', name: 'MidRight', z: 0.0, sign: 1 },
      { prefix: 'RR', name: 'RearRight', z: -0.12, sign: 1 },
    ];

    legPairs.forEach(lp => {
      const xBase = lp.sign * 0.12;
      const coxa = `${lp.prefix}_Coxa`;
      const femur = `${lp.prefix}_Femur`;
      const tibia = `${lp.prefix}_Tibia`;
      const tarsus = `${lp.prefix}_Tarsus`;

      bones.push({ name: coxa, parentName: 'Thorax_Root', position: [xBase, 0.38, lp.z], rotation: [0, 0, 0, 1], length: 0.1, role: 'leg' });
      bones.push({ name: femur, parentName: coxa, position: [xBase + lp.sign * 0.15, 0.48, lp.z], rotation: [0, 0, 0, 1], length: 0.18, role: 'leg' });
      bones.push({ name: tibia, parentName: femur, position: [xBase + lp.sign * 0.28, 0.25, lp.z], rotation: [0, 0, 0, 1], length: 0.2, role: 'leg' });
      bones.push({ name: tarsus, parentName: tibia, position: [xBase + lp.sign * 0.35, 0.02, lp.z], rotation: [0, 0, 0, 1], length: 0.08, role: 'foot' });
    });

    return {
      species: 'INSECT',
      rootBoneName: 'Thorax_Root',
      bones,
    };
  }

  private static createArachnidSkeleton(): SkeletonDefinition {
    const bones: BoneDefinition[] = [];
    bones.push({ name: 'Prosoma_Root', parentName: null, position: [0, 0.35, 0], rotation: [0, 0, 0, 1], length: 0.15, role: 'root' });
    bones.push({ name: 'Chelicerae', parentName: 'Prosoma_Root', position: [0, 0.32, 0.2], rotation: [0, 0, 0, 1], length: 0.08, role: 'head' });
    bones.push({ name: 'Opisthosoma', parentName: 'Prosoma_Root', position: [0, 0.4, -0.3], rotation: [0, 0, 0, 1], length: 0.3, role: 'spine' });

    // 8 legs
    for (let i = 1; i <= 4; i++) {
      [-1, 1].forEach(side => {
        const sidePrefix = side === -1 ? 'L' : 'R';
        const z = 0.15 - (i - 1) * 0.1;
        const x = side * 0.1;
        const b1 = `Leg${i}_${sidePrefix}_Coxa`;
        const b2 = `Leg${i}_${sidePrefix}_Femur`;
        const b3 = `Leg${i}_${sidePrefix}_Tibia`;
        const b4 = `Leg${i}_${sidePrefix}_Metatarsus`;

        bones.push({ name: b1, parentName: 'Prosoma_Root', position: [x, 0.35, z], rotation: [0, 0, 0, 1], length: 0.08, role: 'leg' });
        bones.push({ name: b2, parentName: b1, position: [x + side * 0.15, 0.48, z], rotation: [0, 0, 0, 1], length: 0.18, role: 'leg' });
        bones.push({ name: b3, parentName: b2, position: [x + side * 0.3, 0.22, z], rotation: [0, 0, 0, 1], length: 0.2, role: 'leg' });
        bones.push({ name: b4, parentName: b3, position: [x + side * 0.38, 0.02, z], rotation: [0, 0, 0, 1], length: 0.1, role: 'foot' });
      });
    }

    return {
      species: 'ARACHNID',
      rootBoneName: 'Prosoma_Root',
      bones,
    };
  }

  private static createCustomCreatureRig(species: SpeciesCategory, customAnatomy?: any): SkeletonDefinition {
    const bones: BoneDefinition[] = [];
    const rootName = 'CreaturePelvis';

    // 1. Core Pelvis & Spine
    bones.push({ name: rootName, parentName: null, position: [0, 0.75, 0], rotation: [0, 0, 0, 1], length: 0.18, role: 'root' });
    bones.push({ name: 'CreatureSpine1', parentName: rootName, position: [0, 0.9, 0], rotation: [0, 0, 0, 1], length: 0.18, role: 'spine' });
    bones.push({ name: 'CreatureChest', parentName: 'CreatureSpine1', position: [0, 1.1, 0.05], rotation: [0, 0, 0, 1], length: 0.2, role: 'chest' });
    bones.push({ name: 'CreatureNeck', parentName: 'CreatureChest', position: [0, 1.3, 0.1], rotation: [0, 0, 0, 1], length: 0.12, role: 'neck' });
    bones.push({ name: 'CreatureHead', parentName: 'CreatureNeck', position: [0, 1.45, 0.15], rotation: [0, 0, 0, 1], length: 0.18, role: 'head' });
    bones.push({ name: 'CreatureJaw', parentName: 'CreatureHead', position: [0, 1.4, 0.2], rotation: [0, 0, 0, 1], length: 0.1, role: 'jaw' });

    // Inspect custom anatomy parameters or default to user specification:
    // e.g. 6 legs, 2 wings, articulated tail, 2 upper limbs
    const weightBearingLegs = customAnatomy?.weightBearingLegs ?? 6;
    const hasWings = customAnatomy?.hasWings ?? true;
    const hasTail = customAnatomy?.hasTail ?? true;
    const armCount = customAnatomy?.manipulatorArms ?? 2;

    // 2. Legs: generate pairs based on weightBearingLegs
    const legPairs = Math.max(1, Math.floor(weightBearingLegs / 2));
    for (let i = 1; i <= legPairs; i++) {
      const zOffset = 0.15 - (i - 1) * 0.2;
      const parentBone = i === 1 ? 'CreatureChest' : 'CreaturePelvis';

      // Left leg
      const lHip = `Leg${i}_L_Hip`;
      const lKnee = `Leg${i}_L_Knee`;
      const lAnkle = `Leg${i}_L_Ankle`;
      const lFoot = `Leg${i}_L_Foot`;
      bones.push({ name: lHip, parentName: parentBone, position: [-0.22, 0.7 - (i - 1) * 0.05, zOffset], rotation: [0, 0, 0, 1], length: 0.25, role: 'leg' });
      bones.push({ name: lKnee, parentName: lHip, position: [-0.24, 0.42 - (i - 1) * 0.05, zOffset + 0.02], rotation: [0, 0, 0, 1], length: 0.25, role: 'leg' });
      bones.push({ name: lAnkle, parentName: lKnee, position: [-0.25, 0.15 - (i - 1) * 0.05, zOffset], rotation: [0, 0, 0, 1], length: 0.12, role: 'leg' });
      bones.push({ name: lFoot, parentName: lAnkle, position: [-0.25, 0.03, zOffset + 0.04], rotation: [0, 0, 0, 1], length: 0.08, role: 'foot' });

      // Right leg
      const rHip = `Leg${i}_R_Hip`;
      const rKnee = `Leg${i}_R_Knee`;
      const rAnkle = `Leg${i}_R_Ankle`;
      const rFoot = `Leg${i}_R_Foot`;
      bones.push({ name: rHip, parentName: parentBone, position: [0.22, 0.7 - (i - 1) * 0.05, zOffset], rotation: [0, 0, 0, 1], length: 0.25, role: 'leg' });
      bones.push({ name: rKnee, parentName: rHip, position: [0.24, 0.42 - (i - 1) * 0.05, zOffset + 0.02], rotation: [0, 0, 0, 1], length: 0.25, role: 'leg' });
      bones.push({ name: rAnkle, parentName: rKnee, position: [0.25, 0.15 - (i - 1) * 0.05, zOffset], rotation: [0, 0, 0, 1], length: 0.12, role: 'leg' });
      bones.push({ name: rFoot, parentName: rAnkle, position: [0.25, 0.03, zOffset + 0.04], rotation: [0, 0, 0, 1], length: 0.08, role: 'foot' });
    }

    // 3. Upper Manipulator Limbs (Arms)
    if (armCount >= 2) {
      bones.push({ name: 'UpperArm_L_Shoulder', parentName: 'CreatureChest', position: [-0.25, 1.15, 0], rotation: [0, 0, 0, 1], length: 0.2, role: 'arm' });
      bones.push({ name: 'UpperArm_L_Elbow', parentName: 'UpperArm_L_Shoulder', position: [-0.42, 0.95, 0], rotation: [0, 0, 0, 1], length: 0.2, role: 'arm' });
      bones.push({ name: 'UpperArm_L_Hand', parentName: 'UpperArm_L_Elbow', position: [-0.58, 0.78, 0], rotation: [0, 0, 0, 1], length: 0.1, role: 'hand' });

      bones.push({ name: 'UpperArm_R_Shoulder', parentName: 'CreatureChest', position: [0.25, 1.15, 0], rotation: [0, 0, 0, 1], length: 0.2, role: 'arm' });
      bones.push({ name: 'UpperArm_R_Elbow', parentName: 'UpperArm_R_Shoulder', position: [0.42, 0.95, 0], rotation: [0, 0, 0, 1], length: 0.2, role: 'arm' });
      bones.push({ name: 'UpperArm_R_Hand', parentName: 'UpperArm_R_Elbow', position: [0.58, 0.78, 0], rotation: [0, 0, 0, 1], length: 0.1, role: 'hand' });
    }

    // 4. Aerofoil Wings
    if (hasWings) {
      bones.push({ name: 'Wing_L_Humerus', parentName: 'CreatureChest', position: [-0.18, 1.2, -0.08], rotation: [0, 0, 0, 1], length: 0.35, role: 'wing' });
      bones.push({ name: 'Wing_L_Radius', parentName: 'Wing_L_Humerus', position: [-0.48, 1.35, -0.1], rotation: [0, 0, 0, 1], length: 0.35, role: 'wing' });
      bones.push({ name: 'Wing_L_Carpus', parentName: 'Wing_L_Radius', position: [-0.78, 1.45, -0.12], rotation: [0, 0, 0, 1], length: 0.3, role: 'wing' });

      bones.push({ name: 'Wing_R_Humerus', parentName: 'CreatureChest', position: [0.18, 1.2, -0.08], rotation: [0, 0, 0, 1], length: 0.35, role: 'wing' });
      bones.push({ name: 'Wing_R_Radius', parentName: 'Wing_R_Humerus', position: [0.48, 1.35, -0.1], rotation: [0, 0, 0, 1], length: 0.35, role: 'wing' });
      bones.push({ name: 'Wing_R_Carpus', parentName: 'Wing_R_Radius', position: [0.78, 1.45, -0.12], rotation: [0, 0, 0, 1], length: 0.3, role: 'wing' });
    }

    // 5. Articulated Tail
    if (hasTail) {
      const tailSegments = customAnatomy?.tailSegments ?? 5;
      let prevTail = rootName;
      for (let s = 1; s <= tailSegments; s++) {
        const tName = `CreatureTail_${s}`;
        const z = -0.15 - s * 0.12;
        const y = 0.7 - s * 0.05;
        bones.push({ name: tName, parentName: prevTail, position: [0, y, z], rotation: [0, 0, 0, 1], length: 0.12, role: 'tail' });
        prevTail = tName;
      }
    }

    return {
      species,
      rootBoneName: rootName,
      bones,
    };
  }

  private static createHumanoidSkeleton(): SkeletonDefinition {
    const bones: BoneDefinition[] = [];

    // Core Root & Spine
    bones.push({ name: 'Hips', parentName: null, position: [0, 0.95, 0], rotation: [0, 0, 0, 1], length: 0.15, role: 'hips' });
    bones.push({ name: 'Spine', parentName: 'Hips', position: [0, 1.1, 0], rotation: [0, 0, 0, 1], length: 0.15, role: 'spine' });
    bones.push({ name: 'Chest', parentName: 'Spine', position: [0, 1.25, 0], rotation: [0, 0, 0, 1], length: 0.18, role: 'chest' });
    bones.push({ name: 'Neck', parentName: 'Chest', position: [0, 1.45, 0], rotation: [0, 0, 0, 1], length: 0.1, role: 'neck' });
    bones.push({ name: 'Head', parentName: 'Neck', position: [0, 1.58, 0], rotation: [0, 0, 0, 1], length: 0.18, role: 'head' });
    bones.push({ name: 'Jaw', parentName: 'Head', position: [0, 1.52, 0.06], rotation: [0, 0, 0, 1], length: 0.08, role: 'jaw' });
    bones.push({ name: 'LeftEye', parentName: 'Head', position: [-0.04, 1.62, 0.08], rotation: [0, 0, 0, 1], length: 0.03, role: 'leftEye' });
    bones.push({ name: 'RightEye', parentName: 'Head', position: [0.04, 1.62, 0.08], rotation: [0, 0, 0, 1], length: 0.03, role: 'rightEye' });

    // Left Arm
    bones.push({ name: 'LeftShoulder', parentName: 'Chest', position: [-0.08, 1.35, 0], rotation: [0, 0, 0, 1], length: 0.14, role: 'leftShoulder' });
    bones.push({ name: 'LeftUpperArm', parentName: 'LeftShoulder', position: [-0.22, 1.33, 0], rotation: [0, 0, 0, 1], length: 0.22, role: 'leftUpperArm' });
    bones.push({ name: 'LeftLowerArm', parentName: 'LeftUpperArm', position: [-0.44, 1.15, 0], rotation: [0, 0, 0, 1], length: 0.2, role: 'leftLowerArm' });
    bones.push({ name: 'LeftHand', parentName: 'LeftLowerArm', position: [-0.62, 0.95, 0], rotation: [0, 0, 0, 1], length: 0.08, role: 'leftHand' });

    // Left Fingers (5 fingers, 3 phalanges each)
    const fingers = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'];
    fingers.forEach(f => {
      bones.push({ name: `LeftHand${f}1`, parentName: 'LeftHand', position: [-0.65, 0.92, 0], rotation: [0, 0, 0, 1], length: 0.03 });
      bones.push({ name: `LeftHand${f}2`, parentName: `LeftHand${f}1`, position: [-0.67, 0.89, 0], rotation: [0, 0, 0, 1], length: 0.025 });
      bones.push({ name: `LeftHand${f}3`, parentName: `LeftHand${f}2`, position: [-0.69, 0.86, 0], rotation: [0, 0, 0, 1], length: 0.02 });
    });

    // Right Arm
    bones.push({ name: 'RightShoulder', parentName: 'Chest', position: [0.08, 1.35, 0], rotation: [0, 0, 0, 1], length: 0.14, role: 'rightShoulder' });
    bones.push({ name: 'RightUpperArm', parentName: 'RightShoulder', position: [0.22, 1.33, 0], rotation: [0, 0, 0, 1], length: 0.22, role: 'rightUpperArm' });
    bones.push({ name: 'RightLowerArm', parentName: 'RightUpperArm', position: [0.44, 1.15, 0], rotation: [0, 0, 0, 1], length: 0.2, role: 'rightLowerArm' });
    bones.push({ name: 'RightHand', parentName: 'RightLowerArm', position: [0.62, 0.95, 0], rotation: [0, 0, 0, 1], length: 0.08, role: 'rightHand' });

    // Right Fingers (5 fingers, 3 phalanges each)
    fingers.forEach(f => {
      bones.push({ name: `RightHand${f}1`, parentName: 'RightHand', position: [0.65, 0.92, 0], rotation: [0, 0, 0, 1], length: 0.03 });
      bones.push({ name: `RightHand${f}2`, parentName: `RightHand${f}1`, position: [0.67, 0.89, 0], rotation: [0, 0, 0, 1], length: 0.025 });
      bones.push({ name: `RightHand${f}3`, parentName: `RightHand${f}2`, position: [0.69, 0.86, 0], rotation: [0, 0, 0, 1], length: 0.02 });
    });

    // Left Leg
    bones.push({ name: 'LeftUpperLeg', parentName: 'Hips', position: [-0.12, 0.88, 0], rotation: [0, 0, 0, 1], length: 0.4, role: 'leftUpperLeg' });
    bones.push({ name: 'LeftLowerLeg', parentName: 'LeftUpperLeg', position: [-0.13, 0.48, 0.02], rotation: [0, 0, 0, 1], length: 0.38, role: 'leftLowerLeg' });
    bones.push({ name: 'LeftFoot', parentName: 'LeftLowerLeg', position: [-0.14, 0.1, -0.02], rotation: [0, 0, 0, 1], length: 0.12, role: 'leftFoot' });
    bones.push({ name: 'LeftToes', parentName: 'LeftFoot', position: [-0.14, 0.02, 0.08], rotation: [0, 0, 0, 1], length: 0.06, role: 'leftToes' });

    // Right Leg
    bones.push({ name: 'RightUpperLeg', parentName: 'Hips', position: [0.12, 0.88, 0], rotation: [0, 0, 0, 1], length: 0.4, role: 'rightUpperLeg' });
    bones.push({ name: 'RightLowerLeg', parentName: 'RightUpperLeg', position: [0.13, 0.48, 0.02], rotation: [0, 0, 0, 1], length: 0.38, role: 'rightLowerLeg' });
    bones.push({ name: 'RightFoot', parentName: 'RightLowerLeg', position: [0.14, 0.1, -0.02], rotation: [0, 0, 0, 1], length: 0.12, role: 'rightFoot' });
    bones.push({ name: 'RightToes', parentName: 'RightFoot', position: [0.14, 0.02, 0.08], rotation: [0, 0, 0, 1], length: 0.06, role: 'rightToes' });

    return {
      species: 'HUMANOID',
      rootBoneName: 'Hips',
      bones,
    };
  }

  private static createQuadrupedSkeleton(): SkeletonDefinition {
    const bones: BoneDefinition[] = [];

    // Pelvis & Spine Chain
    bones.push({ name: 'RootPelvis', parentName: null, position: [0, 0.68, -0.2], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'LumbarSpine', parentName: 'RootPelvis', position: [0, 0.7, 0.0], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'ThoracicSpine', parentName: 'LumbarSpine', position: [0, 0.72, 0.2], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'Neck', parentName: 'ThoracicSpine', position: [0, 0.78, 0.38], rotation: [0, 0, 0, 1], length: 0.16 });
    bones.push({ name: 'Head', parentName: 'Neck', position: [0, 0.86, 0.52], rotation: [0, 0, 0, 1], length: 0.18 });

    // Tail (5 segments)
    bones.push({ name: 'Tail1', parentName: 'RootPelvis', position: [0, 0.65, -0.3], rotation: [0, 0, 0, 1], length: 0.1 });
    bones.push({ name: 'Tail2', parentName: 'Tail1', position: [0, 0.62, -0.4], rotation: [0, 0, 0, 1], length: 0.1 });
    bones.push({ name: 'Tail3', parentName: 'Tail2', position: [0, 0.58, -0.5], rotation: [0, 0, 0, 1], length: 0.1 });
    bones.push({ name: 'Tail4', parentName: 'Tail3', position: [0, 0.53, -0.6], rotation: [0, 0, 0, 1], length: 0.1 });

    // Front Left Leg
    bones.push({ name: 'FL_Scapula', parentName: 'ThoracicSpine', position: [-0.16, 0.65, 0.2], rotation: [0, 0, 0, 1], length: 0.18 });
    bones.push({ name: 'FL_Humerus', parentName: 'FL_Scapula', position: [-0.17, 0.48, 0.2], rotation: [0, 0, 0, 1], length: 0.18 });
    bones.push({ name: 'FL_Radius', parentName: 'FL_Humerus', position: [-0.17, 0.3, 0.22], rotation: [0, 0, 0, 1], length: 0.18 });
    bones.push({ name: 'FL_Paw', parentName: 'FL_Radius', position: [-0.17, 0.08, 0.23], rotation: [0, 0, 0, 1], length: 0.08 });

    // Front Right Leg
    bones.push({ name: 'FR_Scapula', parentName: 'ThoracicSpine', position: [0.16, 0.65, 0.2], rotation: [0, 0, 0, 1], length: 0.18 });
    bones.push({ name: 'FR_Humerus', parentName: 'FR_Scapula', position: [0.17, 0.48, 0.2], rotation: [0, 0, 0, 1], length: 0.18 });
    bones.push({ name: 'FR_Radius', parentName: 'FR_Humerus', position: [0.17, 0.3, 0.22], rotation: [0, 0, 0, 1], length: 0.18 });
    bones.push({ name: 'FR_Paw', parentName: 'FR_Radius', position: [0.17, 0.08, 0.23], rotation: [0, 0, 0, 1], length: 0.08 });

    // Rear Left Leg
    bones.push({ name: 'RL_Femur', parentName: 'RootPelvis', position: [-0.15, 0.62, -0.22], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'RL_Tibia', parentName: 'RL_Femur', position: [-0.16, 0.42, -0.26], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'RL_Hock', parentName: 'RL_Tibia', position: [-0.16, 0.22, -0.3], rotation: [0, 0, 0, 1], length: 0.14 });
    bones.push({ name: 'RL_Paw', parentName: 'RL_Hock', position: [-0.16, 0.08, -0.28], rotation: [0, 0, 0, 1], length: 0.08 });

    // Rear Right Leg
    bones.push({ name: 'RR_Femur', parentName: 'RootPelvis', position: [0.15, 0.62, -0.22], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'RR_Tibia', parentName: 'RR_Femur', position: [0.16, 0.42, -0.26], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'RR_Hock', parentName: 'RR_Tibia', position: [0.16, 0.22, -0.3], rotation: [0, 0, 0, 1], length: 0.14 });
    bones.push({ name: 'RR_Paw', parentName: 'RR_Hock', position: [0.16, 0.08, -0.28], rotation: [0, 0, 0, 1], length: 0.08 });

    return {
      species: 'QUADRUPED',
      rootBoneName: 'RootPelvis',
      bones,
    };
  }

  private static createSerpentSkeleton(): SkeletonDefinition {
    const bones: BoneDefinition[] = [];
    const segmentCount = 16;
    let prevName: string | null = null;

    for (let i = 0; i < segmentCount; i++) {
      const name = i === 0 ? 'SerpentHead' : `SpineVertebra_${i}`;
      const z = 0.8 - i * 0.11;
      const y = i === 0 ? 0.22 : 0.12;

      bones.push({
        name,
        parentName: prevName,
        position: [0, y, z],
        rotation: [0, 0, 0, 1],
        length: 0.11,
      });
      prevName = name;
    }

    // Add jaw bone to head
    bones.push({
      name: 'SerpentJaw',
      parentName: 'SerpentHead',
      position: [0, 0.15, 0.82],
      rotation: [0, 0, 0, 1],
      length: 0.08,
    });

    return {
      species: 'SERPENT',
      rootBoneName: 'SerpentHead',
      bones,
    };
  }

  private static createBirdSkeleton(): SkeletonDefinition {
    const bones: BoneDefinition[] = [];

    bones.push({ name: 'KeelBody', parentName: null, position: [0, 0.62, 0], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'Neck', parentName: 'KeelBody', position: [0, 0.76, 0.14], rotation: [0, 0, 0, 1], length: 0.15 });
    bones.push({ name: 'HeadBeak', parentName: 'Neck', position: [0, 0.9, 0.24], rotation: [0, 0, 0, 1], length: 0.14 });

    // Left Wing (3 folding bones)
    bones.push({ name: 'LeftHumerusWing', parentName: 'KeelBody', position: [-0.18, 0.68, 0.05], rotation: [0, 0, 0, 1], length: 0.25 });
    bones.push({ name: 'LeftRadiusWing', parentName: 'LeftHumerusWing', position: [-0.38, 0.68, 0], rotation: [0, 0, 0, 1], length: 0.25 });
    bones.push({ name: 'LeftCarpusWing', parentName: 'LeftRadiusWing', position: [-0.58, 0.65, -0.05], rotation: [0, 0, 0, 1], length: 0.2 });

    // Right Wing
    bones.push({ name: 'RightHumerusWing', parentName: 'KeelBody', position: [0.18, 0.68, 0.05], rotation: [0, 0, 0, 1], length: 0.25 });
    bones.push({ name: 'RightRadiusWing', parentName: 'RightHumerusWing', position: [0.38, 0.68, 0], rotation: [0, 0, 0, 1], length: 0.25 });
    bones.push({ name: 'RightCarpusWing', parentName: 'RightRadiusWing', position: [0.58, 0.65, -0.05], rotation: [0, 0, 0, 1], length: 0.2 });

    // Talons
    bones.push({ name: 'LeftTalon', parentName: 'KeelBody', position: [-0.1, 0.25, -0.04], rotation: [0, 0, 0, 1], length: 0.25 });
    bones.push({ name: 'RightTalon', parentName: 'KeelBody', position: [0.1, 0.25, -0.04], rotation: [0, 0, 0, 1], length: 0.25 });

    // Tail Feathers
    bones.push({ name: 'TailFan', parentName: 'KeelBody', position: [0, 0.55, -0.25], rotation: [0, 0, 0, 1], length: 0.2 });

    return {
      species: 'BIRD',
      rootBoneName: 'KeelBody',
      bones,
    };
  }

  private static createFishSkeleton(): SkeletonDefinition {
    const bones: BoneDefinition[] = [];
    const segmentCount = 8;
    let prevName: string | null = null;

    for (let i = 0; i < segmentCount; i++) {
      const name = i === 0 ? 'FishCranium' : `FishSpine_${i}`;
      const z = 0.5 - i * 0.15;
      bones.push({
        name,
        parentName: prevName,
        position: [0, 0.5, z],
        rotation: [0, 0, 0, 1],
        length: 0.15,
      });
      prevName = name;
    }

    // Fins
    bones.push({ name: 'DorsalFin', parentName: 'FishSpine_2', position: [0, 0.72, 0.1], rotation: [0, 0, 0, 1], length: 0.18 });
    bones.push({ name: 'LeftPectoralFin', parentName: 'FishSpine_1', position: [-0.16, 0.45, 0.25], rotation: [0, 0, 0, 1], length: 0.15 });
    bones.push({ name: 'RightPectoralFin', parentName: 'FishSpine_1', position: [0.16, 0.45, 0.25], rotation: [0, 0, 0, 1], length: 0.15 });
    bones.push({ name: 'CaudalFin', parentName: 'FishSpine_7', position: [0, 0.5, -0.65], rotation: [0, 0, 0, 1], length: 0.25 });

    return {
      species: 'FISH',
      rootBoneName: 'FishCranium',
      bones,
    };
  }

  private static createCreatureSkeleton(species: SpeciesCategory): SkeletonDefinition {
    const bones: BoneDefinition[] = [];
    bones.push({ name: 'CorePelvis', parentName: null, position: [0, 0.7, 0], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'CoreChest', parentName: 'CorePelvis', position: [0, 1.0, 0], rotation: [0, 0, 0, 1], length: 0.25 });
    bones.push({ name: 'Cephalon', parentName: 'CoreChest', position: [0, 1.25, 0.05], rotation: [0, 0, 0, 1], length: 0.2 });
    bones.push({ name: 'AppendageL', parentName: 'CoreChest', position: [-0.3, 0.8, 0], rotation: [0, 0, 0, 1], length: 0.3 });
    bones.push({ name: 'AppendageR', parentName: 'CoreChest', position: [0.3, 0.8, 0], rotation: [0, 0, 0, 1], length: 0.3 });
    bones.push({ name: 'CaudalAppendage', parentName: 'CorePelvis', position: [0, 0.6, -0.3], rotation: [0, 0, 0, 1], length: 0.3 });

    return {
      species,
      rootBoneName: 'CorePelvis',
      bones,
    };
  }
}
