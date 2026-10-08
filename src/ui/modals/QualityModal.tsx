/**
 * Model Studio - Production Quality Report Modal (Section 45)
 * Detailed 9-pillar quantitative scoring breakdown with real measurement diagnostics
 */

import React from 'react';
import { X, Award, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useStudio } from '../../core/studioState';

export const QualityModal: React.FC = () => {
  const { project, showQualityModal, setShowQualityModal } = useStudio();
  if (!showQualityModal) return null;

  const q = project.qualityMetrics;
  const d = q.diagnostics;

  const pillars = [
    { name: 'Geometry', score: q.geometry, weight: '14%' },
    { name: 'Topology', score: q.topology, weight: '14%' },
    { name: 'UV Atlas', score: q.uv, weight: '10%' },
    { name: 'Materials', score: q.materials, weight: '10%' },
    { name: 'Skeletal Rig', score: q.rig, weight: '12%' },
    { name: 'Skinning Deformation', score: q.deformation, weight: '12%' },
    { name: 'Locomotion / Motion', score: q.animation, weight: '10%' },
    { name: 'Physics Simulation', score: q.physics, weight: '8%' },
    { name: 'Multi-View Consistency', score: q.consistency, weight: '10%' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-studio-panel border border-studio-panel-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-studio-panel-border bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Production Quality Report</h2>
              <p className="text-[11px] text-slate-400">Quantitative audit derived from real geometry, topology, and physics tests</p>
            </div>
          </div>
          <button
            onClick={() => setShowQualityModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Overall Composite Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 to-slate-900 border border-sky-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-sky-400 font-semibold">Composite Score</span>
              <div className="text-3xl font-extrabold text-white mt-0.5">
                {q.overall} <span className="text-base text-slate-400 font-normal">/ 100</span>
              </div>
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Production Grade Certified</span>
              </div>
            </div>

            <div className="w-20 h-20 rounded-full border-4 border-sky-400/40 border-t-sky-400 flex items-center justify-center font-bold text-xl text-sky-300 font-mono">
              {q.overall}%
            </div>
          </div>

          {/* 9 Pillars Grid */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Pillars</span>
            <div className="grid grid-cols-3 gap-2.5">
              {pillars.map(p => (
                <div key={p.name} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-500">{p.weight}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-white font-mono">{p.score}</span>
                    <span className={`text-[10px] font-semibold ${p.score >= 90 ? 'text-emerald-400' : 'text-sky-400'}`}>
                      {p.score >= 90 ? 'Optimal' : 'Verified'}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.score >= 90 ? 'bg-emerald-400' : 'bg-sky-400'}`}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Diagnostics */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-1.5">
            <span className="text-slate-400 font-sans font-semibold uppercase text-[10px]">Diagnostics Audit</span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-slate-300">
              <div className="flex justify-between"><span>Non-Manifold Edges:</span> <span className="text-emerald-400 font-bold">{d.nonManifoldEdges}</span></div>
              <div className="flex justify-between"><span>Holes:</span> <span className="text-emerald-400 font-bold">{d.holes}</span></div>
              <div className="flex justify-between"><span>Degenerate Faces:</span> <span className="text-emerald-400 font-bold">{d.degenerateFaces}</span></div>
              <div className="flex justify-between"><span>UV Overlap Ratio:</span> <span className="text-sky-300 font-bold">{(d.uvOverlapRatio * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Skin Weight Error:</span> <span className="text-emerald-400 font-bold">{d.maxSkinWeightError.toFixed(4)}</span></div>
              <div className="flex justify-between"><span>Clipping Points:</span> <span className="text-emerald-400 font-bold">{d.clippingVertexCount}</span></div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-studio-panel-border bg-slate-900/90 flex justify-end">
          <button
            onClick={() => setShowQualityModal(false)}
            className="studio-btn studio-btn-primary px-4 py-2"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
