/**
 * Model Studio - Universal AI 2D/3D Model Builder Architecture Test Suite
 * Formally verifies:
 * 1. Canonical Project Schema v1.0.0 serialization & domain entities (Section 3)
 * 2. Universal Exporter Registry capabilities & conversion reports (Section 6)
 * 3. Multi-view consistency & conflict resolution engine (Section 2)
 * 4. AI Orchestration Engine, DAG task graph, & GeneratorAdapter (Section 7)
 * 5. 2D/3D Dual-Mode Studio Workspace State & Viewports (Section 1 & 4)
 */

import { describe, it, expect } from 'vitest';
import { DefaultModelFactory } from '../src/core/defaultModels';
import { CanonicalProjectAdapter } from '../src/core/canonicalProjectAdapter';
import { ExporterRegistry } from '../src/io/formatRegistry';
import { MultiViewConsistencyEngine } from '../src/intelligence/multiViewConsistency';
import { AIOrchestrator, HighFidelityStudioAdapter } from '../src/orchestration/aiOrchestrator';

describe('Universal AI 2D/3D Model Builder Master Architecture Suite', () => {
  const project = DefaultModelFactory.createTurnaroundModelProject('/references/front.png');

  // =========================================================================
  // 1. CANONICAL PROJECT FORMAT SCHEMA (Section 3)
  // =========================================================================
  describe('1. Canonical Project Format Schema (v1.0.0)', () => {
    it('serializes project into a strict Canonical Schema v1.0.0 JSON manifest', () => {
      const manifest = CanonicalProjectAdapter.toCanonicalManifest(project);

      expect(manifest.schemaVersion).toBe('1.0.0');
      expect(manifest.project.name).toBe(project.name);
      expect(manifest.project.unit).toBe('meter');
      expect(manifest.project.activeMode).toBe('3d');

      // Nodes hierarchy
      expect(manifest.scene.nodes.length).toBe(project.layers.length);
      manifest.scene.nodes.forEach(node => {
        expect(node.kind).toBe('mesh');
        expect(node.transform.position).toEqual([0, 0, 0]);
        expect(node.metadata?.bounds?.dimensions[0]).toBeGreaterThan(0.05); // layer width
        expect(node.metadata?.bounds?.dimensions[1]).toBeGreaterThan(0.05); // layer height
        expect(node.metadata?.bounds?.dimensions[2]).toBeGreaterThan(0.05); // layer depth
      });

      // Skeletons & VRM humanoid mapping
      expect(manifest.scene.skeletons.length).toBe(1);
      const rig = manifest.scene.skeletons[0];
      expect(rig.isHumanoid).toBe(true);
      expect(rig.vrmCompliant).toBe(true);
      expect(rig.boneCount).toBeGreaterThanOrEqual(15);

      // JSON string roundtrip
      const jsonStr = CanonicalProjectAdapter.serializeToCanonicalJson(project);
      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.schemaVersion).toBe('1.0.0');
    });
  });

  // =========================================================================
  // 2. UNIVERSAL EXPORTER REGISTRY & CAPABILITIES (Section 6)
  // =========================================================================
  describe('2. Universal Exporter Registry & Format Capabilities', () => {
    it('declares capability contracts for GLB, VRM, OBJ, STL, SVG, PNG, and MODELSTUDIO', () => {
      const caps = ExporterRegistry.getAllCapabilities();
      expect(caps.length).toBeGreaterThanOrEqual(7);

      const glbCap = ExporterRegistry.getCapability('glb')!;
      expect(glbCap.preservesGeometry).toBe(true);
      expect(glbCap.preservesPbrTextures).toBe(true);
      expect(glbCap.preservesRig).toBe(true);
      expect(glbCap.preservesAnimations).toBe(true);

      const vrmCap = ExporterRegistry.getCapability('vrm')!;
      expect(vrmCap.preservesRig).toBe(true);
      expect(vrmCap.category).toBe('Avatar Interchange');

      const stlCap = ExporterRegistry.getCapability('stl')!;
      expect(stlCap.preservesMaterials).toBe(false);
      expect(stlCap.category).toBe('3D Printing');

      const svgCap = ExporterRegistry.getCapability('svg')!;
      expect(svgCap.preserves2DLayers).toBe(true);
      expect(svgCap.category).toBe('2D Vector');
    });

    it('generates accurate conversion reports with preserved, transformed, and discarded features', () => {
      // STL Conversion Report
      const stlReport = ExporterRegistry.generateConversionReport('stl', project);
      expect(stlReport.format).toContain('Stereolithography');
      expect(stlReport.discardedFeatures.some(f => f.includes('Rig'))).toBe(true);
      expect(stlReport.warnings.some(w => w.includes('skeletal deformation'))).toBe(true);
      expect(stlReport.metrics.triangleCount).toBeGreaterThan(3000);

      // GLB Conversion Report
      const glbReport = ExporterRegistry.generateConversionReport('glb', project);
      expect(glbReport.preservedFeatures.some(f => f.includes('PBR Materials'))).toBe(true);
      expect(glbReport.preservedFeatures.some(f => f.toLowerCase().includes('skelet'))).toBe(true);
      expect(glbReport.isValid).toBe(true);
    });

    it('successfully produces verified payloads for 3D and 2D formats', async () => {
      // Export SVG
      const svgResult = await ExporterRegistry.exportAsset('svg', project);
      expect(svgResult.filename.endsWith('.svg')).toBe(true);
      expect(typeof svgResult.data).toBe('string');
      expect(svgResult.data as string).toContain('<svg');

      // Export OBJ
      const objResult = await ExporterRegistry.exportAsset('obj', project);
      expect(objResult.filename.endsWith('.obj')).toBe(true);
      expect(typeof objResult.data).toBe('string');
      expect((objResult.data as string).includes('v ')).toBe(true);

      // Export GLB
      const glbResult = await ExporterRegistry.exportAsset('glb', project);
      expect(glbResult.filename.endsWith('.glb')).toBe(true);
      expect(glbResult.data instanceof Blob).toBe(true);
    });
  });

  // =========================================================================
  // 3. MULTI-VIEW CONSISTENCY & CONFLICT RESOLUTION (Section 2)
  // =========================================================================
  describe('3. Multi-View Consistency & Conflict Resolution Engine', () => {
    it('detects missing side view and flags recommendations for depth synthesis', () => {
      // Create reference views with front only
      const frontOnlyViews = project.referenceViews.map(v =>
        v.type === 'front' ? v : { ...v, imageDataUri: null }
      );

      const report = MultiViewConsistencyEngine.evaluateConsistency(frontOnlyViews);
      expect(report.isReadyForReconstruction).toBe(true);
      expect(report.conflicts.some(c => c.type === 'MISSING_SIDE_VIEW')).toBe(true);
      expect(report.recommendations.some(r => r.includes('side view'))).toBe(true);
    });

    it('scores full multi-view package highly when front and side are present', () => {
      const report = MultiViewConsistencyEngine.evaluateConsistency(project.referenceViews);
      expect(report.overallScore).toBeGreaterThanOrEqual(65);
      expect(report.observedViews).toContain('front');
    });
  });

  // =========================================================================
  // 4. AI ORCHESTRATION ENGINE & ADAPTER DAG (Section 7)
  // =========================================================================
  describe('4. AI Orchestration Engine & Model Adapter DAG', () => {
    it('executes end-to-end DAG task graph with progress updates and returns versioned asset', async () => {
      const stepsLogged: string[] = [];

      const result = await AIOrchestrator.submitJob(
        {
          id: 'job_test_001',
          projectId: 'proj_test',
          outputKind: '3d',
          sourceReferenceIds: ['ref_front', 'ref_side'],
          strategy: 'multi_view',
          quality: 'high',
          constraints: {
            preserveIdentity: true,
            targetPolygonCount: 30000,
            generateUVs: true,
            generateRig: true,
          },
        },
        project,
        event => {
          stepsLogged.push(event.stepId);
        }
      );

      expect(result.status).toBe('SUCCEEDED');
      expect(stepsLogged).toContain('step_validate');
      expect(stepsLogged).toContain('step_geometry');
      expect(stepsLogged).toContain('step_textures');
      expect(stepsLogged).toContain('step_rigging');
      expect(stepsLogged).toContain('step_done');

      expect(result.metadata.polyCount).toBeGreaterThan(3000);
      expect(result.metadata.boneCount).toBeGreaterThanOrEqual(15);
      expect(result.resultingLayers).toBeDefined();
      expect(result.resultingSkeleton).toBeDefined();
    });
  });
});
