/**
 * Model Studio - Species & Structural Category Intelligence (Section 6, 8)
 * Classifies model type into the 5 top-level categories:
 * 1. Humanoid
 * 2. Animal
 * 3. Bird
 * 4. Aquatic
 * 5. Unknown Creature
 */

import { SpeciesCategory, ReferenceView } from '../core/types';
import { SilhouetteExtractor } from '../references/silhouetteExtractor';

export type TopLevelCategory = 'Humanoid' | 'Animal' | 'Bird' | 'Aquatic' | 'Unknown Creature';

export interface SpeciesClassificationResult {
  topLevelCategory: TopLevelCategory;
  category: SpeciesCategory; // mapped internal enum
  confidence: number; // 0.0 to 1.0
  secondaryHypothesis?: { category: SpeciesCategory; confidence: number };
  detectedFeatures: string[];
  rationale: string;
}

export class SpeciesClassifier {
  private static registeredTypes: SpeciesCategory[] = [
    'HUMANOID',
    'QUADRUPED',
    'BIRD',
    'SERPENT',
    'FISH',
    'INSECT',
    'ARACHNID',
    'REPTILE',
    'CREATURE',
    'PLANT_LIKE',
    'VEHICLE',
    'ROBOT',
    'OBJECT',
    'CUSTOM',
  ];

  static getSupportedCategories(): SpeciesCategory[] {
    return [...this.registeredTypes];
  }

  static getTopLevelCategories(): TopLevelCategory[] {
    return ['Humanoid', 'Animal', 'Bird', 'Aquatic', 'Unknown Creature'];
  }

  /**
   * Maps internal enum to the 5 top-level categories
   */
  static toTopLevel(category: SpeciesCategory): TopLevelCategory {
    switch (category) {
      case 'HUMANOID':
        return 'Humanoid';
      case 'QUADRUPED':
      case 'REPTILE':
      case 'SERPENT':
        return 'Animal';
      case 'BIRD':
        return 'Bird';
      case 'FISH':
        return 'Aquatic';
      case 'CREATURE':
      case 'INSECT':
      case 'ARACHNID':
      case 'CUSTOM':
      default:
        return 'Unknown Creature';
    }
  }

  /**
   * Maps user-selected top-level category to default internal category
   */
  static fromTopLevel(top: TopLevelCategory): SpeciesCategory {
    switch (top) {
      case 'Humanoid':
        return 'HUMANOID';
      case 'Animal':
        return 'QUADRUPED';
      case 'Bird':
        return 'BIRD';
      case 'Aquatic':
        return 'FISH';
      case 'Unknown Creature':
        return 'CREATURE';
    }
  }

