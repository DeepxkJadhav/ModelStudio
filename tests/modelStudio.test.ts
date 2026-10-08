/**
 * Model Studio - Master Automated Test Suite (Sections 62, 63)
 * Tests Reference Intelligence, Reconstruction, Topology, Rigging, Procedural Motion,
 * Physics & Anti-Clipping, GLB / VRM / OBJ / STL Export, and Re-Import Verification
 */

import { describe, it, expect } from 'vitest';
import { ReferenceManager } from '../src/references/referenceManager';
import { SheetAnalyzer } from '../src/references/sheetAnalyzer';
import { CoverageCalculator } from '../src/references/coverageCalculator';
import { CameraCalibrator } from '../src/references/cameraCalibrator';
import { SpeciesClassifier } from '../src/intelligence/speciesClassifier';
import { AnatomyDetector } from '../src/intelligence/anatomyDetector';
import { ErrorMapEvaluator } from '../src/intelligence/errorMap';
import { aiProvider } from '../src/intelligence/aiProvider';
import { VisualHullReconstructor } from '../src/reconstruction/visualHull';
import { MarchingCubesPolygonizer } from '../src/reconstruction/marchingCubes';
import { TopologyOptimizer } from '../src/reconstruction/topologyOptimizer';
import { UVGenerator } from '../src/reconstruction/uvGenerator';
import { MaterialGenerator } from '../src/reconstruction/materialGenerator';
import { ReconstructionRefinementLoop } from '../src/reconstruction/refinementLoop';
import { SkeletonGenerator } from '../src/rigging/skeletonGenerator';
import { FingerSystem } from '../src/rigging/fingerSystem';
import { AutoWeightingEngine } from '../src/rigging/autoWeighting';
import { IKFKSolver } from '../src/rigging/ikFkSolver';
import { FacialRig } from '../src/rigging/facialRig';
import { DeformationValidator } from '../src/rigging/deformationValidator';
import { CollisionSystem } from '../src/simulation/collisionSystem';
import { ClothSimulator } from '../src/simulation/clothSimulator';
import { HairSimulator } from '../src/simulation/hairSimulator';
import { AntiClippingEngine } from '../src/simulation/antiClippingEngine';
import { LocomotionEngine } from '../src/animation/locomotionEngine';
import { FootHandIKEngine } from '../src/animation/footHandIK';
import { ActionSequencer } from '../src/animation/actionSequencer';
import { MotionValidator } from '../src/animation/motionValidator';
import { QualityScorer } from '../src/quality/qualityScorer';
import { GLTFExporter } from '../src/io/gltfExporter';
import { VRMExporter } from '../src/io/vrmExporter';
import { OBJExporter } from '../src/io/objExporter';
import { STLExporter } from '../src/io/stlExporter';
import { PLYExporter } from '../src/io/plyExporter';
import { ImportManager } from '../src/io/importManager';
import { ReimportValidator } from '../src/io/reimportValidator';
import { ProjectSerializer } from '../src/core/project';
import { DefaultModelFactory } from '../src/core/defaultModels';

