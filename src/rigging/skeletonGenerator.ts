/**
 * Model Studio - Adaptive Skeleton Generator (Sections 10, 23)
 * Constructs species-specific skeletal rigs (Humanoid, Quadruped, Serpent, Bird, Fish, Creature)
 */

import { SpeciesCategory, SkeletonDefinition, BoneDefinition } from '../core/types';

export class SkeletonGenerator {
  /**
   * Generates a fully articulated skeleton definition matching the model's species and anatomy
   */
  static generateSkeleton(species: SpeciesCategory): SkeletonDefinition {
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
      default:
        return this.createCreatureSkeleton(species);
    }
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
