/**
 * Model Studio - Universal Import Manager (Section 49)
 * Ingests GLB, glTF, OBJ, STL, and .modelstudio project files with validation
 */

import { MeshLayer, MaterialProperties, StudioProject } from '../core/types';
import { ProjectSerializer } from '../core/project';

export interface ImportedAsset {
  type: 'PROJECT' | 'MESH_BUNDLE';
  project?: StudioProject;
  layers?: MeshLayer[];
  materials?: MaterialProperties[];
  fileName: string;
}

export class ImportManager {
  /**
   * Universal file importer dispatcher
   */
  static async importFile(file: File | { name: string; buffer: ArrayBuffer | string }): Promise<ImportedAsset> {
    const fileName = file.name;
    const lowerName = fileName.toLowerCase();

    let textContent = '';
    let arrayBuffer: ArrayBuffer | null = null;

    if ('text' in file && typeof (file as any).text === 'function') {
      const f = file as File;
      if (lowerName.endsWith('.glb') || lowerName.endsWith('.stl')) {
        arrayBuffer = await f.arrayBuffer();
      } else {
        textContent = await f.text();
      }
    } else if ('buffer' in file) {
      if (typeof file.buffer === 'string') {
        textContent = file.buffer;
      } else {
        arrayBuffer = file.buffer;
      }
    }

    if (lowerName.endsWith('.modelstudio')) {
      const project = ProjectSerializer.deserialize(textContent);
      return { type: 'PROJECT', project, fileName };
    }

    if (lowerName.endsWith('.obj')) {
      const { layers, materials } = this.parseOBJ(textContent, fileName);
      return { type: 'MESH_BUNDLE', layers, materials, fileName };
    }

    if (lowerName.endsWith('.stl') && arrayBuffer) {
      const { layers, materials } = this.parseBinarySTL(arrayBuffer, fileName);
      return { type: 'MESH_BUNDLE', layers, materials, fileName };
    }

    if (lowerName.endsWith('.glb') && arrayBuffer) {
      const { layers, materials } = this.parseGLB(arrayBuffer, fileName);
      return { type: 'MESH_BUNDLE', layers, materials, fileName };
    }

    throw new Error(`Unsupported 3D file format: ${fileName}`);
  }

  /**
   * Robust parser for Wavefront OBJ files
   */
  static parseOBJ(objText: string, layerName: string = 'ImportedMesh'): {
    layers: MeshLayer[];
    materials: MaterialProperties[];
  } {
    const lines = objText.split('\n');
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const finalVertices: number[] = [];
    const finalNormals: number[] = [];
    const finalUVs: number[] = [];
    const finalIndices: number[] = [];

    let vertexCounter = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      const parts = line.split(/\s+/);
      const tag = parts[0];

      if (tag === 'v') {
        positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
      } else if (tag === 'vn') {
        normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
      } else if (tag === 'vt') {
        uvs.push(parseFloat(parts[1]), parseFloat(parts[2]));
      } else if (tag === 'f') {
        // Handle triangle and quad faces
        const faceIndices: number[] = [];
        for (let i = 1; i < parts.length; i++) {
          const vertData = parts[i].split('/');
          const vIdx = (parseInt(vertData[0], 10) - 1) * 3;
          const vtIdx = vertData[1] ? (parseInt(vertData[1], 10) - 1) * 2 : -1;
          const vnIdx = vertData[2] ? (parseInt(vertData[2], 10) - 1) * 3 : -1;

          finalVertices.push(positions[vIdx], positions[vIdx + 1], positions[vIdx + 2]);

          if (vnIdx >= 0 && vnIdx < normals.length) {
            finalNormals.push(normals[vnIdx], normals[vnIdx + 1], normals[vnIdx + 2]);
          } else {
            finalNormals.push(0, 1, 0);
          }

          if (vtIdx >= 0 && vtIdx < uvs.length) {
            finalUVs.push(uvs[vtIdx], uvs[vtIdx + 1]);
          } else {
            finalUVs.push(0, 0);
          }

          faceIndices.push(vertexCounter++);
        }

        // Triangulate if quad
        if (faceIndices.length === 3) {
          finalIndices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
        } else if (faceIndices.length === 4) {
          finalIndices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
          finalIndices.push(faceIndices[0], faceIndices[2], faceIndices[3]);
        }
      }
    }

    const layer: MeshLayer = {
      id: `imported_${Date.now()}`,
      name: layerName.replace(/\.[^/.]+$/, ''),
      type: 'body',
      visible: true,
      wireframe: false,
      materialId: 'mat_default',
      vertexCount: finalVertices.length / 3,
      triangleCount: finalIndices.length / 3,
      vertices: new Float32Array(finalVertices),
      normals: new Float32Array(finalNormals),
      uvs: new Float32Array(finalUVs),
      indices: new Uint32Array(finalIndices),
    };

    const material: MaterialProperties = {
      id: 'mat_default',
      name: 'Default Material',
      type: 'PBR',
      baseColor: '#94a3b8',
      roughness: 0.5,
      metallic: 0.1,
      normalScale: 1.0,
      emissive: '#000000',
      opacity: 1.0,
    };

