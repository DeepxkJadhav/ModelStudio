/**
 * Model Studio - Wavefront OBJ + MTL Exporter (Section 48)
 * Exports genuine OBJ geometry with vertex positions, texture coordinates, normals, and material group tags
 */

import { MeshLayer, MaterialProperties } from '../core/types';

export class OBJExporter {
  static exportOBJ(layers: MeshLayer[], materials: MaterialProperties[]): { obj: string; mtl: string } {
    let obj = '# Model Studio v1.0 Wavefront OBJ Exporter\n';
    obj += 'mtllib model.mtl\n\n';

    let mtl = '# Model Studio v1.0 MTL Material Definitions\n\n';
    materials.forEach(mat => {
      mtl += `newmtl ${mat.name.replace(/\s+/g, '_')}\n`;
      mtl += `Kd 0.8 0.8 0.8\n`;
      mtl += `Ks ${mat.metallic} ${mat.metallic} ${mat.metallic}\n`;
      mtl += `d ${mat.opacity}\n`;
      mtl += `illum 2\n\n`;
    });

    let vertexOffset = 1;
    let normalOffset = 1;
    let uvOffset = 1;

    layers.forEach(layer => {
      obj += `o ${layer.name.replace(/\s+/g, '_')}\n`;
      const mat = materials.find(m => m.id === layer.materialId) || materials[0];
      if (mat) {
        obj += `usemtl ${mat.name.replace(/\s+/g, '_')}\n`;
      }

      const v = layer.vertices;
      const vn = layer.normals;
      const vt = layer.uvs;
      const idx = layer.indices;

      // Vertices
      for (let i = 0; i < v.length; i += 3) {
        obj += `v ${v[i].toFixed(5)} ${v[i + 1].toFixed(5)} ${v[i + 2].toFixed(5)}\n`;
      }

      // UVs
      for (let i = 0; i < vt.length; i += 2) {
        obj += `vt ${vt[i].toFixed(5)} ${vt[i + 1].toFixed(5)}\n`;
      }

      // Normals
      for (let i = 0; i < vn.length; i += 3) {
        obj += `vn ${vn[i].toFixed(5)} ${vn[i + 1].toFixed(5)} ${vn[i + 2].toFixed(5)}\n`;
      }

      // Faces (f v/vt/vn)
      for (let i = 0; i < idx.length; i += 3) {
        const i0 = idx[i] + vertexOffset;
        const i1 = idx[i + 1] + vertexOffset;
        const i2 = idx[i + 2] + vertexOffset;

        const u0 = idx[i] + uvOffset;
        const u1 = idx[i + 1] + uvOffset;
        const u2 = idx[i + 2] + uvOffset;

        const n0 = idx[i] + normalOffset;
        const n1 = idx[i + 1] + normalOffset;
        const n2 = idx[i + 2] + normalOffset;

        obj += `f ${i0}/${u0}/${n0} ${i1}/${u1}/${n1} ${i2}/${u2}/${n2}\n`;
      }

      vertexOffset += v.length / 3;
      uvOffset += vt.length / 2;
      normalOffset += vn.length / 3;
      obj += '\n';
    });

    return { obj, mtl };
  }
}
