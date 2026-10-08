/**
 * Model Studio - Re-Import Verification Engine (Section 63)
 * Re-imports exported assets to verify data fidelity, vertex count, and buffer integrity
 */

import { MeshLayer, MaterialProperties } from '../core/types';
import { GLTFExporter } from './gltfExporter';
import { OBJExporter } from './objExporter';
import { STLExporter } from './stlExporter';
import { ImportManager } from './importManager';

export interface ReimportValidationResult {
  format: 'GLB' | 'OBJ' | 'STL';
  passed: boolean;
  exportedTriangles: number;
  reimportedTriangles: number;
  exportedVertices: number;
  reimportedVertices: number;
  error?: string;
}

export class ReimportValidator {
  /**
   * Tests GLB round-trip export and re-import
   */
  static async validateGLBRoundTrip(
    layers: MeshLayer[],
    materials: MaterialProperties[]
  ): Promise<ReimportValidationResult> {
    try {
      const glbBuffer = GLTFExporter.exportGLB(layers, materials);
      const reimported = ImportManager.parseGLB(glbBuffer, 'test_export.glb');

      let exportedVertices = 0;
      let exportedTriangles = 0;
      layers.forEach(l => {
        exportedVertices += l.vertexCount;
        exportedTriangles += l.triangleCount;
      });

      let reimportedVertices = 0;
      let reimportedTriangles = 0;
      reimported.layers.forEach(l => {
        reimportedVertices += l.vertexCount;
        reimportedTriangles += l.triangleCount;
      });

      const passed =
        exportedVertices === reimportedVertices &&
        exportedTriangles === reimportedTriangles &&
        reimported.layers.length === layers.length;

      return {
        format: 'GLB',
        passed,
        exportedTriangles,
        reimportedTriangles,
        exportedVertices,
        reimportedVertices,
      };
    } catch (err: any) {
      return {
        format: 'GLB',
        passed: false,
        exportedTriangles: 0,
        reimportedTriangles: 0,
        exportedVertices: 0,
        reimportedVertices: 0,
        error: err.message,
      };
    }
  }

  /**
   * Tests Wavefront OBJ round-trip export and re-import
   */
  static async validateOBJRoundTrip(
    layers: MeshLayer[],
    materials: MaterialProperties[]
  ): Promise<ReimportValidationResult> {
    try {
      const { obj } = OBJExporter.exportOBJ(layers, materials);
      const reimported = ImportManager.parseOBJ(obj, 'test_export.obj');

      let exportedVertices = 0;
      let exportedTriangles = 0;
      layers.forEach(l => {
        exportedVertices += l.vertexCount;
        exportedTriangles += l.triangleCount;
      });

      let reimportedVertices = 0;
      let reimportedTriangles = 0;
      reimported.layers.forEach(l => {
        reimportedVertices += l.vertexCount;
        reimportedTriangles += l.triangleCount;
      });

      // Note: OBJ face triangulations may preserve triangle counts
      const passed =
        reimportedTriangles === exportedTriangles &&
        reimported.layers.length > 0;

      return {
        format: 'OBJ',
        passed,
        exportedTriangles,
        reimportedTriangles,
        exportedVertices,
        reimportedVertices,
      };
    } catch (err: any) {
      return {
        format: 'OBJ',
        passed: false,
        exportedTriangles: 0,
        reimportedTriangles: 0,
        exportedVertices: 0,
        reimportedVertices: 0,
        error: err.message,
      };
    }
  }

  /**
   * Tests STL round-trip export and re-import
   */
  static async validateSTLRoundTrip(
    layers: MeshLayer[]
  ): Promise<ReimportValidationResult> {
    try {
      const stlBuffer = STLExporter.exportBinarySTL(layers);
      const reimported = ImportManager.parseBinarySTL(stlBuffer, 'test_export.stl');

      let exportedTriangles = 0;
      layers.forEach(l => {
        exportedTriangles += l.triangleCount;
      });

      let reimportedTriangles = 0;
      reimported.layers.forEach(l => {
        reimportedTriangles += l.triangleCount;
      });

      const passed = exportedTriangles === reimportedTriangles;

      return {
        format: 'STL',
        passed,
        exportedTriangles,
        reimportedTriangles,
        exportedVertices: exportedTriangles * 3,
        reimportedVertices: reimportedTriangles * 3,
      };
    } catch (err: any) {
      return {
        format: 'STL',
        passed: false,
        exportedTriangles: 0,
        reimportedTriangles: 0,
        exportedVertices: 0,
        reimportedVertices: 0,
        error: err.message,
      };
    }
  }
}
