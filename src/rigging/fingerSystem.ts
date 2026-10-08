/**
 * Model Studio - Full Finger Rigging & Gesture System (Section 24)
 * Individual 5-finger articulated joint controls (Thumb, Index, Middle, Ring, Little) with gesture poses
 */

export interface FingerJointPose {
  proximal: [number, number, number]; // euler angles [pitch, yaw, roll]
  intermediate: [number, number, number];
  distal: [number, number, number];
}

export interface HandPose {
  thumb: FingerJointPose;
  index: FingerJointPose;
  middle: FingerJointPose;
  ring: FingerJointPose;
  little: FingerJointPose;
}

export type HandGesturePreset = 'RELAXED' | 'FIST' | 'POINTING' | 'GRIP' | 'OPEN_PALM' | 'PEACE' | 'THUMBS_UP';

export class FingerSystem {
  static getGesturePreset(preset: HandGesturePreset): HandPose {
    const flatZero: FingerJointPose = {
      proximal: [0, 0, 0],
      intermediate: [0, 0, 0],
      distal: [0, 0, 0],
    };

    const curledPhalanges = (curl: number): FingerJointPose => ({
      proximal: [curl * 0.7, 0, 0],
      intermediate: [curl * 0.9, 0, 0],
      distal: [curl * 0.6, 0, 0],
    });

    switch (preset) {
      case 'FIST':
        return {
          thumb: { proximal: [0.6, 0.4, 0.3], intermediate: [0.8, 0, 0], distal: [0.8, 0, 0] },
          index: curledPhalanges(1.4),
          middle: curledPhalanges(1.45),
          ring: curledPhalanges(1.45),
          little: curledPhalanges(1.4),
        };
      case 'POINTING':
        return {
          thumb: { proximal: [0.6, 0.4, 0.3], intermediate: [0.8, 0, 0], distal: [0.8, 0, 0] },
          index: { proximal: [0.05, 0, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
          middle: curledPhalanges(1.45),
          ring: curledPhalanges(1.45),
          little: curledPhalanges(1.4),
        };
      case 'GRIP':
        return {
          thumb: { proximal: [0.5, 0.3, 0.2], intermediate: [0.6, 0, 0], distal: [0.5, 0, 0] },
          index: curledPhalanges(0.9),
          middle: curledPhalanges(0.95),
          ring: curledPhalanges(0.95),
          little: curledPhalanges(0.9),
        };
      case 'PEACE':
        return {
          thumb: { proximal: [0.6, 0.4, 0.3], intermediate: [0.8, 0, 0], distal: [0.8, 0, 0] },
          index: { proximal: [0, 0.1, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
          middle: { proximal: [0, -0.1, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
          ring: curledPhalanges(1.45),
          little: curledPhalanges(1.4),
        };
      case 'THUMBS_UP':
        return {
          thumb: { proximal: [-0.4, -0.2, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
          index: curledPhalanges(1.4),
          middle: curledPhalanges(1.45),
          ring: curledPhalanges(1.45),
          little: curledPhalanges(1.4),
        };
      case 'OPEN_PALM':
        return {
          thumb: { proximal: [0, 0.3, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
          index: { proximal: [0, 0.08, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
          middle: flatZero,
          ring: { proximal: [0, -0.06, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
          little: { proximal: [0, -0.12, 0], intermediate: [0, 0, 0], distal: [0, 0, 0] },
        };
      case 'RELAXED':
      default:
        return {
          thumb: { proximal: [0.2, 0.1, 0.1], intermediate: [0.2, 0, 0], distal: [0.15, 0, 0] },
          index: curledPhalanges(0.3),
          middle: curledPhalanges(0.35),
          ring: curledPhalanges(0.38),
          little: curledPhalanges(0.4),
        };
    }
  }
}
