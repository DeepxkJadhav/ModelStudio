/**
 * Model Studio - Bottom Panel: Animation Timeline & NLP Command Box (Sections 30, 31, 42, 43, 66)
 * Transport controls, scrub bar, compound action sequencing graph, physics toggle, and natural language command bar
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Wind,
  Layers,
  ChevronRight,
  Send,
  FastForward,
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
    executeAnimationPrompt,
  } = useStudio();

  const [promptInput, setPromptInput] = useState<string>('Walk forward, stop, crouch, then jump');
  const [currentTime, setCurrentTime] = useState<number>(0);

  const sequence = project.currentSequence;
  const totalDuration = sequence.totalDuration || 6.0;

  const handleRunCommand = () => {
    if (!promptInput.trim()) return;
    executeAnimationPrompt(promptInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRunCommand();
    }
  };

  return (
    <div className="h-36 bg-studio-panel border-t border-studio-panel-border flex flex-col z-20 select-none">
      {/* Top Bar: Natural Language Animation Command Box (Section 30, 66) */}
      <div className="h-11 px-4 border-b border-studio-panel-border bg-slate-900/90 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Animation AI:</span>
        </div>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={promptInput}
            onChange={e => setPromptInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell the model what to do... (e.g. 'Walk forward, stop, crouch, then jump')"
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 pr-20"
          />
          <button
            onClick={handleRunCommand}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
          >
            <span>Run</span>
            <Send className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Action Sequence Steps Indicator (Section 31) */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
          <span className="text-slate-500 text-[10px] font-semibold uppercase">Plan:</span>
          {sequence.steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <span className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {step.action}
              </span>
              {idx < sequence.steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Timeline & Transport Controls (Section 42, 43) */}
      <div className="flex-1 px-4 flex items-center gap-4 bg-slate-900/50">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center transition-all shadow-md"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentTime(0)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Time Display */}
        <div className="text-xs font-mono text-slate-400 w-24">
          <span className="text-white font-bold">{currentTime.toFixed(2)}s</span> / {totalDuration.toFixed(1)}s
        </div>

        {/* Timeline Scrub Bar */}
        <div className="flex-1 flex flex-col justify-center">
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.05"
            value={currentTime}
            onChange={e => setCurrentTime(parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 text-[10px]">Speed:</span>
          {[0.5, 1.0, 1.5, 2.0].map(spd => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                playbackSpeed === spd
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Physics Preview Toggle (Section 43) */}
        <div className="h-6 w-px bg-slate-800" />

        <button
          onClick={() => setPhysicsEnabled(!physicsEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            physicsEnabled
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Physics {physicsEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
