/**
 * Model Studio - Optional Technical Diagnostics Modal
 * Isolates deep engineering metrics, vertex/triangle counts, manifold state,
 * UV overlap, GPU VRAM, and quality diagnostics away from the main creative workspace.
 */

import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Gauge,
  Award,
} from 'lucide-react';
import { useStudio } from '../../core/studioState';

export const DiagnosticsModal: React.FC = () => {
  const { project, hardware, showDiagnosticsModal, setShowDiagnosticsModal } = useStudio();

  if (!showDiagnosticsModal) return null;

  const diag = project.qualityMetrics.diagnostics;
  const primaryLayer = project.layers[0];
  const q = project.qualityMetrics;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Technical Diagnostics & Quality Metrics</h2>
              <p className="text-[11px] text-slate-400">Detailed topology, hardware, and validation benchmarks</p>
            </div>
          </div>
          <button
            onClick={() => setShowDiagnosticsModal(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
          {/* Top Score Summary */}
          <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Asset Quality Rating</div>
              <div className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                <span>{q.overall}/100</span>
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  Production Ready
                </span>
              </div>
            </div>
            <Award className="w-8 h-8 text-sky-400 opacity-60" />
          </div>

          {/* Geometry & Topology Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Geometry & Topology</span>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Total Vertices:</span>
                <span className="text-white font-bold">{primaryLayer.vertexCount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Total Triangles:</span>
                <span className="text-white font-bold">{primaryLayer.triangleCount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Non-Manifold Edges:</span>
                <span className={diag.nonManifoldEdges === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {diag.nonManifoldEdges} (Watertight)
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Holes Detected:</span>
                <span className="text-emerald-400 font-bold">{diag.holes}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Degenerate Faces:</span>
                <span className="text-slate-200">{diag.degenerateFaces}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">UV Island Overlap:</span>
                <span className="text-slate-200">{(diag.uvOverlapRatio * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* 9-Pillar Quality Breakdown */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">9-Pillar Studio Evaluation</span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {[
                { label: 'Geometry', score: q.geometry },
                { label: 'Topology', score: q.topology },
                { label: 'UV Mapping', score: q.uv },
                { label: 'Materials', score: q.materials },
                { label: 'Rigging', score: q.rig },
                { label: 'Deformation', score: q.deformation },
                { label: 'Animation', score: q.animation },
                { label: 'Physics', score: q.physics },
                { label: 'Consistency', score: q.consistency },
              ].map(p => (
                <div key={p.label} className="p-2 rounded bg-slate-950/50 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{p.label}</span>
                  <span className="font-mono text-sky-300 font-bold">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GPU Hardware Profile */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GPU & Runtime Compute</span>
            <div className="p-3 rounded bg-slate-950/70 border border-slate-800 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Renderer:</span>
                <span className="text-slate-200">{hardware.gpuRenderer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CPU Threads / Compute Tier:</span>
                <span className="text-slate-200">{hardware.cpuCores} Cores · {hardware.computeTier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated VRAM:</span>
                <span className="text-sky-300">~{hardware.estimatedVramMb} MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setShowDiagnosticsModal(false)}
            className="studio-btn studio-btn-secondary px-4 py-1.5 text-xs"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
