/**
 * Model Studio - Viewport Shading Modes & Material Setup (Section 40)
 * Builds shaders and materials for Wireframe, Solid, Material Preview, PBR, Cel/Anime, X-Ray, Heatmap
 */

import * as THREE from 'three';
import { ShadingMode, MaterialProperties } from '../core/types';

export class ShadingModeFactory {
  static createMaterialForMode(
    mode: ShadingMode,
    matProps: MaterialProperties,
    vertexColors?: Float32Array
  ): THREE.Material {
    switch (mode) {
      case 'WIREFRAME':
        return new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
        });

      case 'SOLID':
        return new THREE.MeshLambertMaterial({
          color: 0x94a3b8,
          roughness: 0.5,
        } as any);

      case 'MATERIAL_PREVIEW':
      case 'RENDERED_PBR':
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(matProps.baseColor),
          roughness: matProps.roughness,
          metalness: matProps.metallic,
          wireframe: false,
        });

      case 'CEL_SHADING': {
        // Stylized anime toon shading with stepped lighting
        const toon = new THREE.MeshToonMaterial({
          color: new THREE.Color(matProps.baseColor),
          wireframe: false,
        });
        return toon;
      }

      case 'XRAY':
        return new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
          wireframe: true,
        });

      case 'ERROR_HEATMAP':
        return new THREE.MeshBasicMaterial({
          vertexColors: true,
          wireframe: false,
        });

      case 'COLLISION_ENVELOPES':
        return new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          wireframe: true,
          transparent: true,
          opacity: 0.7,
        });

      case 'CLOTH_PHYSICS':
        return new THREE.MeshStandardMaterial({
          color: 0x6366f1,
          roughness: 0.8,
          wireframe: false,
        });

      default:
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(matProps.baseColor),
          roughness: matProps.roughness,
          metalness: matProps.metallic,
        });
    }
  }
}
