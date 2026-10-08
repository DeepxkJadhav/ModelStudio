/**
 * Model Studio - Default Model & Project Generator
 * Builds production 3D models with real polygon layers, materials, skeletons, and collision envelopes
 */

import {
  StudioProject,
  SpeciesCategory,
  MeshLayer,
  MaterialProperties,
  ClothSimulationParams,
  HairSimulationParams,
  CollisionEnvelope,
} from './types';
import { SkeletonGenerator } from '../rigging/skeletonGenerator';
import { AutoWeightingEngine } from '../rigging/autoWeighting';
import { MaterialGenerator } from '../reconstruction/materialGenerator';
import { CollisionSystem } from '../simulation/collisionSystem';
import { ActionSequencer } from '../animation/actionSequencer';
import { QualityScorer } from '../quality/qualityScorer';
import { ReferenceManager } from '../references/referenceManager';
import { CoverageCalculator } from '../references/coverageCalculator';
import { VisualHullReconstructor } from '../reconstruction/visualHull';
import { MarchingCubesPolygonizer } from '../reconstruction/marchingCubes';
import { UVGenerator } from '../reconstruction/uvGenerator';

export class DefaultModelFactory {
  static createDefaultProject(species: SpeciesCategory = 'HUMANOID'): StudioProject {
    const refManager = new ReferenceManager();
    const views = refManager.getAllViews();
    const coverageReport = CoverageCalculator.computeCoverage(views);

    // 1. Generate skeleton for species
    const skeleton = SkeletonGenerator.generateSkeleton(species);

    // 2. Generate implicit density field and extract genuine surface mesh
    const grid = VisualHullReconstructor.generateDensityField(species, views, 28);
    const polyMesh = MarchingCubesPolygonizer.extractSurface(grid, 0.0);
    const uvs = UVGenerator.generateUVs(polyMesh.vertices);

    // Compute skinning weights
    const skinning = AutoWeightingEngine.computeWeights(polyMesh.vertices, skeleton);

    // 3. Build multi-layer meshes (Body, Clothing, Hair)
    const materials = MaterialGenerator.generateDefaultPalette(false);

    // Body Layer
    const bodyLayer: MeshLayer = {
      id: 'layer_body',
      name: 'Body',
      type: 'body',
      visible: true,
      wireframe: false,
      materialId: 'mat_body',
      vertexCount: polyMesh.vertices.length / 3,
      triangleCount: polyMesh.indices.length / 3,
      vertices: polyMesh.vertices,
      normals: polyMesh.normals,
      uvs,
      indices: polyMesh.indices,
      skinIndices: skinning.skinIndices,
      skinWeights: skinning.skinWeights,
    };

    // Clothing Layer (Garment overlay with slight offset)
    const clothVerts = new Float32Array(polyMesh.vertices.length);
    for (let i = 0; i < polyMesh.vertices.length; i += 3) {
      const y = polyMesh.vertices[i + 1];
      const factor = (y > 0.8 && y < 1.4) ? 1.025 : 1.0;
      clothVerts[i] = polyMesh.vertices[i] * factor;
      clothVerts[i + 1] = polyMesh.vertices[i + 1];
      clothVerts[i + 2] = polyMesh.vertices[i + 2] * factor;
    }

    const clothLayer: MeshLayer = {
      id: 'layer_clothing',
      name: 'Clothing',
      type: 'clothing',
      visible: true,
      wireframe: false,
      materialId: 'mat_clothing',
      vertexCount: clothVerts.length / 3,
      triangleCount: polyMesh.indices.length / 3,
      vertices: clothVerts,
      normals: polyMesh.normals,
      uvs,
      indices: polyMesh.indices,
      skinIndices: skinning.skinIndices,
      skinWeights: skinning.skinWeights,
    };

    // Hair Layer (Crown strands)
    const hairVerts = new Float32Array(polyMesh.vertices.length);
    for (let i = 0; i < polyMesh.vertices.length; i += 3) {
      const y = polyMesh.vertices[i + 1];
      const factor = y > 1.45 ? 1.04 : 1.0;
      hairVerts[i] = polyMesh.vertices[i] * factor;
      hairVerts[i + 1] = polyMesh.vertices[i + 1] + (y > 1.45 ? 0.02 : 0);
      hairVerts[i + 2] = polyMesh.vertices[i + 2] * factor;
    }

    const hairLayer: MeshLayer = {
      id: 'layer_hair',
      name: 'Hair',
      type: 'hair',
      visible: true,
      wireframe: false,
      materialId: 'mat_hair',
      vertexCount: hairVerts.length / 3,
      triangleCount: polyMesh.indices.length / 3,
      vertices: hairVerts,
      normals: polyMesh.normals,
      uvs,
      indices: polyMesh.indices,
      skinIndices: skinning.skinIndices,
      skinWeights: skinning.skinWeights,
    };

    const layers: MeshLayer[] = [bodyLayer, clothLayer, hairLayer];

    // 4. Cloth & Hair Simulation parameters
    const clothParams: ClothSimulationParams[] = [
      {
        enabled: true,
        meshLayerId: 'layer_clothing',
        stiffness: 0.85,
        bend: 0.4,
        stretch: 0.9,
        damping: 0.15,
        gravity: 9.81,
        friction: 0.2,
        collisionMargin: 0.015,
        wind: [0, 0, 0],
      },
    ];

    const hairParams: HairSimulationParams[] = [
      {
        enabled: true,
        meshLayerId: 'layer_hair',
        stiffness: 0.7,
        damping: 0.2,
        gravity: 9.81,
        strandCount: 200,
        collisionMargin: 0.01,
      },
    ];

    // 5. Collision envelopes
    const collisionEnvelopes: CollisionEnvelope[] =
      species === 'HUMANOID'
        ? CollisionSystem.createDefaultHumanoidEnvelopes()
        : [
            { name: 'CoreCollider', type: 'sphere', boneAttachment: skeleton.rootBoneName, center: [0, 0.7, 0], radius: 0.25 },
          ];

    // 6. Action Sequence
    const defaultSteps =
      species === 'HUMANOID'
        ? [
            { id: 'step_1', action: 'WALK' as const, duration: 2.5 },
            { id: 'step_2', action: 'IDLE' as const, duration: 1.0 },
            { id: 'step_3', action: 'CROUCH' as const, duration: 1.5 },
            { id: 'step_4', action: 'JUMP' as const, duration: 1.2 },
          ]
        : species === 'SERPENT'
        ? [
            { id: 'step_1', action: 'SLITHER' as const, duration: 3.0 },
            { id: 'step_2', action: 'COIL' as const, duration: 2.0 },
            { id: 'step_3', action: 'STRIKE' as const, duration: 1.2 },
          ]
        : species === 'BIRD'
        ? [
            { id: 'step_1', action: 'FLAP' as const, duration: 2.0 },
            { id: 'step_2', action: 'FLY' as const, duration: 3.0 },
            { id: 'step_3', action: 'IDLE' as const, duration: 1.5 },
          ]
        : [
            { id: 'step_1', action: 'WALK' as const, duration: 2.0 },
            { id: 'step_2', action: 'RUN' as const, duration: 2.0 },
            { id: 'step_3', action: 'IDLE' as const, duration: 1.0 },
          ];

    const currentSequence = ActionSequencer.buildSequence('Default Sequence', defaultSteps, true);

    // 7. Quality Metrics
    const qualityMetrics = QualityScorer.evaluateQuality(layers, skeleton, views, 0);

    const initialProject: StudioProject = {
      formatVersion: '1.0.0',
      name: `${species.charAt(0) + species.slice(1).toLowerCase()} Studio Model`,
      createdTime: Date.now(),
      lastModifiedTime: Date.now(),
      species,
      qualityPreset: 'BALANCED',
      referenceViews: views,
      coverageReport,
      anatomicalAnalysis: {
        species,
        symmetryPlane: 'YZ',
        features: [],
        limbCount: species === 'HUMANOID' || species === 'QUADRUPED' ? 4 : species === 'BIRD' ? 2 : 0,
        hasTail: species === 'QUADRUPED' || species === 'SERPENT' || species === 'BIRD',
        hasWings: species === 'BIRD',
        hasFins: species === 'FISH',
        fingerCountPerHand: species === 'HUMANOID' ? 5 : 0,
        confidenceScore: 92,
      },
      skeleton,
      layers,
      materials,
      clothParams,
      hairParams,
      collisionEnvelopes,
      currentSequence,
      qualityMetrics,
      historySnapshots: [],
      currentVersion: 1,
    };

    return initialProject;
  }
}
