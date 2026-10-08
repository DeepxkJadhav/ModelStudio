/**
 * Model Studio - AI-Assisted Mesh Modification (Section 38)
 * Localized geometric edits (scaling, translation along normal, extrusion) targeting specific anatomical regions
 */

import { MeshLayer } from '../core/types';
import { AIRefinementResult } from '../intelligence/aiProvider';

export class AIMeshEditor {
  /**
   * Applies localized refinement to a targeted mesh layer
   */
  static applyLocalizedEdit(layer: MeshLayer, edit: AIRefinementResult): MeshLayer {
    const vertices = new Float32Array(layer.vertices);
    const normals = new Float32Array(layer.normals);
    const vertexCount = vertices.length / 3;

    const { targetRegion, operation, parameters } = edit;

    // Identify vertex bounding criteria for target region
    const isInRegion = (x: number, y: number, z: number): boolean => {
      switch (targetRegion) {
        case 'HEAD':
          return y > 1.45;
        case 'SHOULDERS':
          return y > 1.25 && y < 1.45 && Math.abs(x) > 0.15;
        case 'HANDS':
          return Math.abs(x) > 0.55 && y > 0.75 && y < 1.05;
        case 'CLOTHING':
          return layer.type === 'clothing';
        case 'HAIR':
          return layer.type === 'hair' || y > 1.45;
        case 'TAIL':
          return z < -0.2 && y < 0.75;
        case 'WINGS':
          return Math.abs(x) > 0.2 && y > 0.5 && y < 0.8;
        default:
          return true;
      }
    };

    // Calculate region center for localized scaling
    let centerX = 0, centerY = 0, centerZ = 0, count = 0;
    for (let i = 0; i < vertexCount; i++) {
      const x = vertices[i * 3], y = vertices[i * 3 + 1], z = vertices[i * 3 + 2];
      if (isInRegion(x, y, z)) {
        centerX += x;
        centerY += y;
        centerZ += z;
        count++;
      }
    }

    if (count > 0) {
      centerX /= count;
      centerY /= count;
      centerZ /= count;
    }

    // Apply operation
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const x = vertices[idx], y = vertices[idx + 1], z = vertices[idx + 2];

      if (!isInRegion(x, y, z)) continue;

      if (operation === 'SCALE') {
        const sx = parameters.scaleX ?? 1.0;
        const sy = parameters.scaleY ?? 1.0;
        const sz = parameters.scaleZ ?? 1.0;

        // Scale relative to region center
        vertices[idx] = centerX + (x - centerX) * sx;
        vertices[idx + 1] = centerY + (y - centerY) * sy;
        vertices[idx + 2] = centerZ + (z - centerZ) * sz;
      } else if (operation === 'TRANSLATE') {
        const nx = normals[idx], ny = normals[idx + 1], nz = normals[idx + 2];
        const push = parameters.normalPush ?? 0.01;
        vertices[idx] += nx * push;
        vertices[idx + 1] += ny * push;
        vertices[idx + 2] += nz * push;
      } else if (operation === 'EXTRUDE') {
        const offsetY = parameters.offsetY ?? 0;
        vertices[idx + 1] += offsetY;
      }
    }

    return {
      ...layer,
      vertices,
      normals,
    };
  }
}
