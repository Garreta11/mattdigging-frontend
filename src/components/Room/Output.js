import * as THREE from 'three';

export default class Output {
  constructor(_options = {}) {
    // Options
    this.container = _options.container;
    this.onChestClick = _options.onChestClick || null;
    this.onTrackCoverClick = _options.onTrackCoverClick || null;

    // Config
    this.BASE_VIDEO_URL = "/base.mp4";
    this.CHEST_DIR = "/chest/";
    this.CHEST_PREFIX = "chest_";
    this.CHEST_PAD = 5;
    this.CHEST_COUNT = 60;
    this.CHEST_EXT = ".jpg";
    
    // Chest zone (normalized inside square viewport)
    this.CHEST_ZONE = { x0: 0.2, x1: 0.56, y0: 0, y1: 0.38 };
    this.TRACK_COVER_ZONE = { x0: 0.6, x1: 0.9, y0: 0.5, y1: 0.8 };
    
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
    this.glowTime = 0; // Glow animation clock
    this.chestFrames = new Array(this.CHEST_COUNT).fill(null);
    this.framesLoading = new Set();
    this.chestLoaded = false;
    this.lastTime = performance.now();
    this.interactionsEnabled = true;

    this.bitmapLoader = new THREE.ImageBitmapLoader();
    this.bitmapLoader.setOptions({ imageOrientation: "flipY" });

    this.setRenderer();
    this.setScene();
    this.setCamera();
    this.setupVideo();
    this.setupMaterial();
    // this.setTrackCover();
    // this.setupDebugOverlay();
    this.loadChestFrames();
    
    this.updateViewport();
    this.animate();

    // Event listeners
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onClick = this.onClick.bind(this);

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('click', this.onClick);
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('resize', this.onResize);
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

  // ─── GLOW HALO ────────────────────────────────────────────────────────────
  // Creates (or updates) the animated glow halo mesh positioned behind the cover.
  // The halo is a slightly larger plane rendered with a transparent radial-gradient
  // shader that pulses over time.
  setupGlowHalo() {
    // Shader: soft radial glow with a breathing pulse
    const glowVS = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const glowFS = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor;

      void main() {
        // Distance from center (0.5, 0.5) in UV space
        vec2 centered = vUv - 0.5;
        float dist = length(centered);

        // Breathing pulse: oscillates between 0.6 and 1.0 in intensity
        // float pulse = 0.7 + 0.3 * sin(uTime * 2.0);
        // Breathing pulse: oscillates between 0.25 and 0.5 in intensity
        float pulse = 0.5 * sin(uTime * 2.0);


        // Soft radial falloff — bright core, fades to transparent edge
        // float glow = smoothstep(0.5, 0.1, dist) * pulse;
        float glow = pulse;

        float alpha = clamp(glow, 0.0, 1.0);

        gl_FragColor = vec4(uColor, alpha * 0.65);
      }
    `;

    this.glowMaterial = new THREE.ShaderMaterial({
      vertexShader: glowVS,
      fragmentShader: glowFS,
      uniforms: {
        uTime:  { value: 0.0 },
        uColor: { value: new THREE.Color(0xffc44d) }, // warm amber glow
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Halo plane is slightly larger than the cover (0.45 × 0.45)
    const haloGeo = new THREE.PlaneGeometry(0.45, 0.45);
    this.glowHaloMesh = new THREE.Mesh(haloGeo, this.glowMaterial);

    // Match the cover's position but push it just behind (z = -0.01)
    this.glowHaloMesh.position.set(0.49, 0.32, 0.0);
    this.scene.add(this.glowHaloMesh);
  }

  // Called every frame to advance the glow animation
  updateGlow(dt) {
    if (!this.glowMaterial) return;
    this.glowTime += dt;
    this.glowMaterial.uniforms.uTime.value = this.glowTime / 2.0;
  }
  // ──────────────────────────────────────────────────────────────────────────

  async setTrackCover(config = {}) {
    // If no real content, hide
    if (!config.text && !config.subtitle && !config.backgroundImage) {
      if (this.trackCoverMesh) this.trackCoverMesh.visible = false;
      if (this.glowHaloMesh)   this.glowHaloMesh.visible   = false;
      return;
    }
  
    if (!this.trackCover) {
      this.trackCover = new THREE.PlaneGeometry(0.45, 0.45);
    }
    
    const canvas = await this.generateCoverImage(config);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    this.trackCoverMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true
    });
    
    if (this.trackCoverMesh) {
      if (this.trackCoverMesh.material.map) {
        this.trackCoverMesh.material.map.dispose();
      }
      this.trackCoverMesh.material.dispose();
      this.trackCoverMesh.material = this.trackCoverMaterial;
      this.trackCoverMesh.visible = true;
    } else {
      this.trackCoverMesh = new THREE.Mesh(this.trackCover, this.trackCoverMaterial);
      this.trackCoverMesh.position.set(0.49, 0.32, 0);
      this.scene.add(this.trackCoverMesh);
    }

    // Create / show glow halo whenever cover becomes visible
    if (!this.glowHaloMesh) {
      this.setupGlowHalo();
    } else {
      this.glowHaloMesh.visible = true;
    }
  }

  async generateCoverImage(config) {
    const {
      backgroundImage = null,
      backgroundColor = '#1a1a1a',
    } = config;
  
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
  
    if (backgroundImage) {
      const img = await this.loadImage(backgroundImage);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return canvas;
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
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
    const actualFrame = i * 2;
    return `${this.CHEST_DIR}${this.CHEST_PREFIX}${this.pad(actualFrame, this.CHEST_PAD)}${this.CHEST_EXT}`;
  }

  async loadChestFrames() {
    if (this.isMobile) {
      // On mobile: only load frame 0, no animation
      await this.loadFrame(0);
      this.chestLoaded = true;
      if (this.chestFrames[0]) {
        this.material.uniforms.tChest.value = this.chestFrames[0];
      }
    } else {
      for (let i = 0; i < this.CHEST_COUNT; i++) {
        await this.loadFrame(i);
      }
      this.chestLoaded = true;
      if (this.chestFrames[0]) {
        this.material.uniforms.tChest.value = this.chestFrames[0];
      }
    }
  }

  async loadFrame(index) {
    if (this.chestFrames[index] || this.framesLoading.has(index)) return;
    this.framesLoading.add(index);
    try {
      const bmp = await this.bitmapLoader.loadAsync(this.chestFrameUrl(index));
      const tex = new THREE.Texture(bmp);
      tex.needsUpdate = true;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      this.chestFrames[index] = tex;
    } catch (error) {
      console.error(`[loadFrame] Failed to load frame ${index}:`, error);
    } finally {
      this.framesLoading.delete(index);
    }
  }

  async preloadNearbyFrames(currentIdx, range = 10) {
    if (!this.isMobile) return;
    const start = Math.max(0, currentIdx - range);
    const end = Math.min(this.CHEST_COUNT - 1, currentIdx + range);
    for (let i = start; i <= end; i++) {
      if (!this.chestFrames[i]) this.loadFrame(i);
    }
  }

  findNearestLoadedFrame(targetIdx) {
    for (let distance = 1; distance < this.CHEST_COUNT; distance++) {
      const lower = targetIdx - distance;
      const upper = targetIdx + distance;
      if (lower >= 0 && this.chestFrames[lower]) return lower;
      if (upper < this.CHEST_COUNT && this.chestFrames[upper]) return upper;
    }
    return 0;
  }

  setInteractionsEnabled(enabled) {
    this.interactionsEnabled = enabled;
    if (!enabled) {
      this.mouseSquare.set(-1, -1);
      this.parallaxMouse.set(0, 0);
      document.body.style.cursor = 'auto';
      if (this.chestCtl.state !== "idle") {
        this.chestCtl.state = "release";
        this.chestCtl.target = 0;
      }
    }
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

  updatePointerPosition(clientX, clientY) {
    if (!this.interactionsEnabled) {
      this.mouseSquare.set(-1, -1);
      this.parallaxMouse.set(0, 0);
      return;
    }

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
      if (this.hoveringChest()) event.preventDefault();
    }
  }

  onTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
    }
  }

  onTouchEnd(event) {
    if (!this.interactionsEnabled) {
      this.mouseSquare.set(-1, -1);
      this.parallaxMouse.set(0, 0);
      return;
    }

    if (this.hoveringChest()) {
      this.handleChestClick();
      this.mouseSquare.set(-1, -1);
      this.parallaxMouse.set(0, 0);
      return;
    }

    if (this.hoveringTrackCover()) {
      this.handleTrackCoverClick();
    }
    
    this.mouseSquare.set(-1, -1);
    this.parallaxMouse.set(0, 0);
  }

  onClick(event) {
    if (!this.interactionsEnabled) return;
    this.updatePointerPosition(event.clientX, event.clientY);
    if (this.hoveringChest()) {
      this.handleChestClick();
      return;
    }
    if (this.hoveringTrackCover()) {
      this.handleTrackCoverClick();
    }
  }

  handleChestClick() {
    if (this.onChestClick && typeof this.onChestClick === 'function') {
      this.onChestClick();
    }
  }

  handleTrackCoverClick() {
    if (this.onTrackCoverClick && typeof this.onTrackCoverClick === 'function') {
      this.onTrackCoverClick();
    }
  }

  hoveringChest() {
    if (!this.interactionsEnabled) return false;
    if (this.mouseSquare.x < 0) return false;
    const z = this.CHEST_ZONE;
    return this.mouseSquare.x > z.x0 && this.mouseSquare.x < z.x1 &&
           this.mouseSquare.y > z.y0 && this.mouseSquare.y < z.y1;
  }

  hoveringTrackCover() {
    if (!this.interactionsEnabled) return false;
    if (this.mouseSquare.x < 0) return false;
    const z = this.TRACK_COVER_ZONE;
    return this.mouseSquare.x > z.x0 && this.mouseSquare.x < z.x1 &&
           this.mouseSquare.y > z.y0 && this.mouseSquare.y < z.y1;
  }

  updateChest(dt) {
    if (!this.chestLoaded) return;

    // On mobile: static frame 0, no hover interaction
    if (this.isMobile) {
      if (this.chestFrames[0]) {
        this.material.uniforms.tChest.value = this.chestFrames[0];
      }
      return;
    }


    const hoverChest = this.hoveringChest();
    const hoverCover = this.hoveringTrackCover();

    if (hoverChest || hoverCover) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }

    if (hoverChest && !this.wasHovering) {
      this.chestCtl.state = "pre";
      this.chestCtl.timer = 0;
      if (this.isMobile) {
        this.preloadNearbyFrames(Math.round(this.chestCtl.frame), 10);
      }
    }
    if (!hoverChest && this.wasHovering) {
      this.chestCtl.state = "release";
      this.chestCtl.target = 0;
    }
    this.wasHovering = hoverChest;

    if (this.chestCtl.state === "pre") {
      this.chestCtl.timer += dt;
      const t = Math.min(this.chestCtl.timer / this.HOVER_DELAY, 1.0);
      this.chestCtl.bias = t * this.PARALLAX_PREHOVER_BIAS;

      if (this.chestCtl.timer >= this.HOVER_DELAY) {
        this.chestCtl.state = "active";
        this.chestCtl.target = this.CHEST_COUNT - 1;
        if (this.isMobile) {
          this.preloadNearbyFrames(this.CHEST_COUNT - 1, 15);
        }
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

    if (this.chestFrames[idx]) {
      this.material.uniforms.tChest.value = this.chestFrames[idx];
    } else {
      const fallbackIdx = this.findNearestLoadedFrame(idx);
      if (this.chestFrames[fallbackIdx]) {
        this.material.uniforms.tChest.value = this.chestFrames[fallbackIdx];
      }
      if (this.isMobile) this.loadFrame(idx);
    }
    
    this.material.uniforms.uBias.value = this.chestCtl.bias;
  }

  setupDebugOverlay() {
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
    
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.viewport.x, this.viewport.y, this.viewport.size, this.viewport.size);
    
    const chestZone = this.CHEST_ZONE;
    const chestZoneX = this.viewport.x + chestZone.x0 * this.viewport.size;
    const chestZoneY = this.viewport.y + (1 - chestZone.y1) * this.viewport.size;
    const chestZoneW = (chestZone.x1 - chestZone.x0) * this.viewport.size;
    const chestZoneH = (chestZone.y1 - chestZone.y0) * this.viewport.size;
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(chestZoneX, chestZoneY, chestZoneW, chestZoneH);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.strokeRect(chestZoneX, chestZoneY, chestZoneW, chestZoneH);
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText('CHEST', chestZoneX + 5, chestZoneY + 15);
    
    const coverZone = this.TRACK_COVER_ZONE;
    const coverZoneX = this.viewport.x + coverZone.x0 * this.viewport.size;
    const coverZoneY = this.viewport.y + (1 - coverZone.y1) * this.viewport.size;
    const coverZoneW = (coverZone.x1 - coverZone.x0) * this.viewport.size;
    const coverZoneH = (coverZone.y1 - coverZone.y0) * this.viewport.size;
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(coverZoneX, coverZoneY, coverZoneW, coverZoneH);
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 3;
    ctx.strokeRect(coverZoneX, coverZoneY, coverZoneW, coverZoneH);
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText('COVER', coverZoneX + 5, coverZoneY + 15);
    
    if (this.mouseSquare.x >= 0) {
      const mouseX = this.viewport.x + this.mouseSquare.x * this.viewport.size;
      const mouseY = this.viewport.y + (1 - this.mouseSquare.y) * this.viewport.size;
      
      let cursorColor = 'yellow';
      if (this.hoveringChest()) cursorColor = 'red';
      if (this.hoveringTrackCover()) cursorColor = 'lime';
      
      ctx.fillStyle = cursorColor;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '14px monospace';
      ctx.fillText(`Mouse: (${this.mouseSquare.x.toFixed(3)}, ${this.mouseSquare.y.toFixed(3)})`, 10, 20);
      ctx.fillText(`Hovering Chest: ${this.hoveringChest()}`, 10, 40);
      ctx.fillText(`Hovering Cover: ${this.hoveringTrackCover()}`, 10, 60);
      ctx.fillText(`Frame: ${Math.round(this.chestCtl.frame)}`, 10, 80);
    }
  }
  
  onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === this.lastWidth && h === this.lastHeight) return;
    this.lastWidth = w;
    this.lastHeight = h;
    this.renderer.setSize(w, h);
    this.updateViewport();
    this.updateDebugOverlay();
  }

  setIsMobile(value) {
    this.isMobile = value;
  }

  animate() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.updateChest(dt);
    this.updateGlow(dt);       // ← advance the glow shader clock
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
      this.chestFrames.forEach(tex => {
        if (tex) tex.dispose();
      });
    }

    // Dispose glow halo
    if (this.glowHaloMesh) {
      this.glowHaloMesh.geometry.dispose();
      this.glowMaterial.dispose();
      this.scene.remove(this.glowHaloMesh);
    }

    this.material.dispose();
    this.renderer.dispose();
    this.scene.clear();
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}