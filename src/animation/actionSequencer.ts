/**
 * Model Studio - Action Sequencer & State Machine (Section 31)
 * Manages compound multi-action animation chains with crossfade interpolation
 */

import { ActionSequence, ActionStep } from '../core/types';

export class ActionSequencer {
  /**
   * Resolves the active action and normalized local time for a given global playback timestamp
   */
  static evaluateSequenceState(
    sequence: ActionSequence,
    currentTime: number
  ): {
    currentStep: ActionStep;
    localTime: number;
    stepIndex: number;
    progress: number;
  } {
    const steps = sequence.steps;
    if (steps.length === 0) {
      const fallback: ActionStep = { id: 'idle_0', action: 'IDLE', duration: 1.0 };
      return { currentStep: fallback, localTime: 0, stepIndex: 0, progress: 0 };
    }

    const totalDuration = sequence.totalDuration || steps.reduce((sum, s) => sum + s.duration, 0);
    const loopTime = sequence.loop ? currentTime % (totalDuration || 1.0) : Math.min(currentTime, totalDuration);

    let accumulatedTime = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (loopTime >= accumulatedTime && loopTime < accumulatedTime + step.duration) {
        return {
          currentStep: step,
          localTime: loopTime - accumulatedTime,
          stepIndex: i,
          progress: loopTime / (totalDuration || 1.0),
        };
      }
      accumulatedTime += step.duration;
    }

    // End of non-loop sequence: stay on last step
    const lastStep = steps[steps.length - 1];
    return {
      currentStep: lastStep,
      localTime: lastStep.duration,
      stepIndex: steps.length - 1,
      progress: 1.0,
    };
  }

  /**
   * Creates an ActionSequence from a list of action steps
   */
  static buildSequence(name: string, steps: ActionStep[], loop: boolean = true): ActionSequence {
    const totalDuration = steps.reduce((acc, s) => acc + s.duration, 0);
    return {
      name,
      steps,
      totalDuration,
      loop,
    };
  }
}
