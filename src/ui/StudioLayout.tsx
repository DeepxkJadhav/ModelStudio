/**
 * Model Studio - Master Studio Layout Container (Section 65)
 * Combines TopBar, Reference Intake, Interactive Viewport, Right Inspector, and Timeline Command Bar
 */

import React from 'react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { ViewportCanvas } from './ViewportCanvas';
import { RightInspector } from './RightInspector';
import { BottomPanel } from './BottomPanel';
import { QualityModal } from './modals/QualityModal';
import { ExportModal } from './modals/ExportModal';
import { JobQueueDrawer } from './modals/JobQueueDrawer';
import { UnderstandingModal } from './modals/UnderstandingModal';
import { DiagnosticsModal } from './modals/DiagnosticsModal';

export const StudioLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Studio Top Navigation & Global Controls */}
      <TopBar />

      {/* Primary Workspace (Left Outliner + 3D Viewport + Right Inspector) */}
      <div className="flex flex-1 overflow-hidden relative min-h-0 min-w-0">
        {/* Left Outliner / Assets */}
        <LeftPanel />

        {/* Center Interactive 3D WebGL Viewport */}
        <ViewportCanvas />

        {/* Right Inspector & Tools */}
        <RightInspector />
      </div>

      {/* Bottom Timeline & Animation Controls */}
      <BottomPanel />

      {/* Modals & Drawers */}
      <QualityModal />
      <ExportModal />
      <JobQueueDrawer />
      <UnderstandingModal />
      <DiagnosticsModal />
    </div>
  );
};
