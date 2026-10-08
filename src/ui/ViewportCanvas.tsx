/**
 * Model Studio - Viewport Canvas & Interactive 3D Controls (Sections 40, 41)
 * Mounts ViewportController with floating camera presets, reference overlay slider, and gizmos
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Sliders,
  Maximize2,
  Camera,
  Grid,
  Layers,
  Move,
  RotateCw,
  Scale,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { ViewportController } from '../viewport/ViewportController';
import { CameraCalibrator } from '../references/cameraCalibrator';
import { studioEvents } from '../core/eventBus';

export const ViewportCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ViewportController | null>(null);

  const {
    project,
    shadingMode,
    physicsEnabled,
    isPlaying,
    playbackSpeed,
    referenceOverlayOpacity,
    setReferenceOverlayOpacity,
    activeViewSlot,
  } = useStudio();

  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [activeGizmo, setActiveGizmo] = useState<'SELECT' | 'MOVE' | 'ROTATE' | 'SCALE'>('SELECT');

  // Initialize ViewportController
  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new ViewportController(containerRef.current);
    controllerRef.current = controller;

    controller.updateModel(project.layers, project.materials, project.skeleton);
    controller.updateCollisionEnvelopes(project.collisionEnvelopes);
    controller.setActionSequence(project.currentSequence);

    // Event listener for model updates
    const unbind = studioEvents.on('model-reconstructed', updatedProject => {
      controller.updateModel(updatedProject.layers, updatedProject.materials, updatedProject.skeleton);
      controller.updateCollisionEnvelopes(updatedProject.collisionEnvelopes);
      controller.setActionSequence(updatedProject.currentSequence);
    });

    const unbindSeq = studioEvents.on('sequence-updated', seq => {
      controller.setActionSequence(seq);
    });

    return () => {
      unbind();
      unbindSeq();
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  // Sync Shading Mode
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setShadingMode(shadingMode);
    }
  }, [shadingMode]);

  // Sync Physics Toggle
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setPhysicsEnabled(physicsEnabled);
    }
  }, [physicsEnabled]);

  // Sync Playback State
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setPlayback(isPlaying);
      controllerRef.current.setPlaybackSpeed(playbackSpeed);
    }
  }, [isPlaying, playbackSpeed]);

  // Sync Reference Overlay
  useEffect(() => {
    if (!controllerRef.current) return;

    const activeView = project.referenceViews.find(v => v.type === activeViewSlot);
    if (activeView && activeView.imageDataUri && showOverlay) {
      controllerRef.current.setReferenceOverlay(activeView.imageDataUri, referenceOverlayOpacity);
    } else {
      controllerRef.current.setReferenceOverlay(null);
    }
  }, [activeViewSlot, project.referenceViews, showOverlay, referenceOverlayOpacity]);

  const handleCameraPreset = (slot: string) => {
    if (!controllerRef.current) return;
    const calib = CameraCalibrator.getCalibrationForView(slot as any);
    controllerRef.current.setCameraView(calib.azimuth, calib.elevation, calib.distance, calib.target);
  };

  return (
    <div className="relative flex-1 h-[calc(100vh-3.5rem)] bg-slate-950 overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Top Gizmo Toolbar */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/70 shadow-lg">
        <button
          onClick={() => setActiveGizmo('SELECT')}
          title="Selection Tool (Q)"
          className={`p-1.5 rounded transition-all ${activeGizmo === 'SELECT' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveGizmo('MOVE')}
          title="Translate Gizmo (W)"
          className={`p-1.5 rounded transition-all ${activeGizmo === 'MOVE' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Move className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveGizmo('ROTATE')}
          title="Rotate Gizmo (E)"
          className={`p-1.5 rounded transition-all ${activeGizmo === 'ROTATE' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveGizmo('SCALE')}
          title="Scale Gizmo (R)"
          className={`p-1.5 rounded transition-all ${activeGizmo === 'SCALE' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Scale className="w-4 h-4" />
        </button>
      </div>

      {/* Camera View Angle Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 p-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/70 shadow-lg text-xs">
        <button
          onClick={() => handleCameraPreset('front')}
          className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Front
        </button>
        <button
          onClick={() => handleCameraPreset('right')}
          className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Right
        </button>
        <button
          onClick={() => handleCameraPreset('back')}
          className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Back
        </button>
        <button
          onClick={() => handleCameraPreset('top')}
          className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Top
        </button>
        <button
          onClick={() => handleCameraPreset('front_three_quarter')}
          className="px-2 py-1 rounded text-sky-400 hover:text-sky-300 hover:bg-slate-800 font-medium"
        >
          3/4 View
        </button>
      </div>

      {/* Reference Overlay Floating Slider (Section 41) */}
      <div className="absolute bottom-4 left-3 flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/70 shadow-lg text-xs text-slate-300">
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          title="Toggle Reference Overlay"
          className="text-slate-400 hover:text-white"
        >
          {showOverlay ? <Eye className="w-4 h-4 text-sky-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
        </button>
        <span className="text-[11px] text-slate-400">Ref Overlay:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={referenceOverlayOpacity}
          onChange={e => setReferenceOverlayOpacity(parseFloat(e.target.value))}
          className="w-20 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
        />
        <span className="font-mono text-[10px] text-slate-400 w-7">
          {Math.round(referenceOverlayOpacity * 100)}%
        </span>
      </div>
    </div>
  );
};
