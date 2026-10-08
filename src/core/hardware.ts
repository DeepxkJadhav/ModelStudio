/**
 * Model Studio - Local Compute & Hardware Profiler (Section 52)
 * Detects GPU, WebGL2/WebGPU features, VRAM/RAM estimation, and selects processing tiers
 */

export interface HardwareProfile {
  cpuCores: number;
  gpuVendor: string;
  gpuRenderer: string;
  hasWebGPU: boolean;
  hasWebGL2: boolean;
  estimatedVramMb: number;
  deviceMemoryGb: number;
  recommendedQualityPreset: 'DRAFT' | 'BALANCED' | 'HIGH' | 'ULTRA';
  computeTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export function detectHardwareCapabilities(): HardwareProfile {
  const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const deviceMemoryGb = typeof navigator !== 'undefined' && (navigator as any).deviceMemory ? (navigator as any).deviceMemory : 8;

  let gpuVendor = 'Unknown Vendor';
  let gpuRenderer = 'Standard 3D Graphics';
  let hasWebGL2 = false;
  let estimatedVramMb = 2048;

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        hasWebGL2 = !!canvas.getContext('webgl2');
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || gpuVendor;
          gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
        }

        // Heuristic VRAM estimation based on renderer string
        const lowerRenderer = gpuRenderer.toLowerCase();
        if (lowerRenderer.includes('rtx 40') || lowerRenderer.includes('rtx 3080') || lowerRenderer.includes('rtx 3090') || lowerRenderer.includes('m3 max') || lowerRenderer.includes('m2 ultra')) {
          estimatedVramMb = 12288;
        } else if (lowerRenderer.includes('rtx') || lowerRenderer.includes('rx 6') || lowerRenderer.includes('rx 7') || lowerRenderer.includes('apple m')) {
          estimatedVramMb = 8192;
        } else if (lowerRenderer.includes('gtx') || lowerRenderer.includes('radeon')) {
          estimatedVramMb = 4096;
        } else {
          estimatedVramMb = 2048;
        }
      }
    } catch {
      // Fallback
    }
  }

  const hasWebGPU = typeof navigator !== 'undefined' && !!(navigator as any).gpu;

  let computeTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
  let recommendedQualityPreset: 'DRAFT' | 'BALANCED' | 'HIGH' | 'ULTRA' = 'BALANCED';

  if (estimatedVramMb >= 8192 && cpuCores >= 8) {
    computeTier = 'EXTREME';
    recommendedQualityPreset = 'ULTRA';
  } else if (estimatedVramMb >= 4096 && cpuCores >= 6) {
    computeTier = 'HIGH';
    recommendedQualityPreset = 'HIGH';
  } else if (estimatedVramMb >= 2048) {
    computeTier = 'MEDIUM';
    recommendedQualityPreset = 'BALANCED';
  } else {
    computeTier = 'LOW';
    recommendedQualityPreset = 'DRAFT';
  }

  return {
    cpuCores,
    gpuVendor,
    gpuRenderer,
    hasWebGPU,
    hasWebGL2,
    estimatedVramMb,
    deviceMemoryGb,
    recommendedQualityPreset,
    computeTier,
  };
}
