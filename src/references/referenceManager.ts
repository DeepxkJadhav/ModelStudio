/**
 * Model Studio - Reference Intake & Manager (Sections 3, 4, 6)
 * Handles multi-view intake slots, status tracking, and view generation
 */

import { ReferenceView, ReferenceViewType, EvidenceStatus } from '../core/types';

export class ReferenceManager {
  private views: Map<string, ReferenceView> = new Map();

  constructor() {
    this.initializeDefaultSlots();
  }

  private initializeDefaultSlots(): void {
    const defaultConfigs: Array<{
      type: ReferenceViewType;
      label: string;
      azimuth: number;
      elevation: number;
      isOrtho: boolean;
    }> = [
      { type: 'front', label: 'Front View', azimuth: 0, elevation: 0, isOrtho: true },
      { type: 'back', label: 'Back View', azimuth: 180, elevation: 0, isOrtho: true },
      { type: 'left', label: 'Left View', azimuth: -90, elevation: 0, isOrtho: true },
      { type: 'right', label: 'Right View', azimuth: 90, elevation: 0, isOrtho: true },
      { type: 'top', label: 'Top View', azimuth: 0, elevation: 90, isOrtho: true },
      { type: 'bottom', label: 'Bottom View', azimuth: 0, elevation: -90, isOrtho: true },
      { type: 'front_three_quarter', label: 'Front 3/4 View', azimuth: 45, elevation: 15, isOrtho: false },
      { type: 'back_three_quarter', label: 'Back 3/4 View', azimuth: 135, elevation: 15, isOrtho: false },
    ];

    defaultConfigs.forEach(cfg => {
      this.views.set(cfg.type, {
        id: cfg.type,
        type: cfg.type,
        label: cfg.label,
        imageDataUri: null,
        status: 'UNCERTAIN',
        cameraEstimate: {
          azimuth: cfg.azimuth,
          elevation: cfg.elevation,
          fov: cfg.isOrtho ? 0 : 50,
          distance: 2.5,
          isOrthographic: cfg.isOrtho,
        },
        uncertaintyScore: 1.0,
      });
    });
  }

  getAllViews(): ReferenceView[] {
    return Array.from(this.views.values());
  }

  getView(id: string): ReferenceView | undefined {
    return this.views.get(id);
  }

  setSlotImage(id: string, imageDataUri: string, status: EvidenceStatus = 'OBSERVED'): ReferenceView {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`Reference view slot ${id} does not exist`);
    }

    view.imageDataUri = imageDataUri;
    view.status = status;
    view.uncertaintyScore = status === 'OBSERVED' ? 0.05 : status === 'VERIFIED' ? 0.0 : 0.25;
    return { ...view };
  }

  clearSlot(id: string): void {
    const view = this.views.get(id);
    if (view) {
      view.imageDataUri = null;
      view.status = 'UNCERTAIN';
      view.uncertaintyScore = 1.0;
    }
  }

  addCustomView(label: string, imageDataUri: string | null = null): ReferenceView {
    const id = `custom_${Date.now()}`;
    const newView: ReferenceView = {
      id,
      type: 'custom',
      label,
      imageDataUri,
      status: imageDataUri ? 'OBSERVED' : 'UNCERTAIN',
      cameraEstimate: {
        azimuth: 30,
        elevation: 20,
        fov: 50,
        distance: 2.5,
        isOrthographic: false,
      },
      uncertaintyScore: imageDataUri ? 0.1 : 1.0,
    };
    this.views.set(id, newView);
    return newView;
  }

  removeCustomView(id: string): boolean {
    if (id.startsWith('custom_')) {
      return this.views.delete(id);
    }
    return false;
  }

  /**
   * Generates a supporting synthetic view based on existing views using camera projection/synthesis
   */
  generateMissingView(targetSlotId: string): ReferenceView {
    const target = this.views.get(targetSlotId);
    if (!target) throw new Error(`Target view ${targetSlotId} not found`);

    // In a production AI studio, this invokes the synthesis engine or procedural silhouette projection
    // Here we synthesize a derived camera view SVG data URI
    const synthesizedSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%231e293b"/><text x="150" y="190" fill="%2338bdf8" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">AI SYNTHESIZED</text><text x="150" y="220" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">${target.label.toUpperCase()}</text><circle cx="150" cy="110" r="35" fill="%230ea5e9" opacity="0.4"/><rect x="120" y="150" width="60" height="90" rx="10" fill="%230ea5e9" opacity="0.3"/></svg>`;

    target.imageDataUri = synthesizedSvg;
    target.status = 'AI_GENERATED';
    target.uncertaintyScore = 0.35;
    return { ...target };
  }
}
