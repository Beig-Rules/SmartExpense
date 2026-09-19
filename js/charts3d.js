/**
 * SmartExpense — Three.js candy 3D charts
 * Donut + extruded bars. Falls back silently if WebGL unavailable.
 */
const Charts3D = (() => {
  const CANDY = [
    0xf472b6, 0x818cf8, 0x34d399, 0xfbbf24, 0x22d3ee,
    0xa78bfa, 0xfb7185, 0x4ade80, 0x38bdf8
  ];

  let pie = null;
  let bar = null;
  let lastPieSig = "";
  let lastBarSig = "";
  let rafPie = 0;
  let rafBar = 0;

  function ready() {
    return typeof THREE !== "undefined";
  }

  function isLight() {
    return document.documentElement.getAttribute("data-theme") === "light";
  }

  function bgColor() {
    return isLight() ? 0xf0f4ff : 0x0c1222;
  }

  function disposeScene(bundle) {
    if (!bundle) return;
    cancelAnimationFrame(bundle.raf);
    if (bundle.ro) bundle.ro.disconnect();
    bundle.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    if (bundle.renderer) {
      bundle.renderer.dispose();
      if (bundle.renderer.domElement && bundle.renderer.domElement.parentNode) {
        bundle.renderer.domElement.parentNode.removeChild(bundle.renderer.domElement);
      }
    }
  }

  function makeRenderer(container, width, height) {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.borderRadius = "14px";
    return renderer;
  }

  function addLights(scene) {
    const amb = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(4, 8, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa5b4fc, 0.35);
    fill.position.set(-5, 2, -3);
    scene.add(fill);
    const rim = new THREE.PointLight(0xf472b6, 0.45, 30);
    rim.position.set(-2, 3, 4);
    scene.add(rim);
  }

  function candyMaterial(hex) {
    return new THREE.MeshPhysicalMaterial({
      color: hex,
      metalness: 0.15,
      roughness: 0.25,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      reflectivity: 0.6,
      emissive: hex,
      emissiveIntensity: 0.08
    });
  }

  function buildPie(container, byCat) {
    disposeScene(pie);
    const labels = Object.keys(byCat);
    const values = Object.values(byCat);
    const total = values.reduce((a, b) => a + b, 0);
    if (!total || !labels.length) {
      container.innerHTML = '<p class="chart-empty">داده‌ای برای نمودار نیست</p>';
      pie = null;
      return;
    }

    const w = container.clientWidth || 320;
    const h = Math.max(container.clientHeight || 240, 220);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 3.2, 5.2);
    camera.lookAt(0, 0, 0);
    addLights(scene);

    const group = new THREE.Group();
    scene.add(group);

    const innerR = 0.75;
    const outerR = 1.65;
    const depth = 0.55;
    let angle = 0;

    values.forEach((val, i) => {
      const slice = (val / total) * Math.PI * 2;
      if (slice <= 0.001) return;
      const geo = new THREE.CylinderGeometry(
        outerR, outerR, depth, 48, 1, false, angle, slice
      );
      // Hollow-ish look: subtract inner by using ring-like scale is hard;
      // use Extrude-like via Lathe alternative — simpler: torus sector via shape
      geo.translate(0, 0, 0);
      const mat = candyMaterial(CANDY[i % CANDY.length]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      // Pull slice slightly outward for candy separation
      const mid = angle + slice / 2;
      mesh.position.x = Math.cos(mid) * 0.06;
      mesh.position.z = Math.sin(mid) * 0.06;
      group.add(mesh);

      // Inner dark hole cylinder
      angle += slice;
    });

    // Center plug for donut feel
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(innerR, innerR, depth + 0.02, 32),
      new THREE.MeshPhysicalMaterial({
        color: bgColor(),
        metalness: 0.05,
        roughness: 0.9,
        transparent: true,
        opacity: 0.92
      })
    );
    hole.rotation.x = Math.PI / 2;
    group.add(hole);

    // Gloss floor ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(innerR * 0.95, outerR * 1.08, 64),
      new THREE.MeshBasicMaterial({
        color: isLight() ? 0xc7d2fe : 0x1e1b4b,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -depth / 2 - 0.02;
    group.add(ring);

    const renderer = makeRenderer(container, w, h);
    let t0 = performance.now();

    function frame(now) {
      const t = (now - t0) / 1000;
      group.rotation.y = t * 0.35;
      group.rotation.x = Math.sin(t * 0.5) * 0.12;
      renderer.render(scene, camera);
      pie.raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || w;
      const nh = Math.max(container.clientHeight || h, 220);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    pie = { scene, camera, renderer, group, raf: 0, ro };
    pie.raf = requestAnimationFrame(frame);
  }

  function buildBars(container, byMonth) {
    disposeScene(bar);
    const labels = Object.keys(byMonth).sort();
    const values = labels.map((k) => byMonth[k]);
    if (!labels.length) {
      container.innerHTML = '<p class="chart-empty">داده‌ای برای نمودار نیست</p>';
      bar = null;
      return;
    }

    const w = container.clientWidth || 320;
    const h = Math.max(container.clientHeight || 240, 220);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    const maxV = Math.max(...values, 1);
    const n = labels.length;
    const span = Math.max(n * 1.1, 4);
    camera.position.set(span * 0.15, span * 0.55, span * 0.85);
    camera.lookAt(0, maxV > 0 ? 0.8 : 0, 0);
    addLights(scene);

    const group = new THREE.Group();
    scene.add(group);

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(span + 2, span * 0.5),
      new THREE.MeshPhysicalMaterial({
        color: isLight() ? 0xe0e7ff : 0x1e293b,
        metalness: 0.2,
        roughness: 0.6,
        transparent: true,
        opacity: 0.5
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    group.add(ground);

    const gap = 1.15;
    const startX = -((n - 1) * gap) / 2;

    values.forEach((val, i) => {
      const height = Math.max(0.15, (val / maxV) * 2.8);
      const geo = new THREE.BoxGeometry(0.7, height, 0.7);
      geo.translate(0, height / 2, 0);
      const mat = candyMaterial(CANDY[i % CANDY.length]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = startX + i * gap;
      // rounded candy feel via slight scale pulse base
      mesh.scale.set(1, 1, 1);
      group.add(mesh);

      // Cap sphere for candy top
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 24, 16),
        candyMaterial(CANDY[i % CANDY.length])
      );
      cap.position.set(startX + i * gap, height + 0.05, 0);
      group.add(cap);
    });

    const renderer = makeRenderer(container, w, h);
    let t0 = performance.now();

    function frame(now) {
      const t = (now - t0) / 1000;
      group.rotation.y = Math.sin(t * 0.4) * 0.25;
      renderer.render(scene, camera);
      bar.raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || w;
      const nh = Math.max(container.clientHeight || h, 220);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    bar = { scene, camera, renderer, group, raf: 0, ro };
    bar.raf = requestAnimationFrame(frame);
  }

  function update(expenses) {
    if (!ready()) return false;

    const pieEl = document.getElementById("chart3d-pie");
    const barEl = document.getElementById("chart3d-bar");
    if (!pieEl || !barEl) return false;

    const byCat = {};
    const byMonth = {};
    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
      const m = Storage.monthKey(e.date);
      byMonth[m] = (byMonth[m] || 0) + e.amount;
    }

    const pieSig = JSON.stringify(byCat) + isLight();
    const barSig = JSON.stringify(byMonth) + isLight();

    if (pieSig !== lastPieSig) {
      lastPieSig = pieSig;
      buildPie(pieEl, byCat);
    }
    if (barSig !== lastBarSig) {
      lastBarSig = barSig;
      buildBars(barEl, byMonth);
    }
    return true;
  }

  function refreshTheme() {
    lastPieSig = "";
    lastBarSig = "";
  }

  function destroy() {
    disposeScene(pie);
    disposeScene(bar);
    pie = bar = null;
    lastPieSig = lastBarSig = "";
  }

  return { update, refreshTheme, destroy, ready };
})();
