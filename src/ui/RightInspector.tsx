/**
 * Model Studio - Right Inspector Panel: AI Assistant & Contextual Tools
 * Features Natural Language AI Assistant, Autonomous Model Understanding card,
 * and contextual workflow tools matching active mode (Model | Rig | Animate | Materials | Physics).
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Bone,
  Palette,
  Wind,
  CheckCircle2,
  RefreshCw,
  Wand2,
  Play,
  Brain,
  PanelRightClose,
  PanelRight,
  Send,
  Sliders,
  ShieldCheck,
  Zap,
  Activity,
  User,
  Dog,
  Feather,
  Fish,
  Ghost,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { HandGesturePreset } from '../rigging/fingerSystem';
import { AntiClippingEngine } from '../simulation/antiClippingEngine';
import { ShadingMode, SpeciesCategory } from '../core/types';

export const RightInspector: React.FC = () => {
  const {
    project,
    workflowMode,
    runReconstruction,
    runRefinementPass,
    runAutoRigging,
    executeMeshEditPrompt,
    executeAnimationPrompt,
    acceptAutomaticUnderstanding,
    switchSpecies,
    shadingMode,
    setShadingMode,
    physicsEnabled,
    setPhysicsEnabled,
    rightSidebarOpen,
    setRightSidebarOpen,
    setShowUnderstandingModal,
  } = useStudio();

  const [aiCommandInput, setAiCommandInput] = useState<string>('');
  const [isProcessingCommand, setIsProcessingCommand] = useState<boolean>(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [selectedGesture, setSelectedGesture] = useState<HandGesturePreset>('RELAXED');
  const [ikWeight, setIkWeight] = useState<number>(0.5);
  const [clippingStatus, setClippingStatus] = useState<string | null>(null);

  const au = project.automaticUnderstanding;
  const currentCategory = au?.speciesCategory || project.species;

  const handleRunAiCommand = async () => {
    if (!aiCommandInput.trim() || isProcessingCommand) return;
    setIsProcessingCommand(true);
    setCommandFeedback(null);

    const inputLower = aiCommandInput.toLowerCase();
    try {
      if (
        inputLower.includes('walk') ||
        inputLower.includes('run') ||
        inputLower.includes('jump') ||
        inputLower.includes('pose') ||
        inputLower.includes('animat') ||
        inputLower.includes('move') ||
        inputLower.includes('crouch')
      ) {
        await executeAnimationPrompt(aiCommandInput);
        setCommandFeedback(`Animation sequence generated: "${aiCommandInput}"`);
      } else if (inputLower.includes('rig') || inputLower.includes('bone') || inputLower.includes('skeleton')) {
        await runAutoRigging();
        setCommandFeedback('Auto-rigged skeleton matching body plan.');
      } else if (inputLower.includes('clip') || inputLower.includes('cloth')) {
        handleResolveClipping();
      } else {
        await executeMeshEditPrompt(aiCommandInput);
        setCommandFeedback(`Mesh modified: "${aiCommandInput}"`);
      }
    } finally {
      setIsProcessingCommand(false);
      setAiCommandInput('');
    }
  };

  const handleResolveClipping = () => {
    const clothLayer = project.layers.find(l => l.name === 'Clothing') || project.layers[0];
    const report = AntiClippingEngine.resolveClipping(clothLayer, project.collisionEnvelopes);
    setClippingStatus(`Resolved ${report.resolvedCount} cloth clipping points.`);
  };

  // If collapsed, show minimal expand tab
  if (!rightSidebarOpen) {
    return (
      <div className="w-10 shrink-0 bg-slate-950 border-l border-slate-800 flex flex-col items-center py-3 select-none z-20">
        <button
          onClick={() => setRightSidebarOpen(true)}
          title="Expand AI Assistant & Inspector"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <PanelRight className="w-4 h-4" />
        </button>
        <div className="mt-8 text-[11px] font-semibold text-slate-500 uppercase tracking-widest [writing-mode:vertical-rl]">
          AI Assistant
        </div>
      </div>
    );
  }

  const categoryCards: Array<{ id: SpeciesCategory; label: string; icon: React.ReactNode }> = [
    { id: 'HUMANOID', label: 'Humanoid', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'QUADRUPED', label: 'Animal', icon: <Dog className="w-3.5 h-3.5" /> },
    { id: 'BIRD', label: 'Bird', icon: <Feather className="w-3.5 h-3.5" /> },
    { id: 'FISH', label: 'Aquatic', icon: <Fish className="w-3.5 h-3.5" /> },
    { id: 'CREATURE', label: 'Creature', icon: <Ghost className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside className="w-80 shrink-0 bg-slate-950 border-l border-slate-800 flex flex-col h-full min-h-0 select-none z-20">
      {/* Panel Header */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">AI Assistant</span>
        </div>
        <button
          onClick={() => setRightSidebarOpen(false)}
          title="Collapse Panel"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs text-slate-300">
        {/* 1. UNIVERSAL NATURAL LANGUAGE COMMAND BOX */}
        <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
              <Wand2 className="w-3 h-3 text-purple-400" />
              <span>What do you want to do?</span>
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={aiCommandInput}
              onChange={e => setAiCommandInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRunAiCommand()}
              placeholder="e.g. 'Pose in T-Pose', 'Add walk cycle', 'Refine face'..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 pr-14"
            />
            <button
              onClick={handleRunAiCommand}
              disabled={isProcessingCommand || !aiCommandInput.trim()}
              className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-[11px] font-medium flex items-center gap-1 transition-all"
            >
              <span>{isProcessingCommand ? '...' : 'Run'}</span>
              <Send className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="flex flex-wrap gap-1 pt-1">
            {[
              'Refine mesh',
              'Walk forward',
              'Pose T-Pose',
              'Fix cloth clipping',
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setAiCommandInput(prompt);
                }}
                className="px-2 py-0.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[10px] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {commandFeedback && (
            <div className="text-[10px] text-emerald-400 bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
              {commandFeedback}
            </div>
          )}
        </div>

        {/* 2. AUTONOMOUS MODEL UNDERSTANDING CARD */}
        <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Brain className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Model Understanding</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
              {au?.speciesConfidence || 94}% Conf
            </span>
          </div>

          {/* 5 Core Categories Switcher/Indicators */}
          <div className="grid grid-cols-5 gap-1">
            {categoryCards.map(cat => {
              const isCurrent = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => switchSpecies(cat.id)}
                  title={cat.label}
                  className={`p-1.5 rounded flex flex-col items-center justify-center gap-1 transition-all ${
                    isCurrent
                      ? 'bg-sky-500/20 border border-sky-400 text-sky-300 font-semibold shadow-sm'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {cat.icon}
                  <span className="text-[9px] truncate w-full text-center">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Anatomical Summary Pill List */}
          <div className="bg-slate-950/60 rounded-md p-2 border border-slate-800/60 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Body Plan:</span>
              <span className="font-medium text-slate-200">
                {au?.bodyPlanForm.replace('_', ' ') || 'Bipedal Humanoid'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Limbs / Joints:</span>
              <span className="font-medium text-slate-200">
                {au?.anatomy.limbCount ?? 4} limbs, {au?.anatomy.articulatedStructures?.length ?? 18} joints
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Locomotion:</span>
              <span className="font-medium text-sky-300">
                {au?.locomotion.type.replace('_', ' ') || 'Bipedal Walk'}
              </span>
            </div>
          </div>

          {/* Accept / Edit Actions */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={acceptAutomaticUnderstanding}
              className="flex-1 py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => setShowUnderstandingModal(true)}
              className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <span>Edit Anatomy</span>
            </button>
          </div>
        </div>

        {/* 3. CONTEXTUAL TOOLS MATCHING WORKFLOW MODE */}
        {workflowMode === 'MODEL' && (
          <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Model Reconstruction Tools</span>
            </span>

            <div className="space-y-1.5">
              <button
                onClick={runReconstruction}
                className="w-full py-2 px-3 rounded bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI 3D Reconstruct Model</span>
              </button>
              <button
                onClick={runRefinementPass}
                className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3 h-3 text-sky-400" />
                <span>Quad-Dominant Refinement Pass</span>
              </button>
            </div>

            <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
              <div className="text-[11px] text-slate-400">Natural Language Mesh Sculpt:</div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Slim the waist, widen shoulders"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      executeMeshEditPrompt(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {workflowMode === 'RIG' && (
          <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Bone className="w-3.5 h-3.5 text-amber-400" />
              <span>Rigging & Kinematics</span>
            </span>

            <button
              onClick={runAutoRigging}
              className="w-full py-2 px-3 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Generate Adaptive Rig</span>
            </button>

            {/* Hand Gesture Presets */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-slate-400 font-medium">Hand Gesture Pose:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['RELAXED', 'FIST', 'POINTING', 'OPEN_PALM'] as HandGesturePreset[]).map(preset => (
                  <button
                    key={preset}
                    onClick={() => setSelectedGesture(preset)}
                    className={`py-1 px-2 rounded text-[11px] border transition-all ${
                      selectedGesture === preset
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* IK / FK Weight Slider */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>IK / FK Weight:</span>
                <span className="font-mono text-amber-400">{Math.round(ikWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ikWeight}
                onChange={e => setIkWeight(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
            </div>
          </div>
        )}

        {workflowMode === 'ANIMATE' && (
          <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Locomotion & Action Engine</span>
            </span>

            <div className="space-y-1.5">
              {[
                'Walk forward smoothly',
                'Run fast sprint',
                'Jump and land on feet',
                'Crouch and scan horizon',
              ].map(action => (
                <button
                  key={action}
                  onClick={() => executeAnimationPrompt(action)}
                  className="w-full py-1.5 px-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-left flex items-center justify-between text-xs transition-colors"
                >
                  <span>{action}</span>
                  <Play className="w-2.5 h-2.5 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {workflowMode === 'MATERIALS' && (
          <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Shading & Material Properties</span>
            </span>

            {/* Shading Style */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">Viewport Shading:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'RENDERED_PBR', label: 'PBR Shaded' },
                  { id: 'CEL_SHADING', label: 'Anime Cel' },
                  { id: 'SOLID', label: 'Solid' },
                  { id: 'WIREFRAME', label: 'Wireframe' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setShadingMode(mode.id as ShadingMode)}
                    className={`py-1 px-2 rounded text-[11px] border transition-all ${
                      shadingMode === mode.id
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {workflowMode === 'PHYSICS' && (
          <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              <span>Cloth & Hair Dynamics</span>
            </span>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-300">Physics Simulation</span>
              <button
                onClick={() => setPhysicsEnabled(!physicsEnabled)}
                className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
                  physicsEnabled
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {physicsEnabled ? 'ACTIVE' : 'MUTED'}
              </button>
            </div>

            <button
              onClick={handleResolveClipping}
              className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resolve Cloth Penetration</span>
            </button>

            {clippingStatus && (
              <div className="text-[10px] text-emerald-400 bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                {clippingStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
