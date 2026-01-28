import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default class Output {
  constructor(_options = {}) {
    // Options
    this.container = _options.container;
    this.isMobile = _options.isMobile;

    this.gltfLoader = new GLTFLoader();
    
    this.sizes = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };

    // Mouse movement effect
    this.mouse = { x: 0, y: 0 };
    this.targetCameraOffset = { x: 0, y: 0 };

    this.raycaster = new THREE.Raycaster();
    
    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.setLights();
    
    //this.setDummyObject();
    this.setRoom()
    //this.setOrbitControls();
    
    this.render();
    this.onResize();

    // Event listeners
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('click', this.onClick.bind(this));
  }

  setScene() {
    this.scene = new THREE.Scene();
  }
  setCamera() {
    this.camera = new THREE.PerspectiveCamera(60, this.sizes.width / this.sizes.height, 0.1, 1000);
    this.camera.position.y = 1.5;
    this.camera.position.z = this.isMobile ? 4.5 : 4;
  }
  setRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.container.appendChild(this.renderer.domElement);
  }
  setLights() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);

    // Directional Light
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(1, 1, 1);
    this.scene.add(this.directionalLight);
  }
  setRoom() {
    this.room = new THREE.Group();
    this.gltfLoader.load('/models/projection_v008.gltf', (gltf) => {
      this.room.add(gltf.scene);
    });
    this.scene.add(this.room);
  }
  setDummyObject() {
    this.dummyObject = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    this.scene.add(this.dummyObject);
  }
  setOrbitControls() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  setMouseMovementEffect() {
    // Smoothly interpolate camera position based on mouse
    const factor = 0.05; // smaller = slower, more subtle
    this.targetCameraOffset.x += (this.mouse.x - this.targetCameraOffset.x) * factor;
    this.targetCameraOffset.y += (this.mouse.y - this.targetCameraOffset.y) * factor;

    this.camera.position.x = this.targetCameraOffset.x;
    this.camera.position.y = 1.5 + this.targetCameraOffset.y; // base y + offset

    this.camera.lookAt(0, 1.5, 0); // always look at center of room
  }

  // Listeners: Mouse Movement
  onMouseMove(event) {
    // Normalize mouse position to [-0.5, 0.5]
    this.mouse.x = (event.clientX / window.innerWidth - 0.5);
    this.mouse.y = (event.clientY / window.innerHeight - 0.5);    
  }
  onClick(event) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    if (intersects.length > 0) {
      console.log(intersects[0].object.name);
    }
  }
  // Listeners: Resize
  onResize() {
    this.sizes.width = this.container.clientWidth;
    this.sizes.height = this.container.clientHeight;
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.sizes.width, this.sizes.height);
  }

  // Animations
  render() {
    this.renderer.render(this.scene, this.camera);

    // Mouse movement effect
    this.setMouseMovementEffect();
    
    if (this.orbitControls) this.orbitControls.update();

    requestAnimationFrame(this.render.bind(this));
  }

  // Dispose
  dispose() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('click', this.onClick);

    this.renderer.dispose();
    this.scene.clear();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
  
}