/**
 * Model Studio - Native Project Format (.modelstudio) (Section 50)
 * Serializes and bundles references, layers, skeleton, materials, animations, and history
 */

import { StudioProject } from './types';

export class ProjectSerializer {
  /**
   * Serializes a StudioProject into a standardized JSON string or Blob
   */
  static serialize(project: StudioProject): string {
    // Convert TypedArrays in layers to plain arrays for JSON compatibility
    const cleanProject = {
      ...project,
      lastModifiedTime: Date.now(),
      layers: project.layers.map(layer => ({
        ...layer,
        vertices: Array.from(layer.vertices),
        normals: Array.from(layer.normals),
        uvs: Array.from(layer.uvs),
        indices: Array.from(layer.indices),
        skinIndices: layer.skinIndices ? Array.from(layer.skinIndices) : undefined,
        skinWeights: layer.skinWeights ? Array.from(layer.skinWeights) : undefined,
      })),
    };

    return JSON.stringify(cleanProject, null, 2);
  }

  /**
   * Deserializes a .modelstudio JSON string into an active StudioProject
   */
  static deserialize(jsonString: string): StudioProject {
    const raw = JSON.parse(jsonString);

    if (raw.formatVersion !== '1.0.0') {
      console.warn(`Migrating project from version ${raw.formatVersion} to 1.0.0`);
    }

    // Reconstruct TypedArrays
    const layers = (raw.layers || []).map((l: any) => ({
      ...l,
      vertices: new Float32Array(l.vertices),
      normals: new Float32Array(l.normals),
      uvs: new Float32Array(l.uvs),
      indices: new Uint32Array(l.indices),
      skinIndices: l.skinIndices ? new Float32Array(l.skinIndices) : undefined,
      skinWeights: l.skinWeights ? new Float32Array(l.skinWeights) : undefined,
    }));

    return {
      ...raw,
      layers,
    };
  }
}