    return { layers: [layer], materials: [material] };
  }

  /**
   * Parser for Binary STL files
   */
  static parseBinarySTL(buffer: ArrayBuffer, fileName: string): {
    layers: MeshLayer[];
    materials: MaterialProperties[];
  } {
    const view = new DataView(buffer);
    const triCount = view.getUint32(80, true);

    const vertices = new Float32Array(triCount * 9);
    const normals = new Float32Array(triCount * 9);
    const uvs = new Float32Array(triCount * 6);
    const indices = new Uint32Array(triCount * 3);

    let offset = 84;
    for (let t = 0; t < triCount; t++) {
      const nx = view.getFloat32(offset, true);
      const ny = view.getFloat32(offset + 4, true);
      const nz = view.getFloat32(offset + 8, true);

      for (let v = 0; v < 3; v++) {
        const vOffset = offset + 12 + v * 12;
        const vx = view.getFloat32(vOffset, true);
        const vy = view.getFloat32(vOffset + 4, true);
        const vz = view.getFloat32(vOffset + 8, true);

        const vIdx = t * 3 + v;
        vertices[vIdx * 3] = vx;
        vertices[vIdx * 3 + 1] = vy;
        vertices[vIdx * 3 + 2] = vz;

        normals[vIdx * 3] = nx;
        normals[vIdx * 3 + 1] = ny;
        normals[vIdx * 3 + 2] = nz;

        uvs[vIdx * 2] = 0.5;
        uvs[vIdx * 2 + 1] = 0.5;

        indices[vIdx] = vIdx;
      }
      offset += 50;
    }

    const layer: MeshLayer = {
      id: `stl_${Date.now()}`,
      name: fileName.replace(/\.[^/.]+$/, ''),
      type: 'body',
      visible: true,
      wireframe: false,
      materialId: 'mat_stl',
      vertexCount: vertices.length / 3,
      triangleCount: indices.length / 3,
      vertices,
      normals,
      uvs,
      indices,
    };

    const material: MaterialProperties = {
      id: 'mat_stl',
      name: 'STL Base Material',
      type: 'PBR',
      baseColor: '#38bdf8',
      roughness: 0.3,
      metallic: 0.2,
      normalScale: 1.0,
      emissive: '#000000',
      opacity: 1.0,
    };

    return { layers: [layer], materials: [material] };
  }

  /**
   * Parser for binary glTF 2.0 (GLB)
   */
  static parseGLB(buffer: ArrayBuffer, fileName: string): {
    layers: MeshLayer[];
    materials: MaterialProperties[];
  } {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, true);
    if (magic !== 0x46546c67) {
      throw new Error('Not a valid binary glTF file (invalid magic number)');
    }

    const jsonChunkLength = view.getUint32(12, true);
    const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLength);
    const jsonStr = new TextDecoder().decode(jsonBytes);
    const gltf = JSON.parse(jsonStr);

    const binChunkOffset = 20 + jsonChunkLength;
    const binChunkLength = view.getUint32(binChunkOffset, true);
    const binBytes = new Uint8Array(buffer, binChunkOffset + 8, binChunkLength);

    const layers: MeshLayer[] = [];

    (gltf.meshes || []).forEach((mesh: any, mIdx: number) => {
      mesh.primitives.forEach((prim: any, pIdx: number) => {
        // Resolve accessors
        const posAcc = gltf.accessors[prim.attributes.POSITION];
        const normAcc = prim.attributes.NORMAL !== undefined ? gltf.accessors[prim.attributes.NORMAL] : null;
        const uvAcc = prim.attributes.TEXCOORD_0 !== undefined ? gltf.accessors[prim.attributes.TEXCOORD_0] : null;
        const indAcc = prim.indices !== undefined ? gltf.accessors[prim.indices] : null;

        const getBufferFromAcc = (acc: any, typedArrayConstructor: any) => {
          const view = gltf.bufferViews[acc.bufferView];
          const start = (view.byteOffset || 0) + (acc.byteOffset || 0);
          return new typedArrayConstructor(binBytes.buffer, binBytes.byteOffset + start, acc.count * (acc.type === 'VEC3' ? 3 : acc.type === 'VEC2' ? 2 : 1));
        };

        const vertices = getBufferFromAcc(posAcc, Float32Array);
        const normals = normAcc ? getBufferFromAcc(normAcc, Float32Array) : new Float32Array(vertices.length);
        const uvs = uvAcc ? getBufferFromAcc(uvAcc, Float32Array) : new Float32Array((vertices.length / 3) * 2);

        let indices: Uint32Array;
        if (indAcc) {
          if (indAcc.componentType === 5123) {
            const u16 = getBufferFromAcc(indAcc, Uint16Array);
            indices = new Uint32Array(u16);
          } else {
            indices = getBufferFromAcc(indAcc, Uint32Array);
          }
        } else {
          indices = new Uint32Array(vertices.length / 3);
          for (let i = 0; i < indices.length; i++) indices[i] = i;
        }

        layers.push({
          id: `glb_${mIdx}_${pIdx}`,
          name: mesh.name || `${fileName}_mesh${mIdx}`,
          type: 'body',
          visible: true,
          wireframe: false,
          materialId: 'mat_glb',
          vertexCount: vertices.length / 3,
          triangleCount: indices.length / 3,
          vertices,
          normals,
          uvs,
          indices,
        });
      });
    });

    const material: MaterialProperties = {
      id: 'mat_glb',
      name: 'GLTF Material',
      type: 'PBR',
      baseColor: '#38bdf8',
      roughness: 0.5,
      metallic: 0.1,
      normalScale: 1.0,
      emissive: '#000000',
      opacity: 1.0,
    };

    return { layers, materials: [material] };
  }
}
