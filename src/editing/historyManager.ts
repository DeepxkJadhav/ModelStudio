/**
 * Model Studio - Non-Destructive History & Version Manager (Section 39)
 * Maintains immutable project snapshots (Model v1, v2, v3) with undo, redo, and rollback
 */

import { ProjectSnapshot } from '../core/types';

export class HistoryManager {
  private snapshots: ProjectSnapshot[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 30;

  pushSnapshot(name: string, description: string, stateData: any): ProjectSnapshot {
    // If we branched by undoing, truncate downstream history
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
    }

    const versionNumber = this.snapshots.length + 1;
    const snapshot: ProjectSnapshot = {
      id: `snap_${Date.now()}_${versionNumber}`,
      versionNumber,
      name: `${name} v${versionNumber}`,
      timestamp: Date.now(),
      description,
      dataJson: JSON.stringify(stateData),
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxHistory) {
      this.snapshots.shift();
    }
    this.currentIndex = this.snapshots.length - 1;

    return snapshot;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.snapshots.length - 1;
  }

  undo(): any | null {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return JSON.parse(this.snapshots[this.currentIndex].dataJson);
  }

  redo(): any | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return JSON.parse(this.snapshots[this.currentIndex].dataJson);
  }

  restoreSnapshot(versionNumber: number): any | null {
    const idx = this.snapshots.findIndex(s => s.versionNumber === versionNumber);
    if (idx !== -1) {
      this.currentIndex = idx;
      return JSON.parse(this.snapshots[idx].dataJson);
    }
    return null;
  }

  getAllSnapshots(): ProjectSnapshot[] {
    return [...this.snapshots];
  }

  getCurrentSnapshot(): ProjectSnapshot | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.snapshots.length) {
      return this.snapshots[this.currentIndex];
    }
    return null;
  }
}
