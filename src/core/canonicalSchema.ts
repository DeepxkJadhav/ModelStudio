/**
 * Model Studio - Canonical Project Format Schema (v1.0.0)
 * Reference: Section 3 & Section 6 of Universal AI 2D/3D Model Builder Architecture
 * 
 * Provides a canonical, versioned, vendor-independent scene representation
 * that separates editable project manifests from binary geometry, textures,
 * rigs, and animations.
 */

export interface CanonicalProjectManifest {
  schemaVersion: '1.0.0';
  project: {
    id: string;
    name: string;
    unit: 'meter' | 'centimeter' | 'millimeter';
    activeMode: '3d' | '2d';
    createdAt: number;
    updatedAt: number;
    author?: string;
    description?: string;
  };
  references: CanonicalReferenceImage[];
  scene: {
    nodes: CanonicalSceneNode[];
    materials: CanonicalMaterialAsset[];
    skeletons: CanonicalRigAsset[];
    animations: CanonicalAnimationAsset[];
    layers2d: CanonicalLayer2D[];
  };
  exports: {
    defaultFormat: 'glb' | 'vrm' | 'obj' | 'stl' | 'svg' | 'png';
    profiles: CanonicalExportProfile[];
  };
}

export interface CanonicalReferenceImage {
  id: string;
  assetId: string;
  view: 'front' | 'side' | 'back' | 'top' | 'three_quarter' | 'detail';
  weight: number;
  imageUrl?: string;
  landmarks: Array<{
    id: string;
    name: string;
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    confidence: number;
  }>;
  masks: Array<{
    id: string;
    regionName: string;
    polygon: Array<[number, number]>;
    areaRatio: number;
  }>;
  calibration?: {
    cameraDistance: number;
    fov: number;
    orthographicScale: number;
    groundLevelY: number;
  };
}

export interface CanonicalSceneNode {
  id: string;
  name: string;
  kind: 'mesh' | 'group' | 'light' | 'camera' | 'bone' | 'layer2d';
  parentId: string | null;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number]; // Quaternion [x, y, z, w]
    scale: [number, number, number];
  };
  visible: boolean;
  locked?: boolean;
  geometryAssetId?: string;
  materialIds?: string[];
  rigAssetId?: string;
  metadata?: {
    generated?: boolean;
    generator?: 'image-to-3d' | 'multi_view_reconstruction' | 'manual' | 'procedural';
    sourceReferenceIds?: string[];
    polygonCount?: number;
    vertexCount?: number;
    bounds?: {
      min: [number, number, number];
      max: [number, number, number];
      dimensions: [number, number, number]; // width, height, depth
    };
  };
}

export interface CanonicalGeometryAsset {
  id: string;
  name: string;
  vertexCount: number;
  triangleCount: number;
  vertices: Float32Array | number[];
  normals: Float32Array | number[];
  uvs: Float32Array | number[];
  indices: Uint32Array | number[];
  skinIndices?: Float32Array | number[];
  skinWeights?: Float32Array | number[];
  isWatertight?: boolean;
  isManifold?: boolean;
}

export interface CanonicalMaterialAsset {
  id: string;
  name: string;
  type: 'pbr' | 'toon' | 'unlit';
  color: string; // Hex color
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  textureAssetId?: string;
  normalMapAssetId?: string;
  roughnessMapAssetId?: string;
}

export interface CanonicalHumanoidBoneMapping {
  humanoidBone: string; // VRM 1.0 standard bone name
  nodeId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
}

export interface CanonicalRigAsset {
  id: string;
  name: string;
  rootNodeId: string;
  isHumanoid: boolean;
  humanoidBones: CanonicalHumanoidBoneMapping[];
  boneCount: number;
  vrmCompliant: boolean;
}

export interface CanonicalAnimationTrack {
  nodeId: string;
  property: 'position' | 'rotation' | 'scale';
  times: number[];
  values: number[];
  interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
}

export interface CanonicalAnimationAsset {
  id: string;
  name: string;
  duration: number;
  fps: number;
  tracks: CanonicalAnimationTrack[];
}

export interface CanonicalLayer2D {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'mask' | 'sketch';
  visible: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  paths?: Array<{
    points: Array<[number, number]>;
    closed: boolean;
    strokeColor: string;
    strokeWidth: number;
    fillColor?: string;
  }>;
  rasterImageDataUri?: string;
}

export interface CanonicalExportProfile {
  id: string;
  format: 'glb' | 'vrm' | 'obj' | 'stl' | 'svg' | 'png';
  name: string;
  options: {
    includeMaterials?: boolean;
    includeTextures?: boolean;
    includeRig?: boolean;
    includeAnimations?: boolean;
    watertightVerification?: boolean;
    targetPolyCount?: number;
    scaleMultiplier?: number;
  };
}
