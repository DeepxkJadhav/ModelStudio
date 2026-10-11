/**
 * Model Studio - Master Studio Layout Container (Section 1, 4, 65)
 * Combines TopBar, Reference Intake, Interactive Viewport (3D Studio & 2D Canvas),
 * Right Inspector, and Timeline Command Bar.
 */

import React from 'react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { ViewportCanvas } from './ViewportCanvas';
import { Viewport2DCanvas } from './Viewport2DCanvas';
import { RightInspector } from './RightInspector';
import { BottomPanel } from './BottomPanel';
import { QualityModal } from './modals/QualityModal';
import { ExportModal } from './modals/ExportModal';
import { JobQueueDrawer } from './modals/JobQueueDrawer';
import { UnderstandingModal } from './modals/UnderstandingModal';
import { DiagnosticsModal } from './modals/DiagnosticsModal';
import { useStudio } from '../core/studioState';

export const StudioLayout: React.FC = () => {
  const { activeEditorMode } = useStudio();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Studio Top Navigation & Global Controls */}
      <TopBar />

      {/* Primary Workspace (Left Outliner + 3D Viewport / 2D Canvas + Right Inspector) */}
      <div className="flex flex-1 overflow-hidden relative min-h-0 min-w-0">
        {/* Left Outliner / Assets */}
        <LeftPanel />

        {/* Center Interactive Viewport (3D WebGL Viewport or 2D Vector/Landmark Canvas) */}
        {activeEditorMode === '3d' ? <ViewportCanvas /> : <Viewport2DCanvas />}

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
