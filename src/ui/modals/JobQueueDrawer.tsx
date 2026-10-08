/**
 * Model Studio - AI Job System Drawer (Sections 53, 54, 55)
 * Displays background jobs, real progress metrics, status reporting, and failure recovery
 */

import React from 'react';
import { X, Activity, CheckCircle2, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import { useStudio } from '../../core/studioState';

export const JobQueueDrawer: React.FC = () => {
  const { backgroundJobs, showJobsDrawer, setShowJobsDrawer } = useStudio();
  if (!showJobsDrawer) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
      <div className="w-full max-w-md bg-studio-panel border-l border-studio-panel-border h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-studio-panel-border bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">AI Studio Background Jobs</h2>
          </div>
          <button
            onClick={() => setShowJobsDrawer(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {backgroundJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No recent background jobs
            </div>
          ) : (
            backgroundJobs.map(job => (
              <div
                key={job.id}
                className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{job.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                      job.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : job.status === 'RUNNING'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                        : 'bg-red-500/20 border-red-500/40 text-red-400'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">{job.detail}</div>

                {job.status === 'RUNNING' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
