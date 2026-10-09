/**
 * Model Studio - Core Type Definitions
 * Professional Creative Studio Architecture
 */

export type SpeciesCategory =
  | 'HUMANOID'
  | 'QUADRUPED'
  | 'BIRD'
  | 'SERPENT'
  | 'FISH'
  | 'INSECT'
  | 'ARACHNID'
  | 'REPTILE'
  | 'CREATURE'
  | 'PLANT_LIKE'
  | 'VEHICLE'
  | 'ROBOT'
  | 'OBJECT'
  | 'CUSTOM';

export type EntityNature = 'BIOLOGICAL' | 'MECHANICAL' | 'HYBRID' | 'INORGANIC';

export type BodyPlanForm =
  | 'HUMANOID_BIPED'
  | 'QUADRUPED'
  | 'HEXAPOD'
  | 'OCTOPOD'
  | 'AVIAN'
  | 'SERPENTINE'
  | 'AQUATIC'
  | 'MULTI_LIMB_CREATURE'
  | 'MECHANICAL_ROBOTIC'
  | 'OBJECT_RIGID'
  | 'CUSTOM_UNKNOWN';

export type LocomotionType =
  | 'BIPEDAL_GAIT'
  | 'QUADRUPEDAL_GAIT'
  | 'SERPENTINE_SLITHER'
  | 'AVIAN_FLIGHT'
  | 'AQUATIC_SWIM'
  | 'HEXAPOD_TRIPOD_GAIT'
  | 'OCTOPOD_CRAWL'
  | 'MECHANICAL_WHEELED'
  | 'HOVERING'
  | 'STATIC';

export type DeformationStrategy =
  | 'DUAL_QUATERNION_LBS'
  | 'LINEAR_BLEND_SKINNING'
  | 'SPLINE_CURVE_DEFORM'
  | 'TENTACLE_SPRING_DEFORM'
  | 'RIGID_SEGMENTED';

export type PhysicsStrategy =
  | 'VERLET_CLOTH_HAIR'
  | 'INERTIAL_STRANDS'
  | 'SECONDARY_APPENDAGE_JIGGLE'
  | 'RIGID_BODY_COLLIDERS'
  | 'NONE';

export type StudioWorkflowMode = 'MODEL' | 'RIG' | 'ANIMATE' | 'MATERIALS' | 'PHYSICS';

export interface ArticulatedStructureItem {
  id: string;
  name: string;
  type: string;
  jointType: 'HINGE' | 'BALL_AND_SOCKET' | 'PLANAR' | 'SLIDING' | 'SPLINE';
  position: [number, number, number];
  size: [number, number, number];
  confidence: number;
  evidence: EvidenceStatus;
}

export interface AutomaticUnderstandingReport {
  timestamp: number;
  entityNature: EntityNature;
  entityNatureConfidence: number; // 0-100
  bodyPlanForm: BodyPlanForm;
  bodyPlanConfidence: number; // 0-100
  speciesCategory: SpeciesCategory;
  speciesConfidence: number; // 0-100

  // Multi-view consensus summary
  analyzedViewsCount: number;
  viewConsensusDetails: {
    frontObservations?: string[];
    backObservations?: string[];
    sideObservations?: string[];
    topObservations?: string[];
    threeQuarterObservations?: string[];
  };

  // Anatomical breakdown
  anatomy: {
    spineOrientation: 'VERTICAL_Y' | 'HORIZONTAL_Z' | 'CURVED_SERPENTINE' | 'RADIAL';
    spineSegments: number;
    limbCount: number;
    weightBearingLegs: number;
    manipulatorArms: number;
    wingsCount: number;
    finsCount: number;
    tentaclesCount: number;
    headPresent: boolean;
    headType?: string;
    tailPresent: boolean;
    tailSegments?: number;
    fingerCountPerHand: number;
    symmetry: 'YZ_BILATERAL' | 'XZ_SYMMETRICAL' | 'RADIAL' | 'ASYMMETRICAL';
    articulatedStructures: ArticulatedStructureItem[];
  };
  anatomyConfidence: number; // 0-100

  // Skeleton Rig selection or custom synthesis
  rigArchitecture: {
    name: string;
    isCustomProcedural: boolean;
    totalBones: number;
    ikChainsCount: number;
    boneHierarchySummary: string;
    jointLimitsConfigured: boolean;
  };
  skeletonConfidence: number; // 0-100

