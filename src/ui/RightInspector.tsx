/**
 * Model Studio - Right Inspector Panel (Sections 8, 9, 14, 17, 20, 23, 38, 58)
 * Tabbed inspector for Model Intelligence, Geometry, Rig/IK, Materials, Physics, and AI Edits
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Bone,
  Palette,
  Wind,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Wand2,
  Play,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { HandGesturePreset, FingerSystem } from '../rigging/fingerSystem';
import { AntiClippingEngine } from '../simulation/antiClippingEngine';

type InspectorTab = 'INTELLIGENCE' | 'GEOMETRY' | 'RIG' | 'MATERIALS' | 'PHYSICS' | 'AI_EDIT';

export const RightInspector: React.FC = () => {
  const {
    project,
    switchSpecies,
    runReconstruction,
    runRefinementPass,
    runAutoRigging,
    executeMeshEditPrompt,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<InspectorTab>('INTELLIGENCE');
  const [editPrompt, setEditPrompt] = useState<string>('Make the shoulders narrower');
  const [ikWeight, setIkWeight] = useState<number>(0.5);
  const [selectedGesture, setSelectedGesture] = useState<HandGesturePreset>('RELAXED');
  const [clippingStatus, setClippingStatus] = useState<string | null>(null);

  const anatomy = project.anatomicalAnalysis;
  const skeleton = project.skeleton;
  const primaryLayer = project.layers[0];
  const diag = project.qualityMetrics.diagnostics;

  const handleApplyGesture = (preset: HandGesturePreset) => {
    setSelectedGesture(preset);
    // In full rigging pipeline, gesture applies rotation deltas to LeftHand* and RightHand* bones
  };

  const handleResolveClipping = () => {
    const clothLayer = project.layers.find(l => l.name === 'Clothing') || project.layers[0];
    const report = AntiClippingEngine.resolveClipping(clothLayer, project.collisionEnvelopes);
    setClippingStatus(`Resolved ${report.resolvedCount} clipping points.`);
  };

  const handleRunAiEdit = () => {
    if (!editPrompt.trim()) return;
    executeMeshEditPrompt(editPrompt);
  };

  return (
    <aside className="w-84 bg-studio-panel border-l border-studio-panel-border flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-studio-panel-border bg-slate-900/80 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('INTELLIGENCE')}
          className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'INTELLIGENCE'
              ? 'border-sky-400 text-sky-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Intelligence</span>
        </button>
        <button
          onClick={() => setActiveTab('GEOMETRY')}
          className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'GEOMETRY'
              ? 'border-sky-400 text-sky-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Mesh</span>
        </button>
        <button
          onClick={() => setActiveTab('RIG')}
          className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'RIG'
              ? 'border-sky-400 text-sky-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bone className="w-3.5 h-3.5" />
          <span>Rig & IK</span>
        </button>
        <button
          onClick={() => setActiveTab('MATERIALS')}
          className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'MATERIALS'
              ? 'border-sky-400 text-sky-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Materials</span>
        </button>
        <button
          onClick={() => setActiveTab('PHYSICS')}
          className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'PHYSICS'
              ? 'border-sky-400 text-sky-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Physics</span>
        </button>
        <button
          onClick={() => setActiveTab('AI_EDIT')}
          className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'AI_EDIT'
              ? 'border-sky-400 text-sky-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Edit</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: MODEL & SPECIES INTELLIGENCE (Section 58) */}
        {activeTab === 'INTELLIGENCE' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Model Taxonomy</span>
                <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  {project.species}
                </span>
              </div>
              <div className="text-slate-300 text-xs leading-relaxed">
                Structural category identified via visual hull symmetry and limb branch analysis.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Anatomical Landmarks</span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Symmetry Plane</span>
                  <span className="text-slate-200">{anatomy.symmetryPlane}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Articulated Limbs</span>
                  <span className="text-slate-200">{anatomy.limbCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Finger Count / Hand</span>
                  <span className="text-slate-200">{anatomy.fingerCountPerHand}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Caudal Tail Structure</span>
                  <span className="text-slate-200">{anatomy.hasTail ? 'Detected' : 'None'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">AI Confidence</span>
                  <span className="text-emerald-400 font-bold">{anatomy.confidenceScore}%</span>
                </div>
              </div>
            </div>

            {/* User Override (Section 59) */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Taxonomy Override</span>
              <p className="text-[11px] text-slate-400">
                Override the AI structural classification to adapt the skeleton and locomotion downstream.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['HUMANOID', 'QUADRUPED', 'SERPENT', 'BIRD', 'FISH', 'CREATURE'] as const).map(sp => (
                  <button
                    key={sp}
                    onClick={() => switchSpecies(sp)}
                    className={`py-1.5 px-2 rounded text-[11px] border text-center transition-all ${
                      project.species === sp
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GEOMETRY & TOPOLOGY (Sections 11, 14, 15) */}
        {activeTab === 'GEOMETRY' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Total Vertices</span>
                <span className="text-sky-300 font-bold">{primaryLayer.vertexCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Polygon Triangles</span>
                <span className="text-sky-300 font-bold">{primaryLayer.triangleCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Manifold State</span>
                <span className={diag.nonManifoldEdges === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {diag.nonManifoldEdges === 0 ? 'Watertight (0 Edges)' : `${diag.nonManifoldEdges} Non-Manifold`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Holes Detected</span>
                <span className={diag.holes === 0 ? 'text-emerald-400' : 'text-amber-400'}>{diag.holes}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Degenerate Faces</span>
                <span className="text-slate-200">{diag.degenerateFaces}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">UV Atlas Overlap</span>
                <span className="text-slate-200">{(diag.uvOverlapRatio * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={runReconstruction}
                className="w-full studio-btn studio-btn-primary py-2 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Run Volumetric Reconstruction</span>
              </button>
              <button
                onClick={runRefinementPass}
                className="w-full studio-btn studio-btn-secondary py-2 text-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Camera Contour Refinement Pass</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: RIG & ARTICULATION (Sections 23, 24, 25, 26) */}
        {activeTab === 'RIG' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Skeleton Bones</span>
                <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  {skeleton.bones.length} Bones
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Root: <span className="font-mono text-sky-400">{skeleton.rootBoneName}</span>
              </div>
            </div>

            {/* Hand Gesture Controls (Section 24: Full Finger System) */}
            {project.species === 'HUMANOID' && (
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">5-Finger Articulation Presets</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['RELAXED', 'FIST', 'POINTING', 'GRIP', 'OPEN_PALM', 'PEACE', 'THUMBS_UP'] as HandGesturePreset[]).map(g => (
                    <button
                      key={g}
                      onClick={() => handleApplyGesture(g)}
                      className={`py-1 px-2 rounded text-[10px] border transition-all ${
                        selectedGesture === g
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-semibold'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* IK / FK Blending (Section 25) */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">IK / FK Blend</span>
                <span className="font-mono text-sky-300 text-[10px]">{Math.round(ikWeight * 100)}% IK</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ikWeight}
                onChange={e => setIkWeight(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Full FK)</span>
                <span>100% (Full IK)</span>
              </div>
            </div>

            <button
              onClick={runAutoRigging}
              className="w-full studio-btn studio-btn-primary py-2 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rebuild Adaptive Skeleton & Skinning</span>
            </button>
          </div>
        )}

        {/* TAB 4: MATERIALS (Section 17) */}
        {activeTab === 'MATERIALS' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {project.materials.map(mat => (
                <div key={mat.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{mat.name}</span>
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                      {mat.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border border-slate-600 shadow-inner"
                      style={{ backgroundColor: mat.baseColor }}
                    />
                    <div className="space-y-0.5 text-[11px] text-slate-400">
                      <div>Base Color: <span className="font-mono text-slate-200">{mat.baseColor}</span></div>
                      <div>Roughness: <span className="font-mono text-slate-200">{mat.roughness}</span> | Metal: <span className="font-mono text-slate-200">{mat.metallic}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SIMULATION & PHYSICS (Sections 19, 20, 21, 22) */}
        {activeTab === 'PHYSICS' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Cloth Dynamics (Verlet Springs)</span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Cloth Stiffness</span>
                  <span className="text-slate-200">0.85</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Stretch & Bend</span>
                  <span className="text-slate-200">0.90 / 0.40</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Gravity & Damping</span>
                  <span className="text-slate-200">9.81 m/s² / 0.15</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Collision Margin</span>
                  <span className="text-slate-200">15 mm</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Hair Strand Simulation</span>
              <div className="text-[11px] text-slate-300">
                Spring-damped dynamics responding to head acceleration, gravity, and inertial impulses.
              </div>
            </div>

            {/* Anti-Clipping Engine (Section 22) */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Anti-Clipping Engine</span>
              <p className="text-[11px] text-slate-400">
                Detects cloth-to-body penetration and projects intersecting vertices along surface normals.
              </p>
              <button
                onClick={handleResolveClipping}
                className="w-full studio-btn studio-btn-accent py-2 text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Resolve Mesh Penetration</span>
              </button>
              {clippingStatus && (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{clippingStatus}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AI-ASSISTED MANUAL EDIT (Sections 38, 60) */}
        {activeTab === 'AI_EDIT' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span>Natural Language Mesh Sculpting</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Describe localized geometric modifications. Model Studio applies proportional FFD and Laplacian offsets without breaking surrounding topology.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400">Sculpting Prompt</label>
              <textarea
                rows={3}
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="e.g. 'Make the shoulders narrower', 'Make head 5% smaller', 'Lengthen skirt'..."
                className="w-full studio-input text-xs leading-relaxed resize-none"
              />
            </div>

            {/* Quick Prompt Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Suggested Edits:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Make the shoulders narrower',
                  'Make the head 5% smaller',
                  'Lengthen the skirt',
                  'Fix hair clipping',
                  'Make the tail longer',
                ].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setEditPrompt(preset)}
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunAiEdit}
              className="w-full studio-btn studio-btn-primary bg-purple-600 hover:bg-purple-500 py-2 text-xs"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Execute Geometric Modification</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
