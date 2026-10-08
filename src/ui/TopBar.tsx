/**
 * Model Studio - Studio Top Bar
 * Project status, Species Switcher, Quality Preset, Shading selector, Hardware badge, History, and Export trigger
 */

import React from 'react';
import {
  Layers,
  Undo2,
  Redo2,
  Cpu,
  Download,
  Award,
  Activity,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { SpeciesCategory, QualityPreset, ShadingMode } from '../core/types';

export const TopBar: React.FC = () => {
  const {
    project,
    switchSpecies,
    qualityPreset,
    setQualityPreset,
    shadingMode,
    setShadingMode,
    hardware,
    canUndo,
    canRedo,
    undo,
    redo,
    backgroundJobs,
    setShowQualityModal,
    setShowExportModal,
    setShowJobsDrawer,
  } = useStudio();

  const activeJobsCount = backgroundJobs.filter(j => j.status === 'RUNNING').length;

  const speciesOptions: Array<{ id: SpeciesCategory; label: string }> = [
    { id: 'HUMANOID', label: 'Humanoid Biped' },
    { id: 'QUADRUPED', label: 'Quadruped Beast' },
    { id: 'SERPENT', label: 'Serpent / Snake' },
    { id: 'BIRD', label: 'Avian Bird' },
    { id: 'FISH', label: 'Aquatic Fish' },
    { id: 'CREATURE', label: 'Fictional Creature' },
  ];

  const qualityOptions: QualityPreset[] = ['DRAFT', 'BALANCED', 'HIGH', 'ULTRA'];

  const shadingOptions: Array<{ id: ShadingMode; label: string }> = [
    { id: 'RENDERED_PBR', label: 'PBR Shaded' },
    { id: 'CEL_SHADING', label: 'Anime Cel' },
    { id: 'SOLID', label: 'Solid' },
    { id: 'WIREFRAME', label: 'Wireframe' },
    { id: 'XRAY', label: 'X-Ray' },
    { id: 'SKELETON_ONLY', label: 'Skeleton' },
    { id: 'COLLISION_ENVELOPES', label: 'Colliders' },
    { id: 'ERROR_HEATMAP', label: 'Error Heatmap' },
  ];

  const overallScore = project.qualityMetrics.overall;

  return (
    <header className="h-14 bg-studio-panel border-b border-studio-panel-border px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold tracking-wider text-base text-white">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <span>MODEL<span className="text-sky-400 font-extrabold ml-1">STUDIO</span></span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 ml-1">v1.0</span>
        </div>

        <div className="h-5 w-px bg-slate-700/60" />

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Model:</span>
          <select
            value={project.species}
            onChange={e => switchSpecies(e.target.value as SpeciesCategory)}
            className="bg-slate-800/80 border border-slate-700 text-sky-300 font-medium rounded px-2.5 py-1 text-xs focus:outline-none focus:border-sky-400 cursor-pointer"
          >
            {speciesOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quality Preset */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Quality:</span>
          <select
            value={qualityPreset}
            onChange={e => setQualityPreset(e.target.value as QualityPreset)}
            className="bg-slate-800/80 border border-slate-700 text-amber-300 font-medium rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {qualityOptions.map(q => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shading & View Mode Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5">
          {shadingOptions.slice(0, 4).map(opt => (
            <button
              key={opt.id}
              onClick={() => setShadingMode(opt.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                shadingMode === opt.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <select
            value={shadingMode}
            onChange={e => setShadingMode(e.target.value as ShadingMode)}
            className="bg-transparent text-slate-300 text-xs px-2 py-1 focus:outline-none cursor-pointer border-l border-slate-700/80"
          >
            <option value="RENDERED_PBR" className="bg-slate-900">PBR Shaded</option>
            <option value="CEL_SHADING" className="bg-slate-900">Anime Cel</option>
            <option value="SOLID" className="bg-slate-900">Solid</option>
            <option value="WIREFRAME" className="bg-slate-900">Wireframe</option>
            <option value="XRAY" className="bg-slate-900">X-Ray</option>
            <option value="SKELETON_ONLY" className="bg-slate-900">Skeleton Rig</option>
            <option value="COLLISION_ENVELOPES" className="bg-slate-900">Collision Envelopes</option>
            <option value="ERROR_HEATMAP" className="bg-slate-900">Error Heatmap</option>
          </select>
        </div>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-700/60" />

        {/* Compute & GPU info */}
        <div
          title={`GPU: ${hardware.gpuRenderer}\nCores: ${hardware.cpuCores} | VRAM: ~${hardware.estimatedVramMb}MB | Tier: ${hardware.computeTier}`}
          className="flex items-center gap-1.5 text-xs bg-slate-800/80 border border-slate-700 px-2 py-1 rounded text-slate-300 font-mono"
        >
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span>{hardware.gpuRenderer.split(' ')[0] || 'WebGL2'}</span>
        </div>

        {/* Background Jobs Indicator */}
        <button
          onClick={() => setShowJobsDrawer(true)}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-all ${
            activeJobsCount > 0
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Jobs</span>
          {activeJobsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {activeJobsCount}
            </span>
          )}
        </button>

        {/* Quality Score Trigger */}
        <button
          onClick={() => setShowQualityModal(true)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border transition-all ${
            overallScore >= 90
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
              : overallScore >= 75
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 hover:bg-sky-500/30'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Score: {overallScore}/100</span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="studio-btn studio-btn-primary"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Asset</span>
        </button>
      </div>
    </header>
  );
};
