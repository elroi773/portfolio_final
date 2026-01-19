import { useEffect, useRef } from "react";
import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";
import "./Intro.css";

export default function Intro() {
  const canvasRef = useRef(null);
  const mainScrollRef = useRef(null);

  const customCursorRef = useRef(null); // #cursor (custom-cursor)
  const navCursorRef = useRef(null); // .cursor (nav 아래에 있는 커서)

  // 1) Noise(필름 그레인) + resize + RAF
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let viewWidth = 0;
    let viewHeight = 0;
    const ctx = canvas.getContext("2d");

    // film grain config
    const patternSize = 100;
    const patternScaleX = 1;
    const patternScaleY = 1;
    const patternRefreshInterval = 1;
    const patternAlpha = 19;

    const patternPixelDataLength = patternSize * patternSize * 4;
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext("2d");
    const patternData = patternCtx.createImageData(patternSize, patternSize);

    let frame = 0;
    let rafId = 0;

    const initCanvas = () => {
      viewWidth = canvas.width = canvas.clientWidth;
      viewHeight = canvas.height = canvas.clientHeight;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // 혹시 모를 누적 스케일 방지
      ctx.scale(patternScaleX, patternScaleY);
    };

    const update = () => {
      let value;
      for (let i = 0; i < patternPixelDataLength; i += 4) {
        value = (Math.random() * 255) | 0;
        patternData.data[i] = value;
        patternData.data[i + 1] = value;
        patternData.data[i + 2] = value;
        patternData.data[i + 3] = patternAlpha;
      }
      patternCtx.putImageData(patternData, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, viewWidth, viewHeight);
      ctx.fillStyle = ctx.createPattern(patternCanvas, "repeat");
      ctx.fillRect(0, 0, viewWidth, viewHeight);
    };

    const loop = () => {
      if (++frame % patternRefreshInterval === 0) {
        update();
        draw();
      }
      rafId = requestAnimationFrame(loop);
    };

    const onResize = () => initCanvas();

    initCanvas();
    loop();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // 2) LocomotiveScroll
  useEffect(() => {
    if (!mainScrollRef.current) return;

    const scroll = new LocomotiveScroll({
      el: mainScrollRef.current,
      smooth: true,
      class: "is-inview",
    });

    return () => {
      // destroy
      try {
        scroll.destroy();
      } catch {}
    };
  }, []);

  // 3) 커서 & 링크 hover 효과 (intro.js 옮김)
  useEffect(() => {
    const navCursorEl = navCursorRef.current; // .cursor
    const customCursorEl = customCursorRef.current; // .custom-cursor (#cursor)

    // (A) navCursor: 정확히 마우스 위치 따라다니게
    const onMoveNavCursor = (e) => {
      if (!navCursorEl) return;
      const { clientX: x, clientY: y } = e;
      navCursorEl.style.transform = `translate(${x - 15}px, ${y - 15}px)`;
    };
    window.addEventListener("mousemove", onMoveNavCursor);

    // (B) 링크 span 살짝 따라다니는 효과
    const links = document.querySelectorAll(".cursor-nav .link");

    const animateLink = function (e) {
      const span = this.querySelector("span");
      if (!span) return;

      const { offsetX: x, offsetY: y } = e;
      const { offsetWidth: width, offsetHeight: height } = this;

      const move = 25;
      const xMove = (x / width) * (move * 2) - move;
      const yMove = (y / height) * (move * 2) - move;

      span.style.transform = `translate(${xMove}px, ${yMove}px)`;
      if (e.type === "mouseleave") span.style.transform = "";
    };

    links.forEach((link) => {
      link.addEventListener("mousemove", animateLink);
      link.addEventListener("mouseleave", animateLink);
    });

    // (C) customCursor: left/top으로 따라다니게 (원본의 #cursor)
    const onMoveCustomCursor = (e) => {
      if (!customCursorEl) return;
      customCursorEl.style.left = e.clientX + "px";
      customCursorEl.style.top = e.clientY + "px";
    };
    document.addEventListener("mousemove", onMoveCustomCursor);

    return () => {
      window.removeEventListener("mousemove", onMoveNavCursor);
      document.removeEventListener("mousemove", onMoveCustomCursor);
      links.forEach((link) => {
        link.removeEventListener("mousemove", animateLink);
        link.removeEventListener("mouseleave", animateLink);
      });
    };
  }, []);

  return (
    <div>
      <div className="custom-cursor" id="cursor" ref={customCursorRef} />

      <div id="wrapper">
        <canvas id="canvas" className="noise" ref={canvasRef} />

        <div id="js-scroll" className="main-page" ref={mainScrollRef}>
          <nav className="nav-main" data-scroll-section>
            <ul className="nav-list" id="direction">
              <li className="nav-list__item">
                <div
                  className="item__translate"
                  data-scroll
                  data-scroll-direction="horizontal"
                  data-scroll-target="#direction"
                  data-scroll-speed="8"
                  data-scroll-delay="0.05"
                >
                  <div className="item__container">
                    <span className="item-first-title">Design</span>
                    <span className="arrow">→</span>
                    <span className="item-second-title">Design</span>
                    <span className="arrow">→</span>
                    <span className="item-third-title">Code</span>
                  </div>
                </div>
              </li>

              <li className="nav-list__item">
                <div
                  className="item__translate"
                  data-scroll
                  data-scroll-direction="horizontal"
                  data-scroll-target="#direction"
                  data-scroll-speed="-6"
                  data-scroll-delay="0.1"
                >
                  <div className="item__container">
                    <span className="item-first-title">Develop</span>
                    <span className="arrow">→</span>
                    <span className="item-second-title">Code</span>
                    <span className="arrow">→</span>
                    <span className="item-third-title">AI</span>
                  </div>
                </div>
              </li>

              <li className="nav-list__item">
                <div
                  className="item__translate"
                  data-scroll
                  data-scroll-direction="horizontal"
                  data-scroll-target="#direction"
                  data-scroll-speed="8"
                  data-scroll-delay="0.1"
                >
                  <div className="item__container">
                    <span className="item-first-title">Github</span>
                    <span className="arrow">→</span>
                    <span className="item-second-title">Velog</span>
                    <span className="arrow">→</span>
                    <span className="item-third-title">Figma</span>
                  </div>
                </div>
              </li>

              <li className="nav-list__item">
                <div
                  className="item__translate"
                  data-scroll
                  data-scroll-direction="horizontal"
                  data-scroll-target="#direction"
                  data-scroll-speed="-8"
                  data-scroll-delay="0.05"
                >
                  <div className="item__container">
                    <span className="item-first-title">Design</span>
                    <span className="arrow">→</span>
                    <span className="item-second-title">Publish</span>
                    <span className="arrow">→</span>
                    <span className="item-third-title">React</span>
                  </div>
                </div>
              </li>

              <li className="nav-list__item">
                <div
                  className="item__translate"
                  data-scroll
                  data-scroll-direction="horizontal"
                  data-scroll-target="#direction"
                  data-scroll-speed="5"
                  data-scroll-delay="0.1"
                >
                  <div className="item__container">
                    <span className="item-first-title">Passion</span>
                    <span className="arrow">→</span>
                    <span className="item-second-title">Humility</span>
                    <span className="arrow">→</span>
                    <span className="item-third-title">Potential</span>
                  </div>
                </div>
              </li>
            </ul>
          </nav>

          {/* MAIN CONTENT */}
          <div className="contet-page" data-scroll-section>
            <div className="list-main">
              <ul className="list-main__books">
                <li className="list-main__item blur-effect item-1" data-scroll data-scroll-delay="0.8" data-scroll-speed="1">
                  안녕하세요!
                </li>
                <li className="list-main__item blur-effect item-2" data-scroll data-scroll-delay="0.6" data-scroll-speed="1">
                  어제보다 더 나은 내일을
                </li>
                <li className="list-main__item blur-effect item-3" data-scroll data-scroll-delay="0.4" data-scroll-speed="1">
                  개발하는 FE 개발자
                </li>
                <li className="list-main__item blur-effect item-4" data-scroll data-scroll-delay="0.2" data-scroll-speed="1">
                  김이레 입니다!
                </li>
                <li className="list-main__item blur-effect item-5" data-scroll data-scroll-delay="0.08" data-scroll-speed="1">
                  Provide a great website
                </li>
                <li className="list-main__item blur-effect item-6" data-scroll data-scroll-delay="0.06" data-scroll-speed="1">
                  experience for your users
                </li>
                <li className="list-main__item blur-effect item-7" data-scroll data-scroll-delay="0.04" data-scroll-speed="1">
                  I glad to see you ! ;)
                </li>
              </ul>
            </div>

            <div className="list-description">
              <ul>
                <li className="blur-effect" data-scroll>
                  <sup className="number-description">(00-1)</sup>
                  <span className="text-description">And they glorified God in me</span>
                </li>
                <li className="blur-effect" data-scroll>
                  <sup className="number-description">(00-2)</sup>
                  <span className="text-description">Your word is a lamp to my feet and a light to my path.</span>
                </li>
                <li className="blur-effect" data-scroll>
                  <sup className="number-description">(00-3)</sup>
                  <span className="text-description">
                    Whatever you do, work heartily, as for the Lord and not for men
                  </span>
                </li>
                <li className="blur-effect" data-scroll>
                  <sup className="number-description">(00-4)</sup>
                  <span className="text-description">
                    Encourages those who hope in the Lord to be strong and courageous
                  </span>
                </li>
                <li className="blur-effect" data-scroll>
                  <sup className="number-description">(00-5)</sup>
                  <span className="text-description">
                    For God has not given us the spirit of fear, but of power and of love and of a sound mind
                  </span>
                </li>
              </ul>
            </div>

            <div className="text-content-page blur-effect" data-scroll>
              <p>
                안녕하세요! 저는 18살 프론트엔드 개발자 김이레 입니다! 저는 지난 2년간 html css javascript를
                중심으로 프론트엔드 기술을 학습하여 실무 역량을 키워왔습니다. 또한{" "}
                <span id="bold">직접 개발한 웹페이지를 직접 배포하여 300명 이상의 사용자를 확보한 경험</span>을
                보유하고 있으며 이를 통해 사용자 피드백을 수집하고 서비스를 개선하는 전체적인 개발 프로세스를
                경험 했습니다 저는 사용자와의 <span id="bold">상호작용을 중시</span> 하며,{" "}
                <span id="bold">단순한 기능 구현을 넘어 사용자에게 독창적이고 인상적인</span> 웹사이트 경험을
                제공하는 것을 목표로 합니다. 앞으로 지속적인 학습을 통해 더 나은 사용자 경험을 제공하는 프론트엔드
                개발자로 성장하고자 합니다 저에 대해 더 알고싶으시다면 아래 메뉴를 참고해 주세요 👇
              </p>
            </div>
          </div>

          <div className="nav-wrapper" data-scroll-section>
            <nav className="cursor-nav">
              <a href="./index.html" className="link">
                <span>Home</span>
              </a>
              <a href="./contact.html" className="link">
                <span>Contact</span>
              </a>
              <a href="./profile.html" className="link">
                <span>Profile</span>
              </a>
              <a href="./project.html" className="link">
                <span>Projects</span>
              </a>
              <a href="./skills.html" className="link">
                <span>Skills</span>
              </a>
            </nav>
            <div className="cursor" ref={navCursorRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}