  // Locomotion
  locomotion: {
    type: LocomotionType;
    label: string;
    gaitParameters: Record<string, any>;
    footHandIKEnabled: boolean;
  };
  locomotionConfidence: number; // 0-100

  // Deformation & Physics
  deformationStrategy: DeformationStrategy;
  deformationConfidence: number; // 0-100
  physicsStrategy: PhysicsStrategy;
  physicsConfidence: number; // 0-100

  // Overall explanation
  rationaleChain: string[];
  userAccepted: boolean;
  userOverridden: boolean;
  userOverrideTimestamp?: number;
}

export type ReferenceViewType =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'front_three_quarter'
  | 'back_three_quarter'
  | 'face_closeup'
  | 'detail'
  | 'custom';

export type EvidenceStatus = 'OBSERVED' | 'VERIFIED' | 'AI_GENERATED' | 'INFERRED' | 'UNCERTAIN';

export interface ReferenceView {
  id: string;
  type: ReferenceViewType;
  label: string;
  imageDataUri: string | null;
  status: EvidenceStatus;
  cameraEstimate: {
    azimuth: number; // degrees
    elevation: number; // degrees
    fov: number; // degrees
    distance: number;
    isOrthographic: boolean;
  };
  uncertaintyScore: number; // 0.0 to 1.0 (0 = highly confident/observed, 1.0 = uncertain)
}

export interface RegionCoverage {
  region: string;
  percentage: number;
  status: EvidenceStatus;
}

export interface ReferenceCoverageReport {
  overallPercentage: number;
  regions: {
    head: RegionCoverage;
    torso: RegionCoverage;
    arms: RegionCoverage;
    hands: RegionCoverage;
    legs: RegionCoverage;
    feet: RegionCoverage;
    back: RegionCoverage;
    hair: RegionCoverage;
    clothing: RegionCoverage;
    appendages: RegionCoverage;
  };
  uncertainAreas: string[];
}

export interface AnatomicalFeature {
  name: string;
  type:
    | 'head'
    | 'torso'
    | 'spine'
    | 'pelvis'
    | 'limb'
    | 'joint'
    | 'finger'
    | 'toe'
    | 'wing'
    | 'fin'
    | 'tail'
    | 'tentacle'
    | 'jaw'
    | 'eye'
    | 'ear'
    | 'horn'
    | 'custom';
  position: [number, number, number];
  size: [number, number, number];
  subFeatures?: AnatomicalFeature[];
  confidence: number;
}

export interface AnatomicalAnalysis {
  species: SpeciesCategory;
  customCategoryName?: string;
  symmetryPlane: 'YZ' | 'XZ' | 'XY' | 'NONE';
  features: AnatomicalFeature[];
  limbCount: number;
  hasTail: boolean;
  hasWings: boolean;
  hasFins: boolean;
  fingerCountPerHand: number;
  confidenceScore: number; // 0-100
}

export interface BoneDefinition {
  name: string;
  parentName: string | null;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion (x,y,z,w)
  length: number;
  role?: string; // e.g. 'hips', 'spine', 'leftUpperArm', 'leftHandIndex1', etc.
}

export interface SkeletonDefinition {
  species: SpeciesCategory;
  rootBoneName: string;
  bones: BoneDefinition[];
}

export interface IKTarget {
  chainName: string;
  effectorBoneName: string;
  targetPosition: [number, number, number];
  poleVector?: [number, number, number];
  weight: number; // 0 = full FK, 1 = full IK
  maxIterations: number;
  tolerance: number;
}

export interface MaterialProperties {
  id: string;
  name: string;
  type: 'PBR' | 'STYLIZED_ANIME';
  baseColor: string; // hex
  roughness: number;
  metallic: number;
  normalScale: number;
  emissive: string;
  opacity: number;
  subsurface?: number;
  celBands?: number;
  rimLightIntensity?: number;
  outlineWidth?: number;
  outlineColor?: string;
  textureUri?: string;
}

export interface MeshLayer {
  id: string;
  name: string;
  type: 'body' | 'clothing' | 'hair' | 'accessory' | 'eyes';
  visible: boolean;
  wireframe: boolean;
  materialId: string;
  vertexCount: number;
  triangleCount: number;
  // Raw geometry arrays for serialization / export
  vertices: Float32Array | number[];
  normals: Float32Array | number[];
  uvs: Float32Array | number[];
  indices: Uint32Array | number[];
  skinIndices?: Float32Array | number[];
  skinWeights?: Float32Array | number[];
  morphTargets?: { [name: string]: Float32Array | number[] };
}

