<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Intro</title>
    <link
      rel="stylesheet"
      href="https://rawcdn.githack.com/locomotivemtl/locomotive-scroll/3e3bf62d1ea55586d69403dc6325b4f34130f3a8/dist/locomotive-scroll.min.css"
    />
    <link rel="stylesheet" href="./intro.css" />
  </head>
  <body>
    <div class="custom-cursor" id="cursor"></div>
    <div id="wrapper">
      <canvas id="canvas" class="noise"></canvas>
      <div id="js-scroll" class="main-page">
        <nav class="nav-main" data-scroll-section>
          <ul class="nav-list" id="direction">
            <li class="nav-list__item">
              <div
                class="item__translate"
                data-scroll
                data-scroll-direction="horizontal"
                data-scroll-target="#direction"
                data-scroll-speed="8"
                data-scroll-delay="0.05"
              >
                <div class="item__container">
                  <span class="item-first-title">Design</span
                  ><span class="arrow">→</span>
                  <span class="item-second-title">Design</span
                  ><span class="arrow">→</span
                  ><span class="item-third-title">Code</span>
                </div>
              </div>
            </li>
            <li class="nav-list__item">
              <div
                class="item__translate"
                data-scroll
                data-scroll-direction="horizontal"
                data-scroll-target="#direction"
                data-scroll-speed="-6"
                data-scroll-delay="0.1"
              >
                <div class="item__container">
                  <span class="item-first-title">Develop</span
                  ><span class="arrow">→</span>
                  <span class="item-second-title">Code</span
                  ><span class="arrow">→</span
                  ><span class="item-third-title">AI</span>
                </div>
              </div>
            </li>
            <li class="nav-list__item">
              <div
                class="item__translate"
                data-scroll
                data-scroll-direction="horizontal"
                data-scroll-target="#direction"
                data-scroll-speed="8"
                data-scroll-delay="0.1"
              >
                <div class="item__container">
                  <span class="item-first-title">Github</span
                  ><span class="arrow">→</span>
                  <span class="item-second-title">Velog</span
                  ><span class="arrow">→</span
                  ><span class="item-third-title">Figma</span>
                </div>
              </div>
            </li>
            <li class="nav-list__item">
              <div
                class="item__translate"
                data-scroll
                data-scroll-direction="horizontal"
                data-scroll-target="#direction"
                data-scroll-speed="-8"
                data-scroll-delay="0.05"
              >
                <div class="item__container">
                  <span class="item-first-title">Design</span
                  ><span class="arrow">→</span>
                  <span class="item-second-title">Publish</span
                  ><span class="arrow">→</span
                  ><span class="item-third-title">React</span>
                </div>
              </div>
            </li>
            <li class="nav-list__item">
              <div
                class="item__translate"
                data-scroll
                data-scroll-direction="horizontal"
                data-scroll-target="#direction"
                data-scroll-speed="5"
                data-scroll-delay="0.1"
              >
                <div class="item__container">
                  <span class="item-first-title">Passion</span
                  ><span class="arrow">→</span>
                  <span class="item-second-title">Humility</span
                  ><span class="arrow">→</span
                  ><span class="item-third-title">Potential</span>
                </div>
              </div>
            </li>
          </ul>
        </nav>

        <!-- MAIN CONTENT -->
        <div class="contet-page" data-scroll-section>
          <div class="list-main">
            <ul class="list-main__books">
              <li
                class="list-main__item blur-effect item-1"
                data-scroll
                data-scroll-delay="0.8"
                data-scroll-speed="1"
              >
                안녕하세요!
              </li>
              <li
                class="list-main__item blur-effect item-2"
                data-scroll
                data-scroll-delay="0.6"
                data-scroll-speed="1"
              >
                어제보다 더 나은 내일을
              </li>
              <li
                class="list-main__item blur-effect item-3"
                data-scroll
                data-scroll-delay="0.4"
                data-scroll-speed="1"
              >
                개발하는 FE 개발자
              </li>
              <li
                class="list-main__item blur-effect item-4"
                data-scroll
                data-scroll-delay="0.2"
                data-scroll-speed="1"
              >
                김이레 입니다!
              </li>
              <li
                class="list-main__item blur-effect item-5"
                data-scroll
                data-scroll-delay="0.08"
                data-scroll-speed="1"
              >
                Provide a great website
              </li>
              <li
                class="list-main__item blur-effect item-6"
                data-scroll
                data-scroll-delay="0.06"
                data-scroll-speed="1"
              >
                experience for your users
              </li>
              <li
                class="list-main__item blur-effect item-7"
                data-scroll
                data-scroll-delay="0.04"
                data-scroll-speed="1"
              >
                I glad to see you ! ;)
              </li>
            </ul>
          </div>

          <div class="list-description">
            <ul>
              <li class="blur-effect" data-scroll>
                <sup class="number-description">(00-1)</sup
                ><span class="text-description"
                  >And they glorified God in me</span
                >
              </li>
              <li class="blur-effect" data-scroll>
                <sup class="number-description">(00-2)</sup
                ><span class="text-description"
                  >Your word is a lamp to my feet and a light to my path.</span
                >
              </li>
              <li class="blur-effect" data-scroll>
                <sup class="number-description">(00-3)</sup
                ><span class="text-description"
                  >Whatever you do, work heartily, as for the Lord and not for
                  men</span
                >
              </li>
              <li class="blur-effect" data-scroll>
                <sup class="number-description">(00-4)</sup
                ><span class="text-description"
                  >Encourages those who hope in the Lord to be strong and
                  courageous</span
                >
              </li>
              <li class="blur-effect" data-scroll>
                <sup class="number-description">(00-5)</sup
                ><span class="text-description"
                  >For God has not given us the spirit of fear, but of power and
                  of love and of a sound mind</span
                >
              </li>
            </ul>
          </div>

          <div class="text-content-page blur-effect" data-scroll>
            <p>
              안녕하세요! 저는 18살 프론트엔드 개발자 김이레 입니다! 저는 지난
              2년간 html css javascript를 중심으로 프론트엔드 기술을 학습하여
              실무 역량을 키워왔습니다. 또한
              <span id="bold"
                >직접 개발한 웹페이지를 직접 배포하여 300명 이상의 사용자를
                확보한 경험</span
              >을 보유하고 있으며 이를 통해 사용자 피드백을 수집하고 서비스를
              개선하는 전체적인 개발 프로세스를 경험 했습니다 저는 사용자와의
              <span id="bold">상호작용을 중시</span> 하며,
              <span id="bold"
                >단순한 기능 구현을 넘어 사용자에게 독창적이고 인상적인</span
              >
              웹사이트 경험을 제공하는 것을 목표로 합니다. 앞으로 지속적인
              학습을 통해 더 나은 사용자 경험을 제공하는 프론트엔드 개발자로
              성장하고자 합니다 저에 대해 더 알고싶으시다면 아래 메뉴를 참고해
              주세요 👇
            </p>
          </div>
        </div>
        <div class="nav-wrapper" data-scroll-section>
          <nav class="cursor-nav">
            <a href="./index.html" class="link"><span>Home</span></a>
            <a href="./contact.html" class="link"><span>Contact</span></a>
            <a href="./profile.html" class="link"><span>Profile</span></a>
            <a href="./project.html" class="link"><span>Projects</span></a>
            <a href="./skills.html" class="link"><span>Skills</span></a>
          </nav>
          <div class="cursor"></div>
        </div>
      </div>
    </div>

    <script src="https://rawcdn.githack.com/locomotivemtl/locomotive-scroll/3e3bf62d1ea55586d69403dc6325b4f34130f3a8/dist/locomotive-scroll.min.js"></script>
    <script src="./intro.js"></script>
  </body>
</html>
