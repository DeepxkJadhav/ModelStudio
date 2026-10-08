/**
 * Model Studio - Centralized Studio State & Context
 * Powers real-time updates for Viewport, Inspectors, Timeline, Jobs, and Modals
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  StudioProject,
  SpeciesCategory,
  ShadingMode,
  QualityPreset,
  BackgroundJob,
  ReferenceViewType,
  ActionStep,
} from './types';
import { DefaultModelFactory } from './defaultModels';
import { HistoryManager } from '../editing/historyManager';
import { detectHardwareCapabilities, HardwareProfile } from './hardware';
import { SheetAnalyzer } from '../references/sheetAnalyzer';
import { CoverageCalculator } from '../references/coverageCalculator';
import { SpeciesClassifier } from '../intelligence/speciesClassifier';
import { AnatomyDetector } from '../intelligence/anatomyDetector';
import { SkeletonGenerator } from '../rigging/skeletonGenerator';
import { AutoWeightingEngine } from '../rigging/autoWeighting';
import { VisualHullReconstructor } from '../reconstruction/visualHull';
import { MarchingCubesPolygonizer } from '../reconstruction/marchingCubes';
import { UVGenerator } from '../reconstruction/uvGenerator';
import { ReconstructionRefinementLoop } from '../reconstruction/refinementLoop';
import { QualityScorer } from '../quality/qualityScorer';
import { aiProvider } from '../intelligence/aiProvider';
import { AIMeshEditor } from '../editing/aiMeshEditor';
import { ActionSequencer } from '../animation/actionSequencer';
import { studioEvents } from './eventBus';

interface StudioStateContextType {
  project: StudioProject;
  hardware: HardwareProfile;
  shadingMode: ShadingMode;
  setShadingMode: (mode: ShadingMode) => void;
  qualityPreset: QualityPreset;
  setQualityPreset: (preset: QualityPreset) => void;
  physicsEnabled: boolean;
  setPhysicsEnabled: (enabled: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  referenceOverlayOpacity: number;
  setReferenceOverlayOpacity: (opacity: number) => void;
  activeViewSlot: ReferenceViewType;
  setActiveViewSlot: (slot: ReferenceViewType) => void;
  backgroundJobs: BackgroundJob[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  showQualityModal: boolean;
  setShowQualityModal: (show: boolean) => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  showJobsDrawer: boolean;
  setShowJobsDrawer: (show: boolean) => void;

  // Actions
  switchSpecies: (species: SpeciesCategory) => void;
  setReferenceImage: (slotId: string, dataUri: string) => void;
  generateMissingView: (slotId: string) => void;
  clearReferenceSlot: (slotId: string) => void;
  uploadReferenceSheet: (dataUri: string) => Promise<void>;
  runReconstruction: () => Promise<void>;
  runRefinementPass: () => Promise<void>;
  runAutoRigging: () => Promise<void>;
  executeAnimationPrompt: (prompt: string) => Promise<void>;
  executeMeshEditPrompt: (prompt: string) => Promise<void>;
  addJob: (name: string, category: BackgroundJob['category']) => string;
  updateJob: (id: string, patch: Partial<BackgroundJob>) => void;
  loadProject: (project: StudioProject) => void;
}

const StudioStateContext = createContext<StudioStateContextType | null>(null);

export const StudioStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hardware = useRef(detectHardwareCapabilities()).current;
  const historyMgr = useRef(new HistoryManager()).current;

  const [project, setProject] = useState<StudioProject>(() => {
    const init = DefaultModelFactory.createDefaultProject('HUMANOID');
    historyMgr.pushSnapshot('Initial Project', 'Initialized humanoid studio model', init);
    return init;
  });

  const [shadingMode, setShadingMode] = useState<ShadingMode>('RENDERED_PBR');
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>('BALANCED');
  const [physicsEnabled, setPhysicsEnabled] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [referenceOverlayOpacity, setReferenceOverlayOpacity] = useState<number>(0.35);
  const [activeViewSlot, setActiveViewSlot] = useState<ReferenceViewType>('front');
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);

  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showJobsDrawer, setShowJobsDrawer] = useState<boolean>(false);

  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyMgr.canUndo());
    setCanRedo(historyMgr.canRedo());
  }, [historyMgr]);

  const addJob = useCallback((name: string, category: BackgroundJob['category']): string => {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const job: BackgroundJob = {
      id,
      name,
      category,
      status: 'RUNNING',
      progress: 0,
      detail: 'Initializing processing stage...',
      startTime: Date.now(),
    };
    setBackgroundJobs(prev => [job, ...prev]);
    return id;
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<BackgroundJob>) => {
    setBackgroundJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, ...patch, endTime: patch.status === 'COMPLETED' || patch.status === 'FAILED' ? Date.now() : j.endTime } : j))
    );
  }, []);

  const switchSpecies = useCallback((species: SpeciesCategory) => {
    const newProj = DefaultModelFactory.createDefaultProject(species);
    historyMgr.pushSnapshot(`Switch to ${species}`, `Loaded ${species} base morphology`, newProj);
    setProject(newProj);
    updateHistoryState();
    studioEvents.emit('model-reconstructed', newProj);
  }, [historyMgr, updateHistoryState]);

  const setReferenceImage = useCallback((slotId: string, dataUri: string) => {
    setProject(prev => {
      const updatedViews = prev.referenceViews.map(v => {
        if (v.id === slotId) {
          return {
            ...v,
            imageDataUri: dataUri,
            status: 'OBSERVED' as const,
            uncertaintyScore: 0.05,
          };
        }
        return v;
      });

      const coverageReport = CoverageCalculator.computeCoverage(updatedViews);
      const qualityMetrics = QualityScorer.evaluateQuality(prev.layers, prev.skeleton, updatedViews);

      const next = { ...prev, referenceViews: updatedViews, coverageReport, qualityMetrics };
      historyMgr.pushSnapshot('Add Reference', `Uploaded reference view ${slotId}`, next);
      updateHistoryState();
      return next;
    });
  }, [historyMgr, updateHistoryState]);

  const generateMissingView = useCallback((slotId: string) => {
    const jobId = addJob(`Generate Synthetic View (${slotId})`, 'REFERENCE_ANALYSIS');
    setTimeout(() => {
      setProject(prev => {
        const updatedViews = prev.referenceViews.map(v => {
          if (v.id === slotId) {
            const svgUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%231e293b"/><text x="150" y="190" fill="%2338bdf8" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">AI SYNTHESIZED</text><text x="150" y="220" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">${v.label.toUpperCase()}</text><circle cx="150" cy="110" r="35" fill="%230ea5e9" opacity="0.4"/><rect x="120" y="150" width="60" height="90" rx="10" fill="%230ea5e9" opacity="0.3"/></svg>`;
            return {
              ...v,
              imageDataUri: svgUri,
              status: 'AI_GENERATED' as const,
              uncertaintyScore: 0.35,
            };
          }
          return v;
        });

        const coverageReport = CoverageCalculator.computeCoverage(updatedViews);
        const qualityMetrics = QualityScorer.evaluateQuality(prev.layers, prev.skeleton, updatedViews);
        const next = { ...prev, referenceViews: updatedViews, coverageReport, qualityMetrics };
        historyMgr.pushSnapshot('Generate View', `Synthesized supporting view for ${slotId}`, next);
        updateHistoryState();
        return next;
      });
      updateJob(jobId, { status: 'COMPLETED', progress: 100, detail: `Synthesized view for ${slotId}` });
    }, 400);
  }, [addJob, updateJob, historyMgr, updateHistoryState]);

  const clearReferenceSlot = useCallback((slotId: string) => {
    setProject(prev => {
      const updatedViews = prev.referenceViews.map(v => {
        if (v.id === slotId) {
          return {
            ...v,
            imageDataUri: null,
            status: 'UNCERTAIN' as const,
            uncertaintyScore: 1.0,
          };
        }
        return v;
      });
      const coverageReport = CoverageCalculator.computeCoverage(updatedViews);
      return { ...prev, referenceViews: updatedViews, coverageReport };
    });
  }, []);

  const uploadReferenceSheet = useCallback(async (dataUri: string) => {
    const jobId = addJob('Deconstruct Reference Sheet', 'REFERENCE_ANALYSIS');
    updateJob(jobId, { progress: 30, detail: 'Detecting panels & slicing character sheet...' });

    const panels = await SheetAnalyzer.analyzeSheet(dataUri, 3);
    updateJob(jobId, { progress: 75, detail: 'Classifying perspective camera orientations...' });

    setProject(prev => {
      const updatedViews = prev.referenceViews.map(v => {
        const matchingPanel = panels.find(p => p.predictedView === v.type);
        if (matchingPanel) {
          return {
            ...v,
            imageDataUri: matchingPanel.extractedDataUri,
            status: 'OBSERVED' as const,
            uncertaintyScore: 0.1,
          };
        }
        return v;
      });

      const classification = SpeciesClassifier.classifyFromEvidence(updatedViews);
      const anatomy = AnatomyDetector.analyzeAnatomy(classification.category);
      const coverageReport = CoverageCalculator.computeCoverage(updatedViews);
      const qualityMetrics = QualityScorer.evaluateQuality(prev.layers, prev.skeleton, updatedViews);

      const next = {
        ...prev,
        species: classification.category,
        anatomicalAnalysis: anatomy,
        referenceViews: updatedViews,
        coverageReport,
        qualityMetrics,
      };

      historyMgr.pushSnapshot('Deconstruct Turnaround Sheet', `Extracted ${panels.length} views from sheet`, next);
      updateHistoryState();
      return next;
    });

    updateJob(jobId, { status: 'COMPLETED', progress: 100, detail: `Extracted ${panels.length} panel views successfully` });
  }, [addJob, updateJob, historyMgr, updateHistoryState]);

  const runReconstruction = useCallback(async () => {
    const jobId = addJob('Volumetric 3D Reconstruction', 'RECONSTRUCTION');
    updateJob(jobId, { progress: 25, detail: 'Sampling silhouette visual hull constraints...' });

    await new Promise(r => setTimeout(r, 200));
    updateJob(jobId, { progress: 55, detail: 'Running Marching Cubes isosurface extraction...' });

    await new Promise(r => setTimeout(r, 200));
    updateJob(jobId, { progress: 85, detail: 'Generating conformal UV atlas and topology...' });

    setProject(prev => {
      const res = prev.qualityPreset === 'ULTRA' ? 34 : prev.qualityPreset === 'HIGH' ? 30 : 26;
      const grid = VisualHullReconstructor.generateDensityField(prev.species, prev.referenceViews, res);
      const polyMesh = MarchingCubesPolygonizer.extractSurface(grid, 0.0);
      const uvs = UVGenerator.generateUVs(polyMesh.vertices);
      const skinning = AutoWeightingEngine.computeWeights(polyMesh.vertices, prev.skeleton);

      const bodyLayer = {
        ...prev.layers[0],
        vertexCount: polyMesh.vertices.length / 3,
        triangleCount: polyMesh.indices.length / 3,
        vertices: polyMesh.vertices,
        normals: polyMesh.normals,
        uvs,
        indices: polyMesh.indices,
        skinIndices: skinning.skinIndices,
        skinWeights: skinning.skinWeights,
      };

      const layers = [bodyLayer, ...prev.layers.slice(1)];
      const qualityMetrics = QualityScorer.evaluateQuality(layers, prev.skeleton, prev.referenceViews);
      const next = { ...prev, layers, qualityMetrics };

      historyMgr.pushSnapshot('Reconstruction Pass', `Reconstructed mesh (${polyMesh.indices.length / 3} tris)`, next);
      updateHistoryState();
      studioEvents.emit('model-reconstructed', next);
      return next;
    });

    updateJob(jobId, { status: 'COMPLETED', progress: 100, detail: 'Watertight surface generated successfully' });
  }, [addJob, updateJob, historyMgr, updateHistoryState]);

  const runRefinementPass = useCallback(async () => {
    const jobId = addJob('Camera Refinement Loop', 'RECONSTRUCTION');
    updateJob(jobId, { progress: 40, detail: 'Comparing rendered contours against reference cameras...' });

    await new Promise(r => setTimeout(r, 300));
    setProject(prev => {
      const primaryLayer = prev.layers[0];
      const { refinedVertices, report } = ReconstructionRefinementLoop.runRefinementPass(
        primaryLayer.vertices as Float32Array,
        prev.referenceViews,
        2
      );

      const updatedLayer = { ...primaryLayer, vertices: refinedVertices };
      const layers = [updatedLayer, ...prev.layers.slice(1)];
      const qualityMetrics = QualityScorer.evaluateQuality(layers, prev.skeleton, prev.referenceViews);
      const next = { ...prev, layers, qualityMetrics };

      historyMgr.pushSnapshot('Refinement Pass', `Refinement iteration converged (${report.contourAlignmentScore}% alignment)`, next);
      updateHistoryState();
      studioEvents.emit('model-reconstructed', next);
      return next;
    });

    updateJob(jobId, { status: 'COMPLETED', progress: 100, detail: 'Refinement loop completed' });
  }, [addJob, updateJob, historyMgr, updateHistoryState]);

  const runAutoRigging = useCallback(async () => {
    const jobId = addJob('Adaptive Rig & Skin Weighting', 'RIGGING');
    updateJob(jobId, { progress: 30, detail: 'Constructing species skeletal hierarchy...' });

    await new Promise(r => setTimeout(r, 200));
    setProject(prev => {
      const skeleton = SkeletonGenerator.generateSkeleton(prev.species);
      const skinning = AutoWeightingEngine.computeWeights(prev.layers[0].vertices, skeleton);

      const updatedLayers = prev.layers.map(layer => ({
        ...layer,
        skinIndices: skinning.skinIndices,
        skinWeights: skinning.skinWeights,
      }));

      const qualityMetrics = QualityScorer.evaluateQuality(updatedLayers, skeleton, prev.referenceViews);
      const next = { ...prev, skeleton, layers: updatedLayers, qualityMetrics };

      historyMgr.pushSnapshot('Auto-Rigging', `Rigged ${skeleton.bones.length} bones with smooth weighting`, next);
      updateHistoryState();
      studioEvents.emit('model-reconstructed', next);
      return next;
    });

    updateJob(jobId, { status: 'COMPLETED', progress: 100, detail: 'Rig and weights compiled successfully' });
  }, [addJob, updateJob, historyMgr, updateHistoryState]);

  const executeAnimationPrompt = useCallback(async (prompt: string) => {
    const jobId = addJob(`Animation: "${prompt}"`, 'MOTION_GENERATION');
    updateJob(jobId, { progress: 40, detail: 'Synthesizing action sequence state machine...' });

    const rawSteps = await aiProvider.interpretAnimationPrompt(prompt);
    const steps: ActionStep[] = rawSteps.map((s, idx) => ({
      id: `step_${idx}_${Date.now()}`,
      action: s.action as any,
      duration: s.duration,
      parameters: s.params,
    }));

    const newSequence = ActionSequencer.buildSequence(prompt, steps, true);

    setProject(prev => {
      const next = { ...prev, currentSequence: newSequence };
      historyMgr.pushSnapshot('Animation Sequence', `Generated action sequence: ${prompt}`, next);
      updateHistoryState();
      studioEvents.emit('sequence-updated', newSequence);
      return next;
    });

    updateJob(jobId, { status: 'COMPLETED', progress: 100, detail: `Compiled sequence with ${steps.length} steps` });
  }, [addJob, updateJob, historyMgr, updateHistoryState]);

  const executeMeshEditPrompt = useCallback(async (prompt: string) => {
    const jobId = addJob(`AI Edit: "${prompt}"`, 'RECONSTRUCTION');
    updateJob(jobId, { progress: 30, detail: 'Interpreting localized geometric modification...' });

    const editResult = await aiProvider.interpretEditCommand(prompt);
    updateJob(jobId, { progress: 70, detail: editResult.explanation });

    setProject(prev => {
      const targetLayer = prev.layers.find(l => l.name === 'Clothing') || prev.layers[0];
      const editedLayer = AIMeshEditor.applyLocalizedEdit(targetLayer, editResult);

      const layers = prev.layers.map(l => (l.id === editedLayer.id ? editedLayer : l));
      const qualityMetrics = QualityScorer.evaluateQuality(layers, prev.skeleton, prev.referenceViews);
      const next = { ...prev, layers, qualityMetrics };

      historyMgr.pushSnapshot('AI Geometric Modification', editResult.explanation, next);
      updateHistoryState();
      studioEvents.emit('model-reconstructed', next);
      return next;
    });

    updateJob(jobId, { status: 'COMPLETED', progress: 100, detail: editResult.explanation });
  }, [addJob, updateJob, historyMgr, updateHistoryState]);

  const undo = useCallback(() => {
    const prev = historyMgr.undo();
    if (prev) {
      setProject(prev);
      updateHistoryState();
      studioEvents.emit('model-reconstructed', prev);
    }
  }, [historyMgr, updateHistoryState]);

  const redo = useCallback(() => {
    const next = historyMgr.redo();
    if (next) {
      setProject(next);
      updateHistoryState();
      studioEvents.emit('model-reconstructed', next);
    }
  }, [historyMgr, updateHistoryState]);

  const loadProject = useCallback((newProject: StudioProject) => {
    setProject(newProject);
    historyMgr.pushSnapshot('Loaded Project', `Loaded ${newProject.name}`, newProject);
    updateHistoryState();
    studioEvents.emit('model-reconstructed', newProject);
  }, [historyMgr, updateHistoryState]);

  return (
    <StudioStateContext.Provider
      value={{
        project,
        hardware,
        shadingMode,
        setShadingMode,
        qualityPreset,
        setQualityPreset,
        physicsEnabled,
        setPhysicsEnabled,
        isPlaying,
        setIsPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        referenceOverlayOpacity,
        setReferenceOverlayOpacity,
        activeViewSlot,
        setActiveViewSlot,
        backgroundJobs,
        canUndo,
        canRedo,
        undo,
        redo,
        showQualityModal,
        setShowQualityModal,
        showExportModal,
        setShowExportModal,
        showJobsDrawer,
        setShowJobsDrawer,
        switchSpecies,
        setReferenceImage,
        generateMissingView,
        clearReferenceSlot,
        uploadReferenceSheet,
        runReconstruction,
        runRefinementPass,
        runAutoRigging,
        executeAnimationPrompt,
        executeMeshEditPrompt,
        addJob,
        updateJob,
        loadProject,
      }}
    >
      {children}
    </StudioStateContext.Provider>
  );
};

export const useStudio = () => {
  const ctx = useContext(StudioStateContext);
  if (!ctx) throw new Error('useStudio must be used within a StudioStateProvider');
  return ctx;
};
