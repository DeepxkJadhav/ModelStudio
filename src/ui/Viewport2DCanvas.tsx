/**
 * Model Studio - 2D Canvas Editor & Vector Workspace (Section 1 & 4)
 * Provides 2D vector editing, landmark pin manipulation, segmentation mask inspection,
 * and high-resolution orthographic drawing in the unified creative editor.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  PenTool,
  Move,
  MapPin,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Layers,
  Sparkles,
  Scissors,
  Check,
} from 'lucide-react';
import { useStudio } from '../core/studioState';
import { ExporterRegistry } from '../io/formatRegistry';

interface LandmarkPin {
  id: string;
  name: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  color: string;
}

export const Viewport2DCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { project, activeViewSlot, setActiveViewSlot } = useStudio();

  const [activeTool, setActiveTool] = useState<'SELECT' | 'LANDMARKS' | 'PEN' | 'MASK'>('LANDMARKS');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showMasks, setShowMasks] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Editable landmark pins for active reference
  const [landmarks, setLandmarks] = useState<LandmarkPin[]>([
    { id: 'pin_head', name: 'Head Vertex', x: 0.50, y: 0.12, color: '#38bdf8' },
    { id: 'pin_chin', name: 'Chin Baseline', x: 0.50, y: 0.24, color: '#38bdf8' },
    { id: 'pin_shoulder_l', name: 'Left Shoulder', x: 0.36, y: 0.28, color: '#818cf8' },
    { id: 'pin_shoulder_r', name: 'Right Shoulder', x: 0.64, y: 0.28, color: '#818cf8' },
    { id: 'pin_hips', name: 'Pelvis Origin', x: 0.50, y: 0.50, color: '#34d399' },
    { id: 'pin_knee_l', name: 'Left Knee', x: 0.40, y: 0.70, color: '#fbbf24' },
    { id: 'pin_knee_r', name: 'Right Knee', x: 0.60, y: 0.70, color: '#fbbf24' },
    { id: 'pin_sole_l', name: 'Left Foot Sole', x: 0.40, y: 0.94, color: '#f43f5e' },
    { id: 'pin_sole_r', name: 'Right Foot Sole', x: 0.60, y: 0.94, color: '#f43f5e' },
  ]);

  const activeRef = project.referenceViews.find(v => v.type === activeViewSlot);

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Canvas work area (800x1000)
    const cw = 500;
    const ch = 700;
    const cx = -cw / 2;
    const cy = -ch / 2;

    // Draw workspace sheet
    ctx.fillStyle = '#090d16';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Draw reference image if available
    if (activeRef?.imageDataUri) {
      const img = new Image();
      img.src = activeRef.imageDataUri;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, cx, cy, cw, ch);
      }
    } else {
      // Silhouette placeholder
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.font = '14px sans-serif';
      ctx.fillText(`[ ${activeViewSlot} VIEW CANVAS ]`, 0, -20);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Reference artwork, vector paths & landmarks', 0, 10);
    }

    // Draw Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
      ctx.lineWidth = 1;
      const step = 25;
      for (let x = cx; x <= cx + cw; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x, cy + ch);
        ctx.stroke();
      }
      for (let y = cy; y <= cy + ch; y += step) {
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx + cw, y);
        ctx.stroke();
      }

      // Centerline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(0, cy + ch);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Segmentation Mask Regions
    if (showMasks) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Outer anatomical envelope approximation
      ctx.ellipse(0, cy + ch * 0.18, 55, 65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(-60, cy + ch * 0.28, 120, 140, 12);
      ctx.fill();
      ctx.stroke();
    }

    // Draw Landmark Pins & Alignment Skeleton Lines
    if (activeTool === 'LANDMARKS' || activeTool === 'SELECT') {
      // Draw connection lines between landmarks
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const getPinCoord = (id: string) => {
        const p = landmarks.find(l => l.id === id);
        return p ? { x: cx + p.x * cw, y: cy + p.y * ch } : null;
      };

      const head = getPinCoord('pin_head');
      const chin = getPinCoord('pin_chin');
      const shoulderL = getPinCoord('pin_shoulder_l');
      const shoulderR = getPinCoord('pin_shoulder_r');
      const hips = getPinCoord('pin_hips');
      const kneeL = getPinCoord('pin_knee_l');
      const kneeR = getPinCoord('pin_knee_r');
      const soleL = getPinCoord('pin_sole_l');
      const soleR = getPinCoord('pin_sole_r');

      if (head && chin) { ctx.moveTo(head.x, head.y); ctx.lineTo(chin.x, chin.y); }
      if (shoulderL && shoulderR) { ctx.moveTo(shoulderL.x, shoulderL.y); ctx.lineTo(shoulderR.x, shoulderR.y); }
      if (chin && hips) { ctx.moveTo(chin.x, chin.y); ctx.lineTo(hips.x, hips.y); }
      if (hips && kneeL && soleL) { ctx.moveTo(hips.x, hips.y); ctx.lineTo(kneeL.x, kneeL.y); ctx.lineTo(soleL.x, soleL.y); }
      if (hips && kneeR && soleR) { ctx.moveTo(hips.x, hips.y); ctx.lineTo(kneeR.x, kneeR.y); ctx.lineTo(soleR.x, soleR.y); }
      ctx.stroke();

      // Draw Pins
      landmarks.forEach(pin => {
        const px = cx + pin.x * cw;
        const py = cy + pin.y * ch;
        const isSelected = selectedPinId === pin.id;

        // Pin glow
        ctx.fillStyle = isSelected ? '#ffffff' : pin.color;
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pin Label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = isSelected ? '#38bdf8' : '#cbd5e1';
        ctx.textAlign = 'left';
        ctx.fillText(pin.name, px + 9, py + 3);
      });
    }

    ctx.restore();
  }, [zoom, pan, landmarks, selectedPinId, showMasks, showGrid, activeTool, activeRef, activeViewSlot]);

  // Mouse event handlers for pin dragging & panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.button === 1 || e.shiftKey || activeTool === 'SELECT') {
      setIsPanning(true);
      setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
      return;
    }

    // Check hit on landmarks
    if (activeTool === 'LANDMARKS') {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cw = 500;
      const ch = 700;
      const cx = width / 2 + pan.x - (cw * zoom) / 2;
      const cy = height / 2 + pan.y - (ch * zoom) / 2;

      for (const pin of landmarks) {
        const px = cx + pin.x * cw * zoom;
        const py = cy + pin.y * ch * zoom;
        const dist = Math.hypot(mouseX - px, mouseY - py);
        if (dist <= 12) {
          setSelectedPinId(pin.id);
          return;
        }
      }
      setSelectedPinId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPanning) {
      setPan({ x: mouseX - dragStart.x, y: mouseY - dragStart.y });
      return;
    }

    if (selectedPinId && activeTool === 'LANDMARKS') {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cw = 500 * zoom;
      const ch = 700 * zoom;
      const cx = width / 2 + pan.x - cw / 2;
      const cy = height / 2 + pan.y - ch / 2;

      const normX = Math.max(0, Math.min(1, (mouseX - cx) / cw));
      const normY = Math.max(0, Math.min(1, (mouseY - cy) / ch));

      setLandmarks(prev =>
        prev.map(p => (p.id === selectedPinId ? { ...p, x: normX, y: normY } : p))
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleExportSvg = async () => {
    const result = await ExporterRegistry.exportAsset('svg', project);
    const blob = new Blob([result.data as string], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 h-full relative overflow-hidden bg-slate-950 flex flex-col select-none">
      {/* 2D Canvas Viewport Floating Header Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Left: Tool Selection Chips */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg shadow-xl pointer-events-auto">
          <button
            onClick={() => setActiveTool('LANDMARKS')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
              activeTool === 'LANDMARKS' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Landmark Alignment Tool"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Landmarks</span>
          </button>
          <button
            onClick={() => setActiveTool('SELECT')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
              activeTool === 'SELECT' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pan & Select Tool"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Pan / Select</span>
          </button>
          <button
            onClick={() => setActiveTool('PEN')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
              activeTool === 'PEN' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vector Silhouette Contour Pen"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Vector Pen</span>
          </button>
        </div>

        {/* Center: View Slot Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg shadow-xl pointer-events-auto">
          {(['front', 'right', 'back', 'top'] as const).map(slot => (
            <button
              key={slot}
              onClick={() => setActiveViewSlot(slot)}
              className={`px-2 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition-all ${
                activeViewSlot === slot
                  ? 'bg-slate-700 text-sky-400 font-bold border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {slot.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Right: View Toggles & Export SVG */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg shadow-xl pointer-events-auto">
          <button
            onClick={() => setShowMasks(!showMasks)}
            className={`p-1.5 rounded transition-all ${showMasks ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400'}`}
            title="Toggle Segmentation Masks"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-all ${showGrid ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400'}`}
            title="Toggle Alignment Grid"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            onClick={() => setZoom(prev => Math.min(3.0, prev + 0.15))}
            className="p-1.5 text-slate-400 hover:text-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.15))}
            className="p-1.5 text-slate-400 hover:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
            className="p-1.5 text-slate-400 hover:text-slate-200"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            onClick={handleExportSvg}
            className="flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold transition-all shadow-sm"
            title="Export 2D Vector Silhouette (.svg)"
          >
            <Download className="w-3 h-3" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Main Interactive HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-crosshair"
      />

      {/* Bottom Status Ticker */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 pointer-events-none text-[11px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 backdrop-blur">
        <span>Active: {activeViewSlot} View</span>
        <span>•</span>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
        <span>•</span>
        <span>Landmarks: {landmarks.length} calibrated</span>
      </div>
    </div>
  );
};
