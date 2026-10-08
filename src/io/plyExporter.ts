/**
 * Model Studio - Stanford Polygon File Format (PLY) Exporter (Section 48)
 * Exports genuine ASCII PLY with vertex positions, normals, and face list
 */

import { MeshLayer } from '../core/types';

export class PLYExporter {
  static exportPLY(layers: MeshLayer[]): string {
    let totalVertices = 0;
    let totalTriangles = 0;

    layers.forEach(l => {
      totalVertices += l.vertices.length / 3;
      totalTriangles += l.indices.length / 3;
    });

    let header = 'ply\n';
    header += 'format ascii 1.0\n';
    header += 'comment Model Studio Export\n';
    header += `element vertex ${totalVertices}\n`;
    header += 'property float x\n';
    header += 'property float y\n';
    header += 'property float z\n';
    header += 'property float nx\n';
    header += 'property float ny\n';
    header += 'property float nz\n';
    header += `element face ${totalTriangles}\n`;
    header += 'property list uchar int vertex_indices\n';
    header += 'end_header\n';

    let body = '';
    let vertOffset = 0;

    // Write vertices
    layers.forEach(layer => {
      const v = layer.vertices;
      const n = layer.normals;
      for (let i = 0; i < v.length; i += 3) {
        body += `${v[i].toFixed(5)} ${v[i + 1].toFixed(5)} ${v[i + 2].toFixed(5)} `;
        body += `${n[i].toFixed(5)} ${n[i + 1].toFixed(5)} ${n[i + 2].toFixed(5)}\n`;
      }
    });

    // Write faces
    layers.forEach(layer => {
      const idx = layer.indices;
      for (let i = 0; i < idx.length; i += 3) {
        const i0 = idx[i] + vertOffset;
        const i1 = idx[i + 1] + vertOffset;
        const i2 = idx[i + 2] + vertOffset;
        body += `3 ${i0} ${i1} ${i2}\n`;
      }
      vertOffset += layer.vertices.length / 3;
    });

    return header + body;
  }
}
