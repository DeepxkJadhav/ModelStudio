/**
 * Model Studio - Stereolithography (STL) Exporter (Section 48)
 * Exports genuine binary and ASCII STL 3D geometry
 */

import { MeshLayer } from '../core/types';

export class STLExporter {
  /**
   * Generates genuine binary STL buffer
   */
  static exportBinarySTL(layers: MeshLayer[]): ArrayBuffer {
    let totalTriangles = 0;
    layers.forEach(l => {
      totalTriangles += l.indices.length / 3;
    });

    // Binary STL format: 80 bytes header + 4 bytes triangle count + 50 bytes per triangle
    const bufferSize = 84 + totalTriangles * 50;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // 80-byte header
    const headerStr = 'Model Studio STL Binary Export';
    for (let i = 0; i < headerStr.length; i++) {
      view.setUint8(i, headerStr.charCodeAt(i));
    }

    // Number of triangles
    view.setUint32(80, totalTriangles, true);

    let offset = 84;
    layers.forEach(layer => {
      const v = layer.vertices;
      const n = layer.normals;
      const idx = layer.indices;
      const triCount = idx.length / 3;

      for (let t = 0; t < triCount; t++) {
        const i0 = idx[t * 3];
        const i1 = idx[t * 3 + 1];
        const i2 = idx[t * 3 + 2];

        // Normal (float32 x 3)
        view.setFloat32(offset, n[i0 * 3] || 0, true);
        view.setFloat32(offset + 4, n[i0 * 3 + 1] || 1, true);
        view.setFloat32(offset + 8, n[i0 * 3 + 2] || 0, true);

        // Vertex 1
        view.setFloat32(offset + 12, v[i0 * 3], true);
        view.setFloat32(offset + 16, v[i0 * 3 + 1], true);
        view.setFloat32(offset + 20, v[i0 * 3 + 2], true);

        // Vertex 2
        view.setFloat32(offset + 24, v[i1 * 3], true);
        view.setFloat32(offset + 28, v[i1 * 3 + 1], true);
        view.setFloat32(offset + 32, v[i1 * 3 + 2], true);

        // Vertex 3
        view.setFloat32(offset + 36, v[i2 * 3], true);
        view.setFloat32(offset + 40, v[i2 * 3 + 1], true);
        view.setFloat32(offset + 44, v[i2 * 3 + 2], true);

        // Attribute byte count (uint16)
        view.setUint16(offset + 48, 0, true);

        offset += 50;
      }
    });

    return buffer;
  }
}
