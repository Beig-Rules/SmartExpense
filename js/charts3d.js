/**
 * SmartExpense — Three.js 3D charts
 * - Real donut slices via ExtrudeGeometry + bevel (candy look)
 * - OrbitControls (drag / zoom / pan)
 * Loaded as ES module; exposes window.Charts3D
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const Charts3D = (() => {
  const CANDY = [
    0xf472b6, 0x818cf8, 0x34d399, 0xfbbf24, 0x22d3ee,
    0xa78bfa, 0xfb7185, 0x4ade80, 0x38bdf8
  ];

  let pie = null;
  let bar = null;
  let lastPieSig = "";
  let lastBarSig = "";

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
    if (bundle.controls) bundle.controls.dispose();
    bundle.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    if (bundle.renderer) {
      bundle.renderer.dispose();
      const el = bundle.renderer.domElement;
      if (el && el.parentNode) el.parentNode.removeChild(el);
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
    if (renderer.outputColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.borderRadius = "14px";
    renderer.domElement.style.touchAction = "none";
    return renderer;
  }

  function addLights(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(5, 10, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa5b4fc, 0.4);
    fill.position.set(-6, 3, -4);
    scene.add(fill);
    const rim = new THREE.PointLight(0xf472b6, 0.55, 40);
    rim.position.set(-3, 4, 5);
    scene.add(rim);
  }

  function candyMaterial(hex) {
    return new THREE.MeshPhysicalMaterial({
      color: hex,
      metalness: 0.12,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      reflectivity: 0.55,
      emissive: hex,
      emissiveIntensity: 0.06,
      side: THREE.FrontSide
    });
  }

  /**
   * Annular sector (donut slice) as a closed Shape for ExtrudeGeometry.
   */
  function donutSliceShape(innerR, outerR, startAngle, endAngle, segments) {
    const shape = new THREE.Shape();
    const seg = Math.max(8, segments);
    shape.moveTo(Math.cos(startAngle) * outerR, Math.sin(startAngle) * outerR);
    for (let i = 1; i <= seg; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / seg);
      shape.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
    }
    for (let i = seg; i >= 0; i--) {
      const a = startAngle + (endAngle - startAngle) * (i / seg);
      shape.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
    }
    shape.closePath();
    return shape;
  }

  function createDonutSliceMesh(innerR, outerR, startAngle, endAngle, depth, hex) {
    const shape = donutSliceShape(innerR, outerR, startAngle, endAngle, 48);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 4,
      curveSegments: 24
    });
    // Center geometry in Z so rotation looks natural
    geo.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geo, candyMaterial(hex));
    // Slight explode along bisector for candy separation
    const mid = (startAngle + endAngle) / 2;
    const explode = 0.04;
    mesh.position.x = Math.cos(mid) * explode;
    mesh.position.y = Math.sin(mid) * explode;
    return mesh;
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
    const h = Math.max(container.clientHeight || 240, 240);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 2.8, 5.5);
    camera.lookAt(0, 0, 0);
    addLights(scene);

    const group = new THREE.Group();
    // Tilt donut toward camera slightly
    group.rotation.x = -Math.PI / 2.6;
    scene.add(group);

    const innerR = 0.85;
    const outerR = 1.85;
    const depth = 0.62;
    let angle = -Math.PI / 2; // start from top

    values.forEach((val, i) => {
      const slice = (val / total) * Math.PI * 2;
      if (slice < 0.02) {
        angle += slice;
        return;
      }
      const mesh = createDonutSliceMesh(
        innerR,
        outerR,
        angle,
        angle + slice,
        depth,
        CANDY[i % CANDY.length]
      );
      group.add(mesh);
      angle += slice;
    });

    // Soft ground disc under donut
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(outerR * 1.15, 64),
      new THREE.MeshPhysicalMaterial({
        color: isLight() ? 0xc7d2fe : 0x1e1b4b,
        metalness: 0.1,
        roughness: 0.85,
        transparent: true,
        opacity: 0.35
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    const renderer = makeRenderer(container, w, h);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.target.set(0, 0, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    // Pause auto-rotate while user interacts
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });
    let idleTimer = null;
    controls.addEventListener("end", () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        controls.autoRotate = true;
      }, 2500);
    });

    function frame() {
      controls.update();
      renderer.render(scene, camera);
      pie.raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || w;
      const nh = Math.max(container.clientHeight || h, 240);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    pie = { scene, camera, renderer, group, controls, raf: 0, ro, idleTimer };
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
    const h = Math.max(container.clientHeight || 240, 240);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    const maxV = Math.max(...values, 1);
    const n = labels.length;
    const gap = 1.2;
    const span = Math.max(n * gap, 4);
    camera.position.set(span * 0.35, span * 0.55, span * 0.9);
    camera.lookAt(0, 1, 0);
    addLights(scene);

    const group = new THREE.Group();
    scene.add(group);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(span + 3, span * 0.6),
      new THREE.MeshPhysicalMaterial({
        color: isLight() ? 0xe0e7ff : 0x1e293b,
        metalness: 0.15,
        roughness: 0.7,
        transparent: true,
        opacity: 0.45
      })
    );
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    const startX = -((n - 1) * gap) / 2;
    values.forEach((val, i) => {
      const height = Math.max(0.2, (val / maxV) * 2.9);
      // Rounded candy column: cylinder + sphere cap
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, height, 28),
        candyMaterial(CANDY[i % CANDY.length])
      );
      body.position.set(startX + i * gap, height / 2, 0);
      group.add(body);

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 28, 20),
        candyMaterial(CANDY[i % CANDY.length])
      );
      cap.position.set(startX + i * gap, height + 0.02, 0);
      group.add(cap);
    });

    const renderer = makeRenderer(container, w, h);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 16;
    controls.target.set(0, 1, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.9;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });
    let idleTimer = null;
    controls.addEventListener("end", () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        controls.autoRotate = true;
      }, 2500);
    });

    function frame() {
      controls.update();
      renderer.render(scene, camera);
      bar.raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || w;
      const nh = Math.max(container.clientHeight || h, 240);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    bar = { scene, camera, renderer, group, controls, raf: 0, ro, idleTimer };
    bar.raf = requestAnimationFrame(frame);
  }

  function update(expenses) {
    if (!ready()) return false;
    const pieEl = document.getElementById("chart3d-pie");
    const barEl = document.getElementById("chart3d-bar");
    if (!pieEl || !barEl) return false;

    const byCat = {};
    const byMonth = {};
    const list = expenses || [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
      const m = typeof Storage !== "undefined" ? Storage.monthKey(e.date) : String(e.date).slice(0, 7);
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

window.Charts3D = Charts3D;
export default Charts3D;