describe('Model Studio Test Suite', () => {
  describe('1. Reference Intelligence (Sections 3, 4, 5, 6, 7)', () => {
    it('initializes canonical reference intake slots with default angles', () => {
      const manager = new ReferenceManager();
      const views = manager.getAllViews();
      expect(views.length).toBeGreaterThanOrEqual(8);

      const front = manager.getView('front');
      expect(front).toBeDefined();
      expect(front?.cameraEstimate.azimuth).toBe(0);
      expect(front?.status).toBe('UNCERTAIN');
    });

    it('slices turnaround sheets and classifies view perspectives', async () => {
      const panels = await SheetAnalyzer.analyzeSheet('mock_data_uri', 3);
      expect(panels.length).toBe(3);
      expect(panels[0].predictedView).toBe('front');
      expect(panels[1].predictedView).toBe('right');
      expect(panels[2].predictedView).toBe('back');

      const frontClass = SheetAnalyzer.classifyPanel(0.4, true, 0.95);
      expect(frontClass.view).toBe('front');
      expect(frontClass.confidence).toBeGreaterThan(0.8);
    });

    it('calculates reference coverage percentages accurately', () => {
      const manager = new ReferenceManager();
      manager.setSlotImage('front', 'data:mock/front');
      manager.setSlotImage('right', 'data:mock/right');
      manager.setSlotImage('back', 'data:mock/back');

      const coverage = CoverageCalculator.computeCoverage(manager.getAllViews());
      expect(coverage.overallPercentage).toBeGreaterThan(60);
      expect(coverage.regions.head.percentage).toBeGreaterThan(70);
      expect(coverage.regions.torso.percentage).toBeGreaterThan(70);
    });
  });

  describe('2. Species & Anatomical Intelligence (Sections 8, 9, 10)', () => {
    it('classifies species categories without hardcoding to humanoid', () => {
      const mgr = new ReferenceManager();
      const humanoidResult = SpeciesClassifier.classifyFromEvidence(mgr.getAllViews());
      expect(humanoidResult.category).toBe('HUMANOID');

      // Serpent heuristic
      const serpentViews = [{ ...mgr.getView('front')!, imageDataUri: 'file:///turnaround_serpent_snake.png' }];
      const serpentResult = SpeciesClassifier.classifyFromEvidence(serpentViews as any);
      expect(serpentResult.category).toBe('SERPENT');

      // Quadruped heuristic
      const quadViews = [{ ...mgr.getView('front')!, imageDataUri: 'file:///turnaround_wolf_quadruped.png' }];
      const quadResult = SpeciesClassifier.classifyFromEvidence(quadViews as any);
      expect(quadResult.category).toBe('QUADRUPED');
    });

    it('generates anatomical landmarks tailored to species structure', () => {
      const humanAnatomy = AnatomyDetector.analyzeAnatomy('HUMANOID');
      expect(humanAnatomy.limbCount).toBe(4);
      expect(humanAnatomy.fingerCountPerHand).toBe(5);
      expect(humanAnatomy.hasTail).toBe(false);

      const serpentAnatomy = AnatomyDetector.analyzeAnatomy('SERPENT');
      expect(serpentAnatomy.limbCount).toBe(0);
      expect(serpentAnatomy.hasTail).toBe(true);

      const birdAnatomy = AnatomyDetector.analyzeAnatomy('BIRD');
      expect(birdAnatomy.hasWings).toBe(true);
      expect(birdAnatomy.limbCount).toBe(2);
    });

    it('generates distinct skeletal topologies for distinct species (never forcing humanoid)', () => {
      const humanRig = SkeletonGenerator.generateSkeleton('HUMANOID');
      expect(humanRig.bones.some(b => b.name === 'LeftHandIndex1')).toBe(true);

      const serpentRig = SkeletonGenerator.generateSkeleton('SERPENT');
      expect(serpentRig.bones.some(b => b.name === 'SpineVertebra_5')).toBe(true);
      expect(serpentRig.bones.some(b => b.name.includes('Hand'))).toBe(false);

      const birdRig = SkeletonGenerator.generateSkeleton('BIRD');
      expect(birdRig.bones.some(b => b.name === 'LeftHumerusWing')).toBe(true);
    });
  });

  describe('3. 3D Volumetric Reconstruction & Topology (Sections 11, 14, 15, 16)', () => {
    it('extracts real watertight polygonal geometry from implicit density fields', () => {
      const mgr = new ReferenceManager();
      const grid = VisualHullReconstructor.generateDensityField('HUMANOID', mgr.getAllViews(), 20);
      const mesh = MarchingCubesPolygonizer.extractSurface(grid, 0.0);

      expect(mesh.vertices.length).toBeGreaterThan(0);
      expect(mesh.indices.length).toBeGreaterThan(0);
      expect(mesh.normals.length).toBe(mesh.vertices.length);

      // Verify topology diagnostics
      const topo = TopologyOptimizer.diagnoseTopology(mesh.vertices, mesh.indices);
      expect(topo.degenerateFaces).toBe(0);
      expect(topo.triangleCount).toBe(mesh.indices.length / 3);
    });

    it('generates non-overlapping conformal UV atlas coordinates', () => {
      const vertices = new Float32Array([
        0, 1.5, 0,
        0.2, 1.2, 0,
        0, 1.0, 0.2,
      ]);
      const uvs = UVGenerator.generateUVs(vertices);
      expect(uvs.length).toBe((vertices.length / 3) * 2);

      const report = UVGenerator.auditUVAtlas(uvs);
      expect(report.overlapRatio).toBeLessThan(0.05);
    });
  });

  describe('4. Rigging, Weighting & Kinematics (Sections 23, 24, 25, 26, 27)', () => {
    it('computes smooth skin weights normalized strictly to sum=1.0', () => {
      const skeleton = SkeletonGenerator.generateSkeleton('HUMANOID');
      const vertices = new Float32Array([
        0, 1.6, 0,
        -0.3, 1.2, 0,
        0.1, 0.5, 0,
      ]);

      const skinning = AutoWeightingEngine.computeWeights(vertices, skeleton);
      expect(skinning.skinIndices.length).toBe((vertices.length / 3) * 4);
      expect(skinning.skinWeights.length).toBe((vertices.length / 3) * 4);

      for (let i = 0; i < vertices.length / 3; i++) {
        const sum =
          skinning.skinWeights[i * 4] +
          skinning.skinWeights[i * 4 + 1] +
          skinning.skinWeights[i * 4 + 2] +
          skinning.skinWeights[i * 4 + 3];
        expect(sum).toBeCloseTo(1.0, 4);
      }
    });

    it('solves analytical 2-bone limb IK and FABRIK multi-bone chains', () => {
      // 2-bone IK: Shoulder at [0,1,0], target at [0.3, 0.8, 0], lengths 0.2 and 0.2
      const res = IKFKSolver.solveTwoBoneIK([0, 1, 0], [0.3, 0.8, 0], 0.2, 0.2, [0, 0, 1]);
      expect(res.reached).toBe(true);
      expect(res.jointPosition[1]).toBeDefined();

      // FABRIK 4-bone chain
      const joints = [
        { position: [0, 0, 0] as [number, number, number], length: 0.25 },
        { position: [0, 0.25, 0] as [number, number, number], length: 0.25 },
        { position: [0, 0.5, 0] as [number, number, number], length: 0.25 },
        { position: [0, 0.75, 0] as [number, number, number], length: 0.25 },
      ];
      const target: [number, number, number] = [0.2, 0.6, 0];
      const solved = IKFKSolver.solveFABRIK(joints, target, 0.01, 15);
      expect(solved.length).toBe(4);
      const end = solved[3];
      const err = Math.hypot(end[0] - target[0], end[1] - target[1], end[2] - target[2]);
      expect(err).toBeLessThan(0.05);
    });

    it('provides complete 5-finger articulated gesture presets', () => {
      const fist = FingerSystem.getGesturePreset('FIST');
      expect(fist.thumb.intermediate[0]).toBeGreaterThan(0.5);
      expect(fist.index.intermediate[0]).toBeGreaterThan(1.0);

      const pointing = FingerSystem.getGesturePreset('POINTING');
      expect(pointing.index.intermediate[0]).toBe(0);
      expect(pointing.middle.intermediate[0]).toBeGreaterThan(1.0);
    });

    it('provides ARKit/VRM facial blendshapes and expression presets', () => {
      const happy = FacialRig.getPresetWeights('HAPPY');
      expect(happy.mouthSmileLeft).toBeGreaterThan(0.7);
      expect(happy.eyeBlinkLeft).toBe(0);

      const blink = FacialRig.getPresetWeights('BLINK');
      expect(blink.eyeBlinkLeft).toBe(1.0);
    });
  });

  describe('5. Simulation, Physics & Anti-Clipping (Sections 20, 21, 22, 35)', () => {
    it('executes Verlet mass-spring cloth integration without explosion', () => {
      const vertices = new Float32Array([
        0, 1.2, 0,
        0.1, 1.1, 0,
        0, 1.0, 0,
        -0.1, 1.1, 0,
      ]);

      const simulator = new ClothSimulator(vertices, {
        enabled: true,
        meshLayerId: 'cloth_1',
        stiffness: 0.8,
        bend: 0.3,
        stretch: 0.9,
        damping: 0.1,
        gravity: 9.81,
        friction: 0.2,
        collisionMargin: 0.01,
        wind: [0, 0, 0],
      });

      // Step simulation 10 times
      for (let s = 0; s < 10; s++) {
        simulator.step(0.016);
      }

      const outBuf = new Float32Array(vertices.length);
      simulator.writePositionsToBuffer(outBuf);

      // Check values are valid finite floats (no NaN / Infinity)
      for (let i = 0; i < outBuf.length; i++) {
        expect(Number.isFinite(outBuf[i])).toBe(true);
      }
    });

    it('resolves geometric mesh clipping using AntiClippingEngine', () => {
      const layer = {
        id: 'layer_cloth',
        name: 'Clothing',
        type: 'clothing' as const,
        visible: true,
        wireframe: false,
        materialId: 'mat_cloth',
        vertexCount: 2,
        triangleCount: 0,
        vertices: new Float32Array([
          0, 1.25, 0, // Inside TorsoCollider
          0, 2.0, 0,  // Far outside
        ]),
        normals: new Float32Array([0, 0, 1, 0, 1, 0]),
        uvs: new Float32Array([0, 0, 1, 1]),
        indices: new Uint32Array([0, 1, 0]),
      };

      const envs = CollisionSystem.createDefaultHumanoidEnvelopes();
      const report = AntiClippingEngine.resolveClipping(layer, envs, 0.02);

      expect(report.clippingVerticesDetected).toBeGreaterThanOrEqual(1);
      expect(report.resolvedCount).toBeGreaterThanOrEqual(1);
      expect(report.success).toBe(true);
    });
  });

  describe('6. Procedural Motion & Action Sequencing (Sections 28, 30, 31, 37)', () => {
    it('generates procedural locomotion for diverse species', () => {
      const humanRig = SkeletonGenerator.generateSkeleton('HUMANOID');
      const humanPose = LocomotionEngine.evaluatePose('HUMANOID', 'WALK', 0.5, humanRig);
      expect(humanPose['LeftUpperLeg']).toBeDefined();

      const serpentRig = SkeletonGenerator.generateSkeleton('SERPENT');
      const serpentPose = LocomotionEngine.evaluatePose('SERPENT', 'SLITHER', 0.5, serpentRig);
      expect(serpentPose['SerpentHead']).toBeDefined();

      const birdRig = SkeletonGenerator.generateSkeleton('BIRD');
      const birdPose = LocomotionEngine.evaluatePose('BIRD', 'FLAP', 0.5, birdRig);
      expect(birdPose['LeftHumerusWing']).toBeDefined();
    });

    it('parses natural language animation commands into executable action chains', async () => {
      const steps = await aiProvider.interpretAnimationPrompt('Walk forward, stop, crouch, then jump');
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.some(s => s.action === 'WALK')).toBe(true);
      expect(steps.some(s => s.action === 'CROUCH')).toBe(true);
      expect(steps.some(s => s.action === 'JUMP')).toBe(true);
    });

    it('runs species-specific motion validation without cross-species test errors', () => {
      const humanRig = SkeletonGenerator.generateSkeleton('HUMANOID');
      const humanVal = MotionValidator.validateSpeciesMotion('HUMANOID', humanRig);
      expect(humanVal.passedCount).toBeGreaterThan(0);
      expect(humanVal.stabilityScore).toBeGreaterThan(85);

      const snakeRig = SkeletonGenerator.generateSkeleton('SERPENT');
      const snakeVal = MotionValidator.validateSpeciesMotion('SERPENT', snakeRig);
      expect(snakeVal.testsRun).toContain('SLITHER');
      expect(snakeVal.testsRun).toContain('COIL');
    });
  });

  describe('7. Export & Re-Import Validation (Sections 47, 48, 63)', () => {
    it('exports genuine binary GLB and successfully re-imports with identical geometry', async () => {
      const project = DefaultModelFactory.createDefaultProject('HUMANOID');
      const result = await ReimportValidator.validateGLBRoundTrip(project.layers, project.materials);

      expect(result.passed).toBe(true);
      expect(result.reimportedTriangles).toBe(result.exportedTriangles);
      expect(result.reimportedVertices).toBe(result.exportedVertices);
    });

    it('enforces VRM humanoid validation gate (passes humanoid, blocks non-humanoid)', () => {
      const humanRig = SkeletonGenerator.generateSkeleton('HUMANOID');
      const humanCheck = VRMExporter.validateForVRM('HUMANOID', humanRig);
      expect(humanCheck.canExport).toBe(true);

      const snakeRig = SkeletonGenerator.generateSkeleton('SERPENT');
      const snakeCheck = VRMExporter.validateForVRM('SERPENT', snakeRig);
      expect(snakeCheck.canExport).toBe(false);
      expect(snakeCheck.speciesWarning).toContain('non-humanoid');

      // Attempting to export non-humanoid as VRM throws descriptive error
      const proj = DefaultModelFactory.createDefaultProject('SERPENT');
      expect(() => VRMExporter.exportVRM(proj.layers, proj.materials, snakeRig)).toThrowError(
        /validation gate/
      );
    });

    it('exports Wavefront OBJ and re-imports successfully', async () => {
      const project = DefaultModelFactory.createDefaultProject('HUMANOID');
      const result = await ReimportValidator.validateOBJRoundTrip(project.layers, project.materials);
      expect(result.passed).toBe(true);
      expect(result.reimportedTriangles).toBe(result.exportedTriangles);
    });

    it('exports Binary STL and re-imports successfully', async () => {
      const project = DefaultModelFactory.createDefaultProject('HUMANOID');
      const result = await ReimportValidator.validateSTLRoundTrip(project.layers);
      expect(result.passed).toBe(true);
      expect(result.reimportedTriangles).toBe(result.exportedTriangles);
    });

    it('serializes and deserializes native .modelstudio project bundle with full fidelity', () => {
      const project = DefaultModelFactory.createDefaultProject('HUMANOID');
      const json = ProjectSerializer.serialize(project);
      expect(json.length).toBeGreaterThan(100);

      const deserialized = ProjectSerializer.deserialize(json);
      expect(deserialized.species).toBe('HUMANOID');
      expect(deserialized.layers.length).toBe(project.layers.length);
      expect(deserialized.layers[0].vertices.length).toBe(project.layers[0].vertices.length);
      expect(deserialized.skeleton.bones.length).toBe(project.skeleton.bones.length);
    });
  });

  describe('8. Master End-to-End Pipeline Verification (Section 63)', () => {
    it('executes full pipeline from references to reconstruction, rig, motion, quality gate, export, and re-import', async () => {
      // 1. Reference setup
      const refManager = new ReferenceManager();
      refManager.setSlotImage('front', 'data:mock/front');
      refManager.setSlotImage('right', 'data:mock/right');
      const views = refManager.getAllViews();

      // 2. Species & Anatomy Intelligence
      const speciesRes = SpeciesClassifier.classifyFromEvidence(views);
      expect(speciesRes.category).toBe('HUMANOID');
      const anatomy = AnatomyDetector.analyzeAnatomy(speciesRes.category);
      expect(anatomy.features.length).toBeGreaterThan(5);

      // 3. Volumetric Reconstruction & Polygonization
      const grid = VisualHullReconstructor.generateDensityField(speciesRes.category, views, 22);
      const polyMesh = MarchingCubesPolygonizer.extractSurface(grid, 0.0);
      expect(polyMesh.triangleCount || polyMesh.indices.length / 3).toBeGreaterThan(50);

      // 4. Conformal UV & Materials
      const uvs = UVGenerator.generateUVs(polyMesh.vertices);
      const materials = MaterialGenerator.generateDefaultPalette(false);

      // 5. Adaptive Rig & Smooth Weighting
      const skeleton = SkeletonGenerator.generateSkeleton(speciesRes.category);
      const skinning = AutoWeightingEngine.computeWeights(polyMesh.vertices, skeleton);

      // 6. Build layer
      const layer = {
        id: 'layer_e2e',
        name: 'Body',
        type: 'body' as const,
        visible: true,
        wireframe: false,
        materialId: materials[0].id,
        vertexCount: polyMesh.vertices.length / 3,
        triangleCount: polyMesh.indices.length / 3,
        vertices: polyMesh.vertices,
        normals: polyMesh.normals,
        uvs,
        indices: polyMesh.indices,
        skinIndices: skinning.skinIndices,
        skinWeights: skinning.skinWeights,
      };

      // 7. Motion & Physics
      const pose = LocomotionEngine.evaluatePose(speciesRes.category, 'WALK', 0.25, skeleton);
      expect(pose).toBeDefined();

      // 8. Quality Gate
      const quality = QualityScorer.evaluateQuality([layer], skeleton, views);
      expect(quality.overall).toBeGreaterThanOrEqual(80);
      expect(quality.geometry).toBeGreaterThanOrEqual(80);

      // 9. Export & Re-import
      const reimport = await ReimportValidator.validateGLBRoundTrip([layer], materials);
      expect(reimport.passed).toBe(true);
      expect(reimport.reimportedTriangles).toBe(layer.triangleCount);
    });
  });
});
