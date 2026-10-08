/**
 * Model Studio - Material & Texture Generation (Section 17)
 * Generates PBR and Stylized/Anime Cel-shading materials tailored to asset aesthetics
 */

import { MaterialProperties } from '../core/types';

export class MaterialGenerator {
  /**
   * Generates default material palette for a multi-layer asset
   */
  static generateDefaultPalette(isAnimeStyle: boolean = false): MaterialProperties[] {
    const styleType = isAnimeStyle ? 'STYLIZED_ANIME' : 'PBR';

    return [
      {
        id: 'mat_body',
        name: 'Body / Skin',
        type: styleType,
        baseColor: isAnimeStyle ? '#fce7dc' : '#dcb496',
        roughness: isAnimeStyle ? 0.35 : 0.6,
        metallic: 0.0,
        normalScale: 0.8,
        emissive: '#000000',
        opacity: 1.0,
        subsurface: isAnimeStyle ? 0.4 : 0.2,
        celBands: isAnimeStyle ? 2 : undefined,
        rimLightIntensity: isAnimeStyle ? 0.7 : 0.2,
        outlineWidth: isAnimeStyle ? 0.003 : 0.0,
        outlineColor: '#5c3a21',
      },
      {
        id: 'mat_clothing',
        name: 'Clothing Garment',
        type: styleType,
        baseColor: '#2563eb', // Royal Blue
        roughness: isAnimeStyle ? 0.4 : 0.7,
        metallic: 0.05,
        normalScale: 1.0,
        emissive: '#000000',
        opacity: 1.0,
        celBands: isAnimeStyle ? 3 : undefined,
        rimLightIntensity: isAnimeStyle ? 0.5 : 0.1,
        outlineWidth: isAnimeStyle ? 0.003 : 0.0,
        outlineColor: '#0f172a',
      },
      {
        id: 'mat_hair',
        name: 'Hair Strands',
        type: styleType,
        baseColor: '#854d0e', // Amber brown
        roughness: isAnimeStyle ? 0.25 : 0.5,
        metallic: 0.1,
        normalScale: 1.2,
        emissive: '#000000',
        opacity: 1.0,
        celBands: isAnimeStyle ? 2 : undefined,
        rimLightIntensity: isAnimeStyle ? 0.9 : 0.4,
        outlineWidth: isAnimeStyle ? 0.002 : 0.0,
        outlineColor: '#451a03',
      },
      {
        id: 'mat_eyes',
        name: 'Eyes & Highlights',
        type: styleType,
        baseColor: '#0284c7', // Cyan highlight
        roughness: 0.1,
        metallic: 0.2,
        normalScale: 0.5,
        emissive: '#0369a1',
        opacity: 1.0,
        celBands: 2,
        rimLightIntensity: 0.8,
      },
    ];
  }
}
