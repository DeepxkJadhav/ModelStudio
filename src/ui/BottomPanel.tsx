/**
 * Model Studio - Bottom Panel: Professional Animation Timeline (Sections 30, 31, 42, 43, 66)
 * Transport controls, SMPTE timecode & frames, scrub bar, interactive compound motion segment blocks,
 * speed chips, and physics simulation status.
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Wind,
  Layers,
  Repeat,
} from 'lucide-react';
import { useStudio } from '../core/studioState';

export const BottomPanel: React.FC = () => {
  const {
    project,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    physicsEnabled,
    setPhysicsEnabled,
  } = useStudio();

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  const sequence = project.currentSequence;
  const totalDuration = sequence.totalDuration || 6.0;
  const fps = 30;
  const currentFrame = Math.round(currentTime * fps);
  const totalFrames = Math.round(totalDuration * fps);

  // Compute start and end times for each step
  let cumTime = 0;
  const stepsWithTimes = sequence.steps.map(step => {
    const startTime = cumTime;
    const endTime = cumTime + step.duration;
    cumTime = endTime;
    return {
      ...step,
      startTime,
      endTime,
    };
  });

  const formatTimecode = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleStepBack = () => {
    setCurrentTime(prev => Math.max(0, prev - 0.1));
  };

  const handleStepForward = () => {
    setCurrentTime(prev => Math.min(totalDuration, prev + 0.1));
  };

  const getStepColorClass = (index: number) => {
    const colors = [
      'bg-sky-500/20 border-sky-400/60 text-sky-300 hover:bg-sky-500/30',
      'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/30',
      'bg-amber-500/20 border-amber-400/60 text-amber-300 hover:bg-amber-500/30',
      'bg-purple-500/20 border-purple-400/60 text-purple-300 hover:bg-purple-500/30',
      'bg-rose-500/20 border-rose-400/60 text-rose-300 hover:bg-rose-500/30',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="h-24 shrink-0 bg-slate-950 border-t border-slate-800 flex flex-col z-20 select-none">
      {/* Upper Timeline Row: Interactive Action Sequence Blocks */}
      <div className="h-9 px-4 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between overflow-x-auto gap-3">
        <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>Motion Track:</span>
        </div>

        {/* Sequence Blocks clickable to seek */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1">
          {stepsWithTimes.map((step, idx) => {
            const isCurrent = currentTime >= step.startTime && currentTime <= step.endTime;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentTime(step.startTime)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-all shrink-0 cursor-pointer ${
                  getStepColorClass(idx)
                } ${isCurrent ? 'ring-1 ring-white/60 font-bold scale-[1.02]' : 'opacity-85'}`}
                title={`Seek to ${step.action} (${step.startTime.toFixed(1)}s - ${step.endTime.toFixed(1)}s)`}
              >
                <span>{step.action}</span>
                <span className="text-[9px] opacity-70">
                  {step.startTime.toFixed(1)}s–{step.endTime.toFixed(1)}s
                </span>
              </button>
            );
          })}
        </div>

        {/* Physics Live Indicator */}
        <button
          onClick={() => setPhysicsEnabled(!physicsEnabled)}
          title="Toggle Cloth & Hair Realtime Dynamics in Viewport"
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] border font-medium transition-all shrink-0 ${
            physicsEnabled
              ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
        >
          <Wind className="w-3 h-3" />
          <span>Physics {physicsEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>

      {/* Lower Timeline Row: Transport, Timecode, Scrubber, Speed */}
      <div className="flex-1 px-4 flex items-center gap-4 bg-slate-950">
        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            title="Stop & Return to Start"
            className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleStepBack}
            title="Step Back 0.1s"
            className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title="Play / Pause (Space)"
            className="w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center transition-all shadow-md shadow-sky-500/20 active:scale-95 mx-0.5"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            onClick={handleStepForward}
            title="Step Forward 0.1s"
            className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsLooping(!isLooping)}
            title="Toggle Looping"
            className={`p-1.5 rounded transition-colors ${
              isLooping ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timecode & Frames Readout */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
          <span className="text-white font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span>{formatTimecode(totalDuration)}</span>
          <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
            F: {currentFrame}/{totalFrames}
          </span>
        </div>

        {/* Timeline Scrub Slider */}
        <div className="flex-1 flex flex-col justify-center">
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.02"
            value={currentTime}
            onChange={e => setCurrentTime(parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg hover:h-2 transition-all"
          />
        </div>

        {/* Speed Chips */}
        <div className="flex items-center gap-1 text-xs shrink-0">
          {[0.5, 1.0, 1.5, 2.0].map(spd => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                playbackSpeed === spd
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
