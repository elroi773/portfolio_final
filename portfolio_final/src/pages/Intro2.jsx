// Intro2.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Intro2.css";

/**
 * Intro2
 * - 100vh hero with gooey/metaball center
 * - rAF physics: spring + damping + impulses
 * - click: snap squash + flash, dual rings, trail, dust particles, 2s field boost
 * - hover: subtle preview reaction
 * - resize + prefers-reduced-motion
 */

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeOutCubic(t) {
  t = clamp(t, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}
function easeOutExpo(t) {
  t = clamp(t, 0, 1);
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function rand01(seed) {
  // deterministic-ish pseudo random from seed
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function vecLen(x, y) {
  return Math.hypot(x, y);
}
function normVec(x, y) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

export default function Intro2() {
  const rootRef = useRef(null);

  const beigeRef = useRef(null);
  const yellowRef = useRef(null);

  const gRefs = useRef([]); // green blobs refs
  const ringOuterRef = useRef(null);
  const ringInnerRef = useRef(null);
  const breathRingRef = useRef(null);

  const trailRefs = useRef([]); // fixed pool
  const particleRefs = useRef([]); // fixed pool

  const rafRef = useRef(0);
  const lastTRef = useRef(0);

  const [reducedMotion, setReducedMotion] = useState(false);
  const reducedRef = useRef(false);

  const seeds = useMemo(() => {
    const s = Math.random() * 1000;
    return {
      base: s,
      driftA: s + 11.23,
      driftB: s + 97.11,
      wobA: s + 3.7,
      wobB: s + 19.9,
      wobC: s + 71.4,
      ringA: s + 44.2,
    };
  }, []);

  // viewport metrics
  const metricsRef = useRef({
    w: 1,
    h: 1,
    cx: 0,
    cy: 0,
    scale: 1,
  });

  // pointer
  const pointerRef = useRef({
    x: 0,
    y: 0,
    has: false,
    hover: 0, // 0..1
    hoverVX: 0,
    hoverVY: 0,
  });

  // simulation state
  const simRef = useRef(null);
  if (!simRef.current) {
    simRef.current = {
      // time anchors
      clickT: -9999,
      clickX: 0,
      clickY: 0,

      // flash + field
      flash: 0,
      field: 0, // 0..1
      fieldTimer: 0,

      // group center (green blob group)
      green: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        sx: 1,
        sy: 1,
        svx: 0,
        svy: 0,
      },
      yellow: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        s: 1,
        sv: 0,
      },
      beige: {
        x: 0,
        y: 0,
        s: 1,
        sv: 0,
      },

      // individual green blobs
      blobs: [
        { x: 0, y: 0, vx: 0, vy: 0, sx: 1, sy: 1, svx: 0, svy: 0, phase: 0.0 },
        { x: 0, y: 0, vx: 0, vy: 0, sx: 1, sy: 1, svx: 0, svy: 0, phase: 1.7 },
        { x: 0, y: 0, vx: 0, vy: 0, sx: 1, sy: 1, svx: 0, svy: 0, phase: 3.1 },
      ],

      // trail history (positions of green center)
      trailHistory: [], // {x,y,t}
      trailWriteAcc: 0,

      // particles pool
      particles: [], // {active, x,y,vx,vy, life, age, size}
    };
  }

  // init particles pool once
  useEffect(() => {
    const sim = simRef.current;
    if (!sim.particles.length) {
      for (let i = 0; i < 18; i++) {
        sim.particles.push({
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 0.6,
          age: 0,
          size: 2,
        });
      }
    }
  }, []);

  // reduced motion media
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => {
      setReducedMotion(!!mq.matches);
      reducedRef.current = !!mq.matches;
    };
    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // resize
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const scale = clamp(Math.min(w, h) / 900, 0.75, 1.25);
      metricsRef.current = { w, h, cx, cy, scale };

      // (re)seed base positions
      const sim = simRef.current;
      sim.green.x = 0;
      sim.green.y = 0;
      sim.yellow.x = 240 * scale;
      sim.yellow.y = 0;
      sim.beige.x = -280 * scale;
      sim.beige.y = 10 * scale;

      // initialize blob positions around group
      const baseOffsets = getGreenBaseOffsets(scale);
      sim.blobs.forEach((b, i) => {
        b.x = sim.green.x + baseOffsets[i].x;
        b.y = sim.green.y + baseOffsets[i].y;
      });
    };

    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getPointerLocal = useCallback((clientX, clientY) => {
    const { cx, cy } = metricsRef.current;
    return { x: clientX - cx, y: clientY - cy };
  }, []);

  const injectClick = useCallback((x, y, nowMs) => {
    const sim = simRef.current;
    const { scale } = metricsRef.current;

    sim.clickT = nowMs;
    sim.clickX = x;
    sim.clickY = y;

    // flash + field boost
    sim.flash = 1;
    sim.field = 1;
    sim.fieldTimer = 2.0; // seconds

    // impulse direction: from click -> green center (or vice versa)
    const gx = sim.green.x;
    const gy = sim.green.y;
    let dx = gx - x;
    let dy = gy - y;
    let [nx, ny] = normVec(dx, dy);

    const energy = 1.0;
    const kick = (220 + 120 * rand01(seeds.base + nowMs * 0.001)) * scale * energy;

    // green center reacts strongly
    sim.green.vx += nx * kick;
    sim.green.vy += ny * kick;

    // add a quick squash/stretch in green group scale velocities
    sim.green.svx += (-1.2) * energy;
    sim.green.svy += (1.4) * energy;

    // individual blob impulse + ripple feel
    sim.blobs.forEach((b, i) => {
      const bx = b.x;
      const by = b.y;
      let rx = bx - x;
      let ry = by - y;
      const dist = vecLen(rx, ry);
      let [rnx, rny] = normVec(rx, ry);
      const falloff = 1 / (1 + dist / (220 * scale));
      const blobKick = (260 * falloff + 40) * scale;
      b.vx += rnx * blobKick + (rand01(seeds.wobA + i * 7.1 + nowMs) - 0.5) * 80 * scale;
      b.vy += rny * blobKick + (rand01(seeds.wobB + i * 9.3 + nowMs) - 0.5) * 80 * scale;

      // blob squash a bit different per blob
      b.svx += (-1.1 - 0.15 * i) * energy;
      b.svy += (1.2 + 0.12 * i) * energy;
    });

    // yellow is heavier: slower, delayed
    const ydx = sim.yellow.x - x;
    const ydy = sim.yellow.y - y;
    const [ynx, yny] = normVec(ydx, ydy);
    sim.yellow.vx += ynx * kick * 0.32;
    sim.yellow.vy += yny * kick * 0.32;
    sim.yellow.sv += 0.22;

    // beige minimal
    sim.beige.sv += 0.10;

    // spawn dust particles unless reduced motion
    if (!reducedRef.current) {
      spawnParticlesNear(sim, x, y, scale, nowMs, seeds.base);
    }
  }, [seeds.base, seeds.wobA, seeds.wobB]);

  const onPointerDown = useCallback(
    (e) => {
      // make sure touch also works
      const p = getPointerLocal(e.clientX, e.clientY);
      injectClick(p.x, p.y, performance.now());
    },
    [getPointerLocal, injectClick]
  );

  const onPointerMove = useCallback(
    (e) => {
      const p = getPointerLocal(e.clientX, e.clientY);
      const pr = pointerRef.current;
      pr.x = p.x;
      pr.y = p.y;
      pr.has = true;
    },
    [getPointerLocal]
  );

  const onPointerLeave = useCallback(() => {
    const pr = pointerRef.current;
    pr.has = false;
  }, []);

  // rAF loop
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sim = simRef.current;
    const tick = (tMs) => {
      const last = lastTRef.current || tMs;
      let dt = (tMs - last) / 1000;
      dt = clamp(dt, 0, 0.032);
      lastTRef.current = tMs;

      step(sim, dt, tMs, metricsRef.current, pointerRef.current, reducedRef.current, seeds);

      // apply to DOM
      applyDOM(sim, metricsRef.current, {
        root,
        beigeEl: beigeRef.current,
        yellowEl: yellowRef.current,
        greenEls: gRefs.current,
        ringOuterEl: ringOuterRef.current,
        ringInnerEl: ringInnerRef.current,
        breathRingEl: breathRingRef.current,
        trailEls: trailRefs.current,
        particleEls: particleRefs.current,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [seeds]);

  return (
    <section
      ref={rootRef}
      className="intro2Root"
      data-reduced={reducedMotion ? "1" : "0"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      role="presentation"
    >
      {/* SVG filter defs (gooey) */}
      <svg className="intro2SvgDefs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="intro2-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 22 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="intro2Bg" aria-hidden="true" />

      <div className="intro2Scene" aria-hidden="true">
        {/* Beige */}
        <div ref={beigeRef} className="intro2Shape intro2Beige" />

        {/* Green goo cluster */}
        <div className="intro2GooWrap">
          <div className="intro2Goo" style={{ filter: "url(#intro2-goo)" }}>
            <div
              ref={(el) => (gRefs.current[0] = el)}
              className="intro2Shape intro2GreenBlob intro2GreenA"
            />
            <div
              ref={(el) => (gRefs.current[1] = el)}
              className="intro2Shape intro2GreenBlob intro2GreenB"
            />
            <div
              ref={(el) => (gRefs.current[2] = el)}
              className="intro2Shape intro2GreenBlob intro2GreenC"
            />
          </div>
        </div>

        {/* Yellow */}
        <div ref={yellowRef} className="intro2Shape intro2Yellow" />

        {/* Rings / cues */}
        <div className="intro2FX">
          <div ref={ringOuterRef} className="intro2Ring intro2RingOuter" />
          <div ref={ringInnerRef} className="intro2Ring intro2RingInner" />
          <div ref={breathRingRef} className="intro2Ring intro2BreathRing" />
        </div>

        {/* Trail pool */}
        <div className="intro2TrailLayer">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              ref={(el) => (trailRefs.current[i] = el)}
              className="intro2Trail"
            />
          ))}
        </div>

        {/* Particles pool */}
        <div className="intro2ParticleLayer">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              ref={(el) => (particleRefs.current[i] = el)}
              className="intro2Particle"
            />
          ))}
        </div>
      </div>

      {/* Optional minimal hint text (kept stable) */}
      <div className="intro2Hint" aria-hidden="true">
        <span>click</span>
      </div>
    </section>
  );
}

