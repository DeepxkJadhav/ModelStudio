/**
 * Model Studio - Camera Calibration & View Alignment (Section 13)
 * Estimates camera orientation, distance, field of view, and sets up reference matching
 */

import { ReferenceViewType } from '../core/types';

export interface CameraParameters {
  azimuth: number;
  elevation: number;
  fov: number;
  distance: number;
  isOrthographic: boolean;
  target: [number, number, number];
}

export class CameraCalibrator {
  /**
   * Returns canonical calibrated camera parameters for a given view type
   */
  static getCalibrationForView(type: ReferenceViewType): CameraParameters {
    switch (type) {
      case 'front':
        return { azimuth: 0, elevation: 0, fov: 0, distance: 2.8, isOrthographic: true, target: [0, 0.9, 0] };
      case 'back':
        return { azimuth: 180, elevation: 0, fov: 0, distance: 2.8, isOrthographic: true, target: [0, 0.9, 0] };
      case 'left':
        return { azimuth: -90, elevation: 0, fov: 0, distance: 2.8, isOrthographic: true, target: [0, 0.9, 0] };
      case 'right':
        return { azimuth: 90, elevation: 0, fov: 0, distance: 2.8, isOrthographic: true, target: [0, 0.9, 0] };
      case 'top':
        return { azimuth: 0, elevation: 89.9, fov: 0, distance: 3.0, isOrthographic: true, target: [0, 0, 0] };
      case 'bottom':
        return { azimuth: 0, elevation: -89.9, fov: 0, distance: 3.0, isOrthographic: true, target: [0, 0, 0] };
      case 'front_three_quarter':
        return { azimuth: 45, elevation: 15, fov: 45, distance: 3.2, isOrthographic: false, target: [0, 0.9, 0] };
      case 'back_three_quarter':
        return { azimuth: 135, elevation: 15, fov: 45, distance: 3.2, isOrthographic: false, target: [0, 0.9, 0] };
      case 'face_closeup':
        return { azimuth: 0, elevation: 5, fov: 25, distance: 1.2, isOrthographic: false, target: [0, 1.55, 0] };
      default:
        return { azimuth: 30, elevation: 20, fov: 45, distance: 3.0, isOrthographic: false, target: [0, 0.9, 0] };
    }
  }

  /**
   * Computes camera world position from azimuth, elevation, distance, and target
   */
  static computeCameraPosition(params: CameraParameters): [number, number, number] {
    const phi = (90 - params.elevation) * (Math.PI / 180);
    const theta = (params.azimuth + 90) * (Math.PI / 180);

    const x = params.target[0] + params.distance * Math.sin(phi) * Math.cos(theta);
    const y = params.target[1] + params.distance * Math.cos(phi);
    const z = params.target[2] + params.distance * Math.sin(phi) * Math.sin(theta);

    return [x, y, z];
  }
}
