/**
 * 공부모아 (gongbumoa) - Cloudflare Worker
 *
 * 이 한 파일이 사이트 전체를 담당합니다.
 *  - "/"                          홈페이지
 *  - "/지역", "/과목"             허브 페이지
 *  - "/서울/강남구/역삼동/수학과외"  지역 x 과목 페이지 (약 3만 개)
 *  - "/sitemap.xml", "/robots.txt"
 *
 * 지역 데이터는 regions.js 에 따로 있습니다 (법정동 5,067개).
 * 과목을 추가하려면 아래 SUBJECTS 배열만 수정하세요.
 */

import REGIONS from './regions.js';

/* ========== 홈페이지 ========== */
const HOME_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>공부모아 · 초·중·고 맞춤 수업</title>

<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">

<style>
  :root{
    --paper:#FBFAF6;
    --card:#FFFFFF;
    --ink:#232741;
    --ink-soft:#5B6079;
    --line:#EAE7DC;
    --blue:#10C46E;      /* 화사한 그린 (메인) */
    --blue-deep:#0AA35A;
    --sky:#DFF7E9;       /* 연한 그린 배경 */
    --yellow:#FFC93C;    /* 햇살 옐로우 */
    --coral:#FF7A59;     /* 포인트 코랄 */
    --mint:#12C971;      /* 성공/상승 */
    --grape:#9B6DFF;     /* 포인트 퍼플 */
    --pink:#FF6FA5;      /* 포인트 핑크 */
    --shadow:0 14px 34px -18px rgba(35,39,65,.35);
    --shadow-soft:0 8px 24px -16px rgba(35,39,65,.3);
    --radius:22px;
  }

  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{
    font-family:'Pretendard',system-ui,sans-serif;
    background:var(--paper);
    color:var(--ink);
    line-height:1.6;
    -webkit-font-smoothing:antialiased;
    overflow-x:hidden;
  }
  h1,h2,h3,.jua{font-family:'Pretendard',sans-serif;font-weight:800;letter-spacing:-.03em}
  a{color:inherit;text-decoration:none}
  .wrap{width:min(1120px,92vw);margin:0 auto}
  .accent{color:var(--blue)}
  section{position:relative}

  /* ---------- NAV ---------- */
  header{
    position:sticky;top:0;z-index:50;
    background:rgba(251,250,246,.82);
    backdrop-filter:saturate(160%) blur(10px);
    border-bottom:1px solid var(--line);
  }
  .nav{display:flex;align-items:center;justify-content:space-between;height:70px}
  .brand{display:flex;align-items:center;gap:10px;font-family:'Pretendard';font-weight:800;font-size:22px}
  .brand .mark{
    width:38px;height:38px;border-radius:12px;display:grid;place-items:center;
    background:linear-gradient(135deg,var(--blue),#3FD79C);color:#fff;font-size:20px;
    box-shadow:0 8px 16px -8px var(--blue);transform:rotate(-6deg);
  }
  .nav-links{display:flex;align-items:center;gap:30px;font-weight:600;font-size:15px;color:var(--ink-soft)}
  .nav-links a{transition:color .2s}
  .nav-links a:hover{color:var(--ink)}
  .btn{
    display:inline-flex;align-items:center;gap:8px;
    font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px;
    border:none;cursor:pointer;transition:transform .18s ease,box-shadow .2s ease;
    font-family:'Pretendard';
  }
  .btn-primary{background:var(--blue);color:#fff;box-shadow:0 12px 22px -12px var(--blue)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 26px -12px var(--blue)}
  .btn-ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line)}
  .btn-ghost:hover{border-color:var(--blue);color:var(--blue)}
  .nav .btn{padding:11px 20px}
  .nav-toggle{display:none;background:none;border:none;font-size:26px;cursor:pointer;color:var(--ink)}

  /* ---------- HERO ---------- */
  .hero{padding:70px 0 90px;position:relative}
  .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
  .eyebrow{
    display:inline-flex;align-items:center;gap:8px;
    background:var(--sky);color:var(--blue-deep);font-weight:700;font-size:13.5px;
    padding:7px 15px;border-radius:999px;margin-bottom:22px;
  }
  .eyebrow .dot{width:8px;height:8px;border-radius:50%;background:var(--blue);animation:pulse 1.8s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .hero h1{font-size:clamp(34px,5vw,54px);line-height:1.22;margin-bottom:20px}
  .hero h1 .hl{position:relative;color:var(--blue);white-space:nowrap}
  .hero h1 .hl::after{
    content:"";position:absolute;left:-2%;right:-2%;bottom:6px;height:36%;
    background:var(--yellow);opacity:.5;z-index:-1;border-radius:4px;transform:rotate(-1.2deg);
  }
  .hero p.lead{font-size:18px;color:var(--ink-soft);max-width:460px;margin-bottom:30px}
  .hero-cta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:34px}
  .trust{display:flex;gap:28px;flex-wrap:wrap}
  .trust .num{font-family:'Pretendard';font-weight:800;font-size:30px;color:var(--ink);line-height:1}
  .trust .lbl{font-size:13.5px;color:var(--ink-soft);margin-top:4px}

  /* grade card (signature) */
  .hero-visual{position:relative;display:grid;place-items:center;min-height:380px}
  .g-card{
    background:var(--card);border-radius:26px;padding:26px 28px;width:290px;
    box-shadow:var(--shadow);border:1px solid var(--line);position:relative;z-index:2;
  }
  .g-card .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
  .g-card .who{font-weight:700;font-size:15px}
  .g-card .who span{display:block;font-size:12.5px;color:var(--ink-soft);font-weight:500}
  .g-card .pill{background:#F0FBF6;color:var(--mint);font-weight:700;font-size:12.5px;padding:5px 11px;border-radius:999px}
  .grade-row{display:flex;align-items:center;justify-content:center;gap:14px;margin:6px 0 16px}
  .grade-box{text-align:center}
  .grade-box .g{font-family:'Pretendard';font-weight:800;font-size:46px;line-height:1}
  .grade-box.old .g{color:#C4C7D4}
  .grade-box.new .g{color:var(--blue)}
  .grade-box .t{font-size:12px;color:var(--ink-soft);margin-top:2px}
  .arrow{font-size:26px;color:var(--mint)}
  .bars{display:flex;align-items:flex-end;gap:7px;height:56px}
  .bars span{flex:1;background:var(--sky);border-radius:6px 6px 3px 3px;transform-origin:bottom;animation:grow 1.4s cubic-bezier(.2,.8,.2,1) both}
  .bars span:nth-child(1){height:38%;animation-delay:.1s}
  .bars span:nth-child(2){height:52%;animation-delay:.2s}
  .bars span:nth-child(3){height:44%;animation-delay:.3s}
  .bars span:nth-child(4){height:70%;animation-delay:.4s;background:#A7E8C9}
  .bars span:nth-child(5){height:100%;background:var(--blue);animation-delay:.5s}
  @keyframes grow{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}
  .badge-float{
    position:absolute;background:#fff;border:1px solid var(--line);border-radius:16px;
    padding:11px 15px;font-weight:700;font-size:14px;box-shadow:var(--shadow-soft);z-index:3;
    display:flex;align-items:center;gap:8px;animation:bob 3.4s ease-in-out infinite;
  }
  .badge-float .ic{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:15px}
  .b1{top:16px;left:-6%}
  .b1 .ic{background:#FFF3D6}
  .b2{bottom:20px;right:-4%;animation-delay:1.2s}
  .b2 .ic{background:#FFE6E1}
  @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
  .blob{position:absolute;width:300px;height:300px;border-radius:50%;filter:blur(10px);opacity:.5;z-index:0}
  .blob.a{background:radial-gradient(circle,#CDF0DE,transparent 70%);top:-30px;right:-20px}
  .blob.b{background:radial-gradient(circle,#FFEFCF,transparent 70%);bottom:-40px;left:0}

  /* ---------- LOGO STRIP / FEATURES ---------- */
  .features{padding:20px 0 70px}
  .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  .feat{
    background:var(--card);border:1px solid var(--line);border-radius:var(--radius);
    padding:30px 26px;box-shadow:var(--shadow-soft);transition:transform .22s cubic-bezier(.2,.9,.3,1.4),box-shadow .2s ease;
  }
  .feat:hover{transform:translateY(-7px) rotate(.5deg);box-shadow:var(--shadow)}
  .feat .ic{
    width:52px;height:52px;border-radius:15px;display:grid;place-items:center;font-size:26px;margin-bottom:16px;
    transition:transform .22s ease;
  }
  .feat:hover .ic{transform:rotate(-8deg) scale(1.08)}
  .feat:nth-child(1) .ic{background:var(--sky)}
  .feat:nth-child(2) .ic{background:#FFF3D6}
  .feat:nth-child(3) .ic{background:#FFE6E1}
  .feat h3{font-size:20px;margin-bottom:8px}
  .feat p{font-size:15px;color:var(--ink-soft)}

  /* ---------- CATEGORY ---------- */
  .category{padding:64px 0 30px}
  .cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
  .cat{
    display:block;border-radius:24px;padding:30px 24px 26px;position:relative;overflow:hidden;
    border:2px solid var(--line);background:var(--card);
    transition:transform .22s cubic-bezier(.2,.9,.3,1.4),box-shadow .22s ease,border-color .22s ease;
  }
  .cat::before{
    content:"";position:absolute;width:120px;height:120px;border-radius:50%;
    top:-46px;right:-30px;opacity:.16;transition:transform .3s ease;
  }
  .cat:hover{transform:translateY(-8px) rotate(-.6deg)}
  .cat:hover::before{transform:scale(1.35)}
  .cat-ic{
    display:inline-grid;place-items:center;width:60px;height:60px;border-radius:18px;
    font-size:30px;margin-bottom:16px;position:relative;transition:transform .22s ease;
  }
  .cat:hover .cat-ic{transform:rotate(-8deg) scale(1.06)}
  .cat h3{font-size:21px;margin-bottom:8px}
  .cat p{font-size:14.5px;color:var(--ink-soft);margin-bottom:18px;min-height:63px}
  .cat-go{font-weight:800;font-size:14.5px}
  /* 카테고리별 컬러 */
  .cat-1:hover{border-color:var(--mint);box-shadow:0 18px 30px -18px var(--mint)}
  .cat-1::before{background:var(--mint)} .cat-1 .cat-ic{background:var(--sky)} .cat-1 .cat-go{color:var(--blue-deep)}
  .cat-2:hover{border-color:var(--coral);box-shadow:0 18px 30px -18px var(--coral)}
  .cat-2::before{background:var(--coral)} .cat-2 .cat-ic{background:#FFEAE1} .cat-2 .cat-go{color:var(--coral)}
  .cat-3:hover{border-color:var(--yellow);box-shadow:0 18px 30px -18px var(--yellow)}
  .cat-3::before{background:var(--yellow)} .cat-3 .cat-ic{background:#FFF4D6} .cat-3 .cat-go{color:#E0A300}
  .cat-4:hover{border-color:var(--grape);box-shadow:0 18px 30px -18px var(--grape)}
  .cat-4::before{background:var(--grape)} .cat-4 .cat-ic{background:#F0E9FF} .cat-4 .cat-go{color:var(--grape)}

  /* ---------- SECTION HEADING ---------- */
  .sec-head{text-align:center;max-width:640px;margin:0 auto 46px}
  .sec-tag{display:inline-block;color:var(--blue-deep);background:var(--sky);font-weight:800;font-size:14px;margin-bottom:14px;padding:7px 16px;border-radius:999px}
  .sec-head h2{font-size:clamp(28px,4vw,40px);line-height:1.25;margin-bottom:12px}
  .sec-head p{font-size:16.5px;color:var(--ink-soft)}

  /* ---------- CURRICULUM ---------- */
  .curr{padding:80px 0;background:linear-gradient(180deg,#fff,#FBFAF6)}
  .tabs{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:38px}
  .tab{
    font-weight:700;font-size:15px;padding:11px 22px;border-radius:999px;cursor:pointer;
    background:#fff;border:1.5px solid var(--line);color:var(--ink-soft);transition:all .18s;
  }
  .tab.on{background:linear-gradient(135deg,var(--blue),var(--mint));color:#fff;border-color:transparent;box-shadow:0 10px 18px -10px var(--blue)}
  .tab:hover:not(.on){border-color:var(--blue);color:var(--blue);transform:translateY(-2px)}
  .curr-panel{display:none;animation:fade .35s ease}
  .curr-panel.on{display:block}
  @keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
  .step{
    background:var(--card);border:1px solid var(--line);border-radius:var(--radius);
    padding:26px 22px;position:relative;box-shadow:var(--shadow-soft);
  }
  .step .n{
    font-family:'Pretendard';font-weight:800;font-size:15px;color:#fff;background:var(--blue);
    width:34px;height:34px;border-radius:11px;display:grid;place-items:center;margin-bottom:16px;
  }
  .step:nth-child(2) .n{background:var(--coral)}
  .step:nth-child(3) .n{background:var(--yellow);color:var(--ink)}
  .step:nth-child(4) .n{background:var(--mint)}
  .step h4{font-family:'Pretendard';font-weight:800;font-size:18px;margin-bottom:8px}
  .step p{font-size:14.5px;color:var(--ink-soft)}
  .step .tag{display:inline-block;margin-top:14px;font-size:12.5px;font-weight:700;color:var(--blue);background:var(--sky);padding:5px 11px;border-radius:999px}

  /* ---------- REVIEWS ---------- */
  .reviews{padding:80px 0 40px}
  .rev-grid{columns:3;column-gap:22px}
  .rev{
    break-inside:avoid;margin-bottom:22px;background:var(--card);
    border:1px solid var(--line);border-radius:var(--radius);padding:26px 24px;box-shadow:var(--shadow-soft);
  }
  .stars{color:var(--yellow);font-size:15px;letter-spacing:2px;margin-bottom:12px}
  .rev q{display:block;font-size:15.5px;color:var(--ink);quotes:none;margin-bottom:18px;line-height:1.65}
  .rev .who{display:flex;align-items:center;gap:11px}
  .rev .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-family:'Pretendard';font-weight:800;font-size:16px;color:#fff}
  .rev .who b{font-size:14.5px;display:block}
  .rev .who span{font-size:12.5px;color:var(--ink-soft)}

  /* ---------- CTA BAND ---------- */
  .cta-band{padding:60px 0 90px}
  .cta-inner{
    background:linear-gradient(135deg,var(--blue),#2CC98A);color:#fff;border-radius:30px;
    padding:56px 48px;text-align:center;position:relative;overflow:hidden;box-shadow:var(--shadow);
  }
  .cta-inner::before,.cta-inner::after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.12)}
  .cta-inner::before{width:220px;height:220px;top:-70px;right:-40px}
  .cta-inner::after{width:160px;height:160px;bottom:-60px;left:-30px}
  .cta-inner h2{font-size:clamp(26px,4vw,38px);margin-bottom:12px;position:relative}
  .cta-inner p{font-size:16.5px;opacity:.92;margin-bottom:28px;position:relative}
  .cta-inner .btn{position:relative}
  .btn-yellow{background:var(--yellow);color:var(--ink)}
  .btn-yellow:hover{transform:translateY(-2px);box-shadow:0 14px 24px -12px rgba(0,0,0,.4)}
  .btn-white-ghost{background:rgba(255,255,255,.15);color:#fff;border:1.5px solid rgba(255,255,255,.4)}
  .btn-white-ghost:hover{background:rgba(255,255,255,.25)}
  .cta-inner .btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}

  /* ---------- FOOTER ---------- */
  footer{border-top:1px solid var(--line);padding:44px 0 40px;color:var(--ink-soft);font-size:14px}
  .foot{display:flex;justify-content:space-between;align-items:flex-start;gap:30px;flex-wrap:wrap}
  .foot .brand{font-size:20px;color:var(--ink);margin-bottom:10px}
  .foot-links{display:flex;gap:40px;flex-wrap:wrap}
  .foot-links b{display:block;color:var(--ink);font-size:14px;margin-bottom:10px;font-family:'Pretendard';font-weight:700}
  .foot-links a{display:block;margin-bottom:7px;transition:color .2s}
  .foot-links a:hover{color:var(--blue)}
  .copy{margin-top:30px;font-size:13px;color:#A7AABB}

  /* ---------- REVEAL ---------- */
  .reveal{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
  .reveal.in{opacity:1;transform:none}

  /* ---------- RESPONSIVE ---------- */
  @media(max-width:920px){
    .hero-grid{grid-template-columns:1fr;gap:40px}
    .hero-visual{order:-1;min-height:340px}
    .feat-grid{grid-template-columns:1fr}
    .cat-grid{grid-template-columns:repeat(2,1fr)}
    .cat p{min-height:auto}
    .steps{grid-template-columns:repeat(2,1fr)}
    .rev-grid{columns:2}
  }
  @media(max-width:640px){
    .nav-links{display:none}
    .nav-toggle{display:block}
    .steps{grid-template-columns:1fr}
    .cat-grid{grid-template-columns:1fr}
    .rev-grid{columns:1}
    .trust{gap:20px}
    .cta-inner{padding:44px 24px}
    .hero{padding:44px 0 64px}
  }
  @media(prefers-reduced-motion:reduce){
    *{animation:none!important;transition:none!important}
    .reveal{opacity:1;transform:none}
  }
</style>
</head>
<body>

<!-- NAV -->
<header>
  <div class="wrap nav">
    <a href="#" class="brand"><span class="mark">공</span>공부모아</a>
    <nav class="nav-links">
      <a href="/지역">지역별수업</a>
      <a href="/학교">학교별수업</a>
      <a href="/과목">과목수업</a>
      <a href="/기타">기타수업</a>
    </nav>
    <a href="#contact" class="btn btn-primary">무료 상담 받기</a>
    <button class="nav-toggle" aria-label="메뉴">☰</button>
  </div>
</header>

<!-- HERO -->
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow"><span class="dot"></span>초 · 중 · 고 맞춤 과외</span>
      <h1>우리 아이 성적,<br><span class="hl">한 등급씩</span> 확실하게 올려요</h1>
      <p class="lead">한 명 한 명 진단부터 시작하는 1:1 맞춤 수업. 아이의 속도에 맞춰 개념을 잡고, 시험에서 결과로 증명합니다.</p>
      <div class="hero-cta">
        <a href="#contact" class="btn btn-primary">무료 상담 받기 →</a>
        <a href="#curriculum" class="btn btn-ghost">커리큘럼 보기</a>
      </div>
      <div class="trust">
        <div><div class="num">1,200+</div><div class="lbl">누적 수업 학생</div></div>
        <div><div class="num">4.9<span style="font-size:16px">/5</span></div><div class="lbl">수강생 평균 만족도</div></div>
        <div><div class="num">92%</div><div class="lbl">성적 향상 경험</div></div>
      </div>
    </div>

    <div class="hero-visual">
      <div class="blob a"></div>
      <div class="blob b"></div>

      <div class="badge-float b1"><span class="ic">📈</span>3등급 → 1등급</div>
      <div class="badge-float b2"><span class="ic">🎯</span>내신 100점</div>

      <div class="g-card">
        <div class="top">
          <div class="who">민준이 · 중2 수학<span>3개월 수업 결과</span></div>
          <div class="pill">▲ 상승</div>
        </div>
        <div class="grade-row">
          <div class="grade-box old"><div class="g">4</div><div class="t">시작 등급</div></div>
          <div class="arrow">→</div>
          <div class="grade-box new"><div class="g">1</div><div class="t">현재 등급</div></div>
        </div>
        <div class="bars"><span></span><span></span><span></span><span></span><span></span></div>
      </div>
    </div>
  </div>
</section>

<!-- CATEGORY -->
<section class="category" id="category">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-tag">수업 카테고리</div>
      <h2>어떤 수업을 찾고 있나요? ✨</h2>
      <p>원하는 방식으로 골라서 딱 맞는 수업을 만나보세요.</p>
    </div>
    <div class="cat-grid">
      <a href="/지역" class="cat cat-1 reveal">
        <span class="cat-ic">📍</span>
        <h3>지역별수업</h3>
        <p>우리 동네에서 가까운 선생님을 찾아 대면·화상으로 만나요.</p>
        <span class="cat-go">동네 선생님 보기 →</span>
      </a>
      <a href="/학교" class="cat cat-2 reveal">
        <span class="cat-ic">🏫</span>
        <h3>학교별수업</h3>
        <p>우리 학교 시험 범위와 출제 유형에 딱 맞춘 내신 대비 수업.</p>
        <span class="cat-go">학교 찾기 →</span>
      </a>
      <a href="/과목" class="cat cat-3 reveal">
        <span class="cat-ic">📐</span>
        <h3>과목수업</h3>
        <p>수학·영어·국어부터 탐구까지, 필요한 과목만 골라 집중해요.</p>
        <span class="cat-go">과목 고르기 →</span>
      </a>
      <a href="/기타" class="cat cat-4 reveal">
        <span class="cat-ic">🎨</span>
        <h3>기타수업</h3>
        <p>논술·면접·방학 특강 등 목표에 맞춘 다양한 특별 수업.</p>
        <span class="cat-go">특강 둘러보기 →</span>
      </a>
    </div>
  </div>
</section>
<section class="features" id="features">
  <div class="wrap feat-grid">
    <div class="feat reveal">
      <div class="ic">🧭</div>
      <h3>진단부터 시작</h3>
      <p>첫 수업 전 무료 진단으로 아이의 현재 위치와 부족한 개념을 정확히 파악해요.</p>
    </div>
    <div class="feat reveal">
      <div class="ic">📚</div>
      <h3>학교별 맞춤 커리큘럼</h3>
      <p>학교 시험 범위와 출제 스타일에 맞춰 교재와 문제를 준비합니다.</p>
    </div>
    <div class="feat reveal">
      <div class="ic">💬</div>
      <h3>학부모 리포트</h3>
      <p>매주 수업 내용과 아이의 성장 과정을 리포트로 꼼꼼하게 공유해요.</p>
    </div>
  </div>
</section>

<!-- CURRICULUM -->
<section class="curr" id="curriculum">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-tag">수업 & 커리큘럼</div>
      <h2>아이의 속도에 맞춘<br>4단계 성장 로드맵</h2>
      <p>학년과 과목을 골라 어떤 흐름으로 수업이 진행되는지 확인해 보세요.</p>
    </div>

    <div class="tabs reveal">
      <button class="tab on" data-tab="math">중·고 수학</button>
      <button class="tab" data-tab="eng">영어</button>
      <button class="tab" data-tab="kor">국어 · 논술</button>
      <button class="tab" data-tab="elem">초등 기초</button>
    </div>

    <!-- 수학 -->
    <div class="curr-panel on" id="math">
      <div class="steps">
        <div class="step"><div class="n">1</div><h4>진단 & 개념 점검</h4><p>취약 단원을 찾고 놓친 개념을 다시 잡아 기초를 단단하게 만들어요.</p><span class="tag">1~2주차</span></div>
        <div class="step"><div class="n">2</div><h4>유형별 훈련</h4><p>학교·수능 빈출 유형을 반복 연습하며 풀이 속도를 끌어올립니다.</p><span class="tag">3~6주차</span></div>
        <div class="step"><div class="n">3</div><h4>실전 & 오답 관리</h4><p>실전 문제와 오답 노트로 실수를 줄이고 자신감을 붙여요.</p><span class="tag">7~10주차</span></div>
        <div class="step"><div class="n">4</div><h4>시험 대비 마무리</h4><p>학교 기출과 예상 문제로 시험 직전 최종 점검을 합니다.</p><span class="tag">시험 2주 전</span></div>
      </div>
    </div>
    <!-- 영어 -->
    <div class="curr-panel" id="eng">
      <div class="steps">
        <div class="step"><div class="n">1</div><h4>어휘 & 문법 진단</h4><p>기본 어휘량과 문법 이해도를 점검해 학습 출발선을 정합니다.</p><span class="tag">1~2주차</span></div>
        <div class="step"><div class="n">2</div><h4>구문 독해 훈련</h4><p>긴 문장도 끊어 읽는 힘을 길러 지문 이해 속도를 높여요.</p><span class="tag">3~6주차</span></div>
        <div class="step"><div class="n">3</div><h4>유형별 문제 풀이</h4><p>빈칸·순서·주제 찾기 등 시험 유형을 집중적으로 연습합니다.</p><span class="tag">7~10주차</span></div>
        <div class="step"><div class="n">4</div><h4>내신 · 서술형 대비</h4><p>학교 교과서 지문과 서술형까지 빈틈없이 마무리해요.</p><span class="tag">시험 2주 전</span></div>
      </div>
    </div>
    <!-- 국어 -->
    <div class="curr-panel" id="kor">
      <div class="steps">
        <div class="step"><div class="n">1</div><h4>독해력 진단</h4><p>글을 읽고 핵심을 잡는 힘을 점검해 약한 영역을 찾습니다.</p><span class="tag">1~2주차</span></div>
        <div class="step"><div class="n">2</div><h4>문학 · 비문학</h4><p>지문 유형별 접근법을 익혀 어떤 글도 흔들리지 않게 만들어요.</p><span class="tag">3~6주차</span></div>
        <div class="step"><div class="n">3</div><h4>문법 & 어휘</h4><p>헷갈리는 문법과 어휘를 정리해 실수 없는 답을 고르게 합니다.</p><span class="tag">7~10주차</span></div>
        <div class="step"><div class="n">4</div><h4>서술 · 논술 완성</h4><p>생각을 논리적으로 쓰는 훈련으로 서술형까지 대비해요.</p><span class="tag">시험 2주 전</span></div>
      </div>
    </div>
    <!-- 초등 -->
    <div class="curr-panel" id="elem">
      <div class="steps">
        <div class="step"><div class="n">1</div><h4>공부 습관 만들기</h4><p>앉아서 집중하는 힘부터 차근차근 즐겁게 길러줍니다.</p><span class="tag">1~2주차</span></div>
        <div class="step"><div class="n">2</div><h4>연산 · 읽기 기초</h4><p>모든 공부의 바탕인 연산과 문해력을 탄탄하게 다져요.</p><span class="tag">3~6주차</span></div>
        <div class="step"><div class="n">3</div><h4>단원별 다지기</h4><p>학교 진도에 맞춰 개념을 이해하고 스스로 풀게 도와줍니다.</p><span class="tag">7~10주차</span></div>
        <div class="step"><div class="n">4</div><h4>중등 준비</h4><p>중학교 학습을 미리 경험하며 자신감을 붙여 나갑니다.</p><span class="tag">학기 마무리</span></div>
      </div>
    </div>
  </div>
</section>

<!-- REVIEWS -->
<section class="reviews" id="reviews">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-tag">수강 후기</div>
      <h2>학생과 학부모님이<br>직접 남긴 이야기</h2>
      <p>공부모아를 경험한 분들의 솔직한 후기예요.</p>
    </div>

    <div class="rev-grid">
      <div class="rev reveal">
        <div class="stars">★★★★★</div>
        <q>수학을 아예 포기했던 아이가 이제 스스로 문제집을 펴요. 진단부터 꼼꼼히 봐주셔서 어디서부터 막혔는지 정확히 짚어주셨어요.</q>
        <div class="who"><span class="av" style="background:var(--blue)">김</span><div><b>김O연 학부모님</b><span>중2 자녀 · 수학</span></div></div>
      </div>
      <div class="rev reveal">
        <div class="stars">★★★★★</div>
        <q>영어 독해가 항상 시간이 부족했는데, 끊어 읽는 방법을 배우고 나서 모의고사 등급이 두 개나 올랐어요!</q>
        <div class="who"><span class="av" style="background:var(--coral)">이</span><div><b>이O준 학생</b><span>고1 · 영어</span></div></div>
      </div>
      <div class="rev reveal">
        <div class="stars">★★★★★</div>
        <q>매주 오는 리포트 덕분에 집에서도 아이가 뭘 배우는지 알 수 있어 안심돼요. 선생님이 정말 다정하세요.</q>
        <div class="who"><span class="av" style="background:var(--mint)">박</span><div><b>박O은 학부모님</b><span>초5 자녀 · 전과목</span></div></div>
      </div>
      <div class="rev reveal">
        <div class="stars">★★★★★</div>
        <q>내신 대비를 학교별로 맞춰주셔서 시험에 딱 나오는 것만 공부했어요. 이번 중간고사 국어 95점 맞았습니다.</q>
        <div class="who"><span class="av" style="background:#3FB6A0">최</span><div><b>최O서 학생</b><span>중3 · 국어</span></div></div>
      </div>
      <div class="rev reveal">
        <div class="stars">★★★★★</div>
        <q>아이가 수업 시간을 기다려요. 어렵게만 느끼던 수학을 재밌게 설명해 주셔서 공부에 흥미가 생겼어요.</q>
        <div class="who"><span class="av" style="background:var(--yellow);color:var(--ink)">정</span><div><b>정O호 학부모님</b><span>초6 자녀 · 수학</span></div></div>
      </div>
      <div class="rev reveal">
        <div class="stars">★★★★★</div>
        <q>고3인데 늦었다고 생각했지만, 계획을 촘촘히 짜주셔서 마지막까지 흔들리지 않았어요. 원하던 대학 붙었습니다!</q>
        <div class="who"><span class="av" style="background:#16A870">한</span><div><b>한O린 학생</b><span>고3 · 수능 종합</span></div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-band" id="contact">
  <div class="wrap">
    <div class="cta-inner reveal">
      <h2>먼저, 무료 진단부터 받아보세요</h2>
      <p>아이의 현재 상태를 정확히 알려드리고, 딱 맞는 학습 방향을 제안해 드려요.</p>
      <div class="btns">
        <a href="#" class="btn btn-yellow">무료 상담 신청하기</a>
        <a href="#" class="btn btn-white-ghost">카카오톡으로 문의</a>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="wrap foot">
    <div>
      <div class="brand jua">공부모아</div>
      <p>초·중·고 1:1 맞춤 과외<br>아이의 속도에 맞춰 함께 성장합니다.</p>
    </div>
    <div class="foot-links">
      <div>
        <b>바로가기</b>
        <a href="/지역">지역별수업</a>
        <a href="/과목">과목수업</a>
        <a href="#reviews">수강 후기</a>
      </div>
      <div>
        <b>문의</b>
        <a href="#contact">무료 상담</a>
        <a href="#">카카오톡 채널</a>
        <a href="#">전화 문의</a>
      </div>
    </div>
  </div>
  <div class="wrap copy">© 2026 공부모아. All rights reserved.</div>
</footer>

<script>
  // 커리큘럼 탭
  document.querySelectorAll('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
      document.querySelectorAll('.curr-panel').forEach(p=>p.classList.remove('on'));
      tab.classList.add('on');
      document.getElementById(tab.dataset.tab).classList.add('on');
    });
  });

  // 스크롤 등장 애니메이션
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.14});
  document.querySelectorAll('.reveal').forEach((el,i)=>{
    el.style.transitionDelay=(i%3*0.08)+'s';
    io.observe(el);
  });

  // 모바일 메뉴 (간단 토글: 앵커로 스크롤)
  document.querySelector('.nav-toggle').addEventListener('click',()=>{
    document.getElementById('curriculum').scrollIntoView({behavior:'smooth'});
  });
</script>
</body>
</html>
`;


/* ========== 과목 정의 ========== */
// 과목 정의 — 여기만 고치면 전체 페이지에 반영됩니다.
const SUBJECTS = [
  { slug: '수학', name: '수학', emoji: '📐', color: 'mint',
    desc: '개념부터 실전까지, 막힌 단원을 정확히 짚어 성적을 끌어올립니다.' },
  { slug: '영어', name: '영어', emoji: '📗', color: 'coral',
    desc: '어휘·구문·독해를 단계별로 잡아 내신과 수능을 함께 대비합니다.' },
  { slug: '국어', name: '국어', emoji: '📖', color: 'grape',
    desc: '문학과 비문학 지문 접근법을 익혀 흔들리지 않는 독해력을 만듭니다.' },
  { slug: '과학', name: '과학', emoji: '🔬', color: 'sky',
    desc: '물리·화학·생명·지구과학 개념을 실험과 원리 중심으로 이해합니다.' },
  { slug: '사회', name: '사회', emoji: '🌏', color: 'yellow',
    desc: '흐름과 맥락을 잡아 암기 부담을 줄이고 서술형까지 대비합니다.' },
  { slug: '논술', name: '논술', emoji: '✍️', color: 'pink',
    desc: '생각을 논리적으로 구성하고 글로 풀어내는 훈련을 합니다.' },
];

const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map(s => [s.slug, s]));

// 학년별 태그 (페이지 내 콘텐츠 다양화용)
const GRADES = ['초등', '중등', '고등'];


/* ========== 레이아웃 / CSS ========== */
const SITE = {
  name: '공부모아',
  // 도메인 사면 여기만 바꾸면 canonical/sitemap에 전부 반영됩니다.
  origin: 'https://gongbumoa.com',
};

const CSS = `
:root{--paper:#FBFAF6;--card:#fff;--ink:#232741;--ink-soft:#5B6079;--line:#EAE7DC;
--blue:#10C46E;--blue-deep:#0AA35A;--sky:#DFF7E9;--yellow:#FFC93C;--coral:#FF7A59;
--mint:#12C971;--grape:#9B6DFF;--pink:#FF6FA5;
--shadow:0 14px 34px -18px rgba(35,39,65,.35);--shadow-soft:0 8px 24px -16px rgba(35,39,65,.3)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Pretendard',system-ui,sans-serif;background:var(--paper);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-weight:800;letter-spacing:-.03em}
a{color:inherit;text-decoration:none}
.wrap{width:min(1100px,92vw);margin:0 auto}
header{position:sticky;top:0;z-index:50;background:rgba(251,250,246,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{display:flex;align-items:center;gap:9px;font-size:20px;font-weight:800}
.brand .mark{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,var(--blue),#3FD79C);color:#fff;font-size:17px;transform:rotate(-6deg)}
.nav-links{display:flex;gap:24px;font-weight:600;font-size:14.5px;color:var(--ink-soft)}
.nav-links a:hover{color:var(--blue)}
.btn{display:inline-flex;align-items:center;gap:7px;font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px;transition:transform .18s,box-shadow .2s}
.btn-primary{background:var(--blue);color:#fff;box-shadow:0 12px 22px -12px var(--blue)}
.btn-primary:hover{transform:translateY(-2px)}
.btn-ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line)}
.btn-ghost:hover{border-color:var(--blue);color:var(--blue)}
.crumb{font-size:13.5px;color:var(--ink-soft);padding:20px 0 0;display:flex;gap:7px;flex-wrap:wrap}
.crumb a:hover{color:var(--blue);text-decoration:underline}
.crumb span{opacity:.5}
.hero{padding:26px 0 44px}
.tagline{display:inline-flex;align-items:center;gap:7px;background:var(--sky);color:var(--blue-deep);font-weight:700;font-size:13px;padding:6px 14px;border-radius:999px;margin-bottom:16px}
h1{font-size:clamp(28px,4.4vw,42px);line-height:1.24;margin-bottom:14px}
.lead{font-size:17px;color:var(--ink-soft);max-width:620px;margin-bottom:24px}
.cta-row{display:flex;gap:12px;flex-wrap:wrap}
.stat-row{display:flex;gap:26px;flex-wrap:wrap;margin-top:28px;padding-top:24px;border-top:1px solid var(--line)}
.stat .n{font-size:25px;font-weight:800;line-height:1.1}
.stat .l{font-size:13px;color:var(--ink-soft);margin-top:2px}
section{padding:44px 0}
.sec-tag{display:inline-block;color:var(--blue-deep);background:var(--sky);font-weight:800;font-size:13.5px;padding:6px 15px;border-radius:999px;margin-bottom:13px}
h2{font-size:clamp(23px,3.2vw,31px);margin-bottom:12px}
.sub{color:var(--ink-soft);font-size:16px;margin-bottom:28px;max-width:640px}
.grid{display:grid;gap:18px}
.g2{grid-template-columns:repeat(2,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:26px 24px;box-shadow:var(--shadow-soft);transition:transform .22s cubic-bezier(.2,.9,.3,1.4),box-shadow .2s}
.card:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.card .ic{width:50px;height:50px;border-radius:15px;display:grid;place-items:center;font-size:25px;margin-bottom:14px;background:var(--sky)}
.card h3{font-size:19px;margin-bottom:7px}
.card p{font-size:14.5px;color:var(--ink-soft)}
.step{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px 22px;box-shadow:var(--shadow-soft)}
.step .n{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:14px;margin-bottom:13px;background:var(--blue)}
.step:nth-child(2) .n{background:var(--coral)}.step:nth-child(3) .n{background:var(--yellow);color:var(--ink)}.step:nth-child(4) .n{background:var(--grape)}
.step h3{font-size:17px;margin-bottom:6px}
.step p{font-size:14px;color:var(--ink-soft)}
.chips{display:flex;flex-wrap:wrap;gap:9px}
.chip{display:inline-block;background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:9px 16px;font-size:14.5px;font-weight:600;color:var(--ink-soft);transition:all .18s}
.chip:hover{border-color:var(--blue);color:var(--blue);transform:translateY(-2px)}
.chip.on{background:var(--blue);color:#fff;border-color:var(--blue)}
.subj-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.subj{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:11px 17px;font-weight:700;font-size:14.5px;transition:all .18s}
.subj:hover{transform:translateY(-3px);border-color:var(--blue);color:var(--blue-deep)}
.faq{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin-bottom:12px}
.faq h3{font-size:16px;margin-bottom:7px}
.faq p{font-size:14.5px;color:var(--ink-soft)}
.cta{background:linear-gradient(135deg,var(--blue),#2CC98A);color:#fff;border-radius:26px;padding:48px 40px;text-align:center;position:relative;overflow:hidden;box-shadow:var(--shadow)}
.cta::before{content:"";position:absolute;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.13);top:-64px;right:-36px}
.cta h2{margin-bottom:10px;position:relative}
.cta p{opacity:.93;margin-bottom:24px;position:relative;font-size:16px}
.btn-yellow{background:var(--yellow);color:var(--ink)}
.btn-wg{background:rgba(255,255,255,.16);color:#fff;border:1.5px solid rgba(255,255,255,.42)}
.cta .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative}
footer{border-top:1px solid var(--line);padding:40px 0;color:var(--ink-soft);font-size:14px;margin-top:20px}
.foot{display:flex;justify-content:space-between;gap:28px;flex-wrap:wrap}
.foot b{display:block;color:var(--ink);margin-bottom:9px;font-weight:800}
.foot a{display:block;margin-bottom:6px}
.foot a:hover{color:var(--blue)}
.copy{margin-top:26px;font-size:12.5px;color:#A7AABB}
.linkcol{columns:4;column-gap:20px;font-size:14.5px}
.linkcol a{display:block;margin-bottom:9px;color:var(--ink-soft);break-inside:avoid}
.linkcol a:hover{color:var(--blue)}
@media(max-width:900px){.g4{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:repeat(2,1fr)}.linkcol{columns:2}}
@media(max-width:640px){.nav-links{display:none}.g2,.g3,.g4{grid-template-columns:1fr}.linkcol{columns:1}.cta{padding:38px 22px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;

const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

/**
 * 공통 HTML 셸.
 */
function page({ title, desc, canonical, crumb = '', body, jsonld }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${SITE.name}">
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header><div class="wrap nav">
<a href="/" class="brand"><span class="mark">공</span>${SITE.name}</a>
<nav class="nav-links">
<a href="/지역">지역별수업</a><a href="/학교">학교별수업</a><a href="/과목">과목수업</a><a href="/기타">기타수업</a>
</nav>
<a href="/#contact" class="btn btn-primary">무료 상담</a>
</div></header>
<div class="wrap">${crumb}</div>
${body}
<footer><div class="wrap">
<div class="foot">
<div><b>${SITE.name}</b>초·중·고 1:1 맞춤 과외<br>아이의 속도에 맞춰 함께 성장합니다.</div>
<div><b>수업</b><a href="/지역">지역별수업</a><a href="/학교">학교별수업</a><a href="/과목">과목수업</a><a href="/기타">기타수업</a></div>
<div><b>문의</b><a href="/#contact">무료 상담</a><a href="/#contact">카카오톡 채널</a></div>
</div>
<div class="copy">© 2026 ${SITE.name}. All rights reserved.</div>
</div></footer>
</body></html>`;
}

function crumbs(items) {
  const parts = items.map((it, i) =>
    i === items.length - 1
      ? `<b style="color:var(--ink)">${esc(it.name)}</b>`
      : `<a href="${it.url}">${esc(it.name)}</a>`
  );
  return `<div class="crumb">${parts.join('<span>›</span>')}</div>`;
}


/* ========== 페이지 생성 & 라우팅 ========== */


const SIDO = REGIONS.sido;
const U = encodeURIComponent;

/* ---------------- 조회 헬퍼 ---------------- */

function getSido(s) {
  return SIDO[s] ? { key: s, ...SIDO[s] } : null;
}
function getSgg(sidoKey, sggKey) {
  const s = SIDO[sidoKey];
  if (!s || !s.sgg[sggKey]) return null;
  const v = s.sgg[sggKey];
  return { key: sggKey, disp: v.d, list: v.l };
}
function getDong(sidoKey, sggKey, dongName) {
  const g = getSgg(sidoKey, sggKey);
  if (!g) return null;
  const hit = g.list.find(d => d[0] === dongName);
  return hit ? { name: hit[0], code: hit[1], kind: hit[2] } : null;
}

/* ---------------- 공통 조각 ---------------- */

function subjectRow(basePath, activeSlug) {
  return `<div class="subj-row">` + SUBJECTS.map(s =>
    `<a class="subj" href="${basePath}/${U(s.slug)}과외"${s.slug === activeSlug ? ' style="border-color:var(--blue);color:var(--blue-deep)"' : ''}>${s.emoji} ${s.name}과외</a>`
  ).join('') + `</div>`;
}

function ctaBlock(where) {
  return `<section><div class="wrap"><div class="cta">
<h2>${esc(where)} 무료 진단부터 받아보세요</h2>
<p>아이의 현재 상태를 정확히 알려드리고, 딱 맞는 선생님을 연결해 드려요.</p>
<div class="btns"><a href="/#contact" class="btn btn-yellow">무료 상담 신청</a><a href="/#contact" class="btn btn-wg">카카오톡 문의</a></div>
</div></div></section>`;
}

function faqBlock(items) {
  return `<section><div class="wrap">
<span class="sec-tag">자주 묻는 질문</span><h2>궁금한 점을 모았어요</h2>
${items.map(f => `<div class="faq"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('')}
</div></section>`;
}

/* ---------------- 페이지: 지역 x 과목 ---------------- */

function regionSubjectPage({ sido, sgg, dong, subj, url }) {
  const place = dong ? dong.name : sgg.disp;
  const kindLabel = dong ? dong.kind : '지역';
  const title = `${place} ${subj.name}과외 | ${SITE.name}`;
  const h1 = `${place} ${subj.name}과외`;
  const parentPath = `/${U(sido.key)}/${U(sgg.key)}`;
  const basePath = dong ? `${parentPath}/${U(dong.name)}` : parentPath;

  const desc = `${sido.full} ${sgg.disp} ${dong ? dong.name + ' ' : ''}${subj.name}과외. `
    + `초·중·고 1:1 맞춤 수업으로 ${subj.name} 성적을 올려드립니다. 무료 진단 상담 후 선생님을 연결해 드려요.`;

  const siblings = sgg.list.filter(d => !dong || d[0] !== dong.name).slice(0, 40);

  const crumbItems = [
    { name: '홈', url: '/' },
    { name: '지역별수업', url: '/지역' },
    { name: sido.full, url: `/${U(sido.key)}` },
    { name: sgg.disp, url: parentPath },
  ];
  if (dong) crumbItems.push({ name: dong.name, url: basePath });
  crumbItems.push({ name: `${subj.name}과외` });

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `${subj.name} 과외`,
    name: h1,
    description: desc,
    areaServed: {
      '@type': 'Place',
      name: `${sido.full} ${sgg.disp}${dong ? ' ' + dong.name : ''}`,
    },
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.origin },
    url,
  };

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${subj.emoji} ${sido.full} ${sgg.disp}</span>
<h1>${esc(h1)}<br><span style="color:var(--blue)">1:1 맞춤 수업</span></h1>
<p class="lead">${esc(place)}에서 ${subj.name} 때문에 고민이신가요? ${esc(subj.desc)} ${esc(place)} 인근 선생님을 무료 진단 후 연결해 드립니다.</p>
<div class="cta-row"><a href="/#contact" class="btn btn-primary">무료 상담 받기 →</a><a href="${parentPath}" class="btn btn-ghost">${esc(sgg.disp)} 전체 보기</a></div>
<div class="stat-row">
<div class="stat"><div class="n">1:1</div><div class="l">맞춤 수업</div></div>
<div class="stat"><div class="n">${sgg.list.length}개</div><div class="l">${esc(sgg.disp)} 수업 ${kindLabel}</div></div>
<div class="stat"><div class="n">무료</div><div class="l">진단 상담</div></div>
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">수업 방식</span>
<h2>${esc(place)} ${subj.name}, 이렇게 수업해요</h2>
<p class="sub">${esc(subj.desc)}</p>
<div class="grid g4">
<div class="step"><div class="n">1</div><h3>무료 진단</h3><p>첫 수업 전 ${subj.name} 취약 단원을 정확히 파악합니다.</p></div>
<div class="step"><div class="n">2</div><h3>선생님 매칭</h3><p>${esc(place)} 인근에서 성향이 맞는 선생님을 연결해요.</p></div>
<div class="step"><div class="n">3</div><h3>맞춤 수업</h3><p>학교 진도와 시험 범위에 맞춰 커리큘럼을 짭니다.</p></div>
<div class="step"><div class="n">4</div><h3>리포트</h3><p>매주 학습 내용과 성장 과정을 공유해 드려요.</p></div>
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">다른 과목</span>
<h2>${esc(place)}에서 찾는 다른 과외</h2>
<p class="sub">여러 과목을 함께 신청하면 일정을 맞춰서 배정해 드려요.</p>
${subjectRow(basePath, subj.slug)}
</div></section>

${siblings.length ? `<section><div class="wrap">
<span class="sec-tag">주변 지역</span>
<h2>${esc(sgg.disp)} 다른 지역 ${subj.name}과외</h2>
<p class="sub">가까운 지역도 함께 확인해 보세요.</p>
<div class="linkcol">
${siblings.map(d => `<a href="${parentPath}/${U(d[0])}/${U(subj.slug)}과외">${esc(d[0])} ${subj.name}과외</a>`).join('')}
</div>
</div></section>` : ''}

${faqBlock([
    { q: `${place}에서도 수업이 가능한가요?`, a: `네, ${sido.full} ${sgg.disp} ${place} 전 지역에서 방문 수업과 화상 수업 모두 가능합니다. 지역과 일정에 맞춰 선생님을 배정해 드려요.` },
    { q: `${subj.name} 과외는 몇 학년부터 받을 수 있나요?`, a: `초등학생부터 고등학생까지 모두 가능합니다. 학년과 현재 실력에 따라 커리큘럼을 다르게 구성합니다.` },
    { q: `수업 전에 상담을 먼저 받을 수 있나요?`, a: `무료 진단 상담을 먼저 진행합니다. 아이의 현재 상태를 확인한 뒤 수업 방향을 제안해 드리고, 그 후에 시작 여부를 결정하시면 됩니다.` },
    { q: `선생님이 마음에 들지 않으면 어떻게 하나요?`, a: `수업 초반에 맞지 않는다고 느끼시면 다른 선생님으로 다시 매칭해 드립니다. 부담 없이 말씀해 주세요.` },
  ])}

${ctaBlock(place)}`;

  return page({ title, desc, canonical: url, crumb: crumbs(crumbItems), body, jsonld });
}

/* ---------------- 페이지: 시군구 허브 ---------------- */

function sggHubPage({ sido, sgg, url }) {
  const title = `${sgg.disp} 과외 | 동네별 과목 과외 - ${SITE.name}`;
  const desc = `${sido.full} ${sgg.disp} 과외. ${sgg.list.length}개 지역에서 수학·영어·국어 등 초·중·고 1:1 맞춤 과외를 연결해 드립니다.`;
  const base = `/${U(sido.key)}/${U(sgg.key)}`;

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">📍 ${sido.full}</span>
<h1>${esc(sgg.disp)} 과외</h1>
<p class="lead">${esc(sgg.disp)} 전체 ${sgg.list.length}개 지역에서 1:1 맞춤 과외를 연결해 드립니다. 과목이나 동네를 골라 자세히 확인해 보세요.</p>
<div class="cta-row"><a href="/#contact" class="btn btn-primary">무료 상담 받기 →</a></div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">과목별</span><h2>${esc(sgg.disp)} 과목 과외</h2>
<p class="sub">원하는 과목을 골라보세요.</p>
${subjectRow(base)}
</div></section>

<section><div class="wrap">
<span class="sec-tag">지역별</span><h2>${esc(sgg.disp)} 동네별 과외</h2>
<p class="sub">우리 동네를 선택하면 과목별 수업을 볼 수 있어요.</p>
<div class="linkcol">
${sgg.list.map(d => `<a href="${base}/${U(d[0])}/수학과외">${esc(d[0])} 과외</a>`).join('')}
</div>
</div></section>

${ctaBlock(sgg.disp)}`;

  return page({
    title, desc, canonical: url,
    crumb: crumbs([
      { name: '홈', url: '/' },
      { name: '지역별수업', url: '/지역' },
      { name: sido.full, url: `/${U(sido.key)}` },
      { name: sgg.disp },
    ]),
    body,
  });
}

/* ---------------- 페이지: 시도 허브 ---------------- */

function sidoHubPage({ sido, url }) {
  const sggs = Object.entries(sido.sgg);
  const total = sggs.reduce((a, [, v]) => a + v.l.length, 0);
  const title = `${sido.full} 과외 | 시군구별 과외 - ${SITE.name}`;
  const desc = `${sido.full} 과외. ${sggs.length}개 시군구, ${total}개 지역에서 초·중·고 1:1 맞춤 과외를 연결해 드립니다.`;

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">📍 지역별수업</span>
<h1>${esc(sido.full)} 과외</h1>
<p class="lead">${esc(sido.full)} 전역 ${sggs.length}개 시군구, ${total}개 지역에서 수업이 가능합니다.</p>
<div class="cta-row"><a href="/#contact" class="btn btn-primary">무료 상담 받기 →</a></div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">시군구</span><h2>${esc(sido.full)} 시군구별 과외</h2>
<p class="sub">지역을 선택해 주세요.</p>
<div class="linkcol">
${sggs.map(([k, v]) => `<a href="/${U(sido.key)}/${U(k)}">${esc(v.d)} 과외</a>`).join('')}
</div>
</div></section>

${ctaBlock(sido.full)}`;

  return page({
    title, desc, canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '지역별수업', url: '/지역' }, { name: sido.full }]),
    body,
  });
}

/* ---------------- 페이지: 전국 지역 허브 ---------------- */

function regionRootPage(url) {
  const entries = Object.entries(SIDO);
  const total = entries.reduce((a, [, v]) =>
    a + Object.values(v.sgg).reduce((b, s) => b + s.l.length, 0), 0);

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">📍 지역별수업</span>
<h1>우리 동네 과외 찾기</h1>
<p class="lead">전국 ${total.toLocaleString()}개 지역에서 초·중·고 1:1 맞춤 과외를 연결해 드립니다. 시·도를 먼저 선택해 주세요.</p>
</div></section>

<section><div class="wrap">
<span class="sec-tag">시·도</span><h2>지역을 선택하세요</h2>
<div class="grid g4">
${entries.map(([k, v]) => {
    const n = Object.values(v.sgg).reduce((b, s) => b + s.l.length, 0);
    return `<a class="card" href="/${U(k)}"><div class="ic">📍</div><h3>${esc(v.full)}</h3><p>${Object.keys(v.sgg).length}개 시군구 · ${n}개 지역</p></a>`;
  }).join('')}
</div>
</div></section>

${ctaBlock('전국 어디서나')}`;

  return page({
    title: `지역별 과외 | 전국 ${total.toLocaleString()}개 지역 - ${SITE.name}`,
    desc: `전국 ${total.toLocaleString()}개 지역에서 수학·영어·국어 등 초·중·고 1:1 맞춤 과외를 연결해 드립니다.`,
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '지역별수업' }]),
    body,
  });
}

/* ---------------- 페이지: 과목 허브 ---------------- */

function subjectRootPage(url) {
  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">📚 과목수업</span>
<h1>과목별 과외</h1>
<p class="lead">필요한 과목만 골라 집중적으로 수업받을 수 있어요.</p>
</div></section>
<section><div class="wrap">
<div class="grid g3">
${SUBJECTS.map(s => `<a class="card" href="/과목/${U(s.slug)}과외"><div class="ic">${s.emoji}</div><h3>${s.name}과외</h3><p>${esc(s.desc)}</p></a>`).join('')}
</div>
</div></section>
${ctaBlock('어떤 과목이든')}`;
  return page({
    title: `과목별 과외 | ${SITE.name}`,
    desc: '수학·영어·국어·과학·사회·논술 등 과목별 초·중·고 1:1 맞춤 과외.',
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '과목수업' }]),
    body,
  });
}

function subjectNationalPage(subj, url) {
  const entries = Object.entries(SIDO);
  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${subj.emoji} 과목수업</span>
<h1>${subj.name}과외</h1>
<p class="lead">${esc(subj.desc)}</p>
<div class="cta-row"><a href="/#contact" class="btn btn-primary">무료 상담 받기 →</a></div>
</div></section>
<section><div class="wrap">
<span class="sec-tag">지역별</span><h2>지역별 ${subj.name}과외</h2>
<p class="sub">우리 지역을 선택해 보세요.</p>
<div class="linkcol">
${entries.map(([k, v]) => `<a href="/${U(k)}">${esc(v.full)} ${subj.name}과외</a>`).join('')}
</div>
</div></section>
${ctaBlock(`${subj.name} 과외`)}`;
  return page({
    title: `${subj.name}과외 | 초·중·고 1:1 맞춤 - ${SITE.name}`,
    desc: `${subj.name}과외. ${subj.desc} 전국 어디서나 무료 진단 후 선생님을 연결해 드립니다.`,
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '과목수업', url: '/과목' }, { name: `${subj.name}과외` }]),
    body,
  });
}

/* ---------------- 페이지: 준비중 (학교별/기타) ---------------- */

function comingSoonPage(kind, url) {
  const map = {
    '학교': { emoji: '🏫', h1: '학교별수업',
      lead: '우리 학교 시험 범위와 출제 유형에 맞춘 내신 대비 수업을 준비하고 있어요.' },
    '기타': { emoji: '🎨', h1: '기타수업',
      lead: '논술·면접·방학 특강 등 목표에 맞춘 특별 수업을 준비하고 있어요.' },
  };
  const v = map[kind];
  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${v.emoji} ${v.h1}</span>
<h1>${v.h1} 준비 중이에요</h1>
<p class="lead">${v.lead} 먼저 상담을 남겨주시면 오픈 시 가장 먼저 안내해 드릴게요.</p>
<div class="cta-row"><a href="/#contact" class="btn btn-primary">미리 상담 남기기 →</a><a href="/지역" class="btn btn-ghost">지역별수업 보기</a></div>
</div></section>
${ctaBlock(v.h1)}`;
  return page({
    title: `${v.h1} | ${SITE.name}`,
    desc: `${SITE.name} ${v.h1}. ${v.lead}`,
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: v.h1 }]),
    body,
  });
}

/* ---------------- 사이트맵 ---------------- */

function xmlUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
}

function sitemapIndex(origin) {
  const items = [
    `${origin}/sitemap-main.xml`,
    ...Object.keys(SIDO).map(k => `${origin}/sitemap-${U(k)}.xml`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map(u => `<sitemap><loc>${u}</loc></sitemap>`).join('\n')}
</sitemapindex>`;
}

function sitemapMain(origin) {
  return xmlUrlset([
    `${origin}/`, `${origin}/지역`, `${origin}/과목`,
    ...SUBJECTS.map(s => `${origin}/과목/${U(s.slug)}과외`),
    ...Object.keys(SIDO).map(k => `${origin}/${U(k)}`),
  ]);
}

function sitemapSido(sidoKey, origin) {
  const s = SIDO[sidoKey];
  if (!s) return null;
  const urls = [];
  for (const [sggKey, v] of Object.entries(s.sgg)) {
    const base = `${origin}/${U(sidoKey)}/${U(sggKey)}`;
    urls.push(base);
    for (const subj of SUBJECTS) urls.push(`${base}/${U(subj.slug)}과외`);
    for (const d of v.l) {
      for (const subj of SUBJECTS) urls.push(`${base}/${U(d[0])}/${U(subj.slug)}과외`);
    }
  }
  return xmlUrlset(urls);
}

/* ---------------- 응답 헬퍼 ---------------- */

const html = (s, status = 200) => new Response(s, {
  status,
  headers: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'public, max-age=3600, s-maxage=86400',
  },
});
const xml = s => new Response(s, {
  headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
});

function notFound(origin) {
  return html(page({
    title: `페이지를 찾을 수 없어요 | ${SITE.name}`,
    desc: '요청하신 페이지를 찾을 수 없습니다.',
    canonical: `${origin}/`,
    body: `<section class="hero"><div class="wrap">
<h1>페이지를 찾을 수 없어요 🙏</h1>
<p class="lead">주소가 바뀌었거나 없는 지역일 수 있어요. 지역 목록에서 다시 찾아보세요.</p>
<div class="cta-row"><a href="/지역" class="btn btn-primary">지역별수업 보기</a><a href="/" class="btn btn-ghost">홈으로</a></div>
</div></section>`,
  }), 404);
}

/* ---------------- 라우터 ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = SITE.origin || url.origin;
    const path = decodeURIComponent(url.pathname);

    if (path === '/robots.txt') {
      return new Response(
        `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
        { headers: { 'content-type': 'text/plain; charset=utf-8' } }
      );
    }

    if (path === '/sitemap.xml') return xml(sitemapIndex(origin));
    if (path === '/sitemap-main.xml') return xml(sitemapMain(origin));
    const smMatch = path.match(/^\/sitemap-(.+)\.xml$/);
    if (smMatch) {
      const body = sitemapSido(smMatch[1], origin);
      return body ? xml(body) : notFound(origin);
    }

    const seg = path.split('/').filter(Boolean);

    if (seg.length === 0) return html(HOME_HTML);

    if (seg[0] === '과목') {
      if (seg.length === 1) return html(subjectRootPage(origin + path));
      const m = seg[1].match(/^(.+)과외$/);
      const subj = m && SUBJECT_MAP[m[1]];
      if (subj) return html(subjectNationalPage(subj, origin + path));
      return notFound(origin);
    }

    if (seg[0] === '지역') return html(regionRootPage(origin + path));

    if ((seg[0] === '학교' || seg[0] === '기타') && seg.length === 1) {
      return html(comingSoonPage(seg[0], origin + path));
    }

    const sido = getSido(seg[0]);
    if (!sido) return env.ASSETS.fetch(request);

    if (seg.length === 1) return html(sidoHubPage({ sido, url: origin + path }));

    const sgg = getSgg(sido.key, seg[1]);
    if (!sgg) return notFound(origin);

    if (seg.length === 2) return html(sggHubPage({ sido, sgg, url: origin + path }));

    const last = seg[seg.length - 1];
    const sm = last.match(/^(.+)과외$/);
    const subj = sm && SUBJECT_MAP[sm[1]];

    if (seg.length === 3 && subj) {
      return html(regionSubjectPage({ sido, sgg, dong: null, subj, url: origin + path }));
    }

    if (seg.length === 4 && subj) {
      const dong = getDong(sido.key, sgg.key, seg[2]);
      if (!dong) return notFound(origin);
      return html(regionSubjectPage({ sido, sgg, dong, subj, url: origin + path }));
    }

    if (seg.length === 3) {
      const dong = getDong(sido.key, sgg.key, seg[2]);
      if (dong) return Response.redirect(`${origin}${path}/${SUBJECTS[0].slug}과외`, 301);
    }

    return notFound(origin);
  },
};