export interface ClothSimulationParams {
  enabled: boolean;
  meshLayerId: string;
  stiffness: number; // 0.0 to 1.0
  bend: number;
  stretch: number;
  damping: number;
  gravity: number;
  friction: number;
  collisionMargin: number;
  wind: [number, number, number];
}

export interface HairSimulationParams {
  enabled: boolean;
  meshLayerId: string;
  stiffness: number;
  damping: number;
  gravity: number;
  strandCount: number;
  collisionMargin: number;
}

export interface CollisionEnvelope {
  name: string;
  type: 'sphere' | 'capsule' | 'box';
  boneAttachment: string;
  center: [number, number, number];
  radius: number;
  height?: number;
}

export interface ActionStep {
  id: string;
  action:
    | 'IDLE'
    | 'WALK'
    | 'RUN'
    | 'JUMP'
    | 'CROUCH'
    | 'STAND'
    | 'TURN'
    | 'SIT'
    | 'SLITHER'
    | 'COIL'
    | 'UNCOIL'
    | 'STRIKE'
    | 'FLAP'
    | 'FLY'
    | 'SWIM'
    | 'GESTURE'
    | 'EXPRESSION'
    | 'CUSTOM';
  duration: number; // seconds
  parameters?: Record<string, any>;
  transitionDuration?: number; // blend time
}

export interface ActionSequence {
  name: string;
  steps: ActionStep[];
  totalDuration: number;
  loop: boolean;
}

export interface QualityMetrics {
  geometry: number;      // 0-100
  topology: number;      // 0-100
  uv: number;            // 0-100
  materials: number;     // 0-100
  rig: number;           // 0-100
  deformation: number;   // 0-100
  animation: number;     // 0-100
  physics: number;       // 0-100
  consistency: number;   // 0-100
  overall: number;       // 0-100
  diagnostics: {
    nonManifoldEdges: number;
    holes: number;
    degenerateFaces: number;
    uvOverlapRatio: number;
    maxSkinWeightError: number;
    clippingVertexCount: number;
    referenceDiscrepancy: number;
  };
}

export interface ErrorMapRegion {
  region: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  deviationMeters: number;
  affectedVertexCount: number;
}

export type ShadingMode =
  | 'WIREFRAME'
  | 'SOLID'
  | 'MATERIAL_PREVIEW'
  | 'RENDERED_PBR'
  | 'CEL_SHADING'
  | 'XRAY'
  | 'SKELETON_ONLY'
  | 'COLLISION_ENVELOPES'
  | 'CLOTH_PHYSICS'
  | 'ERROR_HEATMAP';

export type QualityPreset = 'DRAFT' | 'BALANCED' | 'HIGH' | 'ULTRA';

export interface BackgroundJob {
  id: string;
  name: string;
  category:
    | 'REFERENCE_ANALYSIS'
    | 'RECONSTRUCTION'
    | 'TOPOLOGY'
    | 'RIGGING'
    | 'TEXTURE_GENERATION'
    | 'MOTION_GENERATION'
    | 'SIMULATION'
    | 'VALIDATION'
    | 'EXPORT';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number; // 0-100
  detail: string;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface ProjectSnapshot {
  id: string;
  versionNumber: number;
  name: string;
  timestamp: number;
  description: string;
  dataJson: string; // Serialized state
}

export interface StudioProject {
  formatVersion: '1.0.0';
  name: string;
  createdTime: number;
  lastModifiedTime: number;
  species: SpeciesCategory;
  qualityPreset: QualityPreset;
  referenceViews: ReferenceView[];
  coverageReport: ReferenceCoverageReport;
  anatomicalAnalysis: AnatomicalAnalysis;
  skeleton: SkeletonDefinition;
  layers: MeshLayer[];
  materials: MaterialProperties[];
  clothParams: ClothSimulationParams[];
  hairParams: HairSimulationParams[];
  collisionEnvelopes: CollisionEnvelope[];
  currentSequence: ActionSequence;
  qualityMetrics: QualityMetrics;
  historySnapshots: ProjectSnapshot[];
  currentVersion: number;
  automaticUnderstanding?: AutomaticUnderstandingReport;
}
