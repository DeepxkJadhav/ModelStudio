/**
 * Model Studio - Reference Image Viewport Overlay (Section 41)
 * Projects reference views directly into the 3D viewport with opacity and camera matching
 */

import * as THREE from 'three';
import { CameraParameters } from '../references/cameraCalibrator';

export class ReferenceOverlayManager {
  private planeMesh: THREE.Mesh | null = null;
  private planeMaterial: THREE.MeshBasicMaterial | null = null;
  private textureLoader = new THREE.TextureLoader();

  attachToScene(scene: THREE.Scene): void {
    if (this.planeMesh) {
      scene.remove(this.planeMesh);
    }

    const geometry = new THREE.PlaneGeometry(1.6, 2.2);
    this.planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.planeMesh = new THREE.Mesh(geometry, this.planeMaterial);
    this.planeMesh.name = 'ReferenceOverlayPlane';
    this.planeMesh.visible = false;
    scene.add(this.planeMesh);
  }

  setOverlayImage(imageDataUri: string | null): void {
    if (!this.planeMaterial) return;

    if (!imageDataUri) {
      if (this.planeMesh) this.planeMesh.visible = false;
      return;
    }

    this.textureLoader.load(imageDataUri, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (this.planeMaterial) {
        this.planeMaterial.map = tex;
        this.planeMaterial.needsUpdate = true;
      }
      if (this.planeMesh) {
        this.planeMesh.visible = true;
      }
    });
  }

  setOpacity(opacity: number): void {
    if (this.planeMaterial) {
      this.planeMaterial.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  alignToCamera(cameraParams: CameraParameters): void {
    if (!this.planeMesh) return;

    // Position overlay plane facing camera target
    const [tx, ty, tz] = cameraParams.target;
    this.planeMesh.position.set(tx, ty, tz - 0.05);
    this.planeMesh.rotation.y = (cameraParams.azimuth * Math.PI) / 180;
  }

  setVisible(visible: boolean): void {
    if (this.planeMesh) {
      this.planeMesh.visible = visible;
    }
  }
}
