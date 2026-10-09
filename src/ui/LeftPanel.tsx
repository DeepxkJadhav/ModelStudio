/**
 * Model Studio - Left Panel: Asset & Hierarchy Outliner (Sections 3, 4, 5, 6, 7)
 * Clean collapsible project outliner organizing References, Model Layers, Materials, Rig, and Animation Clips.
 */

import React, { useRef, useState } from 'react';
import {
  Layers,
  Image,
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  Camera,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Bone,
  Palette,
  Film,
  Plus,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { EvidenceStatus } from '../core/types';

export const LeftPanel: React.FC = () => {
  const {
    project,
    activeViewSlot,
    setActiveViewSlot,
    setReferenceImage,
    generateMissingView,
    clearReferenceSlot,
    uploadReferenceSheet,
    leftSidebarOpen,
    setLeftSidebarOpen,
    toggleLayerVisibility,
    executeAnimationPrompt,
  } = useStudio();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const targetSlotRef = useRef<string | null>(null);

  // Accordion state
  const [openSections, setOpenSections] = useState({
    references: true,
    layers: true,
    materials: false,
    rig: false,
    clips: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSlotUploadClick = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
        return <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/30">OBS</span>;
      case 'AI_GENERATED':
        return <span className="text-[9px] bg-sky-500/15 text-sky-400 px-1 py-0.2 rounded border border-sky-500/30">AI</span>;
      case 'INFERRED':
        return <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1 py-0.2 rounded border border-amber-500/30">INF</span>;
      case 'UNCERTAIN':
      default:
        return <span className="text-[9px] bg-slate-800 text-slate-500 px-1 py-0.2 rounded border border-slate-700">EMPTY</span>;
    }
  };

  // If collapsed, show minimal expand tab
  if (!leftSidebarOpen) {
    return (
      <div className="w-10 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-3 select-none z-20">
        <button
          onClick={() => setLeftSidebarOpen(true)}
          title="Expand Outliner (Left Panel)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="mt-8 text-[11px] font-semibold text-slate-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
          Outliner
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-full min-h-0 select-none z-20">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <input ref={sheetInputRef} type="file" accept="image/*" onChange={handleSheetChange} className="hidden" />

      {/* Outliner Header */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Outliner</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => sheetInputRef.current?.click()}
            title="Upload multi-view reference sheet"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLeftSidebarOpen(false)}
            title="Collapse Outliner"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
        {/* SECTION 1: REFERENCES */}
        <div className="rounded-md border border-slate-800/80 bg-slate-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('references')}
            className="w-full flex items-center justify-between p-2 bg-slate-900/70 hover:bg-slate-900 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 font-medium">
              <Image className="w-3.5 h-3.5 text-sky-400" />
              <span>References</span>
              <span className="text-[10px] text-slate-500 font-mono">({project.referenceViews.length})</span>
            </div>
            {openSections.references ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          {openSections.references && (
            <div className="p-2 space-y-1.5 border-t border-slate-800/60 bg-slate-950/50">
              {/* Quick Sheet Upload CTA */}
              <button
                onClick={() => sheetInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[11px] font-medium transition-all"
              >
                <Upload className="w-3 h-3 text-sky-400" />
                <span>Import Character Sheet</span>
              </button>

              {/* View Slots */}
              <div className="space-y-1 mt-1.5">
                {project.referenceViews.map(view => {
                  const isSelected = activeViewSlot === view.type;
                  const hasImage = Boolean(view.imageDataUri);

                  return (
                    <div
                      key={view.id}
                      onClick={() => setActiveViewSlot(view.type)}
                      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border border-sky-400/60 text-white'
                          : 'hover:bg-slate-900/80 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {hasImage ? (
                            <img src={view.imageDataUri || undefined} alt={view.label} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="text-[11px] font-medium truncate">{view.label}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {getStatusBadge(view.status)}

                        {hasImage ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearReferenceSlot(view.id);
                            }}
                            title="Clear image"
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => handleSlotUploadClick(view.id, e)}
                              title="Upload angle"
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                            >
                              <Upload className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateMissingView(view.id);
                              }}
                              title="AI Inpaint angle"
                              className="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: MODEL LAYERS */}
        <div className="rounded-md border border-slate-800/80 bg-slate-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('layers')}
            className="w-full flex items-center justify-between p-2 bg-slate-900/70 hover:bg-slate-900 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 font-medium">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Model Layers</span>
              <span className="text-[10px] text-slate-500 font-mono">({project.layers.length})</span>
            </div>
            {openSections.layers ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          {openSections.layers && (
            <div className="p-2 space-y-1 border-t border-slate-800/60 bg-slate-950/50">
              {project.layers.map(layer => {
                const isVisible = layer.visible !== false;
                return (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900/80 text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          isVisible ? 'text-sky-400' : 'text-slate-600'
                        }`}
                        title={isVisible ? 'Hide layer' : 'Show layer'}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <span className={`text-[11px] font-medium truncate ${isVisible ? 'text-slate-200' : 'text-slate-500'}`}>
                        {layer.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      {layer.vertices ? `${Math.round(layer.vertices.length / 3)}v` : '0v'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: MATERIALS */}
        <div className="rounded-md border border-slate-800/80 bg-slate-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('materials')}
            className="w-full flex items-center justify-between p-2 bg-slate-900/70 hover:bg-slate-900 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 font-medium">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Materials</span>
              <span className="text-[10px] text-slate-500 font-mono">({project.materials.length})</span>
            </div>
            {openSections.materials ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          {openSections.materials && (
            <div className="p-2 space-y-1.5 border-t border-slate-800/60 bg-slate-950/50">
              {project.materials.map(mat => (
                <div
                  key={mat.id}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900/80 text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-slate-700 shadow-sm"
                      style={{ backgroundColor: mat.baseColor || '#888' }}
                    />
                    <span className="text-[11px] font-medium">{mat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    r: {mat.roughness.toFixed(1)} / m: {mat.metallic.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: SKELETON RIG */}
        <div className="rounded-md border border-slate-800/80 bg-slate-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('rig')}
            className="w-full flex items-center justify-between p-2 bg-slate-900/70 hover:bg-slate-900 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 font-medium">
              <Bone className="w-3.5 h-3.5 text-amber-400" />
              <span>Skeleton Rig</span>
              <span className="text-[10px] text-slate-500 font-mono">({project.skeleton.bones.length} bones)</span>
            </div>
            {openSections.rig ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          {openSections.rig && (
            <div className="p-2 space-y-1 border-t border-slate-800/60 bg-slate-950/50 text-[11px]">
              <div className="flex items-center justify-between text-slate-400 py-0.5">
                <span>Root Bone:</span>
                <span className="font-mono text-amber-300">{project.skeleton.rootBoneName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 py-0.5">
                <span>Bones Bound:</span>
                <span className="font-mono text-emerald-400">{project.skeleton.bones.length} active</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 py-0.5">
                <span>Weighting:</span>
                <span className="text-sky-300">Skin Weights Normalized</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: ANIMATION CLIPS */}
        <div className="rounded-md border border-slate-800/80 bg-slate-900/40 overflow-hidden">
          <button
            onClick={() => toggleSection('clips')}
            className="w-full flex items-center justify-between p-2 bg-slate-900/70 hover:bg-slate-900 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 font-medium">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Animation Library</span>
            </div>
            {openSections.clips ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          {openSections.clips && (
            <div className="p-2 space-y-1 border-t border-slate-800/60 bg-slate-950/50">
              {[
                { name: 'Idle Breathing', prompt: 'Natural relaxed idle pose' },
                { name: 'Bipedal Walk Cycle', prompt: 'Smooth forward walk cycle' },
                { name: 'Athletic Sprint', prompt: 'Fast energetic run sprint' },
                { name: 'Combat Crouch', prompt: 'Low defensive crouch hold' },
                { name: 'Airborne Jump', prompt: 'Jump high into air and land' },
              ].map(clip => (
                <button
                  key={clip.name}
                  onClick={() => executeAnimationPrompt(clip.prompt)}
                  className="w-full text-left p-1.5 rounded hover:bg-slate-900/80 flex items-center justify-between group transition-colors"
                >
                  <span className="text-[11px] text-slate-300 group-hover:text-white">{clip.name}</span>
                  <span className="text-[10px] text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">Apply</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
