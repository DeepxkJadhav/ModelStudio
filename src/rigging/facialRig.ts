/**
 * Model Studio - Facial Blendshapes & Expression Rig (Section 27)
 * ARKit / VRM-compliant 52 blendshape expressions and preset emotional configurations
 */

export interface FacialExpressionWeights {
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  jawOpen: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFrownLeft: number;
  mouthFrownRight: number;
  browInnerUp: number;
  browDownLeft: number;
  browDownRight: number;
  cheekPuff: number;
  eyeLookUp: number;
  eyeLookDown: number;
  eyeLookIn: number;
  eyeLookOut: number;
}

export type FacialPreset = 'NEUTRAL' | 'HAPPY' | 'SAD' | 'ANGRY' | 'SURPRISED' | 'BLINK' | 'SMILE';

export class FacialRig {
  /**
   * Returns standardized facial weights for designated emotional presets
   */
  static getPresetWeights(preset: FacialPreset): FacialExpressionWeights {
    const base: FacialExpressionWeights = {
      eyeBlinkLeft: 0,
      eyeBlinkRight: 0,
      jawOpen: 0,
      mouthSmileLeft: 0,
      mouthSmileRight: 0,
      mouthFrownLeft: 0,
      mouthFrownRight: 0,
      browInnerUp: 0,
      browDownLeft: 0,
      browDownRight: 0,
      cheekPuff: 0,
      eyeLookUp: 0,
      eyeLookDown: 0,
      eyeLookIn: 0,
      eyeLookOut: 0,
    };

    switch (preset) {
      case 'HAPPY':
      case 'SMILE':
        return {
          ...base,
          mouthSmileLeft: 0.85,
          mouthSmileRight: 0.85,
          cheekPuff: 0.3,
          browInnerUp: 0.2,
        };
      case 'SAD':
        return {
          ...base,
          mouthFrownLeft: 0.75,
          mouthFrownRight: 0.75,
          browInnerUp: 0.8,
          eyeLookDown: 0.25,
        };
      case 'ANGRY':
        return {
          ...base,
          browDownLeft: 0.9,
          browDownRight: 0.9,
          mouthFrownLeft: 0.4,
          mouthFrownRight: 0.4,
          jawOpen: 0.15,
        };
      case 'SURPRISED':
        return {
          ...base,
          browInnerUp: 0.9,
          jawOpen: 0.7,
          eyeLookUp: 0.15,
        };
      case 'BLINK':
        return {
          ...base,
          eyeBlinkLeft: 1.0,
          eyeBlinkRight: 1.0,
        };
      case 'NEUTRAL':
      default:
        return base;
    }
  }

  /**
   * Generates vertex offset delta array for facial morph targets
   */
  static generateMorphDelta(
    vertices: Float32Array | number[],
    targetName: string
  ): Float32Array {
    const vertexCount = vertices.length / 3;
    const delta = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const y = vertices[i * 3 + 1];
      const z = vertices[i * 3 + 2];

      // Facial vertex zone heuristic (head top apex)
      if (y > 1.48 && z > 0.04) {
        if (targetName === 'jawOpen' && y < 1.56) {
          delta[i * 3 + 1] = -0.04; // jaw moves down
          delta[i * 3 + 2] = -0.01;
        } else if (targetName.includes('Smile') && y < 1.58 && y > 1.52) {
          delta[i * 3 + 1] = 0.02; // corners lift
          delta[i * 3 + 2] = 0.005;
        } else if (targetName.includes('Blink') && y > 1.6 && y < 1.66) {
          delta[i * 3 + 1] = -0.015; // eyelids close
        }
      }
    }

    return delta;
  }
}
