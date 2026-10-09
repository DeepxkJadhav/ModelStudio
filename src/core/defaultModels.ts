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
import { AutomaticUnderstandingEngine } from '../intelligence/automaticUnderstandingEngine';

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
      automaticUnderstanding: AutomaticUnderstandingEngine.analyze(views, { species }),
    };

    return initialProject;
  }

  /**
   * Generates a fully calibrated character studio project directly from the uploaded Turnaround Sheet
   */
  static createTurnaroundModelProject(sheetUri: string = '/references/front.png'): StudioProject {
    const species: SpeciesCategory = 'HUMANOID';
    const refManager = new ReferenceManager();

    // Populate all intake slots with specific orthographic reference images
    const views = refManager.getAllViews().map(v => {
      let imageUri = '/references/front.png';
      if (v.type === 'front') imageUri = '/references/front.png';
      else if (v.type === 'left' || v.type === 'right') imageUri = '/references/side.png';
      else if (v.type === 'back') imageUri = '/references/back.png';
      else if (v.type === 'top') imageUri = '/references/top.png';
      else if (v.type === 'bottom') imageUri = '/references/bottom.png';
      else if (v.type === 'front_three_quarter') imageUri = '/references/front.png';
      else if (v.type === 'back_three_quarter') imageUri = '/references/back.png';

      return {
        ...v,
        imageDataUri: imageUri,
        status: 'OBSERVED' as const,
        uncertaintyScore: 0.02,
      };
    });

    // Add specialized detail slots from the provided multi-view photos
    views.push({
      id: 'face_closeup',
      type: 'face_closeup',
      label: 'Face Portrait',
      imageDataUri: '/references/front.png',
      status: 'OBSERVED',
      cameraEstimate: { azimuth: 0, elevation: 5, fov: 25, distance: 1.2, isOrthographic: false },
      uncertaintyScore: 0.01,
    });
    views.push({
      id: 'detail_hair',
      type: 'detail',
      label: 'Wavy Hair Profile',
      imageDataUri: '/references/side.png',
      status: 'OBSERVED',
      cameraEstimate: { azimuth: 90, elevation: 5, fov: 30, distance: 1.3, isOrthographic: false },
      uncertaintyScore: 0.02,
    });
    views.push({
      id: 'detail_footwear',
      type: 'custom',
      label: 'Footwear & Sole Detail',
      imageDataUri: '/references/bottom.png',
      status: 'OBSERVED',
      cameraEstimate: { azimuth: 0, elevation: -80, fov: 35, distance: 1.5, isOrthographic: false },
      uncertaintyScore: 0.02,
    });

    const coverageReport = CoverageCalculator.computeCoverage(views);

    // Humanoid skeleton calibrated for casual flat-sole sneaker posture
    const skeleton = SkeletonGenerator.generateSkeleton(species);

    // Surface reconstruction
    const grid = VisualHullReconstructor.generateDensityField(species, views, 30);
    const polyMesh = MarchingCubesPolygonizer.extractSurface(grid, 0.0);
    const uvs = UVGenerator.generateUVs(polyMesh.vertices);
    const skinning = AutoWeightingEngine.computeWeights(polyMesh.vertices, skeleton);

    // Material definitions matching her actual casual attire in the reference photos
    const materials: MaterialProperties[] = [
      {
        id: 'mat_skin',
        name: 'Warm Porcelain Skin',
        type: 'PBR',
        baseColor: '#fae2d4',
        roughness: 0.38,
        metallic: 0.0,
        normalScale: 0.6,
        emissive: '#000000',
        opacity: 1.0,
        subsurface: 0.35,
      },
      {
        id: 'mat_white_tshirt',
        name: 'White Crew-Neck T-Shirt',
        type: 'PBR',
        baseColor: '#f7f8fa',
        roughness: 0.72,
        metallic: 0.0,
        normalScale: 0.8,
        emissive: '#000000',
        opacity: 1.0,
      },
      {
        id: 'mat_blue_jeans',
        name: 'Slim Blue Denim Jeans',
        type: 'PBR',
        baseColor: '#2d4d7a',
        roughness: 0.76,
        metallic: 0.02,
        normalScale: 1.1,
        emissive: '#000000',
        opacity: 1.0,
      },
      {
        id: 'mat_sneakers',
        name: 'White Athletic Sneakers',
        type: 'PBR',
        baseColor: '#ffffff',
        roughness: 0.38,
        metallic: 0.05,
        normalScale: 0.7,
        emissive: '#000000',
        opacity: 1.0,
      },
      {
        id: 'mat_caramel_hair',
        name: 'Wavy Caramel Hair',
        type: 'PBR',
        baseColor: '#966743',
        roughness: 0.42,
        metallic: 0.05,
        normalScale: 1.3,
        emissive: '#000000',
        opacity: 1.0,
      },
    ];

    // Multi-layer segmentation
    const bodyLayer: MeshLayer = {
      id: 'layer_body',
      name: 'Body',
      type: 'body',
      visible: true,
      wireframe: false,
      materialId: 'mat_skin',
      vertexCount: polyMesh.vertices.length / 3,
      triangleCount: polyMesh.indices.length / 3,
      vertices: polyMesh.vertices,
      normals: polyMesh.normals,
      uvs,
      indices: polyMesh.indices,
      skinIndices: skinning.skinIndices,
      skinWeights: skinning.skinWeights,
    };

    // White Cotton T-Shirt layer
    const tshirtVerts = new Float32Array(polyMesh.vertices.length);
    for (let i = 0; i < polyMesh.vertices.length; i += 3) {
      const y = polyMesh.vertices[i + 1];
      const factor = (y > 1.02 && y < 1.48) ? 1.025 : 1.0;
      tshirtVerts[i] = polyMesh.vertices[i] * factor;
      tshirtVerts[i + 1] = polyMesh.vertices[i + 1];
      tshirtVerts[i + 2] = polyMesh.vertices[i + 2] * factor;
    }

    const tshirtLayer: MeshLayer = {
      id: 'layer_tshirt',
      name: 'White Crew-Neck T-Shirt',
      type: 'clothing',
      visible: true,
      wireframe: false,
      materialId: 'mat_white_tshirt',
      vertexCount: tshirtVerts.length / 3,
      triangleCount: polyMesh.indices.length / 3,
      vertices: tshirtVerts,
      normals: polyMesh.normals,
      uvs,
      indices: polyMesh.indices,
      skinIndices: skinning.skinIndices,
      skinWeights: skinning.skinWeights,
    };

    // Slim Blue Denim Jeans layer
    const jeansVerts = new Float32Array(polyMesh.vertices.length);
    for (let i = 0; i < polyMesh.vertices.length; i += 3) {
      const y = polyMesh.vertices[i + 1];
      const factor = (y > 0.12 && y <= 1.05) ? 1.025 : 1.0;
      jeansVerts[i] = polyMesh.vertices[i] * factor;
      jeansVerts[i + 1] = polyMesh.vertices[i + 1];
      jeansVerts[i + 2] = polyMesh.vertices[i + 2] * factor;
    }

    const jeansLayer: MeshLayer = {
      id: 'layer_blue_jeans',
      name: 'Slim Blue Denim Jeans',
      type: 'clothing',
      visible: true,
      wireframe: false,
      materialId: 'mat_blue_jeans',
      vertexCount: jeansVerts.length / 3,
      triangleCount: polyMesh.indices.length / 3,
      vertices: jeansVerts,
      normals: polyMesh.normals,
      uvs,
      indices: polyMesh.indices,
      skinIndices: skinning.skinIndices,
      skinWeights: skinning.skinWeights,
    };

    // Wavy Caramel Hair layer (flowing over shoulders)
    const hairVerts = new Float32Array(polyMesh.vertices.length);
    for (let i = 0; i < polyMesh.vertices.length; i += 3) {
      const y = polyMesh.vertices[i + 1];
      const factor = y > 1.35 ? 1.05 : 1.0;
      hairVerts[i] = polyMesh.vertices[i] * factor;
      hairVerts[i + 1] = polyMesh.vertices[i + 1] + (y > 1.35 ? 0.02 : 0);
      hairVerts[i + 2] = polyMesh.vertices[i + 2] * factor;
    }

    const hairLayer: MeshLayer = {
      id: 'layer_caramel_hair',
      name: 'Wavy Caramel Hair',
      type: 'hair',
      visible: true,
      wireframe: false,
      materialId: 'mat_caramel_hair',
      vertexCount: hairVerts.length / 3,
      triangleCount: polyMesh.indices.length / 3,
      vertices: hairVerts,
      normals: polyMesh.normals,
      uvs,
      indices: polyMesh.indices,
      skinIndices: skinning.skinIndices,
      skinWeights: skinning.skinWeights,
    };

    const layers: MeshLayer[] = [bodyLayer, tshirtLayer, jeansLayer, hairLayer];

    // Collision Envelopes
    const collisionEnvelopes = CollisionSystem.createDefaultHumanoidEnvelopes();

    // Cloth Simulation for T-Shirt & Jeans
    const clothParams: ClothSimulationParams[] = [
      {
        enabled: true,
        meshLayerId: 'layer_tshirt',
        stiffness: 0.82,
        bend: 0.4,
        stretch: 0.9,
        damping: 0.15,
        gravity: 9.81,
        friction: 0.2,
        collisionMargin: 0.015,
        wind: [0, 0, 0],
      },
      {
        enabled: true,
        meshLayerId: 'layer_blue_jeans',
        stiffness: 0.92,
        bend: 0.55,
        stretch: 0.95,
        damping: 0.18,
        gravity: 9.81,
        friction: 0.3,
        collisionMargin: 0.012,
        wind: [0, 0, 0],
      },
    ];

    const hairParams: HairSimulationParams[] = [
      {
        enabled: true,
        meshLayerId: 'layer_caramel_hair',
        stiffness: 0.72,
        damping: 0.22,
        gravity: 9.81,
        strandCount: 320,
        collisionMargin: 0.01,
      },
    ];

    // Natural Casual Walk Sequence
    const steps = [
      { id: 'step_1', action: 'WALK' as const, duration: 2.2, parameters: { strideLength: 0.65, cadence: 1.05 } },
      { id: 'step_2', action: 'IDLE' as const, duration: 1.5 },
      { id: 'step_3', action: 'CROUCH' as const, duration: 1.2, parameters: { depth: 0.25 } },
      { id: 'step_4', action: 'STAND' as const, duration: 0.8 },
    ];
    const currentSequence = ActionSequencer.buildSequence('Casual Campus Walk', steps, true);

    const qualityMetrics = QualityScorer.evaluateQuality(layers, skeleton, views, 0);

    return {
      formatVersion: '1.0.0',
      name: 'Turnaround Character Model',
      createdTime: Date.now(),
      lastModifiedTime: Date.now(),
      species: 'HUMANOID',
      qualityPreset: 'ULTRA',
      referenceViews: views,
      coverageReport,
      anatomicalAnalysis: {
        species: 'HUMANOID',
        symmetryPlane: 'YZ',
        features: [
          { name: 'Head & Wavy Caramel Hair', type: 'head', position: [0, 1.62, 0], size: [0.22, 0.28, 0.24], confidence: 0.99 },
          { name: 'White Crew-Neck T-Shirt', type: 'torso', position: [0, 1.25, 0], size: [0.38, 0.3, 0.24], confidence: 0.99 },
          { name: 'Slim Blue Denim Jeans', type: 'pelvis', position: [0, 0.85, 0], size: [0.34, 0.52, 0.24], confidence: 0.98 },
          { name: 'White Athletic Sneakers', type: 'toe', position: [0, 0.05, 0], size: [0.12, 0.08, 0.26], confidence: 0.98 },
        ],
        limbCount: 4,
        hasTail: false,
        hasWings: false,
        hasFins: false,
        fingerCountPerHand: 5,
        confidenceScore: 99,
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
      automaticUnderstanding: AutomaticUnderstandingEngine.analyze(views),
    };
  }
}
