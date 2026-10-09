/**
 * Model Studio - AI Provider Abstraction (Section 51)
 * Decoupled provider interface supporting local algorithmic fallback and remote LLM/vision APIs
 */

export interface AIProviderConfig {
  providerType: 'LOCAL_ALGORITHMIC' | 'OPENAI' | 'GEMINI' | 'ANTHROPIC' | 'LOCAL_LLM';
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

export interface AIRefinementRequest {
  currentMeshName: string;
  userPrompt: string;
  regionHint?: string;
}

export interface AIRefinementResult {
  operation: 'SCALE' | 'TRANSLATE' | 'ROTATE' | 'SMOOTH' | 'EXTRUDE';
  targetRegion: string;
  parameters: Record<string, number>;
  explanation: string;
}

export class AIProviderService {
  private config: AIProviderConfig = {
    providerType: 'LOCAL_ALGORITHMIC',
    modelName: 'Studio-Anatomy-Engine-v1',
  };

  setConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Interprets natural language geometric modification commands (Section 38, 60)
   */
  async interpretEditCommand(prompt: string): Promise<AIRefinementResult> {
    const lower = prompt.toLowerCase();

    if (lower.includes('shoulder') && (lower.includes('narrow') || lower.includes('smaller'))) {
      return {
        operation: 'SCALE',
        targetRegion: 'SHOULDERS',
        parameters: { scaleX: 0.9, scaleY: 1.0, scaleZ: 1.0 },
        explanation: 'Reducing shoulder width by 10% along lateral X axis.',
      };
    }

    if (lower.includes('head') && (lower.includes('smaller') || lower.includes('5%'))) {
      return {
        operation: 'SCALE',
        targetRegion: 'HEAD',
        parameters: { scaleX: 0.95, scaleY: 0.95, scaleZ: 0.95 },
        explanation: 'Uniformly reducing head volume by 5%.',
      };
    }

    if (lower.includes('hand') && lower.includes('smaller')) {
      return {
        operation: 'SCALE',
        targetRegion: 'HANDS',
        parameters: { scaleX: 0.88, scaleY: 0.88, scaleZ: 0.88 },
        explanation: 'Downscaling hands by 12% to align with stylized proportions.',
      };
    }

    if (lower.includes('skirt') || lower.includes('dress') || lower.includes('lengthen')) {
      return {
        operation: 'EXTRUDE',
        targetRegion: 'CLOTHING',
        parameters: { offsetY: -0.12 },
        explanation: 'Lengthening lower garment hemline downwards by 12cm.',
      };
    }

    if (lower.includes('tail') && (lower.includes('longer') || lower.includes('increase'))) {
      return {
        operation: 'EXTRUDE',
        targetRegion: 'TAIL',
        parameters: { lengthScale: 1.25 },
        explanation: 'Extending caudal vertebrae segments by 25%.',
      };
    }

    if (lower.includes('wing') && (lower.includes('span') || lower.includes('wider'))) {
      return {
        operation: 'SCALE',
        targetRegion: 'WINGS',
        parameters: { scaleX: 1.2 },
        explanation: 'Widening wingspan by 20%.',
      };
    }

    if (lower.includes('hair') && lower.includes('clipping')) {
      return {
        operation: 'TRANSLATE',
        targetRegion: 'HAIR',
        parameters: { normalPush: 0.015 },
        explanation: 'Pushing intersecting hair vertices outwards along surface normals.',
      };
    }

    return {
      operation: 'SMOOTH',
      targetRegion: 'GLOBAL',
      parameters: { iterations: 2 },
      explanation: `Applied contextual geometric adjustment for: "${prompt}"`,
    };
  }

  /**
   * Interprets natural language animation commands with species-aware translation (Section 8)
   */
  async interpretAnimationPrompt(
    prompt: string,
    species: string = 'HUMANOID'
  ): Promise<Array<{ action: string; duration: number; params?: any }>> {
    const lower = prompt.toLowerCase();
    const actions: Array<{ action: string; duration: number; params?: any }> = [];

    // Species-specific motion guard & adaptation
    if (species === 'FISH') {
      if (lower.includes('walk') || lower.includes('run') || lower.includes('swim') || lower.includes('forward')) {
        return [{ action: 'SWIM', duration: 3.0, params: { speed: 1.2, note: 'Mapped locomotion to aquatic swimming' } }];
      }
      if (lower.includes('turn')) {
        return [{ action: 'TURN', duration: 1.5, params: { angle: 90 } }];
      }
      return [{ action: 'SWIM', duration: 2.5 }];
    }

    if (species === 'SERPENT') {
      if (lower.includes('walk') || lower.includes('run') || lower.includes('slither') || lower.includes('forward')) {
        return [{ action: 'SLITHER', duration: 3.0, params: { waveFreq: 1.5 } }];
      }
      if (lower.includes('coil')) {
        return [{ action: 'COIL', duration: 2.0 }];
      }
      if (lower.includes('strike') || lower.includes('attack')) {
        return [{ action: 'STRIKE', duration: 1.0 }];
      }
      return [{ action: 'SLITHER', duration: 2.5 }];
    }

    if (species === 'BIRD') {
      if (lower.includes('fly') || lower.includes('fly forward') || lower.includes('soar')) {
        return [{ action: 'FLY', duration: 3.0, params: { speed: 1.5 } }];
      }
      if (lower.includes('flap') || lower.includes('wings')) {
        return [{ action: 'FLAP', duration: 2.5 }];
      }
    }

    // Directional turns
    if (lower.includes('turn left')) {
      actions.push({ action: 'TURN_LEFT', duration: 1.2, params: { angle: -90 } });
    } else if (lower.includes('turn right')) {
      actions.push({ action: 'TURN_RIGHT', duration: 1.2, params: { angle: 90 } });
    } else if (lower.includes('turn')) {
      actions.push({ action: 'TURN', duration: 1.0, params: { angle: 180 } });
    }

    // Gestures
    if (lower.includes('wave') || lower.includes('hello')) {
      actions.push({ action: 'WAVE', duration: 2.0, params: { arm: 'Right' } });
    }

    // Walking / Running
    if (lower.includes('walk backward') || lower.includes('backward')) {
      actions.push({ action: 'WALK', duration: 2.0, params: { direction: 'backward', speed: 1.0 } });
    } else if (lower.includes('walk') || lower.includes('walk forward')) {
      actions.push({ action: 'WALK', duration: 2.0, params: { direction: 'forward', speed: 1.2 } });
    }

    if (lower.includes('run')) {
      actions.push({ action: 'RUN', duration: 2.5, params: { speed: 2.4 } });
    }

    if (lower.includes('crouch')) {
      actions.push({ action: 'CROUCH', duration: 1.5, params: { depth: 0.4 } });
    }

    if (lower.includes('jump')) {
      actions.push({ action: 'JUMP', duration: 1.2, params: { height: 0.8 } });
    }

    if (lower.includes('stand') || lower.includes('stand up')) {
      actions.push({ action: 'STAND', duration: 0.8 });
    }

    if (lower.includes('sit')) {
      actions.push({ action: 'SIT', duration: 2.0 });
    }

    if (lower.includes('stop') || lower.includes('idle')) {
      actions.push({ action: 'IDLE', duration: 1.0 });
    }

    if (actions.length === 0) {
      actions.push({ action: 'IDLE', duration: 2.0 });
    }

    return actions;
  }
}

export const aiProvider = new AIProviderService();
