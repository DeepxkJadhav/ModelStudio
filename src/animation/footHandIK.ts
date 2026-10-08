/**
 * Model Studio - Foot IK & Hand IK Solvers (Sections 33, 34)
 * Ground adaptation for feet and target reaching for hands
 */

import { IKFKSolver } from '../rigging/ikFkSolver';

export class FootHandIKEngine {
  /**
   * Adjusts foot position to snap cleanly to ground height (Y = 0 or obstacle height)
   */
  static solveFootGroundAdaptation(
    hipPos: [number, number, number],
    desiredFootPos: [number, number, number],
    upperLegLen: number = 0.4,
    lowerLegLen: number = 0.38,
    groundHeight: number = 0.0
  ): { footPosition: [number, number, number]; kneePosition: [number, number, number] } {
    const footY = Math.max(groundHeight, desiredFootPos[1]);
    const adjustedFoot: [number, number, number] = [desiredFootPos[0], footY, desiredFootPos[2]];

    const ikResult = IKFKSolver.solveTwoBoneIK(
      hipPos,
      adjustedFoot,
      upperLegLen,
      lowerLegLen,
      [0, 0, 1] // forward knee pole
    );

    return {
      footPosition: adjustedFoot,
      kneePosition: ikResult.jointPosition,
    };
  }

  /**
   * Solves hand reaching toward an interactive target position
   */
  static solveHandTargetReach(
    shoulderPos: [number, number, number],
    targetObjectPos: [number, number, number],
    upperArmLen: number = 0.22,
    forearmLen: number = 0.2
  ): { handPosition: [number, number, number]; elbowPosition: [number, number, number]; reached: boolean } {
    const ikResult = IKFKSolver.solveTwoBoneIK(
      shoulderPos,
      targetObjectPos,
      upperArmLen,
      forearmLen,
      [0, -1, 0.5]
    );

    return {
      handPosition: targetObjectPos,
      elbowPosition: ikResult.jointPosition,
      reached: ikResult.reached,
    };
  }
}
