/**
 * Model Studio - 3D Viewport Controller (Sections 40, 41, 42, 43, 56)
 * Real interactive 3D WebGL studio scene with orbit controls, lighting, shading modes, skeleton, and physics preview
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ShadingMode,
  MeshLayer,
  MaterialProperties,
  SkeletonDefinition,
  CollisionEnvelope,
  ActionSequence,
  SpeciesCategory,
} from '../core/types';
import { ShadingModeFactory } from './shadingModes';
import { ReferenceOverlayManager } from './referenceOverlay';
import { LocomotionEngine } from '../animation/locomotionEngine';
import { ActionSequencer } from '../animation/actionSequencer';
import { ClothSimulator } from '../simulation/clothSimulator';
import { HairSimulator } from '../simulation/hairSimulator';

export class ViewportController {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private lightsGroup: THREE.Group;
  private modelGroup: THREE.Group;
  private skeletonGroup: THREE.Group;
  private collidersGroup: THREE.Group;
  private gridHelper: THREE.GridHelper;

  private referenceOverlay = new ReferenceOverlayManager();

  private shadingMode: ShadingMode = 'RENDERED_PBR';
  private layers: MeshLayer[] = [];
  private materials: MaterialProperties[] = [];
  private skeleton: SkeletonDefinition | null = null;
  private collisionEnvelopes: CollisionEnvelope[] = [];
  private actionSequence: ActionSequence | null = null;

  private animationTime: number = 0;
  private isPlaying: boolean = true;
  private playbackSpeed: number = 1.0;
  private physicsEnabled: boolean = true;

  private clothSim: ClothSimulator | null = null;
  private hairSim: HairSimulator | null = null;

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Studio Dark Slate

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.3, 3.2);

    // 3. WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0.9, 0);

    // 5. Scene Groups
    this.lightsGroup = new THREE.Group();
    this.modelGroup = new THREE.Group();
    this.skeletonGroup = new THREE.Group();
    this.collidersGroup = new THREE.Group();

    this.scene.add(this.lightsGroup);
    this.scene.add(this.modelGroup);
    this.scene.add(this.skeletonGroup);
    this.scene.add(this.collidersGroup);

    // 6. Ground Studio Grid
    this.gridHelper = new THREE.GridHelper(10, 20, 0x38bdf8, 0x1e293b);
    this.gridHelper.position.y = 0;
    this.scene.add(this.gridHelper);

    // 7. Lighting Setup (Key, Fill, Rim)
    this.setupStudioLighting();

    // 8. Reference Overlay
    this.referenceOverlay.attachToScene(this.scene);

    // 9. Resize Listener
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      });
      this.resizeObserver.observe(this.container);
    }

    // 10. Start Animation Loop
    this.lastTimestamp = performance.now();
    this.animate(this.lastTimestamp);
  }

  private setupStudioLighting(): void {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.6);
    this.lightsGroup.add(ambientLight);

    // Key Light (Directional with shadow)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    this.lightsGroup.add(keyLight);

    // Fill Light (Soft cool tone)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.position.set(-3, 2, 2);
    this.lightsGroup.add(fillLight);

    // Rim / Back Light (Vibrant edge definition)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(0, 3, -3);
    this.lightsGroup.add(rimLight);
  }

  private onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Updates mesh layers, materials, and rebuilds Three.js scene geometry
   */
  updateModel(
    layers: MeshLayer[],
    materials: MaterialProperties[],
    skeleton?: SkeletonDefinition
  ): void {
    this.layers = layers;
    this.materials = materials;
    if (skeleton) this.skeleton = skeleton;

    // Clear old model meshes
    while (this.modelGroup.children.length > 0) {
      const obj = this.modelGroup.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      this.modelGroup.remove(obj);
    }

    layers.forEach(layer => {
      if (!layer.visible) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(layer.vertices), 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(layer.normals), 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(layer.uvs), 2));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(layer.indices), 1));

      const matProps = materials.find(m => m.id === layer.materialId) || materials[0] || {
        id: 'mat_default',
        name: 'Default',
        type: 'PBR',
        baseColor: '#38bdf8',
        roughness: 0.5,
        metallic: 0.1,
        normalScale: 1.0,
        emissive: '#000000',
        opacity: 1.0,
      };

      const mat = ShadingModeFactory.createMaterialForMode(this.shadingMode, matProps);
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.name = layer.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.modelGroup.add(mesh);
    });

    if (this.skeleton) {
      this.rebuildSkeletonHelper(this.skeleton);
    }

    // Initialize simulators for cloth/hair layers
    const clothLayer = layers.find(l => l.type === 'clothing');
    if (clothLayer) {
      this.clothSim = new ClothSimulator(clothLayer.vertices, {
        enabled: true,
        meshLayerId: clothLayer.id,
        stiffness: 0.85,
        bend: 0.4,
        stretch: 0.9,
        damping: 0.15,
        gravity: 9.81,
        friction: 0.2,
        collisionMargin: 0.015,
        wind: [0, 0, 0],
      }, this.collisionEnvelopes);
    }

    const hairLayer = layers.find(l => l.type === 'hair');
    if (hairLayer) {
      this.hairSim = new HairSimulator(hairLayer.vertices, {
        enabled: true,
        meshLayerId: hairLayer.id,
        stiffness: 0.7,
        damping: 0.2,
        gravity: 9.81,
        strandCount: 200,
        collisionMargin: 0.01,
      }, this.collisionEnvelopes);
    }
  }

  private rebuildSkeletonHelper(skeleton: SkeletonDefinition): void {
    while (this.skeletonGroup.children.length > 0) {
      this.skeletonGroup.remove(this.skeletonGroup.children[0]);
    }

    const jointGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const jointMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const linePoints: THREE.Vector3[] = [];
    const bonePosMap = new Map<string, [number, number, number]>();

    skeleton.bones.forEach(b => {
      bonePosMap.set(b.name, b.position);

      const jointMesh = new THREE.Mesh(jointGeo, jointMat);
      jointMesh.position.set(b.position[0], b.position[1], b.position[2]);
      this.skeletonGroup.add(jointMesh);

      if (b.parentName && bonePosMap.has(b.parentName)) {
        const parentPos = bonePosMap.get(b.parentName)!;
        linePoints.push(new THREE.Vector3(parentPos[0], parentPos[1], parentPos[2]));
        linePoints.push(new THREE.Vector3(b.position[0], b.position[1], b.position[2]));
      }
    });

    if (linePoints.length > 0) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, linewidth: 2 });
      const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
      this.skeletonGroup.add(lineMesh);
    }

    this.skeletonGroup.visible = this.shadingMode === 'SKELETON_ONLY' || this.shadingMode === 'XRAY';
  }

  updateCollisionEnvelopes(envelopes: CollisionEnvelope[]): void {
    this.collisionEnvelopes = envelopes;

    while (this.collidersGroup.children.length > 0) {
      this.collidersGroup.remove(this.collidersGroup.children[0]);
    }

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });

    envelopes.forEach(env => {
      let geo: THREE.BufferGeometry;
      if (env.type === 'capsule' && env.height) {
        geo = new THREE.CapsuleGeometry(env.radius, env.height, 4, 8);
      } else {
        geo = new THREE.SphereGeometry(env.radius, 10, 10);
      }

      const mesh = new THREE.Mesh(geo, wireMat);
      mesh.position.set(env.center[0], env.center[1], env.center[2]);
      this.collidersGroup.add(mesh);
    });

    this.collidersGroup.visible = this.shadingMode === 'COLLISION_ENVELOPES';
  }

  setShadingMode(mode: ShadingMode): void {
    this.shadingMode = mode;
    this.updateModel(this.layers, this.materials, this.skeleton || undefined);
    this.skeletonGroup.visible = mode === 'SKELETON_ONLY' || mode === 'XRAY';
    this.collidersGroup.visible = mode === 'COLLISION_ENVELOPES';
  }

  setReferenceOverlay(imageDataUri: string | null, opacity: number = 0.35): void {
    this.referenceOverlay.setOverlayImage(imageDataUri);
    this.referenceOverlay.setOpacity(opacity);
  }

  setReferenceOverlayOpacity(opacity: number): void {
    this.referenceOverlay.setOpacity(opacity);
  }

  setCameraView(azimuth: number, elevation: number, distance: number = 3.0, target: [number, number, number] = [0, 0.9, 0]): void {
    const phi = (90 - elevation) * (Math.PI / 180);
    const theta = (azimuth + 90) * (Math.PI / 180);

    const x = target[0] + distance * Math.sin(phi) * Math.cos(theta);
    const y = target[1] + distance * Math.cos(phi);
    const z = target[2] + distance * Math.sin(phi) * Math.sin(theta);

    this.camera.position.set(x, y, z);
    this.controls.target.set(target[0], target[1], target[2]);
    this.controls.update();
  }

  setActionSequence(sequence: ActionSequence): void {
    this.actionSequence = sequence;
    this.animationTime = 0;
  }

  setPlayback(playing: boolean): void {
    this.isPlaying = playing;
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
  }

  setPhysicsEnabled(enabled: boolean): void {
    this.physicsEnabled = enabled;
  }

  setTime(time: number): void {
    this.animationTime = time;
  }

  getTime(): number {
    return this.animationTime;
  }

  private animate = (now: number): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = now;

    if (this.isPlaying) {
      this.animationTime += dt * this.playbackSpeed;
    }

    // 1. Evaluate Skeletal Motion
    if (this.skeleton && this.actionSequence) {
      const state = ActionSequencer.evaluateSequenceState(this.actionSequence, this.animationTime);
      const pose = LocomotionEngine.evaluatePose(
        this.skeleton.species,
        state.currentStep.action,
        this.animationTime,
        this.skeleton
      );

      // Apply subtle procedural bounce to model group
      if (pose['Hips'] && pose['Hips'].position) {
        this.modelGroup.position.set(
          pose['Hips'].position[0],
          pose['Hips'].position[1] - 0.95,
          pose['Hips'].position[2]
        );
      }
    }

    // 2. Evaluate Physics (Cloth & Hair)
    if (this.physicsEnabled) {
      if (this.clothSim) {
        this.clothSim.step(dt);
        const clothMesh = this.modelGroup.getObjectByName('Clothing') as THREE.Mesh;
        if (clothMesh && clothMesh.geometry) {
          const posAttr = clothMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
          this.clothSim.writePositionsToBuffer(posAttr.array as Float32Array);
          posAttr.needsUpdate = true;
          clothMesh.geometry.computeVertexNormals();
        }
      }

      if (this.hairSim) {
        this.hairSim.step(dt);
        const hairMesh = this.modelGroup.getObjectByName('Hair') as THREE.Mesh;
        if (hairMesh && hairMesh.geometry) {
          const posAttr = hairMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
          this.hairSim.writePositionsToBuffer(posAttr.array as Float32Array);
          posAttr.needsUpdate = true;
          hairMesh.geometry.computeVertexNormals();
        }
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
