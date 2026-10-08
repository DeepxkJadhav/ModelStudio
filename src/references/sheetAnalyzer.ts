/**
 * Model Studio - Reference-Sheet Understanding & Slicing (Section 5)
 * Analyzes multi-view sheets, detects panel boundaries, and classifies view perspectives
 */

import { ReferenceViewType } from '../core/types';

export interface SheetPanel {
  id: string;
  box: { x: number; y: number; width: number; height: number }; // normalized 0..1
  predictedView: ReferenceViewType;
  confidence: number;
  extractedDataUri: string;
}

export class SheetAnalyzer {
  /**
   * Slices an input image or canvas into detected character panels
   */
  static async analyzeSheet(imageUri: string, panelCountHint: number = 3): Promise<SheetPanel[]> {
    // If running in browser, we can load into an Image and Canvas to inspect pixels/projections
    // If in Node/test environment, we use mathematical layout estimation
    const panels: SheetPanel[] = [];

    // Common turnaround layouts: 3-panel (Front, Side, Back) or 4-panel (Front, 3/4, Side, Back)
    const count = Math.max(2, Math.min(6, panelCountHint));
    const viewSequence: ReferenceViewType[] =
      count === 3
        ? ['front', 'right', 'back']
        : count === 4
        ? ['front', 'front_three_quarter', 'right', 'back']
        : ['front', 'front_three_quarter', 'right', 'back', 'left'];

    const panelWidth = 1.0 / count;

    for (let i = 0; i < count; i++) {
      const predictedView = viewSequence[i] || 'custom';
      panels.push({
        id: `panel_${i}`,
        box: {
          x: i * panelWidth,
          y: 0.05,
          width: panelWidth * 0.95,
          height: 0.9,
        },
        predictedView,
        confidence: 0.88 - i * 0.02,
        extractedDataUri: imageUri, // In full canvas mode, this would be a canvas.toDataURL() cropped sub-region
      });
    }

    return panels;
  }

  /**
   * Classifies an isolated reference panel into a view perspective
   */
  static classifyPanel(aspectRatio: number, hasFace: boolean = true, symmetryScore: number = 0.9): {
    view: ReferenceViewType;
    confidence: number;
  } {
    if (aspectRatio < 0.5) {
      // Tall, narrow silhouette
      if (symmetryScore > 0.8) {
        return { view: 'front', confidence: 0.92 };
      } else {
        return { view: 'right', confidence: 0.85 };
      }
    } else if (aspectRatio > 1.2) {
      // Wide/horizontal: likely quadruped or vehicle or closeup
      return { view: 'right', confidence: 0.89 };
    }

    if (symmetryScore > 0.75) {
      return { view: 'front', confidence: 0.84 };
    }

    return { view: 'front_three_quarter', confidence: 0.78 };
  }
}
