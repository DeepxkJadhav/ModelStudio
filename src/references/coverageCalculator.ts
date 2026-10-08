/**
 * Model Studio - Reference Coverage Calculator (Section 7)
 * Calculates reference coverage percentages across anatomical regions and identifies uncertainty
 */

import { ReferenceView, ReferenceCoverageReport, EvidenceStatus } from '../core/types';

export class CoverageCalculator {
  static computeCoverage(views: ReferenceView[]): ReferenceCoverageReport {
    // Map existing active views
    const activeViews = new Map<string, ReferenceView>();
    views.forEach(v => {
      if (v.imageDataUri) {
        activeViews.set(v.type, v);
      }
    });

    const hasFront = activeViews.has('front');
    const hasBack = activeViews.has('back');
    const hasLeft = activeViews.has('left');
    const hasRight = activeViews.has('right');
    const hasFront34 = activeViews.has('front_three_quarter');
    const hasBack34 = activeViews.has('back_three_quarter');
    const hasTop = activeViews.has('top');

    const computeRegion = (
      regionName: string,
      relevantViews: boolean[],
      baseMax: number = 100
    ): { percentage: number; status: EvidenceStatus } => {
      const count = relevantViews.filter(Boolean).length;
      if (count === 0) {
        return { percentage: 15, status: 'UNCERTAIN' };
      }
      const fraction = count / relevantViews.length;
      const percentage = Math.round(Math.min(baseMax, fraction * baseMax + 20));

      let status: EvidenceStatus = 'OBSERVED';
      if (count === 1 && relevantViews.length > 2) {
        status = 'INFERRED';
      } else if (percentage < 60) {
        status = 'UNCERTAIN';
      }
      return { percentage, status };
    };

    const head = computeRegion('Head', [hasFront, hasLeft || hasRight, hasFront34]);
    const torso = computeRegion('Torso', [hasFront, hasBack, hasLeft || hasRight]);
    const arms = computeRegion('Arms', [hasFront, hasLeft || hasRight, hasFront34]);
    const hands = computeRegion('Hands', [hasFront, hasLeft || hasRight, hasFront34], 90);
    const legs = computeRegion('Legs', [hasFront, hasBack, hasLeft || hasRight]);
    const feet = computeRegion('Feet', [hasFront, hasLeft || hasRight], 85);
    const back = computeRegion('Back', [hasBack, hasBack34]);
    const hair = computeRegion('Hair', [hasFront, hasBack, hasTop, hasLeft || hasRight]);
    const clothing = computeRegion('Clothing', [hasFront, hasBack, hasFront34]);
    const appendages = computeRegion('Appendages', [hasFront, hasBack, hasLeft || hasRight]);

    const regions = {
      head,
      torso,
      arms,
      hands,
      legs,
      feet,
      back,
      hair,
      clothing,
      appendages,
    };

    const uncertainAreas: string[] = [];
    Object.entries(regions).forEach(([key, val]) => {
      if (val.percentage < 70 || val.status === 'UNCERTAIN') {
        uncertainAreas.push(key.toUpperCase());
      }
    });

    const values = Object.values(regions).map(r => r.percentage);
    const overallPercentage = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    return {
      overallPercentage,
      regions: {
        head: { region: 'Head', ...head },
        torso: { region: 'Torso', ...torso },
        arms: { region: 'Arms', ...arms },
        hands: { region: 'Hands', ...hands },
        legs: { region: 'Legs', ...legs },
        feet: { region: 'Feet', ...feet },
        back: { region: 'Back', ...back },
        hair: { region: 'Hair', ...hair },
        clothing: { region: 'Clothing', ...clothing },
        appendages: { region: 'Appendages', ...appendages },
      },
      uncertainAreas,
    };
  }
}