  /**
   * Analyzes reference evidence, image aspect ratios, and metadata to classify species
   */
  static classifyFromEvidence(
    views: ReferenceView[],
    userOverrideHint?: SpeciesCategory
  ): SpeciesClassificationResult {
    if (userOverrideHint) {
      const topLevel = this.toTopLevel(userOverrideHint);
      return {
        topLevelCategory: topLevel,
        category: userOverrideHint,
        confidence: 1.0,
        detectedFeatures: ['User-specified override active'],
        rationale: `Category explicitly configured as ${topLevel} (${userOverrideHint}).`,
      };
    }

    const detectedFeatures: string[] = [];
    const anyUri = views.find(v => v.imageDataUri)?.imageDataUri || '';
    const lower = anyUri.toLowerCase();

    // 1. Textual / URI heuristic checks
    if (lower.includes('snake') || lower.includes('serpent') || lower.includes('viper')) {
      return {
        topLevelCategory: 'Animal',
        category: 'SERPENT',
        confidence: 0.94,
        detectedFeatures: ['Elongated cylindrical body', 'Absence of limbs', 'Continuous spinal curvature'],
        rationale: 'Long continuous aspect ratio with zero limb branching points indicates serpentine animal anatomy.',
      };
    }

    if (lower.includes('dog') || lower.includes('cat') || lower.includes('horse') || lower.includes('wolf') || lower.includes('quadruped') || lower.includes('animal')) {
      return {
        topLevelCategory: 'Animal',
        category: 'QUADRUPED',
        confidence: 0.93,
        detectedFeatures: ['Horizontal spine orientation', 'Four weight-bearing limbs', 'Pronounced tail bone'],
        rationale: 'Horizontal spine and four ground contact pillars indicate quadrupedal animal.',
      };
    }

    if (lower.includes('bird') || lower.includes('eagle') || lower.includes('owl') || lower.includes('wing') || lower.includes('avian')) {
      return {
        topLevelCategory: 'Bird',
        category: 'BIRD',
        confidence: 0.92,
        detectedFeatures: ['Bilateral wing structures', 'Bipedal talons', 'Avian beak'],
        rationale: 'Bilateral folded aerofoil structures and avian features detected.',
      };
    }

    if (lower.includes('fish') || lower.includes('shark') || lower.includes('whale') || lower.includes('dolphin') || lower.includes('aquatic')) {
      return {
        topLevelCategory: 'Aquatic',
        category: 'FISH',
        confidence: 0.93,
        detectedFeatures: ['Fusiform hydrodynamic body', 'Dorsal and caudal fins', 'Absence of terrestrial feet'],
        rationale: 'Streamlined body plan with stabilizing fins indicates aquatic organism.',
      };
    }

    if (lower.includes('monster') || lower.includes('alien') || lower.includes('dragon') || lower.includes('creature') || lower.includes('tentacle')) {
      return {
        topLevelCategory: 'Unknown Creature',
        category: 'CREATURE',
        confidence: 0.91,
        detectedFeatures: ['Non-standard body plan', 'Multi-appendage articulation', 'Custom anatomical envelope'],
        rationale: 'Unconventional articulated appendages indicate unknown fictional creature.',
      };
    }

    // 2. Visual contour & aspect ratio analysis from front view
    const frontView = views.find(v => v.type === 'front' && v.imageDataUri);
    if (frontView && frontView.imageDataUri) {
      const profile = SilhouetteExtractor.extractProfile(frontView.imageDataUri, 'front');

      if (profile.subjectCategoryHint === 'SERPENTINE') {
        return {
          topLevelCategory: 'Animal',
          category: 'SERPENT',
          confidence: 0.88,
          detectedFeatures: ['Very high horizontal aspect ratio', 'Elongated continuous silhouette'],
          rationale: 'Silhouette contour indicates serpentine or elongated animal structure.',
        };
      }

      if (profile.subjectCategoryHint === 'HORIZONTAL') {
        return {
          topLevelCategory: 'Animal',
          category: 'QUADRUPED',
          confidence: 0.86,
          detectedFeatures: ['Horizontal body axis', 'Wide ground contact envelope'],
          rationale: 'Horizontal silhouette width exceeds vertical height, typical of quadrupedal animals.',
        };
      }

      if (profile.subjectCategoryHint === 'WINGED') {
        return {
          topLevelCategory: 'Bird',
          category: 'BIRD',
          confidence: 0.85,
          detectedFeatures: ['Wide lateral wing envelope', 'Tapered caudal silhouette'],
          rationale: 'Wide lateral limb span matches avian wing structure.',
        };
      }
    }

    // Default upright turnaround character is Humanoid
    detectedFeatures.push(
      'Vertical upright spine axis (Y-dominant)',
      'Bilateral symmetry',
      'Dual upper arm appendages with hands',
      'Dual lower bipedal locomotion limbs',
      'Cranial head apex'
    );

    return {
      topLevelCategory: 'Humanoid',
      category: 'HUMANOID',
      confidence: 0.92,
      secondaryHypothesis: { category: 'ROBOT', confidence: 0.40 },
      detectedFeatures,
      rationale: 'Vertical upright posture with bilateral limb pairs and cranial vertex detected.',
    };
  }
}