/** base offsets for the green metaballs */
function getGreenBaseOffsets(scale) {
  return [
    { x: -48 * scale, y: 8 * scale },
    { x: 44 * scale, y: -6 * scale },
    { x: 4 * scale, y: 46 * scale },
  ];
}

function spawnParticlesNear(sim, x, y, scale, nowMs, seedBase) {
  const count = 8 + Math.floor(rand01(seedBase + nowMs * 0.01) * 4);
  let spawned = 0;
  for (let i = 0; i < sim.particles.length && spawned < count; i++) {
    const p = sim.particles[i];
    if (p.active) continue;
    p.active = true;
    p.age = 0;
    p.life = 0.55 + rand01(seedBase + nowMs + i * 9.3) * 0.35;
    const a = (rand01(seedBase + nowMs + i * 17.1) * Math.PI * 2) % (Math.PI * 2);
    const r = (6 + rand01(seedBase + nowMs + i * 3.7) * 18) * scale;
    p.x = x + Math.cos(a) * r;
    p.y = y + Math.sin(a) * r;
    const sp = (40 + rand01(seedBase + nowMs + i * 5.9) * 120) * scale;
    p.vx = Math.cos(a) * sp + (rand01(seedBase + 12.3 + i * 1.1) - 0.5) * 30 * scale;
    p.vy = Math.sin(a) * sp + (rand01(seedBase + 99.2 + i * 1.3) - 0.5) * 30 * scale;
    p.size = 1.6 + rand01(seedBase + nowMs + i * 2.1) * 2.6;
    spawned++;
  }
}

