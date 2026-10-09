/**
 * Model Studio - Reference Image Viewport Overlay (Section 41)
 * Projects reference views directly into the 3D viewport as a non-intrusive backdrop
 * Positioned behind model geometry to never occlude or be confused with the 3D asset.
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
    this.planeMesh.renderOrder = -1; // Render behind 3D model geometry
    this.planeMesh.position.set(0, 0.9, -1.2); // Positioned safely behind character
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

  /**
   * Dynamically positions and billboards the reference overlay behind the model
   * Prevents the overlay plane from ever being viewed edge-on from side/isometric camera angles.
   */
  updateOverlayPosition(camera: THREE.Camera, target: THREE.Vector3 = new THREE.Vector3(0, 0.9, 0)): void {
    if (!this.planeMesh || !this.planeMesh.visible) return;

    // Billboard: Plane always faces the camera directly
    this.planeMesh.quaternion.copy(camera.quaternion);

    // Position safely behind model along the view direction
    const viewRay = new THREE.Vector3().subVectors(target, camera.position);
    if (viewRay.lengthSq() > 0.001) {
      viewRay.normalize();
      this.planeMesh.position.copy(target).addScaledVector(viewRay, 1.8);
    }
  }

  alignToCamera(cameraParams: CameraParameters): void {
    if (!this.planeMesh) return;

    const [tx, ty, tz] = cameraParams.target;
    const phi = (90 - cameraParams.elevation) * (Math.PI / 180);
    const theta = (cameraParams.azimuth + 90) * (Math.PI / 180);
    const dirX = -Math.sin(phi) * Math.cos(theta);
    const dirY = -Math.cos(phi);
    const dirZ = -Math.sin(phi) * Math.sin(theta);

    this.planeMesh.position.set(tx + dirX * 1.8, ty + dirY * 1.8, tz + dirZ * 1.8);
    this.planeMesh.rotation.y = (cameraParams.azimuth * Math.PI) / 180;
  }

  setVisible(visible: boolean): void {
    if (this.planeMesh) {
      this.planeMesh.visible = visible;
    }
  }
}
