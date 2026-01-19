import { useEffect, useRef } from "react";
import "./index.css";

const VERT_SHADER = `
attribute vec3 aPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

const FRAG_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform float uSpeedColor;
uniform vec2 uResolution;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;

const int AMOUNT = 2;
const float scale = 2.0;

vec3 blendLinearBurn(vec3 base, vec3 blend) {
  return max(base + blend - vec3(1.0), vec3(0.0));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return vec3(
    base.r < 0.5 ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
    base.g < 0.5 ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
    base.b < 0.5 ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
  );
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float createLen() {
  float time = 10.0 + uTime / 1.0;
  vec2 coord = scale * (gl_FragCoord.xy - uResolution.xy) / min(uResolution.y, uResolution.x);
  float len;
  for(int i = 0; i < AMOUNT; i++) {
    len = length(vec2(coord.x, coord.y));
    coord.x = coord.x + cos(coord.y - sin(len)) - cos(time / 9.1);
    coord.y = coord.y + sin(coord.y + cos(len)) + sin(time / 12.0);
  }
  return len;
}

float createLen2(float x, float y, float speed, float offset) {
  float time = offset + uTime / speed;
  vec2 coord = scale * (gl_FragCoord.xy - uResolution.xy) / min(uResolution.y, uResolution.x);
  float len;
  for(int i = 0; i < AMOUNT; i++) {
    len = length(vec2(coord.x, coord.y));
    coord.x = coord.x + sin(coord.y + cos(len) * cos(len)) + sin(time / x);
    coord.y = coord.y - cos(coord.y + sin(len) * sin(len)) + cos(time / y);
  }
  return len;
}

float createLen3(float x, float y, float speed, float offset) {
  float time = offset + uTime / speed;
  vec2 coord = scale * (gl_FragCoord.xy - uResolution.xy) / min(uResolution.y, uResolution.x);
  float len;
  for(int i = 0; i < AMOUNT; i++) {
    len = length(vec2(coord.x, coord.y));
    coord.y = coord.y + sin(coord.y + cos(len)) + sin(time / y);
  }
  return len;
}

float createLen4(float x, float y, float speed, float offset) {
  float time = offset + uTime / speed;
  vec2 coord = scale * (gl_FragCoord.xy - uResolution.xy) / min(uResolution.y, uResolution.x);
  float len;
  for(int i = 0; i < AMOUNT; i++) {
    len = length(vec2(coord.x, coord.y));
    coord.x = coord.x - cos(coord.y + sin(len)) + cos(time / x);
  }
  return len;
}

// rgb2hsv & hsv2rgb (StackOverflow)
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0., -1./3., 2./3., -1.);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.*d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1., 2./3., 1./3., 3.);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);
}

void main() {
  float len = createLen();
  float len2 = createLen2(10.0, 10.0, 8.0, 20.0);
  float len3 = createLen3(2.0, 2.0, 10.0, 30.0);
  float len4 = createLen4(5.0, 20.0, 5.0, 40.0);

  vec3 blue = uColor1 + cos(len) * 0.25 + 0.25;
  vec3 turquoise = uColor2 + cos(len2) * 0.5 + 0.75;
  vec3 pink = uColor3 + cos(len3) * 0.5 + 0.75;
  vec3 peach = uColor4 + cos(len4) * 0.75 + 0.95;

  float pinkValue = min(1.0, max(0.0, 1.2 - (pink[0] / 1.2)));
  float peachValue = min(1.0, max(0.0, 1.5 - (peach[0] / 1.2)));
  float turquoiseValue = min(1.0, max(0.0, 1.5 - (turquoise[2] / 1.1)));

  vec3 blend = blue;
  blend = mix(blend, turquoise, turquoiseValue);
  blend = mix(blend, peach, peachValue);
  blend = mix(blend, pink, pinkValue);

  vec3 lightercolor = blendLinearBurn(blend, peach);
  blend = mix(blend, lightercolor, max(1.0 - lightercolor[0], 0.0));

  blend = blendOverlay(blend, vec3(0.0, 0.0, 0.0));
  blend = blendLinearBurn(blend, vec3(1.0, 0.7, 0.1));

  vec3 color = blend;

  vec3 hsb = rgb2hsv(vec3(color.r, color.g, color.b));
  hsb[1] -= rand(scale * (gl_FragCoord.xy - uResolution.xy) / min(uResolution.y, uResolution.x)) * 0.4;
  vec3 rgb = hsv2rgb(hsb);

  gl_FragColor = vec4(rgb, 1.0);
}
`;

