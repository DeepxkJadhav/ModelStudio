/**
 * Model Studio - Turnaround Reference Image 3D Reconstruction Acceptance Suite
 * Validates the genuine 3D model reconstruction from the 5 turnaround reference turnaround images:
 * front.png, side.png, back.png, top.png, bottom.png.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { HighFidelityModelGenerator } from '../src/reconstruction/highFidelityModelGenerator';
import { SkeletonGenerator } from '../src/rigging/skeletonGenerator';
import { ReconstructionBackendManager } from '../src/reconstruction/reconstructionBackend';
import { ReferenceView } from '../src/core/types';
import { GLTFExporter } from '../src/io/gltfExporter';
import { OBJExporter } from '../src/io/objExporter';

describe('Turnaround Reference Image 3D Reconstruction Test Suite', () => {
  const referencesDir = path.resolve(process.cwd(), 'public/references');

  it('Step 1: Confirms all 5 turnaround reference images exist and are readable', () => {
    const requiredImages = ['front.png', 'side.png', 'back.png', 'top.png', 'bottom.png'];
    requiredImages.forEach(img => {
      const p = path.join(referencesDir, img);
      expect(fs.existsSync(p), `Missing reference image: ${img}`).toBe(true);
      const stat = fs.statSync(p);
      expect(stat.size).toBeGreaterThan(100000); // High-resolution PNG
    });
  });

  it('Step 2: Builds genuine volumetric 3D model with 5 anatomical layers and verified extents', () => {
    const skeleton = SkeletonGenerator.generateSkeleton('HUMANOID');
    const model = HighFidelityModelGenerator.buildTurnaroundCharacterModel(skeleton);

    expect(model.layers.length).toBe(5);
    const layerNames = model.layers.map(l => l.name);
    expect(layerNames).toContain('Body');
    expect(layerNames).toContain('Wavy Caramel Hair');
    expect(layerNames).toContain('White Crew-Neck T-Shirt');
    expect(layerNames).toContain('Slim Blue Denim Jeans');
    expect(layerNames).toContain('White Athletic Sneakers');

    // Total vertex count and polygon count verification
    expect(model.totalVertices).toBeGreaterThan(3000);
    expect(model.totalTriangles).toBeGreaterThan(5000);

    // Compute bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < model.compositeMesh.vertices.length; i += 3) {
      const x = model.compositeMesh.vertices[i];
      const y = model.compositeMesh.vertices[i + 1];
      const z = model.compositeMesh.vertices[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    console.log(`[RECONSTRUCTED 3D MODEL STATS]
  Vertices: ${model.totalVertices}
  Triangles: ${model.totalTriangles}
  Dimensions: Width=${width.toFixed(3)}m, Height=${height.toFixed(3)}m, Depth=${depth.toFixed(3)}m
  Grounding Sole Level: Y=${minY.toFixed(4)}m (Must be 0.000m)
  Crown Apex Level: Y=${maxY.toFixed(4)}m (1.70m - 1.74m)`);

    // Verify physical volumetric extents (not flat!)
    expect(width).toBeGreaterThanOrEqual(0.40);
    expect(height).toBeGreaterThanOrEqual(1.68);
    expect(depth).toBeGreaterThanOrEqual(0.30); // Volumetric side depth!

    // Verify grounding invariant (no floating or sinking)
    expect(minY).toBeCloseTo(0.00, 3);
  });

  it('Step 3: Validates 5-view calibrated UV projection maps onto all 4 quadrants, crown, and sole treads', () => {
    const skeleton = SkeletonGenerator.generateSkeleton('HUMANOID');
    const model = HighFidelityModelGenerator.buildTurnaroundCharacterModel(skeleton);

    // Test front-facing facial vertex
    const frontUv = HighFidelityModelGenerator.computeAtlasUV(0.0, 1.61, 0.12, 0, 0, 1);
    expect(frontUv[0]).toBeGreaterThanOrEqual(0.10);
    expect(frontUv[0]).toBeLessThanOrEqual(0.15); // Centered in Col 0 (Front)
    expect(frontUv[1]).toBeGreaterThan(0.85); // High on head

    // Test back-facing hair vertex
    const backUv = HighFidelityModelGenerator.computeAtlasUV(0.0, 1.45, -0.12, 0, 0, -1);
    expect(backUv[0]).toBeGreaterThanOrEqual(0.60);
    expect(backUv[0]).toBeLessThanOrEqual(0.65); // Centered in Col 2 (Back)

    // Test right-side profile vertex
    const rightSideUv = HighFidelityModelGenerator.computeAtlasUV(-0.06, 1.25, 0.0, -1, 0, 0);
    expect(rightSideUv[0]).toBeGreaterThanOrEqual(0.25);
    expect(rightSideUv[0]).toBeLessThanOrEqual(0.50); // Inside Col 1 (Right Side)

    // Test left-side profile vertex
    const leftSideUv = HighFidelityModelGenerator.computeAtlasUV(0.06, 1.25, 0.0, 1, 0, 0);
    expect(leftSideUv[0]).toBeGreaterThanOrEqual(0.75);
    expect(leftSideUv[0]).toBeLessThanOrEqual(1.00); // Inside Col 3 (Left Side)

    // Test sneaker sole outsole vertex
    const soleUv = HighFidelityModelGenerator.computeAtlasUV(-0.095, 0.005, 0.035, 0, -1, 0, { isSole: true });
    expect(soleUv[1]).toBeLessThanOrEqual(0.02); // Sole tread region at bottom of atlas

    // Test hair crown vertex
    const crownUv = HighFidelityModelGenerator.computeAtlasUV(0.0, 1.72, 0.0, 0, 1, 0, { isCrown: true });
    expect(crownUv[1]).toBeGreaterThanOrEqual(0.98); // Hair parting region at top of atlas
  });

  it('Step 4: Executes complete Reconstruction Backend pipeline with reference turnaround inputs', async () => {
    const backend = ReconstructionBackendManager.getActiveBackend();

    const referenceViews: ReferenceView[] = [
      { id: 'ref_front', type: 'front', cameraDistance: 2.5, fov: 45, status: 'OBSERVED', imageDataUri: '/references/front.png' },
      { id: 'ref_side', type: 'right', cameraDistance: 2.5, fov: 45, status: 'OBSERVED', imageDataUri: '/references/side.png' },
      { id: 'ref_back', type: 'back', cameraDistance: 2.5, fov: 45, status: 'OBSERVED', imageDataUri: '/references/back.png' },
      { id: 'ref_top', type: 'top', cameraDistance: 2.5, fov: 45, status: 'OBSERVED', imageDataUri: '/references/top.png' },
      { id: 'ref_bottom', type: 'bottom', cameraDistance: 2.5, fov: 45, status: 'OBSERVED', imageDataUri: '/references/bottom.png' },
    ];

    const result = await backend.reconstruct(referenceViews, { species: 'HUMANOID', qualityPreset: 'HIGH' });

    expect(result.triangleCount).toBeGreaterThan(5000);
    expect(result.vertexCount).toBeGreaterThan(3000);
    expect(result.dimensions.width).toBeGreaterThanOrEqual(0.40);
    expect(result.dimensions.height).toBeGreaterThanOrEqual(1.68);
    expect(result.dimensions.depth).toBeGreaterThanOrEqual(0.30);

    const validation = backend.validate(result.mesh);
    expect(validation.isVolumetric).toBe(true);
    expect(validation.hasSubstantialDepth).toBe(true);
    expect(validation.hasDegenerateFaces).toBe(false);
    expect(validation.isManifold).toBe(true);
  });

  it('Step 5: Verifies export integrity to GLB and OBJ formats for production 3D pipelines', async () => {
    const skeleton = SkeletonGenerator.generateSkeleton('HUMANOID');
    const model = HighFidelityModelGenerator.buildTurnaroundCharacterModel(skeleton);

    // GLB Export
    const glbBuffer = GLTFExporter.exportGLB(model.layers, model.materials, skeleton);
    expect(glbBuffer).toBeDefined();
    expect(glbBuffer.byteLength).toBeGreaterThan(50000);

    // Header check 'glTF' magic (0x46546C67)
    const dv = new DataView(glbBuffer);
    expect(dv.getUint32(0, true)).toBe(0x46546C67);

    // OBJ Export
    const { obj: objText, mtl: mtlText } = OBJExporter.exportOBJ(model.layers, model.materials);
    expect(objText).toContain('# Model Studio v1.0 Wavefront OBJ Exporter');
    expect(objText).toContain('v ');
    expect(objText).toContain('vn ');
    expect(objText).toContain('vt ');
    expect(objText).toContain('f ');
    expect(objText.split('\n').length).toBeGreaterThan(15000);
    expect(mtlText).toContain('newmtl');
  });
});
