/**
 * Model Studio - Professional Studio Top Bar
 * Minimalist top bar inspired by professional 3D DCC tools (Blender / Maya / Unreal).
 * Project Name, Workflow Mode Switcher (Model | Rig | Animate | Materials | Physics),
 * Import, Save, Undo, Redo, Technical Diagnostics, and Export Asset.
 */

import React, { useRef, useState } from 'react';
import {
  Layers,
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  Save,
  Gauge,
  Activity,
  Box,
  Bone,
  Play,
  Palette,
  Wind,
  Check,
  Edit2,
  Brain,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { StudioWorkflowMode } from '../core/types';

export const TopBar: React.FC = () => {
  const {
    project,
    workflowMode,
    setWorkflowMode,
    canUndo,
    canRedo,
    undo,
    redo,
    projectName,
    setProjectName,
    saveProjectToFile,
    uploadReferenceSheet,
    backgroundJobs,
    setShowDiagnosticsModal,
    setShowExportModal,
    setShowJobsDrawer,
    setShowUnderstandingModal,
  } = useStudio();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeJobsCount = backgroundJobs.filter(j => j.status === 'RUNNING').length;
  const overallScore = project.qualityMetrics.overall;

  const handleNameSave = () => {
    if (tempName.trim()) {
      setProjectName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const uri = evt.target?.result as string;
      if (uri) {
        uploadReferenceSheet(uri);
      }
    };
    reader.readAsDataURL(file);
  };

  const workflowModes: Array<{ id: StudioWorkflowMode; label: string; icon: React.ReactNode }> = [
    { id: 'MODEL', label: 'Model', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'RIG', label: 'Rig', icon: <Bone className="w-3.5 h-3.5" /> },
    { id: 'ANIMATE', label: 'Animate', icon: <Play className="w-3.5 h-3.5" /> },
    { id: 'MATERIALS', label: 'Materials', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'PHYSICS', label: 'Physics', icon: <Wind className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-12 shrink-0 bg-slate-950 border-b border-slate-800/80 px-3.5 flex items-center justify-between z-30 select-none">
      {/* Hidden Import Input */}
      <input
        ref={importInputRef}
        type="file"
        accept="image/*,.glb,.gltf,.obj"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        {/* Brand Icon & Name */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-500/15 border border-sky-400/60 flex items-center justify-center text-sky-400 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center tracking-wide text-xs font-bold text-white">
            <span>MODEL</span>
            <span className="text-sky-400 ml-1 font-extrabold">STUDIO</span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Project Name (Editable) */}
        <div className="flex items-center gap-1.5 group">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                autoFocus
                className="bg-slate-900 border border-sky-400 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleNameSave}
                className="p-1 rounded bg-sky-500 hover:bg-sky-400 text-white"
                title="Save Name"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempName(projectName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-900 text-xs text-slate-300 hover:text-white transition-colors"
              title="Click to rename project"
            >
              <span className="font-medium text-slate-200">{projectName}</span>
              <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-slate-400" />
            </button>
          )}
        </div>

        {/* AI Understanding Quick Chip */}
        <button
          onClick={() => setShowUnderstandingModal(true)}
          title="Review AI Anatomy & Structure Understanding"
          className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-medium transition-all"
        >
          <Brain className="w-3 h-3 text-sky-400" />
          <span>AI: {project.automaticUnderstanding?.bodyPlanForm.replace('_', ' ') || project.species}</span>
        </button>
      </div>

      {/* Central Workflow Mode Tabs */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shadow-inner">
        {workflowModes.map(mode => {
          const isActive = workflowMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setWorkflowMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Actions: Import, Save, Undo, Redo, Diagnostics, Export */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Import Action */}
        <button
          onClick={() => importInputRef.current?.click()}
          title="Import reference image, sheet, or 3D model"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Import</span>
        </button>

        {/* Save Action */}
        <button
          onClick={saveProjectToFile}
          title="Save Project File (.modelstudio)"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Jobs Indicator (if any running) */}
        {activeJobsCount > 0 && (
          <button
            onClick={() => setShowJobsDrawer(true)}
            title="Active background AI jobs"
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse"
          >
            <Activity className="w-3 h-3" />
            <span className="font-mono text-[11px]">{activeJobsCount}</span>
          </button>
        )}

        {/* Technical Diagnostics Modal Trigger */}
        <button
          onClick={() => setShowDiagnosticsModal(true)}
          title="Open Technical Diagnostics & Mesh Topology Metrics"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Diagnostics</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
            overallScore >= 90
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
          }`}>
            {overallScore}
          </span>
        </button>

        {/* Export Asset (Primary Action) */}
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
