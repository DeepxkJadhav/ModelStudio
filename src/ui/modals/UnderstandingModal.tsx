/**
 * Model Studio - Automatic Model Understanding Review Modal (Section 8, 9, 10, Master Spec)
 * Displays the AI's autonomous multi-view understanding, body plan, adaptive rig, locomotion,
 * and physics strategy with full confidence metrics and user override controls.
 */

import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Sliders,
  Layers,
  Bone,
  Wind,
  ShieldCheck,
  Eye,
  Activity,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  X,
  Edit3,
} from 'lucide-react';
import { useStudio } from '../../core/studioState';
import { SpeciesCategory } from '../../core/types';

export const UnderstandingModal: React.FC = () => {
  const {
    project,
    showUnderstandingModal,
    setShowUnderstandingModal,
    acceptAutomaticUnderstanding,
    overrideModelUnderstanding,
  } = useStudio();

  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesCategory>(project.species);
  const [customLegs, setCustomLegs] = useState<number>(project.automaticUnderstanding?.anatomy.weightBearingLegs ?? 2);
  const [customArms, setCustomArms] = useState<number>(project.automaticUnderstanding?.anatomy.manipulatorArms ?? 2);
  const [customWings, setCustomWings] = useState<number>(project.automaticUnderstanding?.anatomy.wingsCount ?? 0);
  const [customTail, setCustomTail] = useState<boolean>(project.automaticUnderstanding?.anatomy.tailPresent ?? false);
  const [customTailSegments, setCustomTailSegments] = useState<number>(project.automaticUnderstanding?.anatomy.tailSegments ?? 5);

  if (!showUnderstandingModal) return null;

  const u = project.automaticUnderstanding;

  const handleApplyOverride = () => {
    overrideModelUnderstanding({
      species: selectedSpecies,
      anatomy: {
        weightBearingLegs: customLegs,
        manipulatorArms: customArms,
        wingsCount: customWings,
        tailPresent: customTail,
        tailSegments: customTail ? customTailSegments : 0,
      },
    });
    setEditMode(false);
  };

  const handleAccept = () => {
    acceptAutomaticUnderstanding();
    setShowUnderstandingModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Automatic Model Understanding & Anatomy Intelligence
                </h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Autonomous AI Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-view visual consensus analyzed without requiring upfront manual selection.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUnderstandingModal(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* Top Hero Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 to-purple-950/60 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase text-sky-400 tracking-wider">
                Autonomous Visual Recognition Result
              </div>
              <div className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>{u?.bodyPlanForm.replace('_', ' ')}</span>
                <span className="text-sm font-mono font-normal text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                  {u?.speciesConfidence}% Confidence
                </span>
                {u?.userAccepted && (
                  <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                  </span>
                )}
                {u?.userOverridden && (
                  <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                    User Overridden
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                Classified as <strong className="text-white">{u?.entityNature}</strong> entity with{' '}
                <strong className="text-sky-300">{u?.anatomy.symmetry}</strong> symmetry,{' '}
                <strong className="text-sky-300">{u?.anatomy.weightBearingLegs} weight-bearing limbs</strong>, and{' '}
                <strong className="text-sky-300">{u?.anatomy.fingerCountPerHand}-finger articulation</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!u?.userAccepted && (
                <button
                  onClick={handleAccept}
                  className="studio-btn studio-btn-primary bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept AI Interpretation</span>
                </button>
              )}
              <button
                onClick={() => setEditMode(!editMode)}
                className="studio-btn studio-btn-secondary px-3 py-2"
              >
                <Edit3 className="w-4 h-4 text-sky-400" />
                <span>{editMode ? 'Hide Override Controls' : 'Override / Edit Interpretation'}</span>
              </button>
            </div>
          </div>

          {/* User Override Panel (Expanded on click) */}
          {editMode && (
            <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Interactive Anatomy & Taxonomy Override</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Override AI defaults to customize skeleton & kinematics downstream
                </span>
              </div>

              {/* Species Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-300 font-semibold">Model Classification Category:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['HUMANOID', 'QUADRUPED', 'SERPENT', 'BIRD', 'FISH', 'CREATURE'] as const).map(sp => (
                    <button
                      key={sp}
                      onClick={() => setSelectedSpecies(sp)}
                      className={`py-1.5 px-2 rounded text-xs border text-center transition-all ${
                        selectedSpecies === sp
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anatomy Steppers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700 space-y-1">
                  <span className="text-slate-400 text-[10px]">Weight-Bearing Legs</span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCustomLegs(Math.max(0, customLegs - 2))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      -
                    </button>
                    <span className="font-bold text-sky-400 text-sm">{customLegs}</span>
                    <button
                      onClick={() => setCustomLegs(Math.min(8, customLegs + 2))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700 space-y-1">
                  <span className="text-slate-400 text-[10px]">Manipulator Arms</span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCustomArms(Math.max(0, customArms - 2))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      -
                    </button>
                    <span className="font-bold text-sky-400 text-sm">{customArms}</span>
                    <button
                      onClick={() => setCustomArms(Math.min(4, customArms + 2))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700 space-y-1">
                  <span className="text-slate-400 text-[10px]">Aerofoil Wings</span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCustomWings(Math.max(0, customWings - 2))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      -
                    </button>
                    <span className="font-bold text-sky-400 text-sm">{customWings}</span>
                    <button
                      onClick={() => setCustomWings(Math.min(4, customWings + 2))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700 space-y-1">
                  <span className="text-slate-400 text-[10px]">Articulated Tail</span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCustomTail(!customTail)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        customTail ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {customTail ? 'YES' : 'NO'}
                    </button>
                    {customTail && (
                      <span className="text-[11px] text-slate-300">{customTailSegments} seg</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="studio-btn studio-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyOverride}
                  className="studio-btn studio-btn-primary bg-amber-600 hover:bg-amber-500 font-semibold"
                >
                  Apply Override & Rebuild Skeleton
                </button>
              </div>
            </div>
          )}

          {/* 4-Pillar Grid: Anatomy, Rig, Locomotion, Physics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PILLAR 1: ANATOMY-FIRST EVIDENCE */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Anatomical Structure
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-sky-400">
                  {u?.anatomyConfidence}% Conf.
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Spine Orientation</span>
                  <span className="text-slate-200">{u?.anatomy.spineOrientation} ({u?.anatomy.spineSegments} segments)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Weight-Bearing Limbs</span>
                  <span className="text-slate-200">{u?.anatomy.weightBearingLegs} Legs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Manipulator Arms</span>
                  <span className="text-slate-200">{u?.anatomy.manipulatorArms} Arms ({u?.anatomy.fingerCountPerHand} Fingers/Hand)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Wings / Aerofoils</span>
                  <span className="text-slate-200">{u?.anatomy.wingsCount} Wings</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Caudal Tail</span>
                  <span className="text-slate-200">{u?.anatomy.tailPresent ? `Detected (${u?.anatomy.tailSegments} seg)` : 'None'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Articulated Nodes</span>
                  <span className="text-emerald-400 font-bold">{u?.anatomy.articulatedStructures.length} Nodes</span>
                </div>
              </div>
            </div>

            {/* PILLAR 2: SKELETON & RIG ARCHITECTURE */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bone className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Adaptive Skeleton Rig
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-sky-400">
                  {u?.skeletonConfidence}% Conf.
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Architecture</span>
                  <span className="text-sky-300 font-semibold">{u?.rigArchitecture.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Total Bones Count</span>
                  <span className="text-slate-200">{u?.rigArchitecture.totalBones} Bones</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Active IK Chains</span>
                  <span className="text-slate-200">{u?.rigArchitecture.ikChainsCount} Chains (Legs/Arms)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Procedural Generation</span>
                  <span className="text-slate-200">{u?.rigArchitecture.isCustomProcedural ? 'Custom Multi-Limb Rig' : 'Native Species Rig'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Joint Constraint Limits</span>
                  <span className="text-emerald-400 font-bold">Anatomically Bounded</span>
                </div>
              </div>
            </div>

            {/* PILLAR 3: PROCEDURAL LOCOMOTION */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Locomotion & Kinematics
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  {u?.locomotionConfidence}% Conf.
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="font-semibold text-slate-200">
                  {u?.locomotion.label}
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Gait synthesized automatically from ground-contact pillars. Foot-floor IK anchors each foot contact
                  with anti-slippage phase compensation and pelvis vertical bounce.
                </p>
              </div>
            </div>

            {/* PILLAR 4: DEFORMATION & PHYSICS */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Deformation & Physics Strategy
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-purple-400">
                  {u?.physicsConfidence}% Conf.
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Deformation Method</span>
                  <span className="text-slate-200">{u?.deformationStrategy}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Garment Physics</span>
                  <span className="text-slate-200">Verlet Mass-Springs (0.88 stiffness)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Hair Simulation</span>
                  <span className="text-slate-200">Inertial Damped Strands (240 strands)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Anti-Clipping Protection</span>
                  <span className="text-emerald-400 font-bold">Surface Normal Repulsion Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Computer Vision Evidence Rationale Chain */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Multi-View Visual Consensus Evidence</span>
            </span>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-300 leading-relaxed">
              {u?.rationaleChain.map((item, idx) => (
                <li key={idx} className="pl-1">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Model Studio respects user sovereignty: AI proposes, you dispose.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnderstandingModal(false)}
              className="studio-btn studio-btn-secondary px-4 py-2"
            >
              Close
            </button>
            <button
              onClick={handleAccept}
              className="studio-btn studio-btn-primary bg-sky-600 hover:bg-sky-500 font-semibold px-4 py-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Keep Active Rig</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
