/**
 * Model Studio - Universal Multi-Format Export Manager (Section 6)
 * Powered by ExporterRegistry with format capability declaration,
 * live pre-flight conversion validation reports, and re-import verification.
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
  Layers,
  FileCode,
  Info,
  Check,
} from 'lucide-react';
import { useStudio } from '../../core/studioState';
import { ExporterRegistry, FormatCapability, ConversionReport } from '../../io/formatRegistry';
import { ReimportValidator, ReimportValidationResult } from '../../io/reimportValidator';

type ExportFormatId = 'glb' | 'vrm' | 'obj' | 'stl' | 'svg' | 'png' | 'modelstudio';

export const ExportModal: React.FC = () => {
  const { project, showExportModal, setShowExportModal } = useStudio();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatId>('glb');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isTestingReimport, setIsTestingReimport] = useState<boolean>(false);
  const [reimportResult, setReimportResult] = useState<ReimportValidationResult | null>(null);

  if (!showExportModal) return null;

  const capabilities = ExporterRegistry.getAllCapabilities();
  const currentCapability = ExporterRegistry.getCapability(selectedFormat);
  const conversionReport: ConversionReport = ExporterRegistry.generateConversionReport(selectedFormat, project);

  const handleTestReimport = async () => {
    setIsTestingReimport(true);
    setReimportResult(null);

    let res: ReimportValidationResult;
    if (selectedFormat === 'obj') {
      res = await ReimportValidator.validateOBJRoundTrip(project.layers, project.materials);
    } else if (selectedFormat === 'stl') {
      res = await ReimportValidator.validateSTLRoundTrip(project.layers);
    } else {
      res = await ReimportValidator.validateGLBRoundTrip(project.layers, project.materials);
    }

    setReimportResult(res);
    setIsTestingReimport(false);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const result = await ExporterRegistry.exportAsset(selectedFormat, project);
      let blob: Blob;
      if (typeof result.data === 'string') {
        const mime = currentCapability?.mimeType || 'text/plain';
        blob = new Blob([result.data], { type: mime });
      } else {
        blob = result.data;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Universal Format Exporter</h2>
              <p className="text-xs text-slate-400">
                Vendor-neutral asset serialization with live capability analysis & validation report
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Format Selector Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 block">
              Select Target Delivery Format:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {capabilities.map(cap => {
                const isSelected = selectedFormat === cap.formatId;
                return (
                  <button
                    key={cap.formatId}
                    onClick={() => {
                      setSelectedFormat(cap.formatId as ExportFormatId);
                      setReimportResult(null);
                    }}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400/80 ring-1 ring-sky-400/50 shadow-md'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-mono text-xs font-bold uppercase ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                        {cap.extension}
                      </span>
                      <span className="text-[10px] text-slate-500 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                        {cap.category}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-200 leading-snug line-clamp-1">
                      {cap.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Capability Details & Conversion Report */}
          {currentCapability && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{currentCapability.name}</span>
                    <span className="text-xs font-mono text-slate-400">({currentCapability.mimeType})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {currentCapability.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono text-slate-400">Estimated Payload</div>
                  <div className="text-xs font-mono font-bold text-sky-400">
                    ~{(conversionReport.fileSizeBytes / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>

              {/* Capability Matrix Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  currentCapability.preservesGeometry ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}>
                  {currentCapability.preservesGeometry ? '✓ Meshes' : '✕ No Mesh'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  currentCapability.preservesMaterials ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {currentCapability.preservesPbrTextures ? '✓ PBR Materials' : currentCapability.preservesMaterials ? '✓ Basic Materials' : '✕ No Materials'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  currentCapability.preservesRig ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {currentCapability.preservesRig ? '✓ Skeleton Rig' : '✕ Static Only'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  currentCapability.preservesAnimations ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {currentCapability.preservesAnimations ? '✓ Animations' : '✕ No Keyframes'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  currentCapability.preserves2DLayers ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {currentCapability.preserves2DLayers ? '✓ 2D Layers' : '✕ 3D Only'}
                </span>
              </div>

              {/* Conversion Report Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Preserved Features */}
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Preserved in Target</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {conversionReport.preservedFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 text-[10px] mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Transformed or Discarded Features */}
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Transformed or Excluded</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {conversionReport.transformedFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-amber-300">
                        <span className="text-amber-400 text-[10px] mt-0.5">~</span>
                        <span>{f}</span>
                      </li>
                    ))}
                    {conversionReport.discardedFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-500">
                        <span className="text-slate-600 text-[10px] mt-0.5">✕</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Conversion Warnings if any */}
              {conversionReport.warnings.length > 0 && (
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    {conversionReport.warnings.map((w, i) => (
                      <div key={i}>{w}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Re-Import Round-Trip Verification */}
          {(selectedFormat === 'glb' || selectedFormat === 'vrm' || selectedFormat === 'obj' || selectedFormat === 'stl') && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-sky-400" />
                  <span>Pre-Flight Re-Import Verification</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Simulates decoding exported buffer in an isolated parser to ensure zero corruption or lost geometry.
                </div>
              </div>
              <button
                onClick={handleTestReimport}
                disabled={isTestingReimport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
              >
                {isTestingReimport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Verify Roundtrip</span>
              </button>
            </div>
          )}

          {/* Re-import Verification Result Feedback */}
          {reimportResult && (
            <div className={`p-3 rounded-lg border text-xs ${
              reimportResult.passed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="font-semibold flex items-center gap-1.5">
                {reimportResult.passed ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span>{reimportResult.passed ? 'Re-import Validation Passed!' : 'Re-import Validation Failed'}</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1 font-mono">
                Decoded {reimportResult.reimportedTriangles.toLocaleString()} triangles, {reimportResult.reimportedVertices.toLocaleString()} vertices.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Mesh: {conversionReport.metrics.triangleCount.toLocaleString()} tris • {conversionReport.metrics.boneCount} bones
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download {currentCapability?.extension.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