function step(sim, dt, tMs, metrics, pointer, reduced, seeds) {
  const { scale } = metrics;

  // time since click
  const tSince = (tMs - sim.clickT) / 1000;

  // flash decays
  sim.flash = lerp(sim.flash, 0, 1 - Math.exp(-dt * 12));

  // field decay (2s)
  if (sim.fieldTimer > 0) {
    sim.fieldTimer -= dt;
    const x = clamp(sim.fieldTimer / 2.0, 0, 1);
    // smooth decay: keep strong earlier, then fade
    sim.field = x * x;
  } else {
    sim.field = lerp(sim.field, 0, 1 - Math.exp(-dt * 3));
  }

  // hover preview: proximity to center objects
  let hoverTarget = 0;
  if (pointer.has) {
    const dG = vecLen(pointer.x - sim.green.x, pointer.y - sim.green.y);
    const dY = vecLen(pointer.x - sim.yellow.x, pointer.y - sim.yellow.y);
    const near = Math.min(dG, dY);
    hoverTarget = near < 220 * scale ? 1 : near < 320 * scale ? (320 * scale - near) / (100 * scale) : 0;
  }
  pointer.hover = lerp(pointer.hover, hoverTarget, 1 - Math.exp(-dt * 10));

  // compute a tiny hover force vector (preview)
  if (pointer.hover > 0.001 && pointer.has) {
    const dx = pointer.x - sim.green.x;
    const dy = pointer.y - sim.green.y;
    const [nx, ny] = normVec(dx, dy);
    const amp = 10 * scale * pointer.hover;
    // gently "follow" pointer by a pixel or two
    const tx = nx * amp;
    const ty = ny * amp;
    pointer.hoverVX = lerp(pointer.hoverVX, tx, 1 - Math.exp(-dt * 10));
    pointer.hoverVY = lerp(pointer.hoverVY, ty, 1 - Math.exp(-dt * 10));
  } else {
    pointer.hoverVX = lerp(pointer.hoverVX, 0, 1 - Math.exp(-dt * 10));
    pointer.hoverVY = lerp(pointer.hoverVY, 0, 1 - Math.exp(-dt * 10));
  }

  // drift (very slow)
  const driftX = Math.sin((tMs * 0.00012) + seeds.driftA) * 10 * scale;
  const driftY = Math.cos((tMs * 0.00010) + seeds.driftB) * 8 * scale;

  // attraction to click during field mode
  let attractX = 0;
  let attractY = 0;
  if (sim.field > 0.0001) {
    const dx = sim.clickX - sim.green.x;
    const dy = sim.clickY - sim.green.y;
    const [nx, ny] = normVec(dx, dy);
    const dist = vecLen(dx, dy);
    const falloff = 1 / (1 + dist / (420 * scale));
    const strength = (28 * scale) * sim.field * falloff;
    attractX = nx * strength;
    attractY = ny * strength;
  }

  // idle amplitude (reduced motion: much smaller)
  const idleMul = reduced ? 0.35 : 1.0;
  const fieldMul = 1 + sim.field * 0.55 * (reduced ? 0.35 : 1.0);

  // green group target (center)
  const greenBaseX = 0;
  const greenBaseY = 0;

  const targetGX =
    greenBaseX +
    driftX * idleMul +
    pointer.hoverVX * 0.55 +
    attractX * fieldMul;

  const targetGY =
    greenBaseY +
    driftY * idleMul +
    pointer.hoverVY * 0.55 +
    attractY * fieldMul;

  // spring integrate green group (strong but damped)
  spring2D(sim.green, targetGX, targetGY, 32, 10.5, dt);

  // green breathing + irregular wobble scale
  const breath = 1 + Math.sin(tMs * 0.0010 + seeds.wobA) * (0.012 * idleMul) * fieldMul;
  const jelly = Math.sin(tMs * 0.0017 + seeds.wobB) * (0.008 * idleMul) * fieldMul;

  const targetGSX = breath * (1 + jelly * 0.5);
  const targetGSY = breath * (1 - jelly * 0.4);

  // click snap squash (0~0.12s strong)
  let snap = 0;
  if (tSince >= 0 && tSince < 0.18) {
    // quick peak then decay
    snap = Math.exp(-tSince / 0.09);
  }
  // overshoot feel
  const snapOsc = (tSince >= 0 && tSince < 0.45) ? Math.cos(tSince * 18) * Math.exp(-tSince * 4.2) : 0;

  const snapSX = 1 - (reduced ? 0.04 : 0.09) * snap + (reduced ? 0.02 : 0.04) * snapOsc;
  const snapSY = 1 + (reduced ? 0.05 : 0.12) * snap - (reduced ? 0.02 : 0.05) * snapOsc;

  spring1DScale(sim.green, targetGSX * snapSX, targetGSY * snapSY, 26, 8.5, dt);

  // green blobs positions around group with wobble (sin/cos combo)
  const baseOffsets = getGreenBaseOffsets(scale);
  sim.blobs.forEach((b, i) => {
    const ph = b.phase;
    const wob1 = Math.sin(tMs * (0.0019 + i * 0.0002) + seeds.wobA + ph) * 14 * scale * idleMul * fieldMul;
    const wob2 = Math.cos(tMs * (0.0014 + i * 0.00015) + seeds.wobC + ph * 1.3) * 11 * scale * idleMul * fieldMul;
    const wob3 = Math.sin(tMs * (0.0026 + i * 0.00021) + seeds.wobB + ph * 0.7) * 8 * scale * idleMul * fieldMul;

    const ox = baseOffsets[i].x + wob1 + wob3 * 0.6;
    const oy = baseOffsets[i].y + wob2 - wob3 * 0.4;

    // extra deformation when ring passes (0.1~0.4)
    let ringKick = 0;
    if (!reduced && tSince >= 0.12 && tSince <= 0.45) {
      const k = (tSince - 0.12) / 0.33;
      ringKick = Math.sin(k * Math.PI) * 1.0; // 0..1..0
    }

    const tx = sim.green.x + ox + (i - 1) * 2.5 * scale * ringKick;
    const ty = sim.green.y + oy + (1 - i) * 2.5 * scale * ringKick;

    spring2D(b, tx, ty, 38, 11.2, dt);

    // blob scale: subtle, plus leftover click jitter
    const localBreath = 1 + Math.sin(tMs * 0.0021 + seeds.wobC + ph) * (0.012 * idleMul) * fieldMul;
    const clickJit = (!reduced && tSince >= 0 && tSince < 0.8) ? Math.cos((tSince + i * 0.07) * 22) * Math.exp(-tSince * 3.5) * 0.035 : 0;

    const tSX = localBreath * (1 + clickJit);
    const tSY = localBreath * (1 - clickJit * 0.8);

    // slight snap squash inherits from group
    spring1DScale(b, tSX * lerp(1, snapSX, 0.25), tSY * lerp(1, snapSY, 0.25), 26, 9.2, dt);
  });

  // yellow: heavier inertia, smaller idle, also attracted (lag)
  const yDriftX = Math.sin(tMs * 0.00011 + seeds.driftB) * 6 * scale * idleMul;
  const yDriftY = Math.cos(tMs * 0.00009 + seeds.driftA) * 5 * scale * idleMul;

  let yAttrX = 0, yAttrY = 0;
  if (sim.field > 0.0001) {
    const dx = sim.clickX - sim.yellow.x;
    const dy = sim.clickY - sim.yellow.y;
    const [nx, ny] = normVec(dx, dy);
    const dist = vecLen(dx, dy);
    const falloff = 1 / (1 + dist / (520 * scale));
    const strength = (16 * scale) * sim.field * falloff; // weaker
    yAttrX = nx * strength;
    yAttrY = ny * strength;
  }

  const yellowBaseX = 240 * scale;
  const yellowBaseY = 0;
  const targetYX = yellowBaseX + yDriftX + yAttrX + pointer.hoverVX * 0.12;
  const targetYY = yellowBaseY + yDriftY + yAttrY + pointer.hoverVY * 0.12;

  spring2D(sim.yellow, targetYX, targetYY, 18, 7.8, dt);

  const yBreath = 1 + Math.sin(tMs * 0.0009 + seeds.wobA) * (0.0065 * idleMul) * (1 + sim.field * 0.25);
  spring1D(sim.yellow, "s", "sv", yBreath, 16, 7.5, dt);

  // beige: almost fixed, tiny breath only
  const beigeBaseX = -280 * scale;
  const beigeBaseY = 10 * scale;
  sim.beige.x = lerp(sim.beige.x, beigeBaseX, 1 - Math.exp(-dt * 6));
  sim.beige.y = lerp(sim.beige.y, beigeBaseY, 1 - Math.exp(-dt * 6));
  const bBreath = 1 + Math.sin(tMs * 0.0008 + seeds.wobB) * (0.0045 * idleMul);
  spring1D(sim.beige, "s", "sv", bBreath, 14, 7.2, dt);

  // trail history for 0.4~1.2s (and subtle always)
  sim.trailWriteAcc += dt;
  const writeEvery = reduced ? 0.07 : 0.033;
  if (!reduced && sim.trailWriteAcc >= writeEvery) {
    sim.trailWriteAcc = 0;
    sim.trailHistory.unshift({ x: sim.green.x, y: sim.green.y, t: tMs });
    // keep ~1.4s
    const max = 80;
    if (sim.trailHistory.length > max) sim.trailHistory.length = max;
  } else if (reduced) {
    // keep empty in reduced (no trail)
    sim.trailHistory.length = 0;
  }

  // particles
  if (reduced) {
    sim.particles.forEach((p) => (p.active = false));
  } else {
    sim.particles.forEach((p) => {
      if (!p.active) return;
      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        return;
      }
      // friction + slight upward drift
      p.vx *= Math.exp(-dt * 4.5);
      p.vy *= Math.exp(-dt * 4.5);
      p.vy -= 14 * scale * dt; // faint float
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
  }
}

function spring2D(obj, tx, ty, k, d, dt) {
  const ax = (tx - obj.x) * k - obj.vx * d;
  const ay = (ty - obj.y) * k - obj.vy * d;
  obj.vx += ax * dt;
  obj.vy += ay * dt;
  obj.x += obj.vx * dt;
  obj.y += obj.vy * dt;
}

function spring1D(obj, xKey, vKey, target, k, d, dt) {
  const x = obj[xKey];
  const v = obj[vKey];
  const a = (target - x) * k - v * d;
  obj[vKey] = v + a * dt;
  obj[xKey] = x + obj[vKey] * dt;
}
function spring1DScale(obj, targetSX, targetSY, k, d, dt) {
  // sx
  {
    const a = (targetSX - obj.sx) * k - obj.svx * d;
    obj.svx += a * dt;
    obj.sx += obj.svx * dt;
  }
  // sy
  {
    const a = (targetSY - obj.sy) * k - obj.svy * d;
    obj.svy += a * dt;
    obj.sy += obj.svy * dt;
  }
}

function applyDOM(sim, metrics, els) {
  const { cx, cy, scale } = metrics;
  const {
    root,
    beigeEl,
    yellowEl,
    greenEls,
    ringOuterEl,
    ringInnerEl,
    breathRingEl,
    trailEls,
    particleEls,
  } = els;

  // CSS vars (bg noise/glow)
  const field = clamp(sim.field, 0, 1);
  const flash = clamp(sim.flash, 0, 1);
  root.style.setProperty("--field", field.toFixed(3));
  root.style.setProperty("--flash", flash.toFixed(3));

  // beige
  if (beigeEl) {
    const r = 86 * scale;
    beigeEl.style.width = `${r * 2}px`;
    beigeEl.style.height = `${r * 2}px`;
    beigeEl.style.transform = `translate3d(${cx + sim.beige.x - r}px, ${cy + sim.beige.y - r}px, 0) scale(${sim.beige.s})`;
  }

  // green blobs (goo)
  if (greenEls && greenEls.length >= 3) {
    const radii = [110 * scale, 92 * scale, 72 * scale];
    for (let i = 0; i < 3; i++) {
      const el = greenEls[i];
      if (!el) continue;
      const r = radii[i];
      el.style.width = `${r * 2}px`;
      el.style.height = `${r * 2}px`;

      // inherit group squash a bit
      const sx = sim.blobs[i].sx * lerp(1, sim.green.sx, 0.35);
      const sy = sim.blobs[i].sy * lerp(1, sim.green.sy, 0.35);

      el.style.transform = `translate3d(${cx + sim.blobs[i].x - r}px, ${cy + sim.blobs[i].y - r}px, 0) scale(${sx}, ${sy})`;
    }
  }

  // yellow
  if (yellowEl) {
    const r = 98 * scale;
    yellowEl.style.width = `${r * 2}px`;
    yellowEl.style.height = `${r * 2}px`;
    yellowEl.style.transform = `translate3d(${cx + sim.yellow.x - r}px, ${cy + sim.yellow.y - r}px, 0) scale(${sim.yellow.s})`;
  }

  // click rings
  const tMs = performance.now();
  const tSince = (tMs - sim.clickT) / 1000;

  // Outer ring: 0.10~0.42
  if (ringOuterEl) {
    if (tSince >= 0.10 && tSince <= 0.42) {
      const p = (tSince - 0.10) / 0.32;
      const e = easeOutExpo(p);
      const s = lerp(0.55, 2.65, e);
      const fade = 1 - p;
      const sx = s * (1 + Math.sin(tMs * 0.004) * 0.08);
      const sy = s * (1 + Math.cos(tMs * 0.003) * 0.10);
      ringOuterEl.style.opacity = `${clamp(fade, 0, 1)}`;
      ringOuterEl.style.transform = `translate3d(${cx + sim.clickX}px, ${cy + sim.clickY}px, 0) translate3d(-50%, -50%, 0) scale(${sx}, ${sy})`;
    } else {
      ringOuterEl.style.opacity = "0";
    }
  }

  // Inner ring: 0.14~0.46 (sharper)
  if (ringInnerEl) {
    if (tSince >= 0.14 && tSince <= 0.46) {
      const p = (tSince - 0.14) / 0.32;
      const e = easeOutCubic(p);
      const s = lerp(0.45, 2.25, e);
      const fade = 1 - p;
      const sx = s * (1 + Math.sin(tMs * 0.005 + 1.2) * 0.05);
      const sy = s * (1 + Math.cos(tMs * 0.004 + 0.4) * 0.07);
      ringInnerEl.style.opacity = `${clamp(fade, 0, 1)}`;
      ringInnerEl.style.transform = `translate3d(${cx + sim.clickX}px, ${cy + sim.clickY}px, 0) translate3d(-50%, -50%, 0) scale(${sx}, ${sy})`;
    } else {
      ringInnerEl.style.opacity = "0";
    }
  }

  // Breath ring cue (idle): subtle periodic near center
  if (breathRingEl) {
    const period = 3.6;
    const phase = (tMs / 1000) % period;
    const p = phase / period;
    const s = lerp(0.65, 1.65, easeOutCubic(p));
    const o = (1 - p) * 0.22;
    // keep it near center, slightly biased to green/yellow overlap region
    const bx = cx + 70 * scale;
    const by = cy + 12 * scale;
    breathRingEl.style.opacity = `${o}`;
    breathRingEl.style.transform = `translate3d(${bx}px, ${by}px, 0) translate3d(-50%, -50%, 0) scale(${s}, ${s * 0.92})`;
  }

  // trail (0.4~1.2 after click, but uses history already)
  if (trailEls && trailEls.length) {
    const hist = sim.trailHistory;
    for (let i = 0; i < trailEls.length; i++) {
      const el = trailEls[i];
      if (!el) continue;
      if (!hist.length) {
        el.style.opacity = "0";
        continue;
      }
      const idx = Math.min(i * 4, hist.length - 1);
      const h = hist[idx];
      const age = (tMs - h.t) / 1000;
      const life = 1.2;
      if (age < 0 || age > life) {
        el.style.opacity = "0";
        continue;
      }
      const fade = (1 - age / life);
      const o = fade * 0.14 * (0.5 + sim.field * 0.8);
      const s = 0.55 + fade * 0.55;
      el.style.opacity = `${o}`;
      el.style.transform = `translate3d(${cx + h.x}px, ${cy + h.y}px, 0) translate3d(-50%, -50%, 0) scale(${s})`;
    }
  }

  // particles
  if (particleEls && particleEls.length) {
    for (let i = 0; i < particleEls.length; i++) {
      const el = particleEls[i];
      const p = sim.particles[i];
      if (!el || !p) continue;
      if (!p.active) {
        el.style.opacity = "0";
        continue;
      }
      const a = p.age / p.life;
      const o = (1 - a) * 0.32;
      const s = 1 + a * 0.6;
      el.style.opacity = `${o}`;
      el.style.width = `${p.size}px`;
      el.style.height = `${p.size}px`;
      el.style.transform = `translate3d(${cx + p.x}px, ${cy + p.y}px, 0) translate3d(-50%, -50%, 0) scale(${s})`;
    }
  }
}