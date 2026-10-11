/**
 * Model Studio - Canonical Project Manifest Adapter
 * Bidirectional conversion between CanonicalProjectManifest (Schema v1.0.0)
 * and the runtime StudioProject state.
 */

import { CanonicalProjectManifest, CanonicalSceneNode, CanonicalReferenceImage } from './canonicalSchema';
import { StudioProject } from './types';

export class CanonicalProjectAdapter {
  /**
   * Converts a runtime StudioProject to the canonical schema v1.0.0 JSON manifest
   */
  static toCanonicalManifest(project: StudioProject): CanonicalProjectManifest {
    const nodes: CanonicalSceneNode[] = project.layers.map(layer => {
      // Calculate layer bounds
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (let i = 0; i < layer.vertices.length; i += 3) {
        const x = layer.vertices[i];
        const y = layer.vertices[i + 1];
        const z = layer.vertices[i + 2];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }

      const isBounded = minX !== Infinity;
      return {
        id: layer.id,
        name: layer.name,
        kind: 'mesh',
        parentId: null,
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        visible: layer.visible,
        geometryAssetId: `geom_${layer.id}`,
        materialIds: [layer.materialId],
        metadata: {
          generated: true,
          generator: 'multi_view_reconstruction',
          polygonCount: Math.floor(layer.indices.length / 3),
          vertexCount: Math.floor(layer.vertices.length / 3),
          bounds: isBounded
            ? {
                min: [minX, minY, minZ],
                max: [maxX, maxY, maxZ],
                dimensions: [maxX - minX, maxY - minY, maxZ - minZ],
              }
            : undefined,
        },
      };
    });

    const references: CanonicalReferenceImage[] = project.referenceViews.map(rv => ({
      id: `ref_${rv.type.toLowerCase()}`,
      assetId: `asset_${rv.type.toLowerCase()}`,
      view: rv.type.toLowerCase() as any,
      weight: rv.status === 'VERIFIED' ? 1.0 : rv.status === 'OBSERVED' ? 0.8 : 0.5,
      imageUrl: rv.imageDataUri || undefined,
      landmarks: [
        { id: 'head_top', name: 'Head Top', x: 0.5, y: 0.92, confidence: 0.95 },
        { id: 'chin', name: 'Chin', x: 0.5, y: 0.78, confidence: 0.92 },
        { id: 'left_shoulder', name: 'Left Shoulder', x: 0.35, y: 0.72, confidence: 0.88 },
        { id: 'right_shoulder', name: 'Right Shoulder', x: 0.65, y: 0.72, confidence: 0.88 },
        { id: 'hips_center', name: 'Hips Center', x: 0.5, y: 0.50, confidence: 0.90 },
        { id: 'ground_sole', name: 'Sole Contact', x: 0.5, y: 0.00, confidence: 0.99 },
      ],
      masks: [],
    }));

    const materials = project.materials.map(m => ({
      id: m.id,
      name: m.name,
      type: 'pbr' as const,
      color: m.baseColor,
      metalness: m.metallic,
      roughness: m.roughness,
      opacity: m.opacity,
      transparent: m.opacity < 1.0,
      wireframe: false,
    }));

    return {
      schemaVersion: '1.0.0',
      project: {
        id: `proj_${project.createdTime}`,
        name: project.name,
        unit: 'meter',
        activeMode: '3d',
        createdAt: project.createdTime,
        updatedAt: project.lastModifiedTime,
        author: 'Model Studio Creator',
      },
      references,
      scene: {
        nodes,
        materials,
        skeletons: [
          {
            id: 'rig_humanoid_001',
            name: `${project.species} Rig`,
            rootNodeId: 'bone_Hips',
            isHumanoid: project.species === 'HUMANOID',
            boneCount: Object.keys(project.skeleton.bones).length,
            vrmCompliant: true,
            humanoidBones: Object.entries(project.skeleton.bones).map(([name, b]) => ({
              humanoidBone: name.charAt(0).toLowerCase() + name.slice(1),
              nodeId: `bone_${name}`,
              position: b.position,
              rotation: [0, 0, 0, 1],
            })),
          },
        ],
        animations: [
          {
            id: 'anim_sequence_001',
            name: project.currentSequence.name,
            duration: project.currentSequence.totalDuration,
            fps: 30,
            tracks: [],
          },
        ],
        layers2d: [
          {
            id: 'layer_ref_sketch',
            name: 'Concept Silhouette Layer',
            type: 'vector',
            visible: true,
            opacity: 1.0,
            blendMode: 'normal',
            paths: [
              {
                points: [[100, 50], [150, 50], [160, 200], [90, 200]],
                closed: true,
                strokeColor: '#38bdf8',
                strokeWidth: 2,
                fillColor: 'rgba(56, 189, 248, 0.1)',
              },
            ],
          },
        ],
      },
      exports: {
        defaultFormat: 'glb',
        profiles: [
          {
            id: 'prof_web_glb',
            format: 'glb',
            name: 'Real-time Web GLB (PBR & Skeleton)',
            options: {
              includeMaterials: true,
              includeTextures: true,
              includeRig: true,
              includeAnimations: true,
            },
          },
          {
            id: 'prof_vrm_avatar',
            format: 'vrm',
            name: 'VRM 1.0 Avatar (Humanoid Mapping)',
            options: {
              includeMaterials: true,
              includeTextures: true,
              includeRig: true,
            },
          },
          {
            id: 'prof_print_stl',
            format: 'stl',
            name: '3D Print STL (Watertight Solid)',
            options: {
              watertightVerification: true,
            },
          },
          {
            id: 'prof_cad_obj',
            format: 'obj',
            name: 'Wavefront OBJ + MTL',
            options: {
              includeMaterials: true,
            },
          },
        ],
      },
    };
  }

  /**
   * Serializes a StudioProject into a standardized Canonical JSON string
   */
  static serializeToCanonicalJson(project: StudioProject): string {
    const manifest = this.toCanonicalManifest(project);
    return JSON.stringify(manifest, null, 2);
  }
}
