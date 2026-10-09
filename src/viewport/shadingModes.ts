/**
 * Model Studio - Viewport Shading Modes & Material Setup (Section 40)
 * Builds shaders and materials for Wireframe, Solid, Material Preview, PBR, Cel/Anime, X-Ray, Heatmap.
 * Includes texture loading, sRGB color-space management, and caching for reference textures.
 */

import * as THREE from 'three';
import { ShadingMode, MaterialProperties } from '../core/types';

const textureCache = new Map<string, THREE.Texture>();
const textureLoader = new THREE.TextureLoader();

function getOrCreateTexture(uri: string): THREE.Texture {
  if (textureCache.has(uri)) {
    return textureCache.get(uri)!;
  }
  const texture = textureLoader.load(
    uri,
    (tex) => {
      tex.needsUpdate = true;
    },
    undefined,
    (err) => {
      console.warn(`[ShadingModeFactory] Texture load error from ${uri}:`, err);
    }
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(uri, texture);
  return texture;
}

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
        // Clean studio clay / sculpting shade respecting anatomical component tints
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(matProps.baseColor || '#cbd5e1'),
          roughness: 0.65,
          metalness: 0.05,
          wireframe: false,
        });

      case 'MATERIAL_PREVIEW':
      case 'RENDERED_PBR': {
        const hasTexture = Boolean(matProps.textureUri);
        const mat = new THREE.MeshStandardMaterial({
          // When texture is bound, keep baseColor light/neutral so image details aren't muddy
          color: hasTexture ? new THREE.Color(0xffffff) : new THREE.Color(matProps.baseColor),
          roughness: matProps.roughness ?? 0.5,
          metalness: matProps.metallic ?? 0.0,
          wireframe: false,
        });

        if (matProps.textureUri) {
          try {
            mat.map = getOrCreateTexture(matProps.textureUri);
            mat.needsUpdate = true;
          } catch (e) {
            console.warn('[ShadingModeFactory] Failed binding texture to MeshStandardMaterial:', e);
          }
        }
        return mat;
      }

      case 'CEL_SHADING': {
        // Stylized anime toon shading with stepped lighting
        const hasTexture = Boolean(matProps.textureUri);
        const toon = new THREE.MeshToonMaterial({
          color: hasTexture ? new THREE.Color(0xffffff) : new THREE.Color(matProps.baseColor),
          wireframe: false,
        });

        if (matProps.textureUri) {
          try {
            toon.map = getOrCreateTexture(matProps.textureUri);
            toon.needsUpdate = true;
          } catch (e) {
            console.warn('[ShadingModeFactory] Failed binding texture to MeshToonMaterial:', e);
          }
        }
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
          roughness: matProps.roughness ?? 0.5,
          metalness: matProps.metallic ?? 0.0,
        });
    }
  }
}
