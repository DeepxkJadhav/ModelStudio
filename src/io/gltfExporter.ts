/**
 * Model Studio - Binary GLTF / GLB Exporter (Section 48)
 * Generates genuine binary glTF 2.0 (.glb) files with buffers, accessors, materials, and mesh primitives
 */

import { MeshLayer, MaterialProperties, SkeletonDefinition } from '../core/types';

export class GLTFExporter {
  /**
   * Encodes mesh layers into a genuine binary glTF 2.0 (.glb) ArrayBuffer
   */
  static exportGLB(
    layers: MeshLayer[],
    materials: MaterialProperties[],
    skeleton?: SkeletonDefinition
  ): ArrayBuffer {
    // Collect binary buffers
    const bufferChunks: ArrayBuffer[] = [];
    let byteOffset = 0;

    const bufferViews: any[] = [];
    const accessors: any[] = [];
    const gltfMeshes: any[] = [];
    const gltfMaterials: any[] = [];

    // Map materials
    materials.forEach(mat => {
      // Parse hex color to rgb [0..1]
      const hex = mat.baseColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255.0 || 0.8;
      const g = parseInt(hex.substring(2, 4), 16) / 255.0 || 0.8;
      const b = parseInt(hex.substring(4, 6), 16) / 255.0 || 0.8;

      gltfMaterials.push({
        name: mat.name,
        pbrMetallicRoughness: {
          baseColorFactor: [r, g, b, mat.opacity],
          metallicFactor: mat.metallic,
          roughnessFactor: mat.roughness,
        },
      });
    });

    const align4 = (bytes: number): number => (bytes + 3) & ~3;

    layers.forEach((layer, layerIdx) => {
      const vertices = layer.vertices instanceof Float32Array ? layer.vertices : new Float32Array(layer.vertices);
      const normals = layer.normals instanceof Float32Array ? layer.normals : new Float32Array(layer.normals);
      const uvs = layer.uvs instanceof Float32Array ? layer.uvs : new Float32Array(layer.uvs);
      const indices = layer.indices instanceof Uint32Array ? layer.indices : new Uint32Array(layer.indices);

      // Compute bounding box for POSITION
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (let i = 0; i < vertices.length; i += 3) {
        minX = Math.min(minX, vertices[i]);
        minY = Math.min(minY, vertices[i + 1]);
        minZ = Math.min(minZ, vertices[i + 2]);
        maxX = Math.max(maxX, vertices[i]);
        maxY = Math.max(maxY, vertices[i + 1]);
        maxZ = Math.max(maxZ, vertices[i + 2]);
      }

      // Add POSITION bufferView & accessor
      const posBuffer = vertices.buffer.slice(vertices.byteOffset, vertices.byteOffset + vertices.byteLength) as ArrayBuffer;
      const posViewIdx = bufferViews.length;
      bufferViews.push({ buffer: 0, byteOffset, byteLength: posBuffer.byteLength, target: 34962 });
      byteOffset = align4(byteOffset + posBuffer.byteLength);
      bufferChunks.push(posBuffer);

      const posAccIdx = accessors.length;
      accessors.push({
        bufferView: posViewIdx,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: vertices.length / 3,
        type: 'VEC3',
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      });

      // Add NORMAL bufferView & accessor
      const normBuffer = normals.buffer.slice(normals.byteOffset, normals.byteOffset + normals.byteLength) as ArrayBuffer;
      const normViewIdx = bufferViews.length;
      bufferViews.push({ buffer: 0, byteOffset, byteLength: normBuffer.byteLength, target: 34962 });
      byteOffset = align4(byteOffset + normBuffer.byteLength);
      bufferChunks.push(normBuffer);

      const normAccIdx = accessors.length;
      accessors.push({
        bufferView: normViewIdx,
        byteOffset: 0,
        componentType: 5126,
        count: normals.length / 3,
        type: 'VEC3',
      });

      // Add TEXCOORD_0 bufferView & accessor
      const uvBuffer = uvs.buffer.slice(uvs.byteOffset, uvs.byteOffset + uvs.byteLength) as ArrayBuffer;
      const uvViewIdx = bufferViews.length;
      bufferViews.push({ buffer: 0, byteOffset, byteLength: uvBuffer.byteLength, target: 34962 });
      byteOffset = align4(byteOffset + uvBuffer.byteLength);
      bufferChunks.push(uvBuffer);

      const uvAccIdx = accessors.length;
      accessors.push({
        bufferView: uvViewIdx,
        byteOffset: 0,
        componentType: 5126,
        count: uvs.length / 2,
        type: 'VEC2',
      });

      // Add INDICES bufferView & accessor
      const indBuffer = indices.buffer.slice(indices.byteOffset, indices.byteOffset + indices.byteLength) as ArrayBuffer;
      const indViewIdx = bufferViews.length;
      bufferViews.push({ buffer: 0, byteOffset, byteLength: indBuffer.byteLength, target: 34963 });
      byteOffset = align4(byteOffset + indBuffer.byteLength);
      bufferChunks.push(indBuffer);

      const indAccIdx = accessors.length;
      accessors.push({
        bufferView: indViewIdx,
        byteOffset: 0,
        componentType: 5125, // UNSIGNED_INT
        count: indices.length,
        type: 'SCALAR',
      });

      // Add Primitive to Mesh
      gltfMeshes.push({
        name: layer.name,
        primitives: [
          {
            attributes: {
              POSITION: posAccIdx,
              NORMAL: normAccIdx,
              TEXCOORD_0: uvAccIdx,
            },
            indices: indAccIdx,
            material: Math.min(layerIdx, Math.max(0, gltfMaterials.length - 1)),
          },
        ],
      });
    });

    // Concatenate all binary buffer chunks
    const totalBinaryLength = byteOffset;
    const combinedBinaryBuffer = new Uint8Array(totalBinaryLength);
    let binCursor = 0;
    for (const chunk of bufferChunks) {
      combinedBinaryBuffer.set(new Uint8Array(chunk), binCursor);
      binCursor = align4(binCursor + chunk.byteLength);
    }

    // Build glTF JSON object
    const gltfJson = {
      asset: { version: '2.0', generator: 'Model Studio v1.0' },
      scene: 0,
      scenes: [{ nodes: gltfMeshes.map((_, i) => i) }],
      nodes: gltfMeshes.map((m, i) => ({ name: m.name, mesh: i })),
      meshes: gltfMeshes,
      materials: gltfMaterials,
      accessors,
      bufferViews,
      buffers: [{ byteLength: totalBinaryLength }],
    };

    // Serialize JSON chunk
    const jsonString = JSON.stringify(gltfJson);
    const jsonBytes = new TextEncoder().encode(jsonString);
    const paddedJsonLength = align4(jsonBytes.length);
    const jsonChunkBuffer = new Uint8Array(paddedJsonLength);
    jsonChunkBuffer.set(jsonBytes);
    for (let i = jsonBytes.length; i < paddedJsonLength; i++) {
      jsonChunkBuffer[i] = 0x20; // space padding
    }

    // glTF Header: 12 bytes
    // magic: 0x46546C67 ("glTF")
    // version: 2
    // length: 12 + 8 + paddedJsonLength + 8 + totalBinaryLength
    const totalGlbLength = 12 + 8 + paddedJsonLength + 8 + totalBinaryLength;
    const glbBuffer = new ArrayBuffer(totalGlbLength);
    const view = new DataView(glbBuffer);

    // Header
    view.setUint32(0, 0x46546c67, true); // magic 'glTF'
    view.setUint32(4, 2, true);          // version 2
    view.setUint32(8, totalGlbLength, true);

    // JSON Chunk header
    view.setUint32(12, paddedJsonLength, true);
    view.setUint32(16, 0x4e4f534a, true); // chunkType 'JSON'
    new Uint8Array(glbBuffer, 20, paddedJsonLength).set(jsonChunkBuffer);

    // BIN Chunk header
    const binHeaderOffset = 20 + paddedJsonLength;
    view.setUint32(binHeaderOffset, totalBinaryLength, true);
    view.setUint32(binHeaderOffset + 4, 0x004e4942, true); // chunkType 'BIN\0'
    new Uint8Array(glbBuffer, binHeaderOffset + 8, totalBinaryLength).set(combinedBinaryBuffer);

    return glbBuffer;
  }
}