export default function Index() {
  const p5MountRef = useRef(null);
  const cursorRef = useRef(null);
  const navRef = useRef(null);

  // p5 + shader 캔버스 생성
  useEffect(() => {
    let p5Instance = null;

    (async () => {
      // npm i p5
      const p5Module = await import("p5");
      const P5 = p5Module.default;

      const sketch = (p) => {
        const colors = ["#225ee1", "#83dcb7", "#ac53cf", "#e7a39c"];
        const backgroundColor = "#31AFD4";
        let s;
        let canvasWidth = window.innerWidth;
        let canvasHeight = window.innerHeight;

        const hex2rgb = (hex) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return [r / 255, g / 255, b / 255];
        };

        p.setup = () => {
          p.createCanvas(canvasWidth, canvasHeight, p.WEBGL);
          p.noiseSeed(20);
          p.rectMode(p.CENTER);
          p.noStroke();
          s = p.createShader(VERT_SHADER, FRAG_SHADER);
        };

        p.draw = () => {
          p.background(backgroundColor);
          p.shader(s);

          s.setUniform("uResolution", [canvasWidth, canvasHeight]);
          s.setUniform("uTime", p.millis() / 100);
          s.setUniform("uSpeedColor", 20.0);

          s.setUniform("uColor1", hex2rgb(colors[0]));
          s.setUniform("uColor2", hex2rgb(colors[1]));
          s.setUniform("uColor3", hex2rgb(colors[2]));
          s.setUniform("uColor4", hex2rgb(colors[3]));
          s.setUniform("uColor5", [0, 0, 0]); // 원본에서도 임시값

          p.rect(0, 0, canvasWidth, canvasHeight);
        };

        p.windowResized = () => {
          canvasWidth = window.innerWidth;
          canvasHeight = window.innerHeight;
          p.resizeCanvas(canvasWidth, canvasHeight);
        };
      };

      if (p5MountRef.current) {
        p5Instance = new P5(sketch, p5MountRef.current);
      }
    })();

    return () => {
      if (p5Instance) p5Instance.remove();
    };
  }, []);

  // 커스텀 커서(부드럽게 따라오는 버전)
  useEffect(() => {
    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let rafId = 0;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      const speed = 0.2;
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;

      cursorEl.style.left = cursorX + "px";
      cursorEl.style.top = cursorY + "px";

      rafId = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMove);
    animate();

    // 링크 호버 효과
    const links = navRef.current?.querySelectorAll("a") || [];
    const onEnter = () => {
      cursorEl.style.transform = "translate(-50%, -50%) scale(1.5)";
      cursorEl.style.background = "rgba(172, 83, 207, 0.8)";
      cursorEl.style.borderColor = "rgba(172, 83, 207, 0.5)";
    };
    const onLeave = () => {
      cursorEl.style.transform = "translate(-50%, -50%) scale(1)";
      cursorEl.style.background = "rgba(255, 255, 255, 0.8)";
      cursorEl.style.borderColor = "rgba(255, 255, 255, 0.5)";
    };

    links.forEach((link) => {
      link.addEventListener("mouseenter", onEnter);
      link.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      links.forEach((link) => {
        link.removeEventListener("mouseenter", onEnter);
        link.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <div>
      {/* p5 캔버스가 mount 되는 곳 */}
      <div ref={p5MountRef} />

      {/* 커스텀 커서 */}
      <div className="custom-cursor" id="cursor" ref={cursorRef} />

      <div className="nav">
        <nav className="textmenu" ref={navRef}>
          <a href="./index.html">Home</a>
          <a href="./contact.html">Contact</a>
          <a href="./profile.html">Profile</a>
          <a href="./project.html">Projects</a>
          <a href="./skills.html">Skills</a>
          <span></span>
        </nav>
      </div>

      <div className="container">
        <h1>Hello World!</h1>
        <br />
        <h4>FE 개발자 김이레 입니다!</h4>
        <div className="buttons">
          <button className="button" onClick={() => (window.location.href = "./Intro.jsx")}>
            <span>더 알아보러가기</span>
          </button>
        </div>
      </div>
    </div>
  );
}