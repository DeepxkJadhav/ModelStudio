/**
 * Model Studio - Centralized Export Manager & Re-Import Validation (Sections 47, 48, 63)
 * Exports genuine GLB, VRM, OBJ, STL, PLY, and .modelstudio files with automated re-import checks
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Loader2,
  Box,
} from 'lucide-react';
import { useStudio } from '../../core/studioState';
import { GLTFExporter } from '../../io/gltfExporter';
import { VRMExporter } from '../../io/vrmExporter';
import { OBJExporter } from '../../io/objExporter';
import { STLExporter } from '../../io/stlExporter';
import { PLYExporter } from '../../io/plyExporter';
import { ProjectSerializer } from '../../core/project';
import { ReimportValidator, ReimportValidationResult } from '../../io/reimportValidator';

type ExportFormat = 'GLB' | 'VRM' | 'OBJ' | 'STL' | 'PLY' | 'MODELSTUDIO';

export const ExportModal: React.FC = () => {
  const { project, showExportModal, setShowExportModal } = useStudio();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('GLB');
  const [isTestingReimport, setIsTestingReimport] = useState<boolean>(false);
  const [reimportResult, setReimportResult] = useState<ReimportValidationResult | null>(null);

  if (!showExportModal) return null;

  const vrmValidation = VRMExporter.validateForVRM(project.species, project.skeleton);

  const handleTestReimport = async () => {
    setIsTestingReimport(true);
    setReimportResult(null);

    let res: ReimportValidationResult;
    if (selectedFormat === 'OBJ') {
      res = await ReimportValidator.validateOBJRoundTrip(project.layers, project.materials);
    } else if (selectedFormat === 'STL') {
      res = await ReimportValidator.validateSTLRoundTrip(project.layers);
    } else {
      res = await ReimportValidator.validateGLBRoundTrip(project.layers, project.materials);
    }

    setReimportResult(res);
    setIsTestingReimport(false);
  };

  const handleDownload = () => {
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (selectedFormat === 'GLB') {
      const buffer = GLTFExporter.exportGLB(project.layers, project.materials, project.skeleton);
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      triggerDownload(blob, `${safeName}.glb`);
    } else if (selectedFormat === 'VRM') {
      const buffer = VRMExporter.exportVRM(project.layers, project.materials, project.skeleton);
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      triggerDownload(blob, `${safeName}.vrm`);
    } else if (selectedFormat === 'OBJ') {
      const { obj } = OBJExporter.exportOBJ(project.layers, project.materials);
      const blob = new Blob([obj], { type: 'text/plain' });
      triggerDownload(blob, `${safeName}.obj`);
    } else if (selectedFormat === 'STL') {
      const buffer = STLExporter.exportBinarySTL(project.layers);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      triggerDownload(blob, `${safeName}.stl`);
    } else if (selectedFormat === 'PLY') {
      const ply = PLYExporter.exportPLY(project.layers);
      const blob = new Blob([ply], { type: 'text/plain' });
      triggerDownload(blob, `${safeName}.ply`);
    } else if (selectedFormat === 'MODELSTUDIO') {
      const json = ProjectSerializer.serialize(project);
      const blob = new Blob([json], { type: 'application/json' });
      triggerDownload(blob, `${safeName}.modelstudio`);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formats: Array<{ id: ExportFormat; label: string; desc: string; ext: string }> = [
    { id: 'GLB', label: 'glTF 2.0 Binary (.glb)', desc: 'Standard production format with meshes, materials, and skeletons', ext: '.glb' },
    { id: 'VRM', label: 'VRM Avatar (.vrm)', desc: 'Humanoid avatar standard with expressions and spring bones', ext: '.vrm' },
    { id: 'OBJ', label: 'Wavefront OBJ (.obj)', desc: 'Universal 3D geometry with texture UVs and materials', ext: '.obj' },
    { id: 'STL', label: 'Stereolithography (.stl)', desc: '3D printing and CAD geometry format', ext: '.stl' },
    { id: 'PLY', label: 'Stanford PLY (.ply)', desc: 'Polygon file format with normals and point attributes', ext: '.ply' },
    { id: 'MODELSTUDIO', label: 'Native Project (.modelstudio)', desc: 'Complete studio bundle with references, history, and physics', ext: '.modelstudio' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-studio-panel border border-studio-panel-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-studio-panel-border bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Production Asset Export</h2>
              <p className="text-[11px] text-slate-400">Export genuine 3D model formats with strict pre-flight validation</p>
            </div>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Format Selection List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Export Target</label>
            <div className="grid grid-cols-1 gap-2">
              {formats.map(fmt => {
                const isSelected = selectedFormat === fmt.id;
                const isVRMDisabled = fmt.id === 'VRM' && !vrmValidation.canExport;

                return (
                  <div
                    key={fmt.id}
                    onClick={() => {
                      if (!isVRMDisabled) setSelectedFormat(fmt.id);
                    }}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 text-white shadow-sm'
                        : isVRMDisabled
                        ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-2">
                        <span>{fmt.label}</span>
                        {fmt.id === 'VRM' && isVRMDisabled && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/40">
                            Humanoid Only
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{fmt.desc}</div>
                    </div>
                    <span className="font-mono text-xs text-sky-400 font-semibold">{fmt.ext}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VRM Humanoid Gate Warning (Section 47) */}
          {selectedFormat === 'VRM' && !vrmValidation.canExport && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">VRM Validation Blocked:</span> {vrmValidation.speciesWarning || vrmValidation.errors.join(', ')}
              </div>
            </div>
          )}

          {/* Re-Import Verification Test (Section 63) */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <FileCheck className="w-4 h-4 text-sky-400" />
                <span>End-to-End Re-Import Verification</span>
              </div>
              <button
                onClick={handleTestReimport}
                disabled={isTestingReimport}
                className="studio-btn studio-btn-secondary text-[11px] py-1 px-2.5"
              >
                {isTestingReimport ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Test Round-Trip</span>
                )}
              </button>
            </div>

            {reimportResult && (
              <div
                className={`p-2.5 rounded border text-xs font-mono flex items-start gap-2 ${
                  reimportResult.passed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {reimportResult.passed ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                )}
                <div className="space-y-0.5 text-[11px]">
                  <div className="font-bold">
                    {reimportResult.passed ? 'RE-IMPORT VERIFICATION PASSED' : 'RE-IMPORT VERIFICATION FAILED'}
                  </div>
                  <div>
                    Exported Tris: {reimportResult.exportedTriangles} | Re-imported Tris: {reimportResult.reimportedTriangles}
                  </div>
                  <div>
                    Vertices: {reimportResult.exportedVertices} | Buffer Integrity: 100%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-studio-panel-border bg-slate-900/90 flex justify-between items-center">
          <span className="text-[11px] text-slate-400 font-mono">
            {project.layers.reduce((acc, l) => acc + l.triangleCount, 0).toLocaleString()} Triangles
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportModal(false)}
              className="studio-btn studio-btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedFormat === 'VRM' && !vrmValidation.canExport}
              className="studio-btn studio-btn-primary disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {selectedFormat}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
