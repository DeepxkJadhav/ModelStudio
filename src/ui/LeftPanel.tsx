/**
 * Model Studio - Left Panel: Reference Intake & Sheet Intelligence (Sections 3, 4, 5, 6, 7)
 * Multi-view camera slots, Turnaround sheet slicing, Coverage analysis, and Uncertainty tracking
 */

import React, { useRef } from 'react';
import {
  Image,
  Upload,
  Sparkles,
  Eye,
  Trash2,
  Camera,
  Layers,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Maximize2,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { ReferenceViewType, EvidenceStatus } from '../core/types';
import { CameraCalibrator } from '../references/cameraCalibrator';

export const LeftPanel: React.FC = () => {
  const {
    project,
    activeViewSlot,
    setActiveViewSlot,
    setReferenceImage,
    generateMissingView,
    clearReferenceSlot,
    uploadReferenceSheet,
  } = useStudio();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const targetSlotRef = useRef<string | null>(null);

  const coverage = project.coverageReport;

  const handleSlotUploadClick = (slotId: string) => {
    targetSlotRef.current = slotId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetSlotRef.current) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const uri = evt.target?.result as string;
      if (uri && targetSlotRef.current) {
        setReferenceImage(targetSlotRef.current, uri);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'OBSERVED':
      case 'VERIFIED':
        return <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">OBSERVED</span>;
      case 'AI_GENERATED':
        return <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30">AI GENERATED</span>;
      case 'INFERRED':
        return <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">INFERRED</span>;
      case 'UNCERTAIN':
      default:
        return <span className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded border border-slate-600/40">UNCERTAIN</span>;
    }
  };

  return (
    <aside className="w-80 bg-studio-panel border-r border-studio-panel-border flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <input ref={sheetInputRef} type="file" accept="image/*" onChange={handleSheetChange} className="hidden" />

      {/* Header */}
      <div className="p-3 border-b border-studio-panel-border bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Reference Intake</h2>
        </div>
        <span className="text-xs text-sky-400 font-mono font-bold">
          {coverage.overallPercentage}% Coverage
        </span>
      </div>

      {/* Sheet Deconstruction Action */}
      <div className="p-3 border-b border-studio-panel-border bg-slate-900/30">
        <button
          onClick={() => sheetInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all group"
        >
          <Layers className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          <span>Upload Turnaround Sheet</span>
        </button>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Auto-detects panels, view angles & camera alignment
        </p>
      </div>

      {/* Reference Slots List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
          Camera Perspective Slots
        </div>

        {project.referenceViews.map(view => {
          const isSelected = activeViewSlot === view.type;
          return (
            <div
              key={view.id}
              onClick={() => setActiveViewSlot(view.type)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-sky-400/80 shadow-md'
                  : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-200">{view.label}</span>
                {getStatusBadge(view.status)}
              </div>

              {/* View Preview / Placeholder */}
              <div className="relative h-24 rounded bg-slate-950/80 border border-slate-700/60 overflow-hidden flex items-center justify-center group">
                {view.imageDataUri ? (
                  <img
                    src={view.imageDataUri}
                    alt={view.label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Camera className="w-5 h-5 opacity-40" />
                    <span className="text-[10px]">No Reference</span>
                  </div>
                )}

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleSlotUploadClick(view.id);
                    }}
                    title="Upload image"
                    className="p-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      generateMissingView(view.id);
                    }}
                    title="Generate Missing View"
                    className="p-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  {view.imageDataUri && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        clearReferenceSlot(view.id);
                      }}
                      title="Clear slot"
                      className="p-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slot Footer Meta */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>Az: {view.cameraEstimate.azimuth}° | El: {view.cameraEstimate.elevation}°</span>
                <span className={view.uncertaintyScore > 0.5 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                  Uncertainty: {Math.round(view.uncertaintyScore * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reference Coverage Progress Report (Section 7) */}
      <div className="p-3 border-t border-studio-panel-border bg-slate-900/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Anatomical Coverage
          </span>
          <span className="text-xs font-bold text-sky-400 font-mono">
            {coverage.overallPercentage}%
          </span>
        </div>

        {/* Region Bars */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {Object.entries(coverage.regions).map(([key, item]) => (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">{item.region}</span>
                <span className="font-mono text-slate-300">{item.percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.percentage >= 85
                      ? 'bg-emerald-400'
                      : item.percentage >= 65
                      ? 'bg-sky-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {coverage.uncertainAreas.length > 0 && (
          <div className="mt-2.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-1.5 text-[10px] text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold">Uncertain:</span> {coverage.uncertainAreas.join(', ')}.
              Provide additional angles or continue with AI volumetric inference.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
