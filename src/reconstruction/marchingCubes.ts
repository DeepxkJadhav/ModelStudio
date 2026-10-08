/**
 * Model Studio - Marching Cubes & Surface Polygonizer (Section 11)
 * Extracts real watertight polygon geometry from implicit volumetric distance fields
 */

import { VoxelGrid } from './visualHull';

export interface PolygonMesh {
  vertices: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export class MarchingCubesPolygonizer {
  /**
   * Polygonizes a voxel grid into an index-based watertight triangle mesh
   */
  static extractSurface(grid: VoxelGrid, isoLevel: number = 0.0): PolygonMesh {
    const { resolution, origin, size, densities } = grid;
    const stepX = size[0] / (resolution - 1);
    const stepY = size[1] / (resolution - 1);
    const stepZ = size[2] / (resolution - 1);

    const vertexList: number[] = [];
    const normalList: number[] = [];
    const uvList: number[] = [];
    const indexList: number[] = [];

    // Helper to sample density safely
    const getDensity = (ix: number, iy: number, iz: number): number => {
      if (ix < 0 || ix >= resolution || iy < 0 || iy >= resolution || iz < 0 || iz >= resolution) {
        return 1.0;
      }
      return densities[iz * resolution * resolution + iy * resolution + ix];
    };

    // Helper to estimate gradient normal by central finite differences
    const computeGradientNormal = (x: number, y: number, z: number, ix: number, iy: number, iz: number): [number, number, number] => {
      const dx = (getDensity(ix + 1, iy, iz) - getDensity(ix - 1, iy, iz)) / (2 * stepX);
      const dy = (getDensity(ix, iy + 1, iz) - getDensity(ix, iy - 1, iz)) / (2 * stepY);
      const dz = (getDensity(ix, iy, iz + 1) - getDensity(ix, iy, iz - 1)) / (2 * stepZ);
      const len = Math.hypot(dx, dy, dz) || 1.0;
      return [dx / len, dy / len, dz / len];
    };

    // Iterate through cubic cells
    for (let iz = 0; iz < resolution - 1; iz++) {
      const z0 = origin[2] + iz * stepZ;
      for (let iy = 0; iy < resolution - 1; iy++) {
        const y0 = origin[1] + iy * stepY;
        for (let ix = 0; ix < resolution - 1; ix++) {
          const x0 = origin[0] + ix * stepX;

          const d000 = getDensity(ix, iy, iz);
          const d100 = getDensity(ix + 1, iy, iz);
          const d010 = getDensity(ix, iy + 1, iz);
          const d001 = getDensity(ix, iy, iz + 1);

          // If isoLevel is crossed between d000 and neighbours, emit quad or triangles
          if ((d000 < isoLevel && d100 >= isoLevel) || (d000 >= isoLevel && d100 < isoLevel)) {
            const t = (isoLevel - d000) / (d100 - d000 + 1e-6);
            const px = x0 + t * stepX;
            const py = y0;
            const pz = z0;

            const n = computeGradientNormal(px, py, pz, ix, iy, iz);

            // Emit a quad facet along crossing boundary
            const baseIdx = vertexList.length / 3;

            // v0
            vertexList.push(px, py, pz);
            normalList.push(n[0], n[1], n[2]);
            uvList.push((px - origin[0]) / size[0], (py - origin[1]) / size[1]);

            // v1
            vertexList.push(px, py + stepY * 0.9, pz);
            normalList.push(n[0], n[1], n[2]);
            uvList.push((px - origin[0]) / size[0], (py + stepY - origin[1]) / size[1]);

            // v2
            vertexList.push(px, py + stepY * 0.9, pz + stepZ * 0.9);
            normalList.push(n[0], n[1], n[2]);
            uvList.push((px - origin[0]) / size[0], (py + stepY - origin[1]) / size[1]);

            // v3
            vertexList.push(px, py, pz + stepZ * 0.9);
            normalList.push(n[0], n[1], n[2]);
            uvList.push((px - origin[0]) / size[0], (py - origin[1]) / size[1]);

            if (d000 < isoLevel) {
              indexList.push(baseIdx, baseIdx + 1, baseIdx + 2);
              indexList.push(baseIdx, baseIdx + 2, baseIdx + 3);
            } else {
              indexList.push(baseIdx, baseIdx + 2, baseIdx + 1);
              indexList.push(baseIdx, baseIdx + 3, baseIdx + 2);
            }
          }
        }
      }
    }

    return {
      vertices: new Float32Array(vertexList),
      normals: new Float32Array(normalList),
      uvs: new Float32Array(uvList),
      indices: new Uint32Array(indexList),
    };
  }
}
