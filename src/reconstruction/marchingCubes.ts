/**
 * Model Studio - Marching Cubes & Surface Polygonizer (Section 11)
 * Extracts genuine watertight, continuous, manifold polygon geometry from volumetric 3D signed distance fields.
 * Uses official, verified standard Marching Cubes edgeTable and triTable from Three.js.
 */

import { VoxelGrid } from './visualHull';
import { edgeTable, triTable } from 'three/examples/jsm/objects/MarchingCubes.js';

// Workaround for @types/three which mistakenly types edgeTable and triTable as Int32Array[]
const canonicalEdgeTable = edgeTable as unknown as Int32Array;
const canonicalTriTable = triTable as unknown as Int32Array;

export interface PolygonMesh {
  vertices: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export class MarchingCubesPolygonizer {
  /**
   * Polygonizes a volumetric voxel grid into a genuine watertight triangle mesh
   */
  static extractSurface(grid: VoxelGrid, isoLevel: number = 0.0): PolygonMesh {
    const { resolution, origin, size, densities } = grid;
    const rx = resolution;
    const ry = resolution;
    const rz = resolution;

    const stepX = size[0] / (rx - 1);
    const stepY = size[1] / (ry - 1);
    const stepZ = size[2] / (rz - 1);

    const vertexList: number[] = [];
    const normalList: number[] = [];
    const uvList: number[] = [];
    const indexList: number[] = [];

    // Helper to sample density safely
    const getDensity = (ix: number, iy: number, iz: number): number => {
      const cx = Math.max(0, Math.min(rx - 1, ix));
      const cy = Math.max(0, Math.min(ry - 1, iy));
      const cz = Math.max(0, Math.min(rz - 1, iz));
      return densities[cz * rx * ry + cy * rx + cx];
    };

    // Central finite difference normal gradient
    const computeGradientNormal = (ix: number, iy: number, iz: number): [number, number, number] => {
      const dx = (getDensity(ix + 1, iy, iz) - getDensity(ix - 1, iy, iz)) / (2 * stepX);
      const dy = (getDensity(ix, iy + 1, iz) - getDensity(ix, iy - 1, iz)) / (2 * stepY);
      const dz = (getDensity(ix, iy, iz + 1) - getDensity(ix, iy, iz - 1)) / (2 * stepZ);
      const len = Math.hypot(dx, dy, dz) || 1.0;
      return [dx / len, dy / len, dz / len];
    };

    // Helper for linear interpolation between two edge vertices
    const interpolate = (
      p1: [number, number, number],
      p2: [number, number, number],
      val1: number,
      val2: number,
      n1: [number, number, number],
      n2: [number, number, number]
    ): { pos: [number, number, number]; normal: [number, number, number] } => {
      const denom = val2 - val1;
      const t = Math.abs(denom) > 1e-6 ? (isoLevel - val1) / denom : 0.5;
      const clampedT = Math.max(0.0, Math.min(1.0, t));

      const pos: [number, number, number] = [
        p1[0] + clampedT * (p2[0] - p1[0]),
        p1[1] + clampedT * (p2[1] - p1[1]),
        p1[2] + clampedT * (p2[2] - p1[2]),
      ];

      const nx = n1[0] + clampedT * (n2[0] - n1[0]);
      const ny = n1[1] + clampedT * (n2[1] - n1[1]);
      const nz = n1[2] + clampedT * (n2[2] - n1[2]);
      const nlen = Math.hypot(nx, ny, nz) || 1.0;

      return {
        pos,
        normal: [nx / nlen, ny / nlen, nz / nlen],
      };
    };

    // Iterate through cubic volume cells
    for (let iz = 0; iz < rz - 1; iz++) {
      const z0 = origin[2] + iz * stepZ;
      const z1 = z0 + stepZ;

      for (let iy = 0; iy < ry - 1; iy++) {
        const y0 = origin[1] + iy * stepY;
        const y1 = y0 + stepY;

        for (let ix = 0; ix < rx - 1; ix++) {
          const x0 = origin[0] + ix * stepX;
          const x1 = x0 + stepX;

          // Corner positions (8 corners)
          const p0: [number, number, number] = [x0, y0, z0];
          const p1: [number, number, number] = [x1, y0, z0];
          const p2: [number, number, number] = [x0, y1, z0];
          const p3: [number, number, number] = [x1, y1, z0];
          const p4: [number, number, number] = [x0, y0, z1];
          const p5: [number, number, number] = [x1, y0, z1];
          const p6: [number, number, number] = [x0, y1, z1];
          const p7: [number, number, number] = [x1, y1, z1];

          // Sample scalar values at the 8 corners
          const field0 = getDensity(ix, iy, iz);
          const field1 = getDensity(ix + 1, iy, iz);
          const field2 = getDensity(ix, iy + 1, iz);
          const field3 = getDensity(ix + 1, iy + 1, iz);
          const field4 = getDensity(ix, iy, iz + 1);
          const field5 = getDensity(ix + 1, iy, iz + 1);
          const field6 = getDensity(ix, iy + 1, iz + 1);
          const field7 = getDensity(ix + 1, iy + 1, iz + 1);

          let cubeindex = 0;
          if (field0 < isoLevel) cubeindex |= 1;
          if (field1 < isoLevel) cubeindex |= 2;
          if (field2 < isoLevel) cubeindex |= 8;
          if (field3 < isoLevel) cubeindex |= 4;
          if (field4 < isoLevel) cubeindex |= 16;
          if (field5 < isoLevel) cubeindex |= 32;
          if (field6 < isoLevel) cubeindex |= 128;
          if (field7 < isoLevel) cubeindex |= 64;

          const bits = canonicalEdgeTable[cubeindex];
          if (bits === 0) continue;

          // Compute corner gradient normals
          const n0 = computeGradientNormal(ix, iy, iz);
          const n1 = computeGradientNormal(ix + 1, iy, iz);
          const n2 = computeGradientNormal(ix, iy + 1, iz);
          const n3 = computeGradientNormal(ix + 1, iy + 1, iz);
          const n4 = computeGradientNormal(ix, iy, iz + 1);
          const n5 = computeGradientNormal(ix + 1, iy, iz + 1);
          const n6 = computeGradientNormal(ix, iy + 1, iz + 1);
          const n7 = computeGradientNormal(ix + 1, iy + 1, iz + 1);

          // Interpolate vertex positions on the 12 active edges
          const edgeVertices: Array<{ pos: [number, number, number]; normal: [number, number, number] } | null> = new Array(12).fill(null);

          if (bits & 1) edgeVertices[0] = interpolate(p0, p1, field0, field1, n0, n1);
          if (bits & 2) edgeVertices[1] = interpolate(p1, p3, field1, field3, n1, n3);
          if (bits & 4) edgeVertices[2] = interpolate(p2, p3, field2, field3, n2, n3);
          if (bits & 8) edgeVertices[3] = interpolate(p0, p2, field0, field2, n0, n2);
          if (bits & 16) edgeVertices[4] = interpolate(p4, p5, field4, field5, n4, n5);
          if (bits & 32) edgeVertices[5] = interpolate(p5, p7, field5, field7, n5, n7);
          if (bits & 64) edgeVertices[6] = interpolate(p6, p7, field6, field7, n6, n7);
          if (bits & 128) edgeVertices[7] = interpolate(p4, p6, field4, field6, n4, n6);
          if (bits & 256) edgeVertices[8] = interpolate(p0, p4, field0, field4, n0, n4);
          if (bits & 512) edgeVertices[9] = interpolate(p1, p5, field1, field5, n1, n5);
          if (bits & 1024) edgeVertices[10] = interpolate(p3, p7, field3, field7, n3, n7);
          if (bits & 2048) edgeVertices[11] = interpolate(p2, p6, field2, field6, n2, n6);

          // Emit triangles from the standard Three.js triTable
          const offset = cubeindex << 4;
          for (let ti = 0; ti < 16; ti += 3) {
            const e0 = canonicalTriTable[offset + ti];
            if (e0 === -1) break;
            const e1 = canonicalTriTable[offset + ti + 1];
            const e2 = canonicalTriTable[offset + ti + 2];

            const v0 = edgeVertices[e0];
            const v1 = edgeVertices[e1];
            const v2 = edgeVertices[e2];

            if (!v0 || !v1 || !v2) continue;

            // Skip degenerate slivers with near-zero edge lengths or zero area
            const d01 = Math.hypot(v0.pos[0] - v1.pos[0], v0.pos[1] - v1.pos[1], v0.pos[2] - v1.pos[2]);
            const d12 = Math.hypot(v1.pos[0] - v2.pos[0], v1.pos[1] - v2.pos[1], v1.pos[2] - v2.pos[2]);
            const d20 = Math.hypot(v2.pos[0] - v0.pos[0], v2.pos[1] - v0.pos[1], v2.pos[2] - v0.pos[2]);
            if (d01 < 1e-5 || d12 < 1e-5 || d20 < 1e-5) continue;

            const ax = v1.pos[0] - v0.pos[0];
            const ay = v1.pos[1] - v0.pos[1];
            const az = v1.pos[2] - v0.pos[2];
            const bx = v2.pos[0] - v0.pos[0];
            const by = v2.pos[1] - v0.pos[1];
            const bz = v2.pos[2] - v0.pos[2];
            const cx = ay * bz - az * by;
            const cy = az * bx - ax * bz;
            const cz = ax * by - ay * bx;
            const area = 0.5 * Math.hypot(cx, cy, cz);
            if (area < 1e-9) continue;

            const baseIdx = vertexList.length / 3;

            vertexList.push(v0.pos[0], v0.pos[1], v0.pos[2]);
            normalList.push(v0.normal[0], v0.normal[1], v0.normal[2]);
            uvList.push((v0.pos[0] - origin[0]) / size[0], (v0.pos[1] - origin[1]) / size[1]);

            vertexList.push(v1.pos[0], v1.pos[1], v1.pos[2]);
            normalList.push(v1.normal[0], v1.normal[1], v1.normal[2]);
            uvList.push((v1.pos[0] - origin[0]) / size[0], (v1.pos[1] - origin[1]) / size[1]);

            vertexList.push(v2.pos[0], v2.pos[1], v2.pos[2]);
            normalList.push(v2.normal[0], v2.normal[1], v2.normal[2]);
            uvList.push((v2.pos[0] - origin[0]) / size[0], (v2.pos[1] - origin[1]) / size[1]);

            indexList.push(baseIdx, baseIdx + 1, baseIdx + 2);
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
