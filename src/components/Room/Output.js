import * as THREE from 'three';

export default class Output {
  constructor(_options = {}) {
    // Options
    this.container = _options.container;
    this.isMobile = _options.isMobile;
    this.onChestClick = _options.onChestClick || null; // Callback for chest clicks

    // Config
    this.BASE_VIDEO_URL = "/base.mp4";
    this.CHEST_DIR = "/chest/";
    this.CHEST_PREFIX = "chest_";
    this.CHEST_PAD = 5;
    this.CHEST_COUNT = 120;
    this.CHEST_EXT = ".jpg";
    
    // Chest zone (normalized inside square viewport)
    this.CHEST_ZONE = { x0: 0.2, x1: 0.56, y0: 0, y1: 0.38 };
    
    // Interaction feel
    this.HOVER_DELAY = 0.10;
    this.OPEN_EASE = 0.035;
    this.CLOSE_EASE = 0.035;
    this.PARALLAX_BASE = 0.02;
    this.PARALLAX_PREHOVER_BIAS = 0.015;

    // State
    this.viewport = { x: 0, y: 0, size: 1 };
    this.mouseSquare = new THREE.Vector2(-1, -1);
    this.parallaxMouse = new THREE.Vector2(0, 0);
    this.chestCtl = { state: "idle", timer: 0, frame: 0, target: 0, bias: 0 };
    this.wasHovering = false;
    this.chestFrames = null;
    this.chestLoaded = false;
    this.lastTime = performance.now();

    this.bitmapLoader = new THREE.ImageBitmapLoader();
    this.bitmapLoader.setOptions({ imageOrientation: "flipY" });

    this.setRenderer();
    this.setScene();
    this.setCamera();
    this.setupVideo();
    this.setupMaterial();
    // this.setupDebugOverlay();
    this.loadChestFrames();
    
    this.updateViewport();
    this.animate();

    // Event listeners
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchstart', this.onTouchStart.bind(this));
    window.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);
  }

  setScene() {
    this.scene = new THREE.Scene();
  }

  setCamera() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  }

  setupVideo() {
    this.baseVideo = document.createElement("video");
    this.baseVideo.src = this.BASE_VIDEO_URL;
    this.baseVideo.muted = true;
    this.baseVideo.loop = true;
    this.baseVideo.playsInline = true;
    this.baseVideo.preload = "auto";

    this.baseTex = new THREE.VideoTexture(this.baseVideo);
    this.baseTex.minFilter = THREE.LinearFilter;
    this.baseTex.magFilter = THREE.LinearFilter;
    this.baseTex.generateMipmaps = false;

    this.tryPlayBase();
    ["pointerdown", "touchstart", "scroll"].forEach(evt => 
      window.addEventListener(evt, () => this.tryPlayBase(), { once: true })
    );
  }

  async tryPlayBase() {
    try {
      await this.baseVideo.play();
    } catch {}
  }

  setupMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tBase: { value: this.baseTex },
        tChest: { value: this.baseTex },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uZone: { value: new THREE.Vector4(
          this.CHEST_ZONE.x0, 
          this.CHEST_ZONE.x1, 
          this.CHEST_ZONE.y0, 
          this.CHEST_ZONE.y1
        )},
        uBias: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { 
          vUv = uv; 
          gl_Position = vec4(position.xy, 0.0, 1.0); 
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;

        uniform sampler2D tBase;
        uniform sampler2D tChest;
        uniform vec2 uMouse;
        uniform vec4 uZone;
        uniform float uBias;

        bool insideZone(vec2 uv) {
          return uv.x > uZone.x && uv.x < uZone.y &&
                 uv.y > uZone.z && uv.y < uZone.w;
        }

        void main() {
          vec2 p = uMouse * (${this.PARALLAX_BASE.toFixed(4)} + uBias);
          vec3 baseCol = texture2D(tBase, vUv + p).rgb;

          if (insideZone(vUv)) {
            vec3 chestCol = texture2D(tChest, vUv + p).rgb;
            gl_FragColor = vec4(chestCol, 1.0);
          } else {
            gl_FragColor = vec4(baseCol, 1.0);
          }
        }
      `
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(mesh);
  }

  pad(num, width) {
    const s = String(num);
    return s.length >= width ? s : "0".repeat(width - s.length) + s;
  }

  chestFrameUrl(i) {
    return `${this.CHEST_DIR}${this.CHEST_PREFIX}${this.pad(i, this.CHEST_PAD)}${this.CHEST_EXT}`;
  }

  async loadChestFrames() {
    const frames = new Array(this.CHEST_COUNT);
    for (let i = 0; i < this.CHEST_COUNT; i++) {
      const bmp = await this.bitmapLoader.loadAsync(this.chestFrameUrl(i));
      const tex = new THREE.Texture(bmp);
      tex.needsUpdate = true;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      frames[i] = tex;
    }
    this.chestFrames = frames;
    this.chestLoaded = true;
    this.material.uniforms.tChest.value = frames[0];
  }

  updateViewport() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const size = Math.min(w, h);
    const x = Math.floor((w - size) / 2);
    const y = Math.floor((h - size) / 2);
    this.viewport = { x, y, size };

    this.renderer.setViewport(x, y, size, size);
    this.renderer.setScissor(x, y, size, size);
    this.renderer.setScissorTest(true);
  }

  // Helper to update mouse/touch position
  updatePointerPosition(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const sx = (clientX - rect.left - this.viewport.x) / this.viewport.size;
    const sy = 1.0 - (clientY - rect.top - this.viewport.y) / this.viewport.size;

    if (sx >= 0 && sx <= 1 && sy >= 0 && sy <= 1) {
      this.mouseSquare.set(sx, sy);
      this.parallaxMouse.set((sx - 0.5) * 2.0, (sy - 0.5) * 2.0);
    } else {
      this.mouseSquare.set(-1, -1);
      this.parallaxMouse.set(0, 0);
    }

    this.updateDebugOverlay();
  }

  onMouseMove(event) {
    this.updatePointerPosition(event.clientX, event.clientY);
  }

  onTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
      // Prevent scrolling while touching the interactive area
      if (this.hoveringChest()) {
        event.preventDefault();
      }
    }
  }

  onTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
    }
  }

  onTouchEnd(event) {
    // Check if chest was tapped
    if (this.hoveringChest()) {
      this.handleChestClick();
    }
    // Reset position after touch ends
    this.mouseSquare.set(-1, -1);
    this.parallaxMouse.set(0, 0);
  }

  onClick(event) {
    this.updatePointerPosition(event.clientX, event.clientY);
    if (this.hoveringChest()) {
      this.handleChestClick();
    }
  }

  handleChestClick() {
    // Call the callback if provided
    if (this.onChestClick && typeof this.onChestClick === 'function') {
      this.onChestClick();
    }

  }

  hoveringChest() {
    if (this.mouseSquare.x < 0) return false;
    const z = this.CHEST_ZONE;
    return this.mouseSquare.x > z.x0 && this.mouseSquare.x < z.x1 &&
           this.mouseSquare.y > z.y0 && this.mouseSquare.y < z.y1;
  }

  updateChest(dt) {
    if (!this.chestLoaded) return;

    const hover = this.hoveringChest();

    // Edge-triggered transitions
    if (hover && !this.wasHovering) {
      this.chestCtl.state = "pre";
      this.chestCtl.timer = 0;
    }
    if (!hover && this.wasHovering) {
      this.chestCtl.state = "release";
      this.chestCtl.target = 0;
    }
    this.wasHovering = hover;

    if (this.chestCtl.state === "pre") {
      this.chestCtl.timer += dt;
      const t = Math.min(this.chestCtl.timer / this.HOVER_DELAY, 1.0);
      this.chestCtl.bias = t * this.PARALLAX_PREHOVER_BIAS;

      if (this.chestCtl.timer >= this.HOVER_DELAY) {
        this.chestCtl.state = "active";
        this.chestCtl.target = this.CHEST_COUNT - 1;
      } else {
        this.chestCtl.target = 2;
      }
    }

    if (this.chestCtl.state === "active") {
      this.chestCtl.bias = this.PARALLAX_PREHOVER_BIAS;
      this.chestCtl.target = this.CHEST_COUNT - 1;
    }

    if (this.chestCtl.state === "release") {
      this.chestCtl.bias *= 0.85;
      this.chestCtl.target = 0;
      if (this.chestCtl.frame < 0.25) this.chestCtl.state = "idle";
    }

    const easing = (this.chestCtl.target > this.chestCtl.frame) 
      ? this.OPEN_EASE 
      : this.CLOSE_EASE;
    this.chestCtl.frame += (this.chestCtl.target - this.chestCtl.frame) * easing;

    this.chestCtl.frame = Math.max(0, Math.min(this.CHEST_COUNT - 1, this.chestCtl.frame));
    const idx = Math.round(this.chestCtl.frame);

    this.material.uniforms.tChest.value = this.chestFrames[idx];
    this.material.uniforms.uBias.value = this.chestCtl.bias;
  }

  setupDebugOverlay() {
    // Create a canvas overlay
    this.debugCanvas = document.createElement('canvas');
    this.debugCanvas.style.position = 'absolute';
    this.debugCanvas.style.top = '0';
    this.debugCanvas.style.left = '0';
    this.debugCanvas.style.pointerEvents = 'none';
    this.debugCanvas.style.zIndex = '1000';
    this.container.appendChild(this.debugCanvas);
    
    this.updateDebugOverlay();
  }

  updateDebugOverlay() {
    if (!this.debugCanvas) return;
    
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.debugCanvas.width = w;
    this.debugCanvas.height = h;
    
    const ctx = this.debugCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    
    // Draw the square viewport
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.viewport.x, this.viewport.y, this.viewport.size, this.viewport.size);
    
    // Draw the chest zone (converted from normalized coords)
    const z = this.CHEST_ZONE;
    const zoneX = this.viewport.x + z.x0 * this.viewport.size;
    const zoneY = this.viewport.y + (1 - z.y1) * this.viewport.size; // Flip Y
    const zoneW = (z.x1 - z.x0) * this.viewport.size;
    const zoneH = (z.y1 - z.y0) * this.viewport.size;
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(zoneX, zoneY, zoneW, zoneH);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.strokeRect(zoneX, zoneY, zoneW, zoneH);
    
    // Draw mouse position if inside viewport
    if (this.mouseSquare.x >= 0) {
      const mouseX = this.viewport.x + this.mouseSquare.x * this.viewport.size;
      const mouseY = this.viewport.y + (1 - this.mouseSquare.y) * this.viewport.size;
      
      ctx.fillStyle = this.hoveringChest() ? 'lime' : 'yellow';
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Show coordinates
      ctx.fillStyle = 'white';
      ctx.font = '14px monospace';
      ctx.fillText(`Mouse: (${this.mouseSquare.x.toFixed(3)}, ${this.mouseSquare.y.toFixed(3)})`, 10, 20);
      ctx.fillText(`Hovering: ${this.hoveringChest()}`, 10, 40);
      ctx.fillText(`Frame: ${Math.round(this.chestCtl.frame)}`, 10, 60);
    }
  }
  
  onResize() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.updateViewport();
    this.updateDebugOverlay();
  }

  animate() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.updateChest(dt);
    this.renderer.render(this.scene, this.camera);

    this.updateDebugOverlay();
    
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  dispose() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onResize);

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.baseVideo) {
      this.baseVideo.pause();
      this.baseVideo.src = '';
    }

    if (this.chestFrames) {
      this.chestFrames.forEach(tex => tex.dispose());
    }

    this.material.dispose();
    this.renderer.dispose();
    this.scene.clear();
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}