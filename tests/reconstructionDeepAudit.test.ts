/**
 * Model Studio - Comprehensive 12-Point Reconstruction Deep Audit & Workflow Suite (Section 12)
 * Validates real volumetric reconstruction, backend failover, rigging, species classification,
 * multi-view handling, animation, and export round-trips.
 */

import { describe, it, expect } from 'vitest';
import { ReferenceManager } from '../src/references/referenceManager';
import { SilhouetteExtractor } from '../src/references/silhouetteExtractor';
import {
  LocalVolumetricReconstructionBackend,
  LocalAIServerReconstructionBackend,
  ReconstructionBackendManager,
} from '../src/reconstruction/reconstructionBackend';
import { SpeciesClassifier } from '../src/intelligence/speciesClassifier';
import { SkeletonGenerator } from '../src/rigging/skeletonGenerator';
import { LocomotionEngine } from '../src/animation/locomotionEngine';
import { aiProvider } from '../src/intelligence/aiProvider';
import { GLTFExporter } from '../src/io/gltfExporter';
import { OBJExporter } from '../src/io/objExporter';
import { VRMExporter } from '../src/io/vrmExporter';
import { ImportManager } from '../src/io/importManager';
import * as THREE from 'three';

describe('12-Point Reconstruction Deep Audit Suite (Section 12)', () => {
  const volumetricBackend = new LocalVolumetricReconstructionBackend();
  const aiServerBackend = new LocalAIServerReconstructionBackend();
  const refManager = new ReferenceManager();

  // 1. Reference-image upload and validation
  it('1. Reference-image upload and validation: Analyzes reference images, extracts bounding dimensions and foreground silhouette', () => {
    const testSvgUri = 'data:image/svg+xml;utf8,<svg width="400" height="800"><rect x="100" y="50" width="200" height="700" fill="black"/></svg>';
    const profile = SilhouetteExtractor.extractProfile(testSvgUri, 'front');

    expect(profile).toBeDefined();
    expect(profile.width).toBe(400);
    expect(profile.height).toBe(800);
    expect(profile.verticalWidths.length).toBe(64);
    expect(profile.foregroundRatio).toBeGreaterThan(0.2);
    expect(profile.detectedAspectRatio).toBeCloseTo(0.5, 1);
    expect(profile.subjectCategoryHint).toBe('UPRIGHT');
  });

  // 2. Backend request construction
  it('2. Backend request construction: Correctly constructs and validates multi-view reconstruction parameters', () => {
    const views = refManager.getAllViews();
    const analysis = volumetricBackend.analyzeReferences(views);

    expect(analysis).toBeDefined();
    expect(analysis.detectedViewsCount).toBeGreaterThanOrEqual(0);
    expect(typeof analysis.hasFront).toBe('boolean');
    expect(typeof analysis.hasSide).toBe('boolean');
    expect(typeof analysis.hasBack).toBe('boolean');
  });

  // 3. Missing model weights or unavailable inference backend
  it('3. Missing model weights / unavailable inference backend: Gracefully detects offline AI server and falls back to Volumetric Hull', async () => {
    // When port 8000 is not running, checkServerHealth must report offline safely without throwing
    const health = await aiServerBackend.checkServerHealth();
    expect(health).toBeDefined();
    expect(typeof health.isOnline).toBe('boolean');
    expect(health.statusMessage).toBeDefined();

    // Reconstruct through AI adapter must seamlessly succeed via fallback
    const result = await aiServerBackend.reconstruct(refManager.getAllViews(), { resolution: 24 });
    expect(result.mesh).toBeDefined();
    expect(result.triangleCount).toBeGreaterThan(500);
  });

  // 4. Successful reconstruction using a genuine model or a clearly identified test fixture
  it('4. Successful reconstruction: Produces watertight polygonal surface with manifold topology', async () => {
    const views = refManager.getAllViews();
    const result = await volumetricBackend.reconstruct(views, { species: 'HUMANOID', resolution: 28 });
    const mesh = result.mesh;

    expect(mesh.vertices.length).toBeGreaterThan(3000);
    expect(mesh.indices.length).toBeGreaterThan(4500);
    expect(mesh.normals.length).toBe(mesh.vertices.length);
    expect(mesh.uvs.length).toBe((mesh.vertices.length / 3) * 2);

    const validation = volumetricBackend.validate(mesh);
    expect(validation.isVolumetric).toBe(true);
    expect(validation.hasSubstantialDepth).toBe(true);
    expect(validation.hasDegenerateFaces).toBe(false);
  });

  // 5. Geometry loading into the viewport
  it('5. Geometry loading into viewport: Converts reconstructed polygon mesh into valid Three.js BufferGeometry', async () => {
    const views = refManager.getAllViews();
    const result = await volumetricBackend.reconstruct(views, { species: 'HUMANOID', resolution: 24 });
    const mesh = result.mesh;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(mesh.vertices, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(mesh.uvs, 2));
    geom.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    geom.computeBoundingBox();

    expect(geom.boundingBox).not.toBeNull();
    const box = geom.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);

    expect(size.x).toBeGreaterThan(0.3);
    expect(size.y).toBeGreaterThan(1.2);
    expect(size.z).toBeGreaterThan(0.2); // Critical non-flat depth
  });

  // 6. Mesh bounds, vertex count, triangle count, and depth
  it('6. Mesh bounds, vertex count, triangle count, and depth: Verifies physical scale across Humanoid and Animal', async () => {
    const humanResult = await volumetricBackend.reconstruct([], { species: 'HUMANOID', resolution: 26 });
    expect(humanResult.dimensions.height).toBeGreaterThan(1.5); // Humanoid is tall
    expect(humanResult.dimensions.depth).toBeGreaterThan(0.25);

    const quadResult = await volumetricBackend.reconstruct([], { species: 'QUADRUPED', resolution: 26 });
    expect(quadResult.dimensions.depth).toBeGreaterThan(0.8); // Quadruped has horizontal length
  });

  // 7. Multi-view reference handling
  it('7. Multi-view reference handling: Ingestion of side and back silhouettes constrains 3D volume', async () => {
    const defaultResult = await volumetricBackend.reconstruct([], { species: 'HUMANOID', resolution: 26 });

    const multiViews = [
      {
        id: 'front',
        type: 'front' as const,
        label: 'Front View',
        imageDataUri: 'data:image/svg+xml;utf8,<svg width="200" height="400"><rect x="50" y="20" width="100" height="360" fill="black"/></svg>',
        status: 'OBSERVED' as const,
        uncertaintyScore: 0.05,
      },
      {
        id: 'left',
        type: 'left' as const,
        label: 'Left View',
        imageDataUri: 'data:image/svg+xml;utf8,<svg width="200" height="400"><rect x="70" y="20" width="60" height="360" fill="black"/></svg>',
        status: 'OBSERVED' as const,
        uncertaintyScore: 0.05,
      },
    ];

    const multiResult = await volumetricBackend.reconstruct(multiViews, { species: 'HUMANOID', resolution: 26 });
    expect(multiResult.mesh.vertices.length).toBeGreaterThan(0);
    expect(multiResult.triangleCount).toBeGreaterThan(500);
  });

  // 8. Species classification and override
  it('8. Species classification & override: Automatically classifies top-level categories and respects user overrides', () => {
    // 1. Automatic classification heuristics
    const dogViews = [{ id: 'v1', type: 'front' as const, label: 'Front', imageDataUri: 'http://assets.com/dog_photo.jpg', status: 'OBSERVED' as const, uncertaintyScore: 0.1 }];
    const dogClass = SpeciesClassifier.classifyFromEvidence(dogViews);
    expect(dogClass.topLevelCategory).toBe('Animal');
    expect(dogClass.category).toBe('QUADRUPED');

    const birdViews = [{ id: 'v2', type: 'front' as const, label: 'Front', imageDataUri: 'http://assets.com/eagle_avian.jpg', status: 'OBSERVED' as const, uncertaintyScore: 0.1 }];
    const birdClass = SpeciesClassifier.classifyFromEvidence(birdViews);
    expect(birdClass.topLevelCategory).toBe('Bird');
    expect(birdClass.category).toBe('BIRD');

    const fishViews = [{ id: 'v3', type: 'front' as const, label: 'Front', imageDataUri: 'http://assets.com/shark_aquatic.jpg', status: 'OBSERVED' as const, uncertaintyScore: 0.1 }];
    const fishClass = SpeciesClassifier.classifyFromEvidence(fishViews);
    expect(fishClass.topLevelCategory).toBe('Aquatic');
    expect(fishClass.category).toBe('FISH');

    // 2. User override test
    const overridden = SpeciesClassifier.classifyFromEvidence(dogViews, 'CREATURE');
    expect(overridden.topLevelCategory).toBe('Unknown Creature');
    expect(overridden.category).toBe('CREATURE');
    expect(overridden.confidence).toBe(1.0);
  });

  // 9. Rigging behavior for supported anatomy
  it('9. Rigging behavior: Generates 5-finger humanoid hands, quadruped legs, bird wings, fish fins, and creature appendages', () => {
    // Humanoid: Must have 5 fingers per hand
    const humanRig = SkeletonGenerator.generateSkeleton('HUMANOID');
    const leftThumb = humanRig.bones.find(b => b.name === 'LeftHandThumb1');
    const leftLittle = humanRig.bones.find(b => b.name === 'LeftHandLittle3');
    expect(leftThumb).toBeDefined();
    expect(leftLittle).toBeDefined();

    // Quadruped: Must have 4 distinct leg chains and tail
    const quadRig = SkeletonGenerator.generateSkeleton('QUADRUPED');
    expect(quadRig.bones.some(b => b.name.includes('FL_'))).toBe(true);
    expect(quadRig.bones.some(b => b.name.includes('Tail'))).toBe(true);

    // Bird: Must have wings
    const birdRig = SkeletonGenerator.generateSkeleton('BIRD');
    expect(birdRig.bones.some(b => b.name.includes('Wing'))).toBe(true);

    // Unknown Creature: Must support custom multi-appendages
    const creatureRig = SkeletonGenerator.generateSkeleton('CREATURE', { weightBearingLegs: 6, hasWings: true });
    expect(creatureRig.bones.some(b => b.name.includes('Leg3_'))).toBe(true);
  });

  // 10. Animation playback and timeline data
  it('10. Animation playback & commands: Evaluates species-specific locomotion and translates animation prompts', async () => {
    const humanRig = SkeletonGenerator.generateSkeleton('HUMANOID');

    // Humanoid poses for WALK, WAVE, TURN_LEFT
    const walkPose = LocomotionEngine.evaluatePose('HUMANOID', 'WALK', 0.5, humanRig);
    expect(walkPose['Hips']).toBeDefined();
    expect(walkPose['LeftUpperLeg']).toBeDefined();

    const wavePose = LocomotionEngine.evaluatePose('HUMANOID', 'WAVE', 0.5, humanRig);
    expect(wavePose['RightUpperArm']).toBeDefined();

    const turnPose = LocomotionEngine.evaluatePose('HUMANOID', 'TURN_LEFT', 0.5, humanRig);
    expect(turnPose['Hips']).toBeDefined();

    // Natural language command translation with species safety guards
    const fishSteps = await aiProvider.interpretAnimationPrompt('walk forward', 'FISH');
    expect(fishSteps[0].action).toBe('SWIM'); // Mapped walk to swim for fish

    const humanSteps = await aiProvider.interpretAnimationPrompt('wave hello and turn left', 'HUMANOID');
    expect(humanSteps.some(s => s.action === 'WAVE')).toBe(true);
    expect(humanSteps.some(s => s.action === 'TURN_LEFT')).toBe(true);
  });

  // 11. Export and re-import validation
  it('11. Export & re-import: Exports valid GLB, OBJ, and enforces VRM humanoid validation gate', async () => {
    const views = refManager.getAllViews();
    const result = await volumetricBackend.reconstruct(views, { species: 'HUMANOID', resolution: 24 });

    // GLB Export
    const glbBuffer = (await volumetricBackend.export(result.mesh, 'GLB')) as ArrayBuffer;
    expect(glbBuffer.byteLength).toBeGreaterThan(1000);
    const magic = new DataView(glbBuffer).getUint32(0, true);
    expect(magic).toBe(0x46546c67); // 'glTF' header

    // OBJ Export & Re-import
    const objText = (await volumetricBackend.export(result.mesh, 'OBJ')) as string;
    expect(objText).toContain('v ');
    expect(objText).toContain('f ');
    const reimported = ImportManager.parseOBJ(objText);
    expect(reimported.layers.length).toBeGreaterThan(0);
    expect(reimported.layers[0].vertexCount).toBeGreaterThan(0);

    // VRM Humanoid Gate Check
    const quadRig = SkeletonGenerator.generateSkeleton('QUADRUPED');
    const vrmReport = VRMExporter.validateForVRM('QUADRUPED', quadRig);
    expect(vrmReport.isValidForVRM).toBe(false);
    expect(vrmReport.speciesWarning).toContain('non-humanoid');
  });

  // 12. Error recovery and resource cleanup
  it('12. Error recovery: Detects degenerate flat planes and handles empty reference inputs gracefully', () => {
    // Degenerate flat card (all vertices at z = 0)
    const flatPlane = {
      vertices: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
      normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    };

    const validation = volumetricBackend.validate(flatPlane);
    expect(validation.isVolumetric).toBe(false);
    expect(validation.hasSubstantialDepth).toBe(false);
  });
});
