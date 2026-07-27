import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Interactive 3D Ethiopian Orthodox processional cross — realistic gold,
 * Three.js + GSAP. Drag to rotate (with inertia), wheel/pinch to zoom,
 * double-tap/click to reset. Renders on a transparent canvas.
 *
 * The same scene ships inside the Flutter app (assets/cross3d/index.html);
 * keep the two in sync when changing the model.
 */
export const OrthodoxCross3D: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0, 5.9);

    // ---------- studio environment (procedural "room" for gold reflections) ----------
    const buildEnvScene = () => {
      const env = new THREE.Scene();
      env.background = new THREE.Color(0x101418);
      const panel = (
        w: number, h: number, color: number, intensity: number,
        x: number, y: number, z: number, rx = 0, ry = 0,
      ) => {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) }),
        );
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, 0);
        env.add(m);
      };
      panel(6, 4, 0xfff1d8, 9, -5, 5, 4, -0.5, 0.8);        // warm key softbox
      panel(5, 6, 0xcfe0ff, 2.2, 6, 0.5, 2, 0, -1.0);       // cool fill
      panel(8, 1.6, 0xffffff, 6, 0, 3.5, -6, 0.3, 0);       // rim strip
      panel(12, 12, 0x8a6a3a, 0.55, 0, -6, 0, Math.PI / 2, 0); // warm floor bounce
      panel(12, 12, 0x30343c, 1.2, 0, 7, 0, -Math.PI / 2, 0);  // dim ceiling
      panel(9, 7, 0xffdfae, 2.15, 0, 0.5, 8, 0, Math.PI);   // warm front fill
      return env;
    };
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(buildEnvScene(), 0.08).texture;

    const keyLight = new THREE.DirectionalLight(0xfff0d5, 1.6);
    keyLight.position.set(-3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xbfd4ff, 0.9);
    rimLight.position.set(3, -1, -4);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0x554433, 0.5));

    // ---------- materials ----------
    const gold = (roughness: number) =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffc35c, metalness: 1.0, roughness, envMapIntensity: 1.25, reflectivity: 1.0,
      });
    const matPlate = gold(0.3);
    const matBand = gold(0.24);
    const matDetail = gold(0.2);
    const matShaft = gold(0.34);

    // ---------- geometry helpers ----------
    const Z_DEPTH = 0.09;
    const extrude = (shape: THREE.Shape, depth: number, bevel: number) => {
      const g = new THREE.ExtrudeGeometry(shape, {
        depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
        bevelSegments: 3, curveSegments: 24,
      });
      g.center();
      return g;
    };
    const rot = (p: number[], a: number): [number, number] => {
      const c = Math.cos(a), s = Math.sin(a);
      return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
    };

    // ---------- cross head: flared 4-arm plate with pierced lattice ----------
    const buildHeadShape = () => {
      const shape = new THREE.Shape();
      // one arm outline (up), 4-fold symmetric; entries: [x, y] or [x, y, 'q', cx, cy]
      const armPoints = (): (number | string)[][] => [
        [0.17, 0.17],
        [0.155, 0.5, 'q', 0.13, 0.34],
        [0.44, 0.9, 'q', 0.19, 0.72],
        [0.4, 0.99, 'q', 0.46, 0.96],
        [0.24, 0.96, 'q', 0.32, 1.0],
        [0.09, 1.05, 'q', 0.15, 0.99],
        [0.0, 1.02, 'q', 0.045, 1.075],
      ];
      type OutlinePt = { p: [number, number]; q: [number, number] | null };
      const outline: OutlinePt[] = [];
      for (let arm = 0; arm < 4; arm++) {
        const a = (-arm * Math.PI) / 2;
        const right = armPoints();
        for (const e of right) {
          const q = e.length > 3 ? rot([e[3] as number, e[4] as number], a) : null;
          outline.push({ p: rot([e[0] as number, e[1] as number], a), q });
        }
        for (let j = right.length - 2; j >= 0; j--) {
          const e2 = right[j];
          const eNext = right[j + 1];
          const nq = eNext.length > 3 ? rot([-(eNext[3] as number), eNext[4] as number], a) : null;
          outline.push({ p: rot([-(e2[0] as number), e2[1] as number], a), q: nq });
        }
      }
      shape.moveTo(outline[0].p[0], outline[0].p[1]);
      for (let k = 1; k < outline.length; k++) {
        const o = outline[k];
        if (o.q) shape.quadraticCurveTo(o.q[0], o.q[1], o.p[0], o.p[1]);
        else shape.lineTo(o.p[0], o.p[1]);
      }
      shape.closePath();

      // pierced kite hole in each arm
      for (let h = 0; h < 4; h++) {
        const ah = (-h * Math.PI) / 2;
        const hole = new THREE.Path();
        const kite = [[0, 0.33], [0.115, 0.52], [0, 0.79], [-0.115, 0.52]];
        const p0 = rot(kite[0], ah);
        hole.moveTo(p0[0], p0[1]);
        for (let m = 1; m < kite.length; m++) {
          const pm = rot(kite[m], ah);
          hole.lineTo(pm[0], pm[1]);
        }
        hole.closePath();
        shape.holes.push(hole);
      }
      // small round holes on the diagonals near the core
      for (let d = 0; d < 4; d++) {
        const ad = Math.PI / 4 + (d * Math.PI) / 2;
        const circ = new THREE.Path();
        circ.absarc(Math.cos(ad) * 0.3, Math.sin(ad) * 0.3, 0.055, 0, Math.PI * 2, true);
        shape.holes.push(circ);
      }
      return shape;
    };

    const crossGroup = new THREE.Group();
    const head = new THREE.Group();
    head.add(new THREE.Mesh(extrude(buildHeadShape(), Z_DEPTH, 0.018), matPlate));

    // diamond frame behind the head
    const bandShape = (outerR: number, innerR: number) => {
      const s = new THREE.Shape();
      const square = (path: THREE.Path, r: number) => {
        for (let i = 0; i <= 4; i++) {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
        path.closePath();
      };
      square(s, outerR);
      const holePath = new THREE.Path();
      square(holePath, innerR);
      s.holes.push(holePath);
      return s;
    };
    const diamond = new THREE.Mesh(extrude(bandShape(1.0, 0.88), Z_DEPTH * 0.66, 0.014), matBand);
    diamond.position.z = -0.005;
    head.add(diamond);

    // interlaced quatrefoil: four arcs weaving between the arms
    for (let qa = 0; qa < 4; qa++) {
      const start = Math.PI / 4 + (qa * Math.PI) / 2 - 0.62;
      const curvePts: THREE.Vector3[] = [];
      for (let t = 0; t <= 24; t++) {
        const ang = start + (1.24 * t) / 24;
        curvePts.push(new THREE.Vector3(
          Math.cos(ang) * 0.66, Math.sin(ang) * 0.66,
          Math.sin((t / 24) * Math.PI) * 0.055 * (qa % 2 === 0 ? 1 : -1),
        ));
      }
      head.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 32, 0.042, 12), matBand,
      ));
    }

    // finials: spheres on tri-lobe tips + diamond-frame corners
    const sphereGeo = new THREE.SphereGeometry(0.05, 20, 16);
    const smallSphereGeo = new THREE.SphereGeometry(0.036, 16, 12);
    for (let f = 0; f < 4; f++) {
      const af = Math.PI / 2 - (f * Math.PI) / 2;
      ([[0, 1.1], [0.185, 1.035], [-0.185, 1.035]] as [number, number][]).forEach((lp, li) => {
        const pp = rot(lp, af - Math.PI / 2);
        const s = new THREE.Mesh(li === 0 ? sphereGeo : smallSphereGeo, matDetail);
        s.position.set(pp[0], pp[1], 0);
        head.add(s);
      });
      const ad2 = Math.PI / 4 + (f * Math.PI) / 2;
      const corner = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 16), matDetail);
      corner.position.set(Math.cos(ad2) * 1.04, Math.sin(ad2) * 1.04, 0);
      head.add(corner);
    }

    // raised centre boss: ring + relief cross, both faces
    for (const side of [1, -1]) {
      const boss = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.024, 12, 40), matDetail);
      boss.position.z = side * (Z_DEPTH / 2 + 0.012);
      head.add(boss);
      const rc = new THREE.Shape();
      const w = 0.035, l = 0.115;
      rc.moveTo(-w, -l); rc.lineTo(w, -l); rc.lineTo(w, -w); rc.lineTo(l, -w);
      rc.lineTo(l, w); rc.lineTo(w, w); rc.lineTo(w, l); rc.lineTo(-w, l);
      rc.lineTo(-w, w); rc.lineTo(-l, w); rc.lineTo(-l, -w); rc.lineTo(-w, -w);
      rc.closePath();
      const relief = new THREE.Mesh(extrude(rc, 0.02, 0.008), matDetail);
      relief.position.z = side * (Z_DEPTH / 2 + 0.02);
      head.add(relief);
    }

    head.position.y = 0.62;
    crossGroup.add(head);

    // ---------- shaft ----------
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.08, 10), matShaft);
    shaft.position.y = -0.9;
    crossGroup.add(shaft);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.03, 10, 24), matDetail);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.42;
    crossGroup.add(collar);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), matDetail);
    bead.position.y = -0.53;
    crossGroup.add(bead);

    // ---------- tabot base with swinging pendants ----------
    const base = new THREE.Group();
    const plateShape = new THREE.Shape();
    plateShape.moveTo(-0.46, -0.09); plateShape.lineTo(-0.52, 0);
    plateShape.lineTo(-0.46, 0.09); plateShape.lineTo(0.46, 0.09);
    plateShape.lineTo(0.52, 0); plateShape.lineTo(0.46, -0.09);
    plateShape.closePath();
    base.add(new THREE.Mesh(extrude(plateShape, 0.12, 0.016), matPlate));

    const pendants: { g: THREE.Group; v: number }[] = [];
    for (const px of [-0.34, 0.34]) {
      const pivot = new THREE.Group();
      pivot.position.set(px, -0.1, 0);
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.011, 8, 16), matDetail);
      link.position.y = -0.03;
      pivot.add(link);
      const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), matDetail);
      drop.position.y = -0.135;
      drop.scale.set(1, 1.45, 0.6);
      pivot.add(drop);
      base.add(pivot);
      pendants.push({ g: pivot, v: 0 });
    }
    base.position.y = -1.42;
    crossGroup.add(base);

    // ---------- scene graph: root -> float -> spin -> cross ----------
    const root = new THREE.Group();
    const floatG = new THREE.Group();
    const spinG = new THREE.Group();
    spinG.add(crossGroup);
    floatG.add(spinG);
    root.add(floatG);
    root.position.y = 0.02;
    scene.add(root);

    // subtle golden dust
    const dustCount = 50;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 4.5;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 2 - 0.5;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xffd98a, size: 0.02, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(dust);
    gsap.to(dust.rotation, { y: Math.PI * 2, duration: 90, repeat: -1, ease: 'none' });

    // ---------- interaction ----------
    let targetRotY = 0, targetRotX = 0.06, velY = 0;
    let dragging = false, lastX = 0, lastY = 0, lastT = 0;
    let lastInteraction = -3;
    const autoSpin = 0.22;
    let pinchDist = 0, camZ = 5.9;
    let lastTapT = 0;
    const now = () => performance.now() / 1000;

    const resetView = () => {
      const snapped = Math.round(spinG.rotation.y / (Math.PI * 2)) * Math.PI * 2;
      velY = 0;
      gsap.to(spinG.rotation, { y: snapped, x: 0.06, duration: 1.1, ease: 'elastic.out(1, 0.55)' });
      gsap.to(camera.position, {
        z: 5.9, duration: 0.9, ease: 'power3.out',
        onUpdate: () => { camZ = camera.position.z; },
      });
      targetRotY = snapped;
      targetRotX = 0.06;
    };

    const onDown = (x: number, y: number) => {
      dragging = true;
      lastX = x; lastY = y; lastT = now();
      velY = 0;
      lastInteraction = now();
      const t = now();
      if (t - lastTapT < 0.32) resetView();
      lastTapT = t;
    };
    const onMove = (x: number, y: number) => {
      if (!dragging) return;
      const t = now(), dt = Math.max(t - lastT, 1 / 240);
      const dx = x - lastX, dy = y - lastY;
      targetRotY += dx * 0.008;
      targetRotX = Math.max(-0.55, Math.min(0.55, targetRotX + dy * 0.005));
      velY = (dx * 0.008) / dt;
      lastX = x; lastY = y; lastT = t;
      lastInteraction = t;
    };
    const onUp = () => { dragging = false; lastInteraction = now(); };

    const onPointerDown = (e: PointerEvent) => { canvas.setPointerCapture(e.pointerId); onDown(e.clientX, e.clientY); };
    const onPointerMove = (e: PointerEvent) => onMove(e.clientX, e.clientY);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camZ = Math.max(4.2, Math.min(9.0, camZ + e.deltaY * 0.004));
      lastInteraction = now();
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDist > 0) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        camZ = Math.max(4.2, Math.min(9.0, camZ * (pinchDist / d)));
        pinchDist = d;
        lastInteraction = now();
        e.preventDefault();
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    // ---------- GSAP: entrance + idle float + breathing light ----------
    root.scale.setScalar(0.001);
    spinG.rotation.y = -2.4;
    gsap.timeline({ delay: 0.15 })
      .to(root.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: 'power3.out' }, 0)
      .to(spinG.rotation, { y: 0, duration: 1.9, ease: 'power3.out' }, 0)
      .from(root.position, { y: -0.35, duration: 1.5, ease: 'power3.out' }, 0);
    gsap.to(floatG.position, { y: 0.07, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 });
    gsap.to(floatG.rotation, { z: 0.02, duration: 4.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 });
    gsap.to(keyLight, { intensity: 1.95, duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // ---------- sizing ----------
    const resize = () => {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // ---------- main loop ----------
    let prevSpinY = 0, raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = now();

      if (!dragging) {
        targetRotY += velY * dt;
        velY *= Math.pow(0.05, dt);
        if (t - lastInteraction > 2.5) targetRotY += autoSpin * dt;
      }
      if (!gsap.isTweening(spinG.rotation)) {
        spinG.rotation.y += (targetRotY - spinG.rotation.y) * Math.min(1, dt * 9);
        spinG.rotation.x += (targetRotX - spinG.rotation.x) * Math.min(1, dt * 9);
      } else {
        targetRotY = spinG.rotation.y;
        targetRotX = spinG.rotation.x;
      }
      camera.position.z += (camZ - camera.position.z) * Math.min(1, dt * 8);

      // pendant physics: damped pendulum driven by yaw acceleration
      const spinDelta = spinG.rotation.y - prevSpinY;
      prevSpinY = spinG.rotation.y;
      for (const p of pendants) {
        p.v += (-p.g.rotation.z * 26 - spinDelta * 55) * dt;
        p.v *= Math.pow(0.12, dt);
        p.g.rotation.z = Math.max(-0.6, Math.min(0.6, p.g.rotation.z + p.v * dt));
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      gsap.globalTimeline.getChildren().forEach((tw) => {
        const targets = (tw as gsap.core.Tween).targets?.() ?? [];
        if (targets.some((tg: object) =>
          tg === root.scale || tg === root.position || tg === spinG.rotation ||
          tg === floatG.position || tg === floatG.rotation || tg === keyLight ||
          tg === dust.rotation || tg === camera.position)) {
          tw.kill();
        }
      });
      pmrem.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' }}
      aria-label="Interactive 3D Ethiopian Orthodox cross"
    />
  );
};
