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
import SCHOOLS from './schools.js';

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

  /* ---------- CONSULT FORM ---------- */
  .form-card{background:#fff;border:1px solid var(--line);border-radius:26px;max-width:640px;margin:0 auto;padding:44px 40px;box-shadow:var(--shadow)}
  .form-head h2{font-size:clamp(24px,3.4vw,30px);margin-bottom:10px}
  .form-head p{color:var(--ink-soft);font-size:15px;margin-bottom:28px}
  .ff{margin-bottom:22px}
  .ff label{display:block;font-weight:800;font-size:15.5px;margin-bottom:9px}
  .ff label em{color:#E5484D;font-style:normal;font-size:13px;font-weight:700}
  .ff .hint{font-size:13px;color:var(--ink-soft);margin:-3px 0 9px}
  .ff .hint b{color:#E5484D}
  .ff input,.ff select,.ff textarea{width:100%;border:1.5px solid var(--line);border-radius:12px;background:#FCFCFA;padding:13px 15px;font-size:15px;font-family:'Pretendard';color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
  .ff input:focus,.ff select:focus,.ff textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(16,196,110,.13);background:#fff}
  .ff input.err,.ff select.err{border-color:#E5484D}
  .ff textarea{resize:vertical;min-height:80px}
  .phone-row{display:flex;align-items:center;gap:8px}
  .phone-row input{text-align:center;max-width:110px}
  .phone-row span{color:var(--ink-soft)}
  .addr-row{display:flex;gap:8px}
  .addr-row input{flex:1;background:#F4F4F1}
  .btn-addr{flex-shrink:0;background:var(--blue);color:#fff;border:none;border-radius:12px;padding:0 18px;font-weight:700;font-size:14.5px;cursor:pointer;font-family:'Pretendard'}
  .btn-addr:hover{background:var(--blue-deep)}
  .submit-btn{width:100%;background:var(--blue);color:#fff;border:none;border-radius:14px;padding:16px;font-size:17px;font-weight:800;font-family:'Pretendard';cursor:pointer;margin-top:6px;transition:transform .15s,background .15s;box-shadow:0 12px 22px -12px var(--blue)}
  .submit-btn:hover{transform:translateY(-2px);background:var(--blue-deep)}
  .submit-btn:disabled{opacity:.6;cursor:default;transform:none}
  .form-msg{margin-top:14px;font-size:14.5px;font-weight:700;text-align:center;min-height:20px}
  .form-msg.ok{color:var(--blue-deep)}
  .form-msg.fail{color:#E5484D}
  @media(max-width:640px){.form-card{padding:32px 22px}}

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
      <a href="/regions">지역별수업</a>
      <a href="/schools">학교별수업</a>
      <a href="/subjects">과목수업</a>
      <a href="/others">기타수업</a>
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
      <p class="lead">한 명 한 명 상태를 살피고 시작하는 1:1 맞춤 수업. 아이의 속도에 맞춰 개념을 잡고, 시험에서 결과로 증명합니다.</p>
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
      <a href="/regions" class="cat cat-1 reveal">
        <span class="cat-ic">📍</span>
        <h3>지역별수업</h3>
        <p>우리 동네에서 가까운 선생님을 찾아 대면·화상으로 만나요.</p>
        <span class="cat-go">동네 선생님 보기 →</span>
      </a>
      <a href="/schools" class="cat cat-2 reveal">
        <span class="cat-ic">🏫</span>
        <h3>학교별수업</h3>
        <p>우리 학교 시험 범위와 출제 유형에 딱 맞춘 내신 대비 수업.</p>
        <span class="cat-go">학교 찾기 →</span>
      </a>
      <a href="/subjects" class="cat cat-3 reveal">
        <span class="cat-ic">📐</span>
        <h3>과목수업</h3>
        <p>수학·영어·국어부터 탐구까지, 필요한 과목만 골라 집중해요.</p>
        <span class="cat-go">과목 고르기 →</span>
      </a>
      <a href="/others" class="cat cat-4 reveal">
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
      <h3>상담부터 시작</h3>
      <p>상담으로 아이의 현재 상태를 확인하고, 맞는 선생님을 안내해 드려요.</p>
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

<!-- CTA / 상담 신청폼 -->
<section class="cta-band" id="contact">
  <div class="wrap">
    <div class="form-card reveal">
      <div class="form-head">
        <h2>수업 상담 신청</h2>
        <p>무료 30분 시범수업 받아보실 수 있습니다.<br>신청을 남겨주시면 순차적으로 연락드리고 있습니다 😊<br>급하신 경우 <a href="tel:01030388978" style="color:var(--blue-deep);font-weight:800">010-3038-8978</a> 로 전화 주세요.</p>
        <p class="inq-line" hidden style="margin-top:10px;font-size:14px;color:var(--blue-deep);font-weight:700">지금까지 누적 <b class="inq-n" style="font-size:16px"></b>건의 상담이 접수되었습니다</p>
      </div>
      <script>(function(){fetch('/api/stats').then(function(r){return r.json()}).then(function(d){if(!d||!d.count||d.count<1)return;var t=d.count,s=Math.max(0,t-Math.max(5,Math.ceil(t*0.15))),cur=s,steps=20,inc=(t-s)/steps,i=0;document.querySelectorAll('.inq-line').forEach(function(e){e.hidden=false});function tick(){i++;cur=i>=steps?t:cur+inc;var v=Math.round(cur).toLocaleString('ko-KR');document.querySelectorAll('.inq-n').forEach(function(n){n.textContent=v});if(i<steps)setTimeout(tick,40)}tick()}).catch(function(){})})();</script>
      <form id="consultForm" novalidate>
        <div class="ff">
          <label>1. 학생이름 <em>* 필수</em></label>
          <input type="text" id="fName" placeholder="학생 이름을 입력해주세요." maxlength="20">
        </div>
        <div class="ff">
          <label>2. 학년 <em>* 필수</em></label>
          <select id="fGrade">
            <option value="">학년을 선택해주세요</option>
            <optgroup label="초등학교"><option>초1</option><option>초2</option><option>초3</option><option>초4</option><option>초5</option><option>초6</option></optgroup>
            <optgroup label="중학교"><option>중1</option><option>중2</option><option>중3</option></optgroup>
            <optgroup label="고등학교"><option>고1</option><option>고2</option><option>고3</option></optgroup>
            <option>기타</option>
          </select>
        </div>
        <div class="ff">
          <label>3. 과목</label>
          <input type="text" id="fSubject" placeholder="예) 수학, 영어 등" maxlength="40">
        </div>
        <div class="ff">
          <label>4. 연락처 <em>* 필수</em></label>
          <div class="phone-row">
            <input type="tel" id="fP1" value="010" maxlength="3" inputmode="numeric">
            <span>-</span>
            <input type="tel" id="fP2" placeholder="0000" maxlength="4" inputmode="numeric">
            <span>-</span>
            <input type="tel" id="fP3" placeholder="0000" maxlength="4" inputmode="numeric">
          </div>
        </div>
        <div class="ff">
          <label>5. 주소 <em>* 필수</em></label>
          <p class="hint">도로명 주소 검색 + 상세주소(동/호수)까지 <b>모두 입력</b>해야 신청이 완료됩니다.</p>
          <div class="addr-row">
            <input type="text" id="fAddr" placeholder="도로명 주소 검색" readonly>
            <button type="button" class="btn-addr" id="addrBtn">주소 검색</button>
          </div>
          <input type="text" id="fAddrDetail" placeholder="상세 주소 (동/호수) * 필수" maxlength="60" style="margin-top:10px">
        </div>
        <div class="ff">
          <label>6. 상담내용</label>
          <textarea id="fMemo" rows="3">과외 문의드립니다.</textarea>
        </div>
        <input type="text" id="fWebsite" style="display:none" tabindex="-1" autocomplete="off">
        <button type="submit" class="submit-btn" id="submitBtn">제출</button>
        <p class="form-msg" id="formMsg"></p>
      </form>
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
        <a href="/regions">지역별수업</a>
        <a href="/subjects">과목수업</a>
        <a href="#reviews">수강 후기</a>
      </div>
      <div>
        <b>문의</b>
        <a href="#contact">무료 상담</a>
        <a href="#contact">상담 신청</a>
        <a href="tel:01030388978">전화 010-3038-8978</a>
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


  // ===== 상담 신청폼 =====
  (function(){
    var $=function(id){return document.getElementById(id)};
    var form=$('consultForm'); if(!form) return;
    ['fP1','fP2','fP3'].forEach(function(id){
      $(id).addEventListener('input',function(e){e.target.value=e.target.value.replace(/[^0-9]/g,'')});
    });
    var daumLoaded=false;
    function openAddr(){ new daum.Postcode({oncomplete:function(data){ $('fAddr').value=data.roadAddress||data.jibunAddress; $('fAddrDetail').focus(); }}).open(); }
    $('addrBtn').addEventListener('click',function(){
      if(daumLoaded){openAddr();return;}
      var s=document.createElement('script');
      s.src='https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload=function(){daumLoaded=true;openAddr();};
      document.body.appendChild(s);
    });
    $('fAddr').addEventListener('click',function(){$('addrBtn').click();});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var msg=$('formMsg'); msg.className='form-msg'; msg.textContent='';
      var bad=null;
      function mark(el,isBad){ el.classList.toggle('err',!!isBad); if(isBad&&!bad)bad=el; }
      mark($('fName'),!$('fName').value.trim());
      mark($('fGrade'),!$('fGrade').value);
      var p1=$('fP1').value,p2=$('fP2').value,p3=$('fP3').value;
      var phoneOk=p1.length===3&&p1.indexOf('01')===0&&p2.length>=3&&p3.length===4;
      mark($('fP2'),!phoneOk); mark($('fP3'),p3.length!==4);
      mark($('fAddr'),!$('fAddr').value);
      mark($('fAddrDetail'),!$('fAddrDetail').value.trim());
      if(bad){msg.textContent='빨간 표시 항목을 확인해주세요.';msg.classList.add('fail');bad.focus();return;}
      var btn=$('submitBtn'); btn.disabled=true; btn.textContent='접수 중...';
      fetch('/api/consult',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:$('fName').value.trim(),grade:$('fGrade').value,subject:$('fSubject').value.trim(),
          phone:p1+'-'+p2+'-'+p3,addr:$('fAddr').value,addrDetail:$('fAddrDetail').value.trim(),
          memo:$('fMemo').value.trim(),website:$('fWebsite').value,page:location.pathname})})
      .then(function(r){return r.json()})
      .then(function(j){
        if(j.ok){ msg.textContent='신청이 접수되었습니다! 순차적으로 연락드릴게요 😊'; msg.classList.add('ok');
          form.reset(); $('fP1').value='010'; $('fMemo').value='과외 문의드립니다.'; }
        else{ throw 0; }
      })
      .catch(function(){ msg.textContent='일시적인 오류가 발생했어요. 잠시 후 다시 시도하거나 010-3038-8978 로 전화 주세요.'; msg.classList.add('fail'); })
      .finally(function(){ btn.disabled=false; btn.textContent='제출'; });
    });
  })();

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
  { slug: 'math', name: '수학', emoji: '📐', color: 'mint',
    desc: '개념부터 실전까지, 막힌 단원을 정확히 짚어 성적을 끌어올립니다.' },
  { slug: 'english', name: '영어', emoji: '📗', color: 'coral',
    desc: '어휘·구문·독해를 단계별로 잡아 내신과 수능을 함께 대비합니다.' },
  { slug: 'korean', name: '국어', emoji: '📖', color: 'grape',
    desc: '문학과 비문학 지문 접근법을 익혀 흔들리지 않는 독해력을 만듭니다.' },
  { slug: 'science', name: '과학', emoji: '🔬', color: 'sky',
    desc: '물리·화학·생명·지구과학 개념을 실험과 원리 중심으로 이해합니다.' },
  { slug: 'social', name: '사회', emoji: '🌏', color: 'yellow',
    desc: '흐름과 맥락을 잡아 암기 부담을 줄이고 서술형까지 대비합니다.' },
  { slug: 'essay', name: '논술', emoji: '✍️', color: 'pink',
    desc: '생각을 논리적으로 구성하고 글로 풀어내는 훈련을 합니다.' },
];

const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map(s => [s.slug, s]));

const GRADE_LEVELS = [
  { slug: 'elementary', name: '초등', gi: 0, kind: '초' },
  { slug: 'middle', name: '중등', gi: 1, kind: '중' },
  { slug: 'high', name: '고등', gi: 2, kind: '고' },
];
const GRADE_MAP = Object.fromEntries(GRADE_LEVELS.map(g => [g.slug, g]));
const GRADE_BY_KIND = Object.fromEntries(GRADE_LEVELS.map(g => [g.kind, g]));

// 학년별 태그 (페이지 내 콘텐츠 다양화용)
const GRADES = ['초등', '중등', '고등'];


/* ========== 과목별 학습 가이드 ========== */
// 과목별 상세 가이드 콘텐츠. {p} 자리에 지역명이 들어갑니다.
const GUIDES = {
  math: {
    intro: ['수학은 한 번 구멍이 생기면 다음 단원까지 연쇄적으로 흔들리는 계단식 과목입니다. 그래서 지금 학년의 진도만 쫓아가기보다, 어디서부터 이해가 끊겼는지 찾아 그 지점부터 다시 쌓는 것이 가장 빠른 길입니다. {p} 학생들의 학교 진도와 시험 범위에 맞춰, 학년별로 무엇을 어떻게 공부해야 하는지 정리했습니다.', '수학 성적이 안 오르는 이유는 대부분 지금 배우는 단원이 아니라 그 아래 깔린 이전 개념에 있습니다. 분수가 흔들리면 방정식이, 함수가 비면 미적분이 무너지는 식입니다. 그래서 효과적인 수학 공부는 진도를 쫓는 것이 아니라 끊어진 지점을 찾아 다시 잇는 것에서 시작합니다. {p} 학생들의 학교 진도와 시험 일정에 맞춰 학년별 핵심 공부법을 정리했습니다.', '많은 학생이 수학 문제집을 여러 권 풀고도 성적이 제자리인 경험을 합니다. 문제는 양이 아니라 방향입니다. 자기 구멍이 어디인지 모른 채 푸는 100문제보다, 정확한 진단 후 푸는 30문제가 성적을 바꿉니다. 아래에 {p} 초·중·고 학생들이 학년별로 무엇에 집중해야 하는지 정리했으니 우리 아이 학년부터 확인해 보세요.'],
    grades: [
      { t: '초등 수학 공부법', b: ['초등 시기의 목표는 두 가지입니다. 연산의 자동화와 수학에 대한 좋은 감정 만들기. 사칙연산과 분수·소수 계산이 느리거나 자주 틀리면 중학교 방정식에서 반드시 발목을 잡히므로, 하루 15~20분씩 짧게라도 매일 연산을 연습하는 습관이 중요합니다. 문장제를 어려워한다면 수학 문제가 아니라 독해 문제인 경우가 많습니다. 문제를 소리 내어 읽고, 구하는 것이 무엇인지 한 문장으로 말해보게 한 뒤 식을 세우는 훈련이 효과적입니다. 그리고 이 시기에 "나는 수학을 못해"라는 인식이 생기지 않도록, 아이 수준보다 반 걸음 쉬운 문제부터 성공 경험을 쌓아주는 것이 무엇보다 중요합니다.', '초등 수학에서 가장 중요한 두 가지는 연산의 자동화와 수학을 대하는 감정입니다. 사칙연산과 분수 계산이 느리면 중학 방정식에서 반드시 막히므로 하루 15분씩이라도 매일 연산을 만나는 습관을 만들어 주세요. 문장제가 약하다면 그건 수학이 아니라 읽기의 문제일 때가 많습니다. 문제를 소리 내어 읽고 구하는 것을 한 문장으로 말한 뒤 식을 세우는 순서를 훈련하면 좋아집니다. 무엇보다 이 시기에 "나는 수학 못해"라는 낙인이 생기지 않게, 반 걸음 쉬운 문제로 성공 경험부터 쌓아야 합니다.', '초등 수학은 두 개의 기둥 위에 섭니다. 하나는 매일 만나는 연산이고, 다른 하나는 실패해도 괜찮다는 안정감입니다. 연산이 자동화되지 않으면 중학교에서 식을 세우고도 계산에서 무너지고, 수학에 겁을 먹으면 아예 시도를 멈춥니다. 하루 15분 연산 루틴과 아이 수준 반 걸음 아래에서 시작하는 성공 경험, 그리고 문장제를 소리 내어 읽고 조건을 정리하는 습관까지. 이 세 가지가 초등 수학의 전부라 해도 지나치지 않습니다.', '초등 수학에서 부모님들이 가장 많이 하는 실수는 진도 욕심입니다. 연산이 자동화되기 전의 선행은 모래 위에 층을 올리는 일이라, 몇 달 뒤 반드시 무너집니다. 매일 15분 연산, 문장제를 읽고 조건을 말로 정리하는 습관, 그리고 틀려도 괜찮은 분위기. 이 세 가지가 갖춰진 아이는 학년이 올라갈수록 저절로 빨라집니다. 급할수록 기본기로 돌아가는 것이 초등 수학의 역설입니다.', '초등 수학은 자전거 배우기와 같습니다. 보조바퀴(구체물·그림)로 감을 잡고, 넘어져도 다시 타는 경험으로 두려움을 없애고, 매일 조금씩 타며 균형을 몸에 새기는 과정입니다. 연산은 페달 밟기처럼 생각 없이 나와야 하고, 문장제는 목적지를 정하고 경로를 짜는 연습입니다. 자전거를 말로 배울 수 없듯 수학도 매일 타보는 것 외에 왕도가 없습니다.'] },
      { t: '중등 수학 공부법', b: ['중학교 수학은 개념 이해, 유형 연습, 서술형 대비 세 단계로 나눠 접근해야 합니다. 개념은 정의를 외우는 것이 아니라 자기 말로 설명할 수 있어야 하고, 설명이 막히는 지점이 곧 복습할 지점입니다. 유형 연습은 같은 문제집을 여러 권 푸는 것보다 한 권을 세 번 반복하며 틀린 문제만 다시 푸는 방식이 효율적입니다. 특히 함수와 방정식은 고등 수학의 뼈대가 되므로 이 단원만큼은 완성도를 높여야 합니다. 서술형은 답이 맞아도 풀이 과정에서 감점되는 경우가 많으니, 등호와 기호를 정확히 쓰고 근거를 한 줄씩 남기는 답안 작성 연습을 시험 4주 전부터 시작하는 것을 권합니다.', '중학 수학은 개념-유형-서술형의 3단 구조로 접근합니다. 개념은 정의 암기가 아니라 자기 말 설명이 기준이고, 설명이 막히는 곳이 복습 지점입니다. 문제집은 여러 권보다 한 권 3회독이 효율적이며, 틀린 문제만 다시 푸는 방식으로 회독 시간을 줄입니다. 함수와 방정식은 고등 수학의 척추이므로 이 단원만은 완성도를 타협하지 마세요. 서술형은 답이 맞아도 과정 감점이 흔하니 등호와 근거를 한 줄씩 남기는 답안 훈련을 시험 한 달 전부터 시작하는 것이 좋습니다.', '중학 수학에서 시간을 가장 아껴주는 원칙은 "설명할 수 있으면 아는 것, 못 하면 모르는 것"입니다. 개념마다 자기 말로 설명해보게 하면 복습할 지점이 정확히 드러납니다. 문제집은 한 권을 세 번 도는 것이 세 권을 한 번씩 도는 것보다 낫고, 두 번째부터는 틀린 문제만 풀어 시간을 아낍니다. 고등 수학의 뼈대인 함수·방정식 단원은 완성도에 타협이 없어야 하며, 서술형 감점을 막는 답안 쓰기 연습은 시험 한 달 전부터 루틴에 넣으세요.', '중학 수학에서 흔한 함정은 ‘아는 문제 반복’입니다. 풀리는 문제만 풀면 공부한 기분은 들지만 실력은 제자리입니다. 반대로 개념 설명을 건너뛰고 문제부터 푸는 것도 함정입니다. 유형 암기로는 조금만 비틀린 문제에 무너집니다. 올바른 순서는 개념을 말로 설명해보고, 유형으로 굳히고, 틀린 것만 다시 푸는 것입니다. 서술형 답안은 채점자가 읽는 글이라는 사실을 기억하고 근거를 남기는 연습을 하세요.', '중학 수학은 건물의 골조 공사입니다. 함수와 방정식이라는 기둥이 이때 세워지고, 고등 3년의 모든 하중이 이 기둥에 실립니다. 겉보기에 진도가 나가도 기둥이 부실하면 고1 첫 시험에서 균열이 드러납니다. 한 문제집 3회독은 같은 기둥에 콘크리트를 세 번 타설하는 것과 같아서, 새 문제집을 사는 것보다 훨씬 단단합니다.'] },
      { t: '고등 수학 공부법', b: ['고등부터는 내신과 수능을 함께 관리해야 하며, 현재 등급대에 따라 전략이 완전히 달라집니다. 4~5등급이라면 심화 문제를 붙잡기보다 중학 과정을 포함한 개념의 구멍을 먼저 메우는 것이 등급을 올리는 가장 빠른 방법입니다. 2~3등급은 개념은 알지만 준킬러 문항에서 막히는 경우가 많으므로, 기출문제를 유형별로 분류해 풀이의 첫 단추(발상)를 정리하는 훈련이 필요합니다. 1등급 목표라면 킬러 문항 대비와 함께 실수 관리가 핵심입니다. 틀린 문제마다 "몰라서 틀렸는지, 실수인지, 시간이 없었는지"를 구분해 기록하면 자신의 약점이 데이터로 보이기 시작합니다. 학교별 내신 기출의 출제 스타일 분석도 필수입니다.', '고등 수학은 등급대가 곧 전략입니다. 4~5등급은 심화 문제를 붙잡을 때가 아니라 중학 과정까지 포함해 개념 구멍을 메울 때이고, 이것이 등급 상승의 최단 경로입니다. 2~3등급은 준킬러에서 막히는 구간이므로 기출을 유형별로 분류해 첫 발상을 정리하는 훈련이 필요합니다. 1등급 목표라면 킬러 대비와 함께 실수 관리가 핵심입니다. 틀린 문제마다 원인(개념/실수/시간)을 구분해 기록하면 약점이 데이터로 보이고, 내신은 학교 기출의 출제 스타일 분석이 필수입니다.', '고등 수학은 위치에 따라 다른 게임입니다. 하위권에게 심화 문제집은 시간 낭비이고, 중학 과정까지 내려가 개념을 다시 잇는 것이 실제로 가장 빠릅니다. 중위권은 이미 아는 유형을 반복하는 함정에서 나와 틀리는 유형만 정밀 타격해야 등급이 움직입니다. 상위권의 적은 문제가 아니라 자신의 실수입니다. 오답의 원인을 개념 부족·실수·시간 부족으로 분류해 기록하면 시험 직전에 봐야 할 것이 명확해지고, 학교 기출 분석은 어느 등급이든 기본입니다.', '고등 수학에서 가장 비싼 실수는 자기 등급에 맞지 않는 공부입니다. 4등급이 킬러 문항 강의를 듣는 것은 걷기 전에 마라톤을 신청하는 격이고, 1등급이 쉬운 문제만 반복하는 것은 이미 아는 길을 도는 러닝머신입니다. 기출 분석 없이 문제집만 늘리는 것, 오답을 분류 없이 쌓아두는 것도 흔한 낭비입니다. 지금 위치를 정확히 알고 그 지점의 처방을 따르는 것이 재수 없이 가는 유일한 길입니다.', '고등 수학은 등산과 같아서 해발 고도마다 필요한 장비가 다릅니다. 초입(기초)에서는 등산화(개념)가 전부이고, 중턱(준킬러)에서는 지도를 읽는 법(기출 유형 분석)이, 정상 부근(킬러·만점)에서는 날씨 관리(실수 통제)가 생사를 가릅니다. 남의 장비를 부러워할 필요 없이 지금 고도에 맞는 장비를 갖추면 됩니다. 내신 기출 분석은 어느 고도에서든 필수 나침반입니다.'] },
    ],
    problems: [
      { q: '개념은 아는데 문제만 보면 못 풀어요', a: '개념을 "읽어서 아는 것"과 "꺼내 쓰는 것"은 다른 능력입니다. 문제를 보고 어떤 개념이 필요한지 연결하는 훈련이 부족한 경우로, 문제를 풀기 전에 "이 문제는 무슨 단원, 무슨 개념을 묻는 문제인지" 말로 먼저 정리하는 연습이 효과적입니다.' },
      { q: '문장제·서술형만 유독 틀려요', a: '계산력이 아니라 문제 해석력의 문제입니다. 문제 속 조건에 밑줄을 긋고, 구하는 값을 기호로 정리한 뒤 식을 세우는 3단계 루틴을 몸에 붙이면 문장제 정답률이 눈에 띄게 올라갑니다.' },
      { q: '시험 시간이 늘 부족해요', a: '아는 문제를 빨리 푸는 속도보다, 모르는 문제를 빨리 버리는 판단이 시간 관리의 핵심입니다. 평소 문제를 풀 때부터 시간을 재고, 2분 이상 막히면 표시하고 넘어가는 연습을 해야 실전에서 같은 판단이 나옵니다.' },
      { q: '수학이 무섭고 자신감이 없어요', a: '수학 불안은 실력 문제가 아니라 경험 문제입니다. 지금 수준보다 살짝 쉬운 단계부터 "풀린다"는 경험을 반복해 쌓으면 몇 주 안에 태도가 달라집니다. 1:1 수업이 특히 효과적인 영역입니다.' },
      { q: '선행을 어디까지 해야 할지 모르겠어요', a: '선행의 기준은 진도가 아니라 현재 학년의 완성도입니다. 지금 과정 심화 문제가 편안하게 풀릴 때 다음 학기 예습이 의미가 있고, 그렇지 않은 선행은 오히려 구멍을 키웁니다. 진단을 통해 우리 아이에게 맞는 선행 범위를 정하는 것이 안전합니다.' },
      { q: '오답노트를 만들어도 효과가 없어요', a: '베껴 쓰는 오답노트는 손만 아픕니다. 틀린 이유를 한 줄로 분류(개념/실수/시간)하고, 일주일 뒤 노트를 보지 않고 다시 풀어보는 것까지가 한 세트입니다. 다시 틀리는 문제만 남기면 시험 직전 최고의 교재가 됩니다.' },
      { q: '학원과 과외 중 뭐가 나을까요', a: '개념 구멍이 있거나 질문을 못 하는 성향이라면 1:1 과외가 유리하고, 경쟁 자극이 필요한 상위권은 학원 병행도 좋습니다. 중요한 건 형태가 아니라 아이 상태에 맞는 처방입니다. 상담에서 객관적으로 판단해 드립니다.' },
    ],
    help: ['{p}에서 수학 과외를 시작하면 첫 수업에서 학생이 어느 단원에서부터 이해가 끊겼는지 찾아냅니다. 학교 진도만 따라가는 수업이 아니라, 구멍 난 이전 개념을 병행 보충하면서 현재 시험 범위를 준비하는 이중 트랙으로 커리큘럼을 짭니다. 매 수업 숙제를 통해 혼자 푸는 시간을 관리하고, 오답은 유형별로 분류해 시험 전 다시 풀게 합니다. 학부모님께는 매주 학습 리포트로 진도와 성취도, 다음 주 계획을 공유해 드립니다.', '{p} 수학 과외는 상담으로 시작합니다. 학생이 어느 단원에서 막혔는지, 계산 실수형인지 개념 이해형인지부터 구분한 뒤, 학교 진도 대비와 구멍 보충을 병행하는 커리큘럼을 짭니다. 수업마다 숙제로 혼자 푸는 시간을 관리하고 오답을 유형별로 추적하며, 학부모님께는 매주 진도와 성취도를 리포트로 알려드립니다.', '혼자서는 자기 약점을 정확히 보기 어렵습니다. {p}에서 수학 과외를 시작하면 1:1 수업의 장점을 최대로 활용해, 학생이 틀리는 지점을 실시간으로 잡아 그 자리에서 교정합니다. 학교별 기출 스타일을 반영한 시험 대비, 오답 노트 관리, 주간 학습 리포트까지 수업 밖 시간의 공부 습관도 함께 설계해 드립니다.'],
    routine: ['수학은 주 2회 과외 수업만으로는 부족하고, 수업 사이의 자기 학습이 성적을 결정합니다. 권장 주간 루틴은 이렇습니다. 수업 당일에는 배운 내용을 30분 안에 백지에 다시 정리해보고, 다음 날 숙제로 유형 문제를 풀며, 주말에는 한 주간 틀린 문제만 모아 다시 풉니다. 여기에 매일 15분의 연산 또는 기초 문제 루틴을 더하면 감이 끊기지 않습니다. 중요한 것은 총 공부 시간이 아니라 "매일 수학을 만나는 것"입니다. 주말에 몰아서 4시간 하는 것보다 매일 40분이 수학에서는 확실히 효과적입니다.', '수학 실력은 수업 시간이 아니라 수업과 수업 사이에 자랍니다. 배운 날 저녁 30분 안에 그날 내용을 백지에 재현해보고, 이틀 안에 숙제로 유형을 굳히고, 주말에는 그 주에 틀린 문제만 다시 푸는 3단 리듬을 권합니다. 여기에 매일 15분 연산 루틴을 깔아두면 계산 실수가 줄고 감이 유지됩니다. 핵심은 총량이 아니라 빈도입니다. 주말 4시간 몰아치기보다 매일 40분이 수학에서는 항상 이깁니다.', '수학 루틴의 원칙은 하나입니다. 하루도 수학과 헤어지지 않기. 수업 날은 30분 복습(백지 재현), 다음 날은 숙제, 주말은 오답 재풀이로 역할을 나누고, 그 사이를 매일 15분 연산이 이어줍니다. 시간표에 "수학 2시간"이라고 크게 잡는 것보다 "매일 40분"이 지켜지기도 쉽고 효과도 큽니다. 공부량이 아니라 공백 없음이 수학 감각을 지킵니다.', '수학 루틴에서 흔한 착각은 ‘주말에 몰아서’입니다. 수학 감각은 냉장고 없던 시절의 생선과 같아서 이틀만 방치해도 상합니다. 또 하나의 착각은 ‘숙제만 하면 된다’입니다. 숙제는 최소한이고, 배운 날의 백지 복습과 주말 오답 재풀이가 실력을 만드는 부분입니다. 매일 40분의 원칙을 시간표보다 습관에 새기세요.', '수학 공부는 근육 운동과 같습니다. 헬스장에 주 1회 3시간 가는 사람보다 매일 30분 하는 사람이 몸이 바뀌듯, 수학도 매일 만나는 사람이 이깁니다. 수업(PT)에서 자세를 배웠으면 혼자 하는 반복(자율 운동)으로 근육에 새겨야 하고, 오답 재풀이는 안 되던 동작을 다시 교정받는 시간입니다. 연산 15분은 매일의 스트레칭입니다.'],
    exam: ['시험 4주 전부터는 계획이 달라져야 합니다. 4주 전에는 시험 범위의 개념을 처음부터 훑으며 구멍을 확인하고, 3주 전에는 유형서로 범위 내 전 유형을 한 바퀴 돕니다. 2주 전부터는 학교 기출과 유사 문제로 실전 감각을 만들고 서술형 답안 쓰기를 연습합니다. 마지막 1주는 새 문제를 벌리지 말고 그동안 틀린 문제만 다시 푸는 기간입니다. 시험 전날 밤에 새 유형을 만나 불안해지는 것이 최악의 시나리오이므로, 마지막 3일은 오답 복습과 컨디션 관리에 집중하세요.', '시험 4주 전이 되면 공부의 성격을 바꿔야 합니다. 첫 주는 범위 전체 개념을 훑으며 구멍 지도를 그리는 주, 둘째 주는 유형서 한 바퀴, 셋째 주는 학교 기출과 유사 문제로 실전 감각과 서술형 답안을 다듬는 주입니다. 마지막 주에는 새 문제를 벌리지 말고 그동안의 오답만 반복하세요. 시험 전날 처음 보는 유형에 흔들리는 것이 최악이므로, 마지막 3일은 아는 것을 확실하게 만드는 데 씁니다.', '시험 대비는 역할이 다른 4개의 주로 설계합니다. 첫 주는 정찰(범위 개념 훑기와 구멍 찾기), 둘째 주는 훈련(유형서 1회독), 셋째 주는 실전(학교 기출·서술형 답안), 마지막 주는 정비(오답만 반복)입니다. 많은 학생이 마지막 주에 새 문제집을 펴는 실수를 하는데, 시험 직전의 낯선 문제는 실력이 아니라 불안만 늘립니다. 마지막 3일은 아는 것을 굳히는 시간입니다.', '시험 대비에서 가장 흔한 실수 세 가지: 마지막 주에 새 문제집 펴기, 서술형 연습을 눈으로만 하기, 쉬운 단원부터 공부하기입니다. 새 문제는 불안을, 눈 연습은 감점을, 쉬운 단원 우선은 시간 부족을 낳습니다. 순서를 뒤집으세요. 약한 단원부터, 손으로 쓰면서, 마지막 주는 오답만. 이 세 가지 교정만으로 같은 실력에서 시험 점수가 달라집니다.', '시험 4주는 농사의 계절과 같습니다. 1주차는 밭을 살피는 때(범위 훑기·구멍 확인), 2주차는 씨 뿌리는 때(유형 훈련), 3주차는 김매는 때(기출·서술형 다듬기), 마지막 주는 수확 준비(오답 정리와 컨디션)입니다. 수확 직전에 새 씨앗을 뿌리는 농부는 없습니다. 마지막 주에 새 문제를 벌리지 않는 이유입니다.'],
    levels: ['지금 성적대에 따라 우선순위가 다릅니다. 기초가 부족한 학생이라면 현재 학년 문제집을 붙잡기 전에 이전 학년의 핵심 단원(연산, 방정식, 함수)부터 빠르게 복습하는 것이 결국 더 빠릅니다. 보통 4~6주의 집중 보충으로 현재 진도를 따라갈 발판이 만들어집니다. 중위권 학생은 아는 문제를 더 많이 푸는 함정에 빠지기 쉽습니다. 틀리는 유형을 골라 그 유형만 집중 훈련하는 약점 공략이 등급을 바꿉니다. 상위권 학생은 새로운 문제보다 틀린 문제의 원인 분석에 시간을 써야 하며, 실수 기록장을 만들어 시험 직전에 자신의 실수 패턴만 점검하는 것이 만점을 지키는 방법입니다.', '같은 수학 과외라도 성적대에 따라 처방이 다릅니다. 기초가 흔들리는 학생은 지금 교과서보다 이전 학년 핵심 단원으로 돌아가는 것이 결국 빠른 길이고, 보통 4~6주 집중 보충이면 현재 진도에 복귀할 수 있습니다. 중위권은 푸는 양을 늘리기보다 틀리는 유형만 겨냥해 훈련하는 것이 등급을 움직입니다. 상위권은 실수 관리가 전부입니다. 틀린 원인을 기록해 자기 실수 패턴을 데이터로 만들고 시험 직전 그것만 점검하세요.', '성적대별 최우선 과제를 하나씩만 꼽으면 이렇습니다. 기초권은 "지금 교과서를 덮고 이전 학년 구멍부터", 중위권은 "푸는 양 대신 틀리는 유형만", 상위권은 "새 문제 대신 실수 기록 관리". 각각 4~6주만 방향을 지켜도 변화가 보이기 시작합니다. 자신이 어디에 속하는지 애매하다면 그것부터가 진단이 필요하다는 신호입니다.', '성적대별로 피해야 할 것부터 말씀드리면, 기초권은 학원 진도 따라가기(구멍이 더 벌어집니다), 중위권은 개념 강의 재수강(이미 아는 것을 또 듣는 중입니다), 상위권은 문제량 늘리기(실수 관리가 병목인데 연습량만 늘립니다)입니다. 각자의 병목은 다른 곳에 있고, 병목이 아닌 곳에 쏟는 노력은 성적으로 환전되지 않습니다.', '수학 성적대는 물이 새는 배와 같습니다. 기초권의 배는 바닥에 큰 구멍(이전 학년 개념)이 있어 노를 젓기 전에 구멍부터 막아야 합니다. 중위권의 배는 특정 부위(취약 유형)에서만 물이 새니 그 부위를 정확히 찾아 때우면 됩니다. 상위권의 배는 튼튼하지만 파도(실수·시간 압박)에 흔들리므로 항해술을 다듬는 것이 마지막 과제입니다.'],
    parent: ['가정에서는 채점 결과보다 풀이 과정을 봐주세요. 몇 점인지보다 "어떤 유형에서 왜 틀렸는지"를 아이와 함께 이야기하는 것이 성적 향상에 훨씬 큰 영향을 줍니다. 그리고 하루 몰아서 3시간보다 매일 40분이 수학에서는 확실히 유리합니다. 짧아도 끊기지 않는 학습 리듬을 만들어 주세요.', '아이의 수학 공부를 도와주실 때는 답이 맞았는지보다 풀이를 설명할 수 있는지를 확인해 주세요. "이 문제 어떻게 풀었는지 얘기해 줄래?"라는 한마디가 개념 이해도를 가장 정확하게 드러냅니다. 그리고 시험 점수가 떨어졌을 때 다그치기보다 어떤 유형에서 틀렸는지 함께 보는 태도가 수학 자신감을 지켜줍니다.', '수학은 부모님의 조급함이 역효과를 내기 가장 쉬운 과목입니다. 선행 진도보다 현재 학년의 완성도가 중요하고, 몰아서 오래 하는 것보다 매일 짧게 만나는 리듬이 실력을 만듭니다. 가정에서는 공부량을 관리하기보다 매일 정해진 시간에 책상에 앉는 환경을 만들어 주시는 것이 가장 큰 도움입니다.'],
  },

  english: {
    intro: ['영어는 단어·문법·독해·듣기가 따로 노는 과목이 아니라 서로를 받쳐주는 과목입니다. 어느 하나가 약하면 다른 영역도 같이 흔들리기 때문에, 학년별로 힘을 실어야 할 영역이 다릅니다. {p} 학생들이 학교 내신과 수능형 시험을 함께 대비할 수 있도록 시기별 공부법을 정리했습니다.', '영어 점수가 정체되는 학생들은 대부분 한 영역만 파고 있습니다. 단어만 외우거나, 문제만 풀거나. 하지만 영어는 어휘·문법·구문·독해가 서로를 받쳐주는 과목이라 병목이 된 영역을 찾아 그곳을 뚫어야 전체가 오릅니다. {p} 학생들이 학년별로 어디에 힘을 실어야 하는지 정리했습니다.', '초등 때 영어를 잘했던 아이가 중·고등에서 무너지는 경우는 흔합니다. 감으로 읽던 방식이 긴 문장과 시험 앞에서 한계를 만나기 때문입니다. 반대로 체계를 잡은 학생은 학년이 올라갈수록 격차를 벌립니다. {p} 학생들을 위해 시기별 영어 공부의 우선순위를 정리했습니다.'],
    grades: [
      { t: '초등 영어 공부법', b: ['초등 시기는 소리와 어휘의 기초 체력을 만드는 시기입니다. 파닉스가 불안정하면 단어를 통째로 그림처럼 외우게 되어 학년이 올라갈수록 한계가 옵니다. 소리 규칙을 먼저 잡고, 음원을 들으며 따라 읽는 낭독 훈련을 병행하면 읽기와 듣기가 같이 자랍니다. 어휘는 단어장 암기보다 쉬운 책을 많이 읽으며 문장 속에서 만나는 방식이 오래갑니다. 이 시기에 영어를 시험 과목이 아니라 재미있는 언어로 만나게 해주는 것이 이후 6년의 학습 태도를 결정합니다.', '초등 영어의 목표는 소리와 어휘의 기초 체력입니다. 파닉스가 흔들리면 단어를 그림처럼 통째로 외우게 되어 학년이 오를수록 한계가 옵니다. 소리 규칙을 잡고 음원 따라 읽기(낭독)를 병행하면 읽기와 듣기가 같이 자랍니다. 어휘는 단어장보다 쉬운 책 다독으로 문장 속에서 만나는 것이 오래가고, 무엇보다 영어를 시험이 아닌 재미있는 언어로 만나게 해주는 것이 이후 6년의 학습 태도를 결정합니다.', '초등 영어에서 서두를 것은 문법이 아니라 소리입니다. 파닉스로 소리 규칙을 잡고, 음원을 따라 읽는 낭독으로 입과 귀를 함께 훈련하세요. 어휘는 단어장 암기보다 수준에 맞는 책을 많이 읽으며 문장 속에서 만나는 쪽이 오래갑니다. 그리고 이 시기의 가장 중요한 성취는 점수가 아니라 "영어가 재미있다"는 감정입니다. 그 감정이 중·고등 6년의 연료가 됩니다.', '초등 영어에서 흔한 실수는 문법 조기 교육과 단어 시험 압박입니다. 소리 기반이 없는 문법은 모래성이고, 점수화된 단어 시험은 영어를 싫어할 이유만 만들어줍니다. 파닉스와 낭독으로 소리를 잡고, 쉬운 책 다독으로 어휘를 만나게 하고, 잘함보다 즐김을 칭찬하세요. 초등 영어의 성적표는 점수가 아니라 아이가 영어책에 손을 뻗는 빈도입니다.', '초등 영어는 수영 배우기와 같습니다. 물(소리)에 먼저 익숙해져야 하고, 이론(문법)은 물에 뜬 다음의 일입니다. 매일 짧게 물에 들어가는 아이(음원 노출)가 주 1회 오래 수영하는 아이보다 빨리 뜨고, 물이 무섭지 않은 아이가 결국 멀리 갑니다. 낭독은 물장구, 다독은 자유 수영입니다. 즐거워야 계속하고, 계속해야 늡니다.'] },
      { t: '중등 영어 공부법', b: ['중학교부터는 문법을 체계로 정리해야 합니다. 낱개로 배운 문법 규칙들을 문장의 구조(주어-동사-목적어) 안에서 연결해 이해하면 암기량이 줄어듭니다. 어휘는 하루 20~30개를 외우되, 다음 날과 일주일 뒤 두 번 복습하는 주기 반복이 핵심입니다. 한 번에 많이 외우고 잊는 것보다 훨씬 효율적입니다. 내신 대비는 교과서 본문 분석이 절반입니다. 본문의 문장 구조를 해석할 수 있게 만들고, 서술형에 자주 나오는 어법 포인트(시제, 수일치, 관계사 등)를 본문 문장으로 연습하면 감점을 크게 줄일 수 있습니다.', '중학 영어의 과제는 문법의 체계화와 어휘 시스템입니다. 낱개로 배운 문법을 문장 구조(주어-동사-목적어) 안에서 연결해 이해하면 암기량이 줄어듭니다. 어휘는 하루 20~30개씩, 다음 날과 일주일 뒤 두 번 복습하는 주기가 핵심입니다. 내신은 교과서 본문 분석이 절반이므로, 본문 문장의 구조를 해석할 수 있게 만들고 시제·수일치·관계사 같은 서술형 빈출 포인트를 본문 문장으로 연습해 감점을 막으세요.', '중학 영어는 흩어진 지식을 체계로 묶는 시기입니다. 문법 규칙을 낱개로 외우지 말고 문장 구조라는 지도 위에 배치하면 암기량이 줄어듭니다. 어휘는 양보다 주기입니다. 하루 20개를 다음 날과 일주일 뒤 두 번 복습하는 시스템이 몰아 외우기를 이깁니다. 내신의 절반은 교과서 본문에서 나오므로 본문 문장의 구조 분석과 서술형 빈출 어법(시제·수일치·관계사) 훈련이 시험 대비의 중심입니다.', '중학 영어의 흔한 함정은 단어장 몰아 외우기와 문법 용어 암기입니다. 월요일에 100개 외우고 금요일에 다 잊는 사이클, 관계대명사의 정의는 외우는데 문장에서 못 알아보는 상태가 그 결과물입니다. 처방은 단순합니다. 어휘는 20개씩 주기 복습으로, 문법은 용어가 아니라 문장 구조 그림으로. 그리고 내신 대비는 교과서 본문 분석이 문제집 세 권보다 낫습니다.', '중학 영어는 악기 연습과 같습니다. 문법은 악보 읽는 법이고, 어휘는 음계이며, 독해는 실제 연주입니다. 악보 이론만 외우고 연주하지 않으면 늘지 않듯, 문법 규칙을 외우고 문장에 적용하지 않으면 소용이 없습니다. 매일 짧은 연습(어휘 주기 복습)과 곡 하나를 완성하는 경험(본문 완전 분석)이 실력을 만듭니다.'] },
      { t: '고등 영어 공부법', b: ['고등 영어의 벽은 문장의 길이입니다. 단어를 다 알아도 해석이 안 되는 건 구문 독해력이 없기 때문입니다. 긴 문장을 주어부와 동사부로 끊고 수식 관계를 표시하며 읽는 훈련을 해야 지문 이해 속도가 올라갑니다. 유형별 접근법도 필요합니다. 빈칸은 글의 논리, 순서·삽입은 연결어와 대명사, 주제·제목은 반복되는 핵심어를 단서로 잡는 식으로 유형마다 공략법이 다릅니다. 내신은 학교 부교재와 변형 문제 대비가 관건이므로 학교별 출제 경향을 아는 것이 유리하고, 수능은 EBS 연계 교재를 지문 암기가 아닌 구문 분석용으로 활용해야 합니다.', '고등 영어의 벽은 문장 길이입니다. 단어를 다 알아도 해석이 안 되면 구문 독해력의 문제이므로, 긴 문장을 주어부-동사부로 끊고 수식 관계를 표시하며 읽는 훈련이 우선입니다. 유형별 공략법도 다릅니다. 빈칸은 글의 논리, 순서·삽입은 연결어와 대명사, 주제·제목은 반복 핵심어가 단서입니다. 내신은 부교재·변형 문제 대비가 관건이라 학교별 출제 경향을 아는 것이 유리하고, 수능은 EBS 연계 교재를 암기가 아닌 구문 분석용으로 써야 합니다.', '고등 영어에서 성적을 가르는 것은 어휘량이 아니라 긴 문장을 버티는 힘입니다. 주어부와 동사부를 끊고 수식 관계를 표시하는 구문 독해 훈련이 그 힘을 만듭니다. 유형별로는 빈칸은 논리, 순서·삽입은 연결어와 대명사, 주제는 반복 핵심어를 단서로 잡는 각각의 공략법을 익혀야 합니다. 내신은 학교 부교재와 변형 문제, 수능은 EBS 교재의 구문 분석 활용이 핵심 전략입니다.', '고등 영어에서 가장 흔한 낭비는 단어장만 계속 사는 것입니다. 3천 단어를 알아도 구문을 못 끊으면 해석은 안 됩니다. 반대 극단은 감으로 읽고 감으로 찍는 것입니다. 맞을 때는 이유를 모르고 틀릴 때는 교정이 안 됩니다. 구문 독해로 문장을 정확히 끊는 훈련, 유형별 단서를 잡는 접근법, 학교 변형 문제 적응. 이 세 축이 갖춰지면 감이 아니라 실력으로 읽게 됩니다.', '고등 영어 지문은 긴 터널과 같습니다. 어휘는 헤드라이트, 구문 독해는 차선을 읽는 능력입니다. 라이트가 밝아도 차선을 못 보면 터널에서 길을 잃고, 유형별 공략법은 출구 표지판을 읽는 요령입니다. EBS 연계 교재는 미리 달려보는 시뮬레이션 코스이므로 외우지 말고 주행 연습(구문 분석)에 쓰세요.'] },
    ],
    problems: [
      { q: '단어를 외워도 해석이 안 돼요', a: '어휘가 아니라 구문의 문제입니다. 문장이 길어지면 어디가 주어이고 동사인지 놓치는 것이므로, 문장 성분을 표시하며 읽는 구문 독해 훈련을 4~6주만 해도 해석 속도가 달라집니다.' },
      { q: '문법 용어가 어려워서 포기하게 돼요', a: '용어 암기가 아니라 문장 구조로 접근하면 됩니다. 관계대명사·분사구문 같은 용어를 몰라도 "이 덩어리가 앞의 명사를 꾸민다"는 구조를 그림으로 이해하면 문제는 풀립니다. 용어는 그다음입니다.' },
      { q: '지문 읽는 시간이 부족해요', a: '모든 문장을 같은 힘으로 읽고 있기 때문입니다. 주제문과 예시를 구분해 강약을 두고 읽는 스캐닝 훈련, 그리고 문제를 먼저 보고 지문에서 근거를 찾는 순서로 바꾸면 시간이 확보됩니다.' },
      { q: '서술형에서 늘 감점돼요', a: '아는 것과 정확히 쓰는 것의 차이입니다. 시제·수일치·어순 같은 감점 포인트를 체크리스트로 만들어 답안 작성 후 스스로 검토하는 습관을 들이면 같은 실수가 반복되지 않습니다.' },
      { q: '내신은 괜찮은데 모의고사만 보면 등급이 떨어져요', a: '내신은 범위 암기로 커버되지만 모의고사는 처음 보는 지문을 읽어내는 실력 그 자체를 묻기 때문입니다. 범위 없는 시험에 강해지려면 평소에 낯선 지문으로 구문 독해와 유형 훈련을 병행해야 하며, 이 격차는 방치할수록 고3 때 커집니다.' },
      { q: '듣기에서 자꾸 틀려요', a: '듣기는 아는 단어도 소리로 못 알아듣는 것이 문제입니다. 스크립트를 보며 음원을 따라 읽는 섀도잉을 주 2~3회만 해도 연음과 축약에 귀가 뚫리기 시작합니다. 문제 풀이보다 소리 훈련이 먼저입니다.' },
      { q: '교과서는 되는데 외부 지문이 안 돼요', a: '본문을 암기로 커버해온 신호입니다. 당장은 내신이 되지만 모의고사와 수능에서 벽을 만납니다. 처음 보는 지문을 구조로 읽는 훈련을 병행해야 하며, 늦기 전에 시작할수록 교정이 쉽습니다.' },
      { q: '단어를 외워도 금방 잊어버려요', a: '한 번에 오래 보는 방식이라 그렇습니다. 오늘 외운 단어를 내일 3분, 일주일 뒤 3분 다시 보는 주기 복습으로 바꾸면 같은 시간으로 기억량이 두 배 이상 차이 납니다. 수업에서 이 주기를 시스템으로 관리해 드립니다.' },
    ],
    help: ['{p} 영어 과외는 진단 테스트로 어휘·문법·구문·독해 중 어느 영역이 병목인지부터 찾습니다. 그다음 학교 교과서와 부교재 중심의 내신 트랙, 구문·유형 중심의 실력 트랙을 학생 상황에 맞는 비율로 섞어 수업합니다. 어휘는 수업마다 테스트로 주기 복습을 강제하고, 서술형 답안은 첨삭으로 감점 요인을 하나씩 제거합니다. 학교별 기출과 변형 문제 스타일을 반영해 시험 2주 전부터는 실전 대비로 전환합니다.', '{p} 영어 과외는 어휘·문법·구문·독해 중 어느 영역이 병목인지 진단하는 것부터 시작합니다. 이후 학교 내신 트랙과 실력 트랙을 학생 상황에 맞는 비율로 운영하며, 매 수업 단어 테스트로 복습 주기를 강제하고 서술형 답안은 첨삭으로 감점 요인을 제거합니다.', '영어는 혼자 공부할 때 자기가 뭘 모르는지 모르는 과목입니다. {p} 영어 과외에서는 학생이 문장을 해석하는 과정을 직접 관찰해 어디서 끊기는지 찾아내고, 구문 독해 훈련과 학교별 내신 대비를 병행합니다. 어휘 관리부터 서술형 첨삭까지 수업 밖 학습 루틴도 함께 설계합니다.'],
    routine: ['영어는 하루에 몰아 하는 과목이 아니라 매일 쪼개서 하는 과목입니다. 권장 루틴은 매일 어휘 20분(새 단어 + 복습 단어), 격일 구문 독해 30분, 주 2회 듣기 15분입니다. 어휘는 외운 날 기준으로 다음 날과 일주일 뒤 두 번 복습하는 주기를 지키는 것이 양보다 중요합니다. 독해는 하루 한 지문이라도 구조를 분석하며 정독하는 것이 열 지문 훑는 것보다 낫습니다. 수업이 있는 날에는 수업에서 배운 구문 포인트가 들어간 문장을 스스로 두세 개 찾아보면 배움이 자기 것이 됩니다.', '영어는 몰아서 하면 새고, 쪼개서 하면 쌓이는 과목입니다. 매일 어휘 20분(새 단어와 복습 단어 반반), 이틀에 한 번 구문 독해 30분, 주 2회 듣기 15분이 기본 틀입니다. 어휘는 외운 다음 날과 일주일 뒤 두 번의 복습 주기를 지키는 것이 양보다 중요하고, 독해는 열 지문을 훑기보다 한 지문을 구조 분석하며 정독하는 쪽이 실력이 됩니다. 수업에서 배운 구문이 들어간 문장을 스스로 두세 개 찾아보면 그날 배움이 완전히 자기 것이 됩니다.', '영어 루틴은 세 개의 작은 약속으로 만듭니다. 매일 어휘 20분, 이틀에 한 번 정독 30분, 주 2회 듣기 15분. 여기서 정독은 열 지문 훑기가 아니라 한 지문을 구조 분석하며 읽는 것을 뜻합니다. 어휘 복습은 다음 날과 일주일 뒤, 두 번의 주기를 지키는 것이 전부입니다. 작은 약속이라 지켜지고, 지켜지기 때문에 쌓입니다.', '영어 루틴의 흔한 실패는 ‘주말에 단어 200개’입니다. 기억은 만남의 횟수에 비례하지 한 번의 길이에 비례하지 않습니다. 또 하나, 듣기를 시험 전에만 하는 것도 실패 공식입니다. 귀는 벼락치기가 안 되는 기관입니다. 매일 어휘 20분, 격일 정독 30분, 주 2회 듣기 15분. 시시해 보이는 이 루틴이 몰아치기를 항상 이깁니다.', '영어는 화초 기르기와 같습니다. 주말에 물을 왕창 주는 것보다 매일 조금씩 주는 것이 뿌리를 만듭니다. 어휘 복습 주기는 물 주기 간격이고, 정독은 분갈이(뿌리를 깊게), 듣기는 햇빛(자연 노출)입니다. 하루 이틀 거른다고 시들지 않지만, 한 달을 거르면 다시 살리는 데 세 달이 걸립니다.'],
    exam: ['내신 4주 플랜은 이렇게 짭니다. 4주 전에는 교과서와 부교재 본문의 해석을 완성하고 모르는 어휘를 정리합니다. 3주 전에는 본문 속 문법 포인트(시제, 관계사, 분사 등)를 문장 단위로 분석하고, 2주 전부터는 학교별 기출과 변형 문제로 출제 스타일에 적응합니다. 서술형 배점이 큰 학교라면 이 시기에 영작 연습을 반드시 포함해야 합니다. 마지막 주는 본문 흐름과 빈출 문장을 최종 점검하고, 틀렸던 변형 문제를 다시 풀며 마무리합니다.', '내신 영어의 4주 설계는 이렇습니다. 4주 전 교과서·부교재 본문 해석 완성과 어휘 정리, 3주 전 본문 속 문법 포인트 문장 단위 분석, 2주 전부터 학교 기출과 변형 문제 적응 훈련. 서술형 배점이 큰 학교라면 이 시기에 영작 연습이 반드시 들어가야 합니다. 마지막 주는 본문 흐름과 빈출 문장 최종 점검, 그리고 틀렸던 변형 문제 재풀이로 마무리합니다.', '내신 영어 4주는 이렇게 흘러갑니다. 1주차 본문 해석 완성과 어휘 정리, 2주차 본문 속 문법 포인트 분석, 3주차 기출·변형 문제 적응(서술형 학교라면 영작 포함), 4주차 빈출 문장과 오답 최종 점검. 변형 문제는 학교마다 스타일이 달라, 우리 학교 유형을 아는 것이 문제집 한 권보다 가치 있습니다.', '내신 영어 대비의 흔한 실수는 본문 한글 해석 암기입니다. 변형 문제 앞에서 무너지는 지름길입니다. 문장 구조를 분석해두면 어떤 변형에도 대응이 되지만, 해석만 외우면 어순 바뀐 문장 하나에 흔들립니다. 서술형 학교에서 영작 연습 없이 시험장에 가는 것도 예고된 감점입니다. 4주 플랜에 구조 분석과 손 영작을 반드시 넣으세요.', '내신 영어 4주는 요리 준비와 같습니다. 1주차는 장보기(본문 해석·어휘 정리), 2주차는 재료 손질(문법 포인트 분석), 3주차는 시연(기출·변형 문제로 리허설), 마지막 주는 플레이팅 점검(빈출 문장·오답 확인)입니다. 손질 없이 시연부터 하면 재료(본문)가 낯설고, 시연 없이 본 시험은 첫 요리를 손님상에 올리는 격입니다.'],
    levels: ['수준별로 가장 효율이 높은 지점이 다릅니다. 기초 단계라면 어휘와 기본 문장 구조에 학습 시간의 대부분을 쓰는 것이 맞습니다. 이 단계에서 어려운 독해 문제집은 오히려 독이 됩니다. 중위권은 어휘는 되는데 긴 문장에서 무너지는 경우가 대부분이라, 구문 독해 훈련에 집중하면 가장 빠르게 점수가 오릅니다. 상위권은 고난도 유형(빈칸, 순서)의 정답률 관리와 함께, 서술형·수행평가 같은 감점 요소를 촘촘히 막는 것이 1등급 안착의 관건입니다. 자신이 어느 단계인지 애매하다면 진단 테스트로 확인하고 시작하는 것이 시행착오를 줄입니다.', '영어는 수준별로 돈이 되는 지점이 다릅니다. 기초 단계는 어휘와 기본 문장 구조에 시간 대부분을 쓰는 것이 맞고, 이때 어려운 독해 문제집은 오히려 독입니다. 중위권 대부분은 단어는 아는데 긴 문장에서 무너지는 상태이므로 구문 독해 집중 훈련이 가장 빠른 상승 경로입니다. 상위권은 빈칸·순서 같은 고난도 유형 정답률과 서술형 감점 관리가 1등급 안착의 관건입니다. 어느 단계인지 애매하면 진단 테스트로 확인하고 시작하세요.', '단계별 처방은 명확합니다. 기초권은 독해 문제집을 덮고 어휘와 기본 문장 구조에 올인하세요. 중위권은 "단어는 아는데 해석이 안 되는" 상태이므로 구문 독해 훈련 4~6주가 가장 가성비 높은 투자입니다. 상위권은 고난도 유형 정답률과 서술형·수행 감점 관리라는 디테일 싸움입니다. 위치가 애매하면 진단 테스트가 시행착오를 줄여줍니다.', '수준별로 피해야 할 함정이 있습니다. 기초권이 고난도 독해집을 붙잡는 것은 구구단 없이 인수분해를 하는 격이고, 중위권이 단어장만 늘리는 것은 이미 충분한 재료에 요리법 없이 재료만 사는 격입니다. 상위권이 쉬운 지문만 반복하는 것은 체급 아래 스파링만 하는 셈입니다. 각 단계의 병목(어휘·구문·고난도 유형)을 정확히 겨냥해야 노력이 점수가 됩니다.', '영어 실력은 사다리와 같아서 지금 밟은 칸에서 다음 칸만 밟을 수 있습니다. 기초권의 다음 칸은 어휘와 기본 문장, 중위권의 다음 칸은 구문 독해, 상위권의 다음 칸은 고난도 유형과 감점 관리입니다. 두 칸을 건너뛰려다 떨어지는 학생이 제자리인 학생보다 많습니다. 진단은 지금 밟은 칸을 확인하는 일입니다.'],
    parent: ['가정에서는 영어 노출 시간을 자연스럽게 늘려주세요. 하루 10분이라도 영어 음원이나 영상 콘텐츠를 꾸준히 접하는 아이와 시험 기간에만 영어를 보는 아이는 고등학교에서 확연히 갈립니다. 단어 시험 점수보다 "오늘 배운 문장 하나 읽어봐" 같은 가벼운 확인이 부담 없이 오래갑니다.', '가정에서 영어 단어를 외웠는지 검사하는 것보다 효과적인 방법이 있습니다. 아이가 배운 문장을 소리 내어 읽게 하고 들어주는 것입니다. 낭독은 읽기와 듣기 실력을 함께 키우는 가장 저렴한 훈련이고, 부모님이 들어준다는 사실만으로 아이는 꾸준해집니다.', '영어 노출은 짧아도 매일이 정답입니다. 등하교 시간 영어 노래나 짧은 영상 10분이 주말 몰아서 2시간보다 낫습니다. 그리고 시험 점수보다 "영어로 된 걸 겁내지 않는 태도"를 칭찬해 주세요. 그 태도가 고등학교 3년을 버티는 힘이 됩니다.'],
  },

  korean: {
    intro: ['국어는 모든 과목의 바탕이 되는 과목이면서, 정작 어떻게 공부해야 하는지 가장 막막한 과목이기도 합니다. 감으로 푸는 습관을 근거로 푸는 습관으로 바꾸는 것이 국어 공부의 전부라고 해도 과언이 아닙니다. {p} 학생들을 위해 학년별 국어 공부의 핵심을 정리했습니다.', '국어는 공부해도 티가 안 난다는 말이 많지만, 정확히는 잘못된 방법으로 공부한 시간이 티가 안 나는 것입니다. 지문을 많이 푸는 것보다 하나를 제대로 분석하는 것, 감으로 고르는 것보다 근거를 찾는 것. 방법을 바꾸면 국어도 분명히 오르는 과목입니다. {p} 학생들을 위한 학년별 국어 공부법입니다.', '수능에서 가장 먼저 치르는 과목이 국어이고, 국어가 무너진 날의 시험 전체가 흔들립니다. 그런데도 국어는 늘 공부 우선순위에서 밀립니다. 어떻게 해야 할지 몰라서입니다. {p} 학생들이 학년별로 국어를 어떻게 잡아야 하는지, 막연함을 걷어내고 정리했습니다.'],
    grades: [
      { t: '초등 국어 공부법', b: ['초등 국어의 핵심은 독서 습관과 어휘력입니다. 이 시기의 독서량은 이후 모든 과목의 독해력으로 전환되는 자산입니다. 다만 그냥 많이 읽는 것보다, 읽은 내용을 한두 문장으로 말해보게 하는 요약 습관을 붙이면 효과가 배가됩니다. 어휘는 모르는 단어를 만났을 때 사전을 찾고 자기 문장으로 한 번 써보는 것이 단어장 암기보다 오래갑니다. 일기나 짧은 글쓰기를 주 2~3회 꾸준히 하면 문장력과 맞춤법이 자연스럽게 잡히고, 이는 중·고등 서술형의 기초가 됩니다.', '초등 국어의 핵심 자산은 독서 습관과 어휘력입니다. 이 시기의 독서량은 이후 전 과목의 독해력으로 전환됩니다. 다만 그냥 많이 읽기보다 읽은 내용을 한두 문장으로 말해보게 하는 요약 습관을 붙이면 효과가 배가됩니다. 모르는 단어는 사전을 찾고 자기 문장으로 한 번 써보는 것이 단어장보다 오래가며, 주 2~3회의 짧은 글쓰기가 문장력과 맞춤법을 자연스럽게 잡아 중·고등 서술형의 기초가 됩니다.', '초등 국어에서 만들어야 할 것은 점수가 아니라 읽고 쓰는 체력입니다. 독서는 양과 함께 "읽고 나서 두 문장으로 말하기"라는 소화 과정을 붙여야 독해력으로 전환됩니다. 모르는 단어를 사전에서 찾아 자기 문장으로 써보는 습관, 주 2~3회의 짧은 글쓰기. 화려하지 않은 이 루틴들이 중·고등 국어와 전 과목 서술형의 기초 체력이 됩니다.', '초등 국어에서 흔한 오해는 책만 많이 읽으면 된다는 것입니다. 소화 없는 다독은 눈운동에 그칠 수 있습니다. 읽은 것을 두 문장으로 말해보는 요약, 모르는 단어를 자기 문장으로 써보는 어휘 소화, 주 2~3회의 짧은 쓰기가 붙어야 독서가 실력으로 전환됩니다. 반대로 문제집부터 들이미는 것도 금물입니다. 읽는 힘이 없는 상태의 문제 풀이는 국어를 싫어하게 만드는 지름길입니다.', '초등 국어는 밥상머리 교육과 가장 닮은 과목입니다. 오늘 읽은 이야기를 식탁에서 말하게 하고, ‘왜 그랬을까?’라고 물어주는 것이 최고의 독해 수업입니다. 어휘는 반찬처럼 매일 조금씩, 글쓰기는 일기처럼 부담 없이. 국어의 기초 체력은 학원이 아니라 일상의 대화량에서 자란다는 것이 이 시기의 진실입니다.'] },
      { t: '중등 국어 공부법', b: ['중학교 국어는 문학 개념어와 비문학 읽기 방법을 장착하는 시기입니다. 문학은 비유·상징·시점·갈등 같은 개념어를 정확히 알아야 작품 해석의 언어가 생깁니다. 작품을 외우는 것이 아니라 개념을 작품에 적용하는 연습이 중요합니다. 비문학은 문단마다 중심 문장을 찾고 문단 간 관계(원인-결과, 대조, 예시)를 표시하며 읽는 구조 독해를 훈련해야 합니다. 문법은 품사와 문장 성분 등 기초 체계를 이 시기에 잡아두지 않으면 고등 언어와 매체에서 크게 고생하므로, 내신 시험 범위와 별개로 기본 개념을 정리해 두는 것을 권합니다.', '중학 국어는 문학 개념어와 비문학 구조 독해를 장착하는 시기입니다. 비유·상징·시점·갈등 같은 개념어가 있어야 작품을 해석할 언어가 생기고, 작품 암기가 아닌 개념 적용 연습이 중요합니다. 비문학은 문단마다 중심 문장을 찾고 문단 간 관계(원인-결과, 대조, 예시)를 표시하며 읽는 훈련을 하세요. 문법의 기초 체계(품사, 문장 성분)를 이때 잡아두지 않으면 고등 언어와매체에서 크게 고생합니다.', '중학 국어의 두 과제는 문학의 언어와 비문학의 지도를 갖추는 것입니다. 비유·상징·시점 같은 개념어가 없으면 작품 앞에서 할 말이 없고, 문단 관계를 표시하며 읽는 구조 독해가 없으면 긴 글에서 길을 잃습니다. 여기에 품사와 문장 성분 같은 문법의 기초 골격을 이 시기에 세워두면, 고등 국어에서 남들이 헤맬 때 앞서갈 수 있습니다.', '중학 국어의 흔한 실수는 작품 줄거리 암기입니다. 시험 범위 작품을 외우면 당장은 되지만, 처음 보는 작품 앞에서 무너지는 공부입니다. 개념어(비유·상징·시점)를 익혀 어떤 작품에든 적용하는 힘, 비문학을 문단 관계로 읽는 구조 독해가 진짜 자산입니다. 문법을 시험 때만 벼락치기하는 것도 위험합니다. 고등 언어와매체에서 이자까지 붙어 돌아옵니다.', '중학 국어는 연장통을 채우는 시기입니다. 개념어는 드라이버, 구조 독해는 줄자, 문법은 수평계입니다. 연장 없이 작품이라는 가구를 조립하면 매번 맨손으로 낑낑대지만, 연장이 갖춰지면 처음 보는 가구도 설명서(지문)만 보고 조립할 수 있습니다. 고등학교는 더 복잡한 가구를 더 빨리 조립하라고 요구하는 곳입니다.'] },
      { t: '고등 국어 공부법', b: ['고등 국어는 기출 분석이 공부의 중심입니다. 지문을 많이 푸는 것보다 한 지문을 깊게 분석하는 것이 실력을 만듭니다. 틀린 문제는 정답의 근거가 지문 어디에 있는지 찾아 표시하고, 매력적인 오답이 왜 틀렸는지까지 설명할 수 있어야 같은 유형에서 다시 틀리지 않습니다. 문학은 주요 작품의 주제와 표현상 특징을 정리한 자기만의 노트가 내신과 수능 모두에서 무기가 됩니다. 선택과목(화법과작문/언어와매체)은 문법 자신감에 따라 결정하되, 언어와매체를 선택한다면 중등 문법부터 체계적으로 다시 쌓는 것이 안전합니다.', '고등 국어의 중심은 기출 분석입니다. 지문을 많이 푸는 것보다 한 지문을 깊게 파는 것이 실력을 만듭니다. 틀린 문제는 정답 근거를 지문에서 찾아 표시하고, 매력적 오답이 왜 틀렸는지까지 설명할 수 있어야 재발이 없습니다. 문학은 주요 작품의 주제와 표현 특징을 정리한 자기만의 노트가 내신·수능 공용 무기가 됩니다. 선택과목은 문법 자신감에 따라 정하되, 언어와매체를 고른다면 중등 문법부터 다시 쌓는 것이 안전합니다.', '고등 국어는 양치기가 통하지 않는 과목입니다. 열 지문을 풀기보다 한 지문에서 정답의 근거와 오답의 함정을 끝까지 추적하는 분석이 실력을 만듭니다. 문학은 빈출 작품의 주제·표현 특징을 정리한 자기 노트가 내신과 수능을 관통하는 무기이고, 선택과목은 문법 자신감을 기준으로 정하되 언어와매체 선택 시 중등 문법 복습부터 시작하는 것이 안전합니다.', '고등 국어의 대표적 낭비는 하루 열 지문 풀기입니다. 분석 없는 다풀이는 틀리는 방식만 반복 훈련하는 셈입니다. ‘감으로 2번’ 습관을 방치하는 것도 마찬가지입니다. 맞아도 실력이 아니고 틀려도 교정이 안 됩니다. 한 지문을 붙잡고 정답의 근거와 오답의 함정을 끝까지 추적하는 공부, 빈출 작품 정리 노트, 갈래별 시간 배분 훈련. 적게 풀고 깊게 파는 것이 고등 국어의 정답입니다.', '고등 국어 기출은 광산과 같습니다. 지나가며 돌만 주우면(채점만 하면) 빈손이고, 한 자리를 깊이 파야(근거 분석) 광맥이 나옵니다. 평가원이 오답을 매력적으로 만드는 방식에는 패턴이 있고, 그 패턴은 깊이 판 사람에게만 보입니다. 문학 정리 노트는 캐낸 광석을 제련해두는 창고입니다. 시험장에서는 창고에서 꺼내 쓰기만 하면 됩니다.'] },
    ],
    problems: [
      { q: '지문을 읽어도 머리에 남지 않아요', a: '눈으로만 읽고 있기 때문입니다. 문단마다 핵심어에 표시하고 한 줄 요약을 메모하며 읽는 능동적 독해로 바꾸면, 처음엔 느려져도 2~3주 뒤 이해도와 속도가 함께 올라갑니다.' },
      { q: '시와 소설 해석을 어떻게 해야 할지 모르겠어요', a: '작품마다 새로 해석하려 하면 끝이 없습니다. 화자·상황·정서·태도라는 틀로 시를, 인물·갈등·시점의 틀로 소설을 읽는 공식적인 접근법을 먼저 익히면 처음 보는 작품도 길이 보입니다.' },
      { q: '문법이 외계어 같아요', a: '문법은 암기 과목이 아니라 규칙 발견 과목입니다. 예문에서 규칙을 스스로 찾아보는 방식으로 배우면 훨씬 오래 남고, 음운변동·품사 같은 빈출 영역만 우선 잡아도 시험 체감 난도가 내려갑니다.' },
      { q: '다 풀면 시간이 없고, 시간 맞추면 정답률이 떨어져요', a: '지문 유형별로 시간 배분 기준을 정해두지 않아서입니다. 화작/언매-비문학-문학 순서와 영역별 제한 시간을 정해 모의 훈련을 반복하면 자기만의 시간 운영이 만들어집니다.' },
      { q: '어릴 때 책을 안 읽어서 이미 늦은 것 같아요', a: '독서량 부족은 불리한 출발점일 뿐 결승점이 아닙니다. 고등학생도 올바른 지문 분석 훈련을 체계적으로 하면 6개월 안에 유의미한 변화가 나타납니다. 늦었다고 느끼는 지금이 방법을 바꿀 가장 빠른 시점입니다.' },
      { q: '고전(고전시가·고전소설)이 너무 어려워요', a: '고전은 언어의 장벽부터 걷어내야 합니다. 자주 나오는 고어 표현과 관용구를 먼저 정리하고, 빈출 작품을 현대어 풀이와 함께 읽어 배경지식을 쌓으면 처음 보는 고전도 읽히기 시작합니다.' },
      { q: '문제집 채점만 하고 끝나요', a: '채점은 공부의 시작이지 끝이 아닙니다. 맞은 문제도 근거를 확인하고, 틀린 문제는 오답이 매력적이었던 이유까지 분석해야 같은 함정에 다시 빠지지 않습니다. 분석하는 방법 자체를 수업에서 훈련해 드립니다.' },
      { q: '수행평가 글쓰기가 막막해요', a: '채점 기준표를 먼저 확인하는 것이 절반입니다. 기준에 들어간 항목(주장 명확성, 근거, 분량)을 개요에 반영하고 쓰면 같은 실력으로 등급이 달라집니다. 학교별 수행 스타일에 맞춰 첨삭해 드립니다.' },
    ],
    help: ['{p} 국어 과외는 학생이 지문을 어떻게 읽는지 직접 관찰하는 것부터 시작합니다. 눈이 어디서 머무는지, 무엇을 놓치는지 확인한 뒤 읽기 습관 자체를 교정합니다. 문학 개념어와 문법은 학년 수준에 맞게 체계를 잡아주고, 내신 기간에는 학교 필기와 교과서 작품 중심으로, 그 외 기간에는 독해력과 기출 분석 중심으로 수업을 운영합니다. 서술형과 수행평가 글쓰기는 첨삭을 통해 문장 단위로 다듬어 드립니다.', '{p} 국어 과외는 학생의 읽기 습관을 관찰하는 것부터 시작합니다. 지문을 어떻게 읽고 어디서 놓치는지 확인한 뒤 독해 방법 자체를 교정하고, 문학 개념어와 문법 체계를 학년에 맞게 세워드립니다. 내신 기간에는 학교 필기 중심, 평시에는 기출 분석 중심으로 운영합니다.', '국어를 혼자 공부하면 채점만 반복하게 됩니다. {p} 국어 과외에서는 틀린 문제마다 지문의 근거를 함께 찾아 "왜"를 채워드리고, 서술형과 수행평가 글쓰기는 문장 단위 첨삭으로 다듬습니다. 감으로 푸는 습관을 근거로 푸는 습관으로 바꾸는 것이 수업의 목표입니다.'],
    routine: ['국어 실력은 벼락치기가 통하지 않는 대신, 짧은 루틴의 누적에 가장 정직하게 반응합니다. 권장 루틴은 매일 비문학 한 지문 정독(15~20분), 주 3회 문학 작품 하나 분석, 주 1회 어휘·문법 정리입니다. 지문을 풀 때는 채점보다 분석에 시간을 쓰세요. 정답과 오답의 근거를 지문에서 찾아 표시하는 10분이 문제 열 개를 더 푸는 것보다 실력이 됩니다. 수업이 있는 날에는 수업에서 배운 독해 방법을 다른 지문 하나에 직접 적용해보는 것이 가장 좋은 복습입니다.', '국어는 벼락치기가 안 통하는 대신 짧은 루틴의 누적에 가장 정직하게 반응합니다. 매일 비문학 한 지문 15~20분 정독, 주 3회 문학 작품 분석, 주 1회 어휘·문법 정리가 기본입니다. 지문을 풀 때는 채점에 1분, 분석에 10분을 쓰세요. 정답과 오답의 근거를 지문에 표시하는 그 10분이 열 문제를 더 푸는 것보다 실력을 만듭니다. 수업이 있는 날에는 배운 독해법을 다른 지문 하나에 직접 적용해보는 것이 최고의 복습입니다.', '국어 루틴은 소박하지만 배신하지 않습니다. 매일 비문학 한 지문 정독, 주 3회 문학 작품 하나, 주 1회 어휘·문법 정리. 문제를 푼 뒤에는 채점 1분, 분석 10분의 비율을 지키세요. 정답과 오답의 근거를 지문에서 찾아 표시하는 그 10분이 실력이 자라는 시간입니다. 빠르게 늘지 않지만, 한번 오르면 잘 떨어지지 않는 것이 국어입니다.', '국어 루틴의 흔한 실패는 시험 기간에만 국어를 보는 것입니다. 독해력은 시험 2주 전에 만들어지지 않습니다. 또 하나는 채점 후 바로 다음 지문으로 넘어가는 것입니다. 분석 없는 채점은 공부가 아니라 기록입니다. 매일 지문 하나 정독, 채점 1분에 분석 10분, 주 1회 어휘·문법. 이 소박한 루틴을 시험과 무관하게 돌리는 학생이 결국 이깁니다.', '국어 실력은 장 담그기와 같습니다. 하루아침에 안 되고, 매일의 온도(정독 습관)가 맛을 결정하며, 한번 제대로 익으면 오래갑니다. 문제 풀이는 간 보기일 뿐이고, 발효는 분석의 시간(근거 찾기 10분)에 일어납니다. 시험 전에만 급히 담근 장은 깊은 맛이 나지 않습니다.'],
    exam: ['내신 국어는 범위가 명확한 만큼 전략이 통합니다. 4주 전에는 시험 범위의 작품과 지문을 교과서 기준으로 정독하고 학교 필기를 정리합니다. 3주 전에는 작품별 핵심(주제, 표현상 특징, 시어·소재의 의미)을 노트로 만들고, 2주 전부터는 학교 기출과 문제집으로 출제 포인트를 확인합니다. 문법 단원이 범위에 있다면 이 시기에 개념-예문-문제의 순환을 두 바퀴 돌아야 합니다. 마지막 주는 필기 노트와 오답만 반복하며, 서술형 예상 문제의 모범 답안을 직접 써보는 것으로 마무리합니다.', '내신 국어는 범위가 정해져 있어 전략이 확실히 통합니다. 4주 전 시험 범위 작품·지문 정독과 학교 필기 정리, 3주 전 작품별 핵심 노트(주제, 표현상 특징, 시어의 의미) 제작, 2주 전 학교 기출과 문제집으로 출제 포인트 확인. 문법이 범위에 있다면 개념-예문-문제 순환을 이 시기에 두 바퀴 돌아야 합니다. 마지막 주는 필기와 오답만 반복하고, 서술형 예상 문제의 모범 답안을 직접 손으로 써보며 마무리하세요.', '내신 국어는 범위가 정해진 시험이라 준비한 만큼 나옵니다. 1주차 범위 작품·지문 정독과 필기 정리, 2주차 작품별 핵심 노트, 3주차 기출과 문제집으로 출제 포인트 확인, 4주차 오답과 필기 반복. 문법 단원이 있다면 2~3주차에 개념-예문-문제 순환을 두 바퀴 돌고, 서술형은 모범 답안을 눈으로 보지 말고 손으로 직접 써보는 것까지가 대비입니다.', '내신 국어 대비의 흔한 구멍은 학교 필기 무시와 서술형 눈 연습입니다. 출제자는 문제집 저자가 아니라 수업하신 선생님입니다. 필기와 강조점이 1순위 교재여야 합니다. 서술형을 눈으로만 준비하면 시험장에서 첫 문장이 안 나옵니다. 모범 답안을 직접 손으로 써보는 것까지가 대비입니다. 문법 범위는 개념-예문-문제 두 바퀴가 안전선입니다.', '내신 국어 4주는 공연 준비와 같습니다. 1주차 대본 리딩(작품·지문 정독과 필기 정리), 2주차 장면 분석(작품별 핵심 노트), 3주차 리허설(기출·예상 문제), 마지막 주 최종 점검(오답과 필기 반복). 무대에 오르기 전 대본을 손에서 놓지 않듯, 시험 전날의 주인공은 새 문제집이 아니라 학교 필기입니다.'],
    levels: ['국어는 성적대별 처방이 특히 뚜렷한 과목입니다. 기초 단계 학생은 문제 풀이보다 어휘력과 정독 습관부터 잡아야 합니다. 지문의 절반을 이해하지 못한 채 문제 기술만 배우면 성적이 오르지 않습니다. 중위권은 감으로 푸는 습관이 병목입니다. 모든 문제의 근거를 지문에서 찾는 훈련으로 "느낌상 2번"을 "지문 셋째 문단 때문에 2번"으로 바꾸는 것이 핵심 과제입니다. 상위권은 고난도 비문학과 문학의 매력적 오답 판별력, 그리고 시간 운영이 승부처입니다. 자주 틀리는 갈래(현대시, 고전 등)를 좁혀 집중 보완하는 것이 효율적입니다.', '국어 처방은 성적대별로 명확합니다. 기초 단계는 문제 풀이 전에 어휘력과 정독 습관부터 잡아야 합니다. 지문의 절반을 모른 채 푸는 기술은 성적을 못 올립니다. 중위권의 병목은 감으로 푸는 습관입니다. "느낌상 2번"을 "셋째 문단의 이 문장 때문에 2번"으로 바꾸는 근거 훈련이 핵심 과제입니다. 상위권은 매력적 오답 판별력과 시간 운영 싸움이므로, 자주 틀리는 갈래를 좁혀 집중 보완하는 것이 효율적입니다.', '국어의 단계별 처방입니다. 기초권은 문제 기술보다 어휘력과 정독 습관이 먼저입니다. 읽히지 않는 지문에 기술은 무력합니다. 중위권은 감으로 고르는 습관을 근거로 고르는 습관으로 바꾸는 것이 유일한 과제입니다. 상위권은 매력적 오답을 걸러내는 판별력과 갈래별 시간 배분 훈련으로 만점권을 다툽니다. 자주 틀리는 갈래를 좁혀 집중하는 것이 공통 원칙입니다.', '단계별로 흔한 헛발질이 있습니다. 기초권이 풀이 스킬 강의를 듣는 것은 자막 없이 외국 영화를 보며 감상법을 배우는 격입니다. 어휘와 정독이 먼저입니다. 중위권이 문제량으로 승부하는 것은 감 찍기 연습량만 늘리는 일입니다. 근거 훈련이 먼저입니다. 상위권이 쉬운 지문으로 안도하는 것은 체급 아래 경기만 뛰는 셈입니다. 취약 갈래의 고난도 지문을 정면으로 상대하세요.', '국어 성적은 렌즈 맞추기와 같습니다. 기초권은 렌즈 자체가 흐린 상태(어휘·정독 부족)라 도수부터 맞춰야 하고, 중위권은 초점이 감에 맞춰져 있어 근거로 초점을 옮기는 교정이 필요합니다. 상위권은 미세한 난시(특정 갈래 약점)만 남은 상태라 그 부분만 정밀 교정하면 만점권의 시야가 열립니다.'],
    parent: ['가정에서는 정답 여부보다 "왜 그렇게 생각했는지"를 물어봐 주세요. 자기 생각의 근거를 말로 설명하는 습관이 국어 실력의 본질입니다. 그리고 스마트폰 짧은 글에만 익숙해지지 않도록, 분량 있는 글을 끝까지 읽는 경험을 주기적으로 만들어 주는 것이 좋습니다.', '아이의 국어 실력이 걱정되신다면 집에서 가장 쉽게 할 수 있는 일이 있습니다. 아이가 본 영화나 책에 대해 "왜 그렇게 생각해?"라고 물어보는 것입니다. 자기 생각의 이유를 말로 정리하는 습관이 곧 국어 실력의 본질이고, 이건 학원에서 사줄 수 없는 훈련입니다.', '국어는 하루아침에 오르지 않지만 한번 오르면 잘 떨어지지 않는 과목입니다. 그래서 조급함이 가장 큰 적입니다. 몇 주 만에 점수를 기대하기보다 매일 지문 하나를 정독하는 습관이 자리 잡는지를 봐주세요. 습관이 잡히면 점수는 뒤따라옵니다.'],
  },

  science: {
    intro: ['과학은 암기 과목이라는 오해가 가장 많은 과목입니다. 실제로는 원리를 이해하면 외울 것이 절반으로 줄고, 원리 없이 외우면 조금만 문제를 비틀어도 무너집니다. {p} 학생들이 과학을 원리 중심으로 공부할 수 있도록 학년별 방법을 정리했습니다.', '과학이 어렵게 느껴지는 순간은 대부분 용어의 벽 앞에서입니다. 삼투, 관성, 이온화 같은 말이 일상 언어로 번역되지 않으면 교과서가 외국어처럼 읽힙니다. 반대로 원리가 그림으로 그려지기 시작하면 과학은 암기량이 가장 적은 과목이 됩니다. {p} 학생들을 위한 학년별 과학 공부법입니다.', '과학 성적은 학교 수업 자료를 얼마나 장악했느냐에서 갈립니다. 내신 문제의 상당수가 선생님의 프린트와 필기, 교과서 탐구 활동에서 나오기 때문입니다. 여기에 그래프 해석과 계산 훈련이 더해지면 과학은 안정적인 점수 과목이 됩니다. {p} 학생들의 학년별 과학 공부 우선순위를 정리했습니다.'],
    grades: [
      { t: '초등 과학 공부법', b: ['초등 과학의 목표는 지식의 양이 아니라 호기심과 관찰 습관입니다. 교과서 실험을 "결과 외우기"로 넘기지 말고, 왜 그런 결과가 나오는지 아이의 말로 설명해보게 하는 것이 중요합니다. 일상에서 만나는 현상(그림자, 계절, 물의 상태 변화)을 교과 개념과 연결해주면 과학이 시험 과목이 아니라 세상을 설명하는 도구라는 감각이 생깁니다. 이 감각이 중·고등 과학의 학습 태도를 결정합니다. 과학 독서나 다큐멘터리를 함께 보는 것도 배경지식을 넓히는 좋은 방법입니다.', '초등 과학의 목표는 지식량이 아니라 호기심과 관찰 습관입니다. 교과서 실험을 결과 암기로 넘기지 말고 왜 그런 결과가 나오는지 아이의 말로 설명해보게 하세요. 그림자, 계절, 물의 상태 변화 같은 일상 현상을 교과 개념과 이어주면 과학이 세상을 설명하는 도구라는 감각이 생기고, 이 감각이 중·고등 과학의 학습 태도를 결정합니다. 과학 독서와 다큐 시청도 훌륭한 배경지식 저축입니다.', '초등 과학의 목표는 시험이 아니라 "왜?"라는 질문을 지키는 것입니다. 실험 결과를 외우는 대신 왜 그렇게 되는지 아이의 언어로 설명해보게 하고, 그림자·계절·얼음 같은 일상 현상을 교과 개념과 이어주세요. 과학관 방문이나 다큐 시청 같은 경험은 훗날 독해형 문항에서 힘을 발휘하는 배경지식 저축입니다. 호기심이 살아있는 아이는 중등 과학에서 스스로 달립니다.', '초등 과학에서 흔한 실수는 실험 결과 암기시키기입니다. ‘얼음이 녹으면 물이 된다’를 외우는 아이보다 ‘왜 녹을까’를 묻는 아이가 중학 과학에서 앞서갑니다. 교과 개념을 일상과 연결해주지 않는 것도 아쉬운 지점입니다. 그림자 놀이, 요리하며 보는 상태 변화, 베란다 화분의 한살이. 생활이 실험실이 되는 순간 과학은 외울 과목에서 관찰할 세계로 바뀝니다.', '초등 과학은 탐정 놀이와 같습니다. 현상은 사건이고, 개념은 단서이며, 아이의 ‘왜?’는 수사의 시작입니다. 결과를 알려주는 것은 범인을 미리 말해주는 스포일러라, 추리의 재미와 함께 사고력도 사라집니다. 단서를 주고 스스로 추리하게 하면, 그 아이는 중·고등 과학이라는 더 복잡한 사건도 즐기며 풉니다.'] },
      { t: '중등 과학 공부법', b: ['중학교 과학은 물리·화학·생명·지구과학 네 영역이 섞여 나오며, 영역마다 공부법이 다릅니다. 물리·화학은 개념과 공식이 왜 성립하는지 유도 과정을 이해해야 계산 문제가 풀리고, 생명·지구과학은 용어와 과정을 그림과 흐름도로 정리하는 것이 효과적입니다. 공통적으로 중요한 것은 그래프와 표 해석 능력입니다. 시험 문제의 절반 이상이 자료 해석형으로 출제되므로, 개념을 배울 때마다 관련 그래프의 축과 의미를 함께 정리하는 습관을 들여야 합니다. 탐구 과정 서술형은 "가설-과정-결과-결론"의 틀로 답안을 쓰는 연습이 필요합니다.', '중학 과학은 물리·화학·생명·지구 네 영역의 공부법이 서로 다릅니다. 물리·화학은 공식의 유도 과정을 이해해야 계산이 풀리고, 생명·지구는 용어와 과정을 그림·흐름도로 정리하는 것이 효율적입니다. 공통 핵심은 그래프·표 해석력입니다. 시험의 절반 이상이 자료 해석형이므로 개념을 배울 때마다 관련 그래프의 축과 의미를 함께 정리하세요. 탐구 서술형은 가설-과정-결과-결론 틀로 답안을 쓰는 연습이 필요합니다.', '중학 과학은 네 영역이 한 과목에 담긴 구조라 영역별 공부법을 구분해야 합니다. 물리·화학은 공식이 왜 성립하는지 유도 과정까지, 생명·지구는 용어와 과정을 그림·흐름도로. 그리고 모든 영역을 관통하는 무기는 자료 해석입니다. 시험의 절반이 그래프·표 문항이므로 개념을 배울 때마다 관련 자료의 축과 의미를 함께 정리하는 습관이 점수를 만듭니다.', '중학 과학의 흔한 함정은 전 영역을 같은 방식으로 공부하는 것입니다. 물리를 암기로, 생명을 계산 훈련으로 접근하면 양쪽 다 비효율입니다. 물·화는 원리와 공식 유도, 생·지는 그림·흐름도 정리라는 영역별 공부법을 구분하세요. 그래프 문제를 개념과 분리해 나중에 몰아 푸는 것도 실수입니다. 개념을 배울 때 자료를 함께 봐야 시험장의 낯섦이 사라집니다.', '중학 과학은 네 가지 종목의 철인 경기입니다. 물리는 근력(논리), 화학은 기술(공식 적용), 생명은 지구력(체계 암기), 지구과학은 독도법(자료 해석)을 요구합니다. 한 가지 훈련법으로 네 종목을 준비하는 선수는 없습니다. 종목별 훈련을 구분하되, 모든 종목의 공통 기초 체력은 그래프·표 읽기라는 것을 기억하세요.'] },
      { t: '고등 과학 공부법', b: ['고등 과학은 통합과학을 기반으로 선택과목(물리학·화학·생명과학·지구과학)으로 심화됩니다. 선택은 흥미와 진로, 그리고 계산형(물리·화학)과 자료해석형(생명·지구) 중 자신의 강점을 함께 고려해야 합니다. 어느 과목이든 개념 학습 후 기출 문제로 출제 포인트를 확인하는 순환이 기본이며, 특히 수능형 문제는 여러 개념을 한 문제에 엮어 내므로 단원 간 연결 정리가 중요합니다. 내신은 학교 선생님의 필기와 프린트가 출제의 중심이므로 수업 자료를 1순위 교재로 삼고, 실험 관련 문항은 과정과 유의점까지 정리해야 합니다.', '고등 과학은 통합과학을 지나 선택과목으로 심화됩니다. 선택은 흥미·진로와 함께 계산형(물·화)과 자료해석형(생·지) 중 자신의 강점을 고려해야 합니다. 어떤 과목이든 개념 학습 후 기출로 출제 포인트를 확인하는 순환이 기본이고, 수능형 문제는 단원 간 연결 정리가 중요합니다. 내신은 학교 선생님의 필기와 프린트가 출제 중심이므로 수업 자료를 1순위 교재로 삼고, 실험 문항은 과정과 유의점까지 정리해야 합니다.', '고등 과학의 첫 단추는 선택입니다. 흥미·진로와 함께 계산형(물리·화학)과 자료해석형(생명·지구) 중 자신의 강점을 근거로 과목을 고르세요. 공부는 개념-기출-오답의 순환이 기본이고, 수능형 통합 문항에 대비한 단원 간 연결 정리가 상위권을 가릅니다. 내신은 학교 수업 자료가 곧 출제 범위이므로 선생님의 필기와 프린트를 1순위 교재로 삼아야 합니다.', '고등 과학 선택에서 흔한 실수는 친구 따라가기와 소문 따라가기입니다. ‘물리는 어렵다더라’로 피하고 ‘생명은 암기만 하면 된다더라’로 고르면, 자기 강점과 어긋난 과목에서 2년을 고생합니다. 계산이 편한지 자료 해석이 편한지, 중등 성적 데이터로 판단하세요. 선택 후에는 학교 수업 자료를 1순위로, 기출로 출제 포인트를 확인하는 순환이 정석입니다.', '고등 과학탐구는 전공 선택의 예고편입니다. 과목 선택은 적성 검사이기도 해서, 계산형(물·화)과 해석형(생·지) 중 어디서 편안한지가 이공계 진로의 힌트가 됩니다. 공부는 채굴과 제련의 반복입니다. 개념서에서 캐고(학습) 기출에서 제련하며(적용), 학교 프린트라는 지도에 표시된 광맥(출제 포인트)을 우선 파는 것이 내신의 요령입니다.'] },
    ],
    problems: [
      { q: '외울 게 너무 많아서 과학이 싫어요', a: '원리 없이 결과만 외우고 있기 때문입니다. "왜"를 한 번 이해하면 연결된 사실들이 한 덩어리로 기억됩니다. 암기량이 많다고 느껴지는 단원일수록 원리부터 다시 잡는 것이 지름길입니다.' },
      { q: '개념은 이해했는데 계산 문제가 안 풀려요', a: '공식을 외우기만 하고 상황에 적용하는 연습이 부족한 경우입니다. 문제 속 물리량을 기호로 정리하고 어떤 공식이 연결되는지 판단하는 과정을 단계별로 훈련하면 해결됩니다.' },
      { q: '그래프·표 문제만 나오면 막혀요', a: '자료 해석은 별도의 기술입니다. 축이 무엇인지, 기울기와 넓이가 무엇을 의미하는지 먼저 읽는 루틴을 만들고, 기출의 자료 해석 문항만 모아 연습하면 빠르게 좋아집니다.' },
      { q: '실험 서술형에서 점수가 깎여요', a: '결과는 아는데 과정 서술이 빈약한 경우가 많습니다. 조작 변인과 통제 변인, 유의점을 포함하는 답안 틀을 익혀두면 같은 지식으로도 점수가 달라집니다.' },
      { q: '어떤 선택과목을 골라야 할지 모르겠어요', a: '흥미, 진로 연계, 그리고 자신의 강점(계산형인지 자료해석형인지)을 함께 봐야 합니다. 중등 성적에서 물리·화학 계산과 생명·지구 암기 중 어느 쪽이 편했는지가 좋은 힌트가 되며, 상담에서 학생 데이터를 보고 함께 정해드릴 수 있습니다.' },
      { q: '교과서는 이해되는데 시험 문제가 낯설어요', a: '개념을 문제 상황으로 변환하는 연습이 부족한 경우입니다. 교과서를 읽은 뒤 반드시 해당 단원 문제를 풀어 이해를 검증하는 습관을 들이고, 특히 자료가 낀 문항을 우선 연습해야 시험 체감 난도가 내려갑니다.' },
      { q: '과학 용어가 안 외워져요', a: '용어를 글자로 외우면 금방 사라집니다. 용어마다 그림 하나, 실생활 예시 하나를 붙여 저장하면 기억이 오래가고, 서술형에서 용어를 정확히 쓰는 힘도 함께 생깁니다.' },
      { q: '수학이 약한데 물리·화학이 걱정돼요', a: '물리·화학의 계산은 수학 실력보다 공식을 상황에 연결하는 절차의 문제인 경우가 많습니다. 필요한 수학 도구만 짚어 보충하면서 진행하면 수학이 약해도 충분히 따라갈 수 있습니다.' },
    ],
    help: ['{p} 과학 과외는 학생이 어느 영역(물·화·생·지)에서 막히는지, 개념·계산·자료해석 중 무엇이 약한지를 진단으로 구분한 뒤 시작합니다. 원리를 그림과 실생활 예시로 풀어 설명해 암기 부담을 줄이고, 학교 진도와 시험 범위에 맞춰 개념-문제-오답의 순환을 관리합니다. 내신 기간에는 학교 프린트와 기출 스타일을 반영한 예상 문제로 마무리하고, 서술형 답안 작성법까지 첨삭해 드립니다.', '{p} 과학 과외는 물·화·생·지 중 취약 영역과 취약 유형(개념/계산/자료해석)을 진단으로 구분한 뒤 시작합니다. 원리를 그림과 실생활 예시로 풀어 암기 부담을 줄이고, 학교 프린트 중심의 내신 대비와 서술형 답안 첨삭까지 관리합니다.', '과학은 영역마다 공부법이 달라 혼자서는 전략을 세우기 어렵습니다. {p} 과학 과외에서는 물리·화학의 계산 문제는 공식 적용 과정을, 생명·지구과학은 흐름도 정리를 각각 훈련하고, 시험 기간에는 학교 출제 스타일에 맞춘 자료 해석·실험 문항 대비로 마무리합니다.'],
    routine: ['과학은 개념을 배운 직후의 복습이 가장 중요합니다. 권장 루틴은 수업 당일 배운 단원의 개념을 그림·흐름도로 한 장에 정리하고, 이틀 안에 관련 문제를 풀어 이해를 확인하는 것입니다. 주말에는 한 주 동안 배운 내용의 그래프와 표만 모아 다시 읽어보세요. 자료 해석 감각은 이렇게 짧게 자주 만나야 자랍니다. 계산형 단원(물리·화학)은 공식 유도 과정을 일주일에 한 번 백지에 재현해보는 것이 공식 암기보다 오래갑니다.', '과학은 배운 직후의 복습이 승부처입니다. 수업 당일 그 단원을 그림과 흐름도로 한 장에 정리하고, 이틀 안에 문제로 이해를 검증하세요. 주말에는 한 주간 나온 그래프와 표만 모아 다시 읽는 시간을 15분만 가져도 자료 해석 감각이 자랍니다. 물리·화학의 공식은 유도 과정을 일주일에 한 번 백지에 재현해보는 것이 단순 암기보다 훨씬 오래갑니다.', '과학 복습의 골든타임은 배운 당일입니다. 그날 저녁 단원 내용을 그림과 흐름도로 한 장 정리하고, 이틀 안에 문제로 검증하세요. 주말 15분은 그 주의 그래프·표만 다시 보는 시간으로 씁니다. 공식은 외우지 말고 일주일에 한 번 유도 과정을 백지에 재현해보세요. 유도할 수 있는 공식은 잊어버려도 다시 만들 수 있습니다.', '과학 복습의 흔한 실패는 시험 전 몰아 정리입니다. 한 달치 그래프와 용어를 이틀에 소화하려니 체하는 것입니다. 배운 날의 한 장 정리, 이틀 내 문제 검증, 주말 15분 자료 훑기로 나누면 같은 내용이 부담 없이 쌓입니다. 공식을 결과만 외우는 것도 위험합니다. 유도를 백지에 재현하는 주 1회 훈련이 응용 문제의 보험입니다.', '과학 지식은 시멘트와 같아서 배운 직후가 굳기 전의 골든타임입니다. 당일 정리는 틀을 잡는 일이고, 이틀 내 문제 풀이는 양생 과정이며, 주말 자료 복습은 표면 점검입니다. 굳은 뒤에 고치려면 깨고 다시 발라야 하지만, 젖어 있을 때는 손끝으로도 모양이 잡힙니다.'],
    exam: ['과학 내신 4주 플랜입니다. 4주 전에는 교과서와 학교 프린트로 시험 범위 개념을 정리하고, 3주 전에는 단원별 문제 풀이로 이해를 점검합니다. 2주 전부터는 학교 기출 스타일의 자료 해석·계산 문제를 집중 연습하고, 실험 단원이 범위에 있다면 과정·변인·유의점을 서술형 틀로 정리합니다. 마지막 주는 오답과 학교 필기 중심으로 반복하되, 선생님이 수업 중 강조한 부분을 최우선으로 점검하세요. 과학 내신은 수업 자료에서 그대로 출제되는 비율이 높은 과목입니다.', '과학 내신 4주 플랜입니다. 4주 전 교과서와 학교 프린트로 범위 개념 정리, 3주 전 단원별 문제 풀이로 점검, 2주 전부터 자료 해석·계산 문항 집중 훈련. 실험이 범위에 있으면 과정·변인·유의점을 서술형 틀로 정리해 두세요. 과학 내신은 수업 자료에서 그대로 나오는 비율이 높은 과목이라, 마지막 주는 선생님이 강조한 부분과 학교 필기를 최우선으로 반복하는 것이 정답입니다.', '과학 시험 4주 설계입니다. 1주차 교과서·프린트 개념 정리, 2주차 단원별 문제 점검, 3주차 자료 해석·계산 집중 훈련과 실험 단원 서술형 틀 정리, 4주차 학교 필기와 오답 반복. 과학 내신은 다른 과목보다 수업 자료 출제 비율이 높아, 마지막 주에 문제집보다 선생님 강조 부분을 다시 보는 것이 점수에 직결됩니다.', '과학 시험 대비의 흔한 구멍은 학교 프린트 경시입니다. 시중 문제집을 세 권 풀어도 선생님 프린트의 그 그래프에서 출제됩니다. 실험 단원을 결과만 정리하는 것도 감점 예약입니다. 조작·통제 변인과 유의점까지 서술형 틀로 준비하세요. 마지막 주에 새 문제를 벌리는 대신 필기와 오답을 반복하는 것, 과학에서는 특히 이 원칙이 점수로 직결됩니다.', '과학 내신 4주는 실험 절차와 같습니다. 1주차 준비물 확인(교과서·프린트 개념 정리), 2주차 예비 실험(단원별 문제), 3주차 본 실험(자료 해석·계산 집중, 실험 서술형 틀), 4주차 결과 정리(필기·오답 반복). 본 실험 없이 시험장에 가는 것은 첫 실험을 평가받는 셈이고, 준비물(수업 자료) 없는 실험은 시작부터 성립하지 않습니다.'],
    levels: ['상황별로 접근이 달라야 합니다. 과학이 처음부터 어려운 학생은 대부분 용어의 벽에 막혀 있습니다. 개념어를 일상 언어로 풀어 이해하는 과정을 거치면 교과서가 읽히기 시작합니다. 중위권은 개념형은 맞는데 자료 해석·계산형에서 틀리는 패턴이 많으므로, 취약 유형만 골라 집중 훈련하는 것이 점수를 올리는 최단 경로입니다. 상위권은 단원 간 통합 문항과 실험 설계형 문제 대비가 관건이며, 교과서 탐구 활동과 심화 자료까지 정리해야 최고 등급이 안정됩니다. 진로가 이공계라면 지금 과목별 강점을 파악해 고등 선택과목 전략까지 미리 그려두는 것이 좋습니다.', '과학이 어려운 학생은 대부분 용어의 벽에 막혀 있습니다. 개념어를 일상 언어로 번역하는 과정을 거치면 교과서가 읽히기 시작합니다. 중위권은 개념형은 맞고 자료·계산형에서 틀리는 패턴이 많으니 취약 유형만 골라 훈련하는 것이 최단 경로입니다. 상위권은 단원 통합형 문항과 실험 설계 문제까지 대비해야 최고 등급이 안정되고, 이공계 진로라면 지금의 영역별 강약점 데이터로 고등 선택과목 전략까지 미리 그려두는 것이 좋습니다.', '과학의 단계별 접근입니다. 어려움을 느끼는 학생은 대부분 용어 장벽이 원인이므로 개념어를 일상 언어로 번역하는 것부터 시작합니다. 중위권은 개념형은 맞고 자료·계산형에서 틀리는 전형적 패턴이므로 취약 유형 집중 훈련이 지름길입니다. 상위권은 단원 통합·실험 설계 문항 대비로 최고 등급을 굳히고, 이공계 지망이라면 영역별 강약점을 선택과목 전략의 데이터로 삼으세요.', '단계별 흔한 낭비를 짚으면, 기초권이 용어를 건너뛰고 문제부터 푸는 것은 단어 모르는 외국어 시험과 같습니다. 중위권이 개념서만 세 번 읽는 것은 이미 아는 60%를 반복하는 일입니다. 취약 유형 문제로 나머지 40%를 공략하세요. 상위권이 쉬운 문제 정답률에 안주하는 것은 통합형·실험형이라는 진짜 변별 구간을 방치하는 셈입니다.', '과학 실력은 현미경 배율과 같습니다. 기초권은 저배율(용어와 큰 개념)부터 초점을 맞춰야 하고, 중위권은 중배율(취약 유형)에서 상이 흐린 상태이며, 상위권은 고배율(통합·실험 문항)의 미세 초점 싸움입니다. 배율을 건너뛰고 고배율부터 들여다보면 아무것도 보이지 않는 것이 당연합니다.'],
    parent: ['가정에서는 "그건 왜 그럴까?"라는 질문을 아이에게 돌려주세요. 답을 알려주는 것보다 스스로 설명해보게 하는 것이 과학적 사고를 키웁니다. 박물관·과학관 방문이나 다큐 시청처럼 교과 밖 경험도 배경지식이 되어 독해형 문항에서 힘을 발휘합니다.', '과학에 흥미가 없어 보이는 아이라도 좋아하는 것 하나쯤은 과학과 연결됩니다. 게임의 물리 엔진, 요리 속 화학 변화, 반려동물의 생태까지. 아이의 관심사를 과학 언어로 한 번씩 이어주는 대화가 교과서보다 강한 동기를 만듭니다.', '과학 성적표를 보실 때는 점수보다 어느 영역에서 틀렸는지를 봐주세요. 물리 계산에서 틀리는 아이와 생명 암기에서 틀리는 아이는 처방이 완전히 다릅니다. 영역별 강약점은 나중에 고등 선택과목 결정에도 중요한 데이터가 됩니다.'],
  },

  social: {
    intro: ['사회는 범위가 넓어 무작정 외우기 시작하면 끝이 없는 과목입니다. 흐름과 구조를 먼저 잡고 세부 사실을 그 위에 얹는 순서로 공부해야 암기량이 줄고 오래 남습니다. 특히 사회는 학교 선생님의 수업 강조점이 시험에 직결되는 과목이라, 학교 수업 필기를 중심에 두고 공부 체계를 세우는 것이 중요합니다. {p} 학생들을 위한 학년별 사회 공부법을 정리했습니다.', '사회를 잘하는 학생은 많이 외우는 학생이 아니라 구조로 정리하는 학생입니다. 목차 수준의 큰 흐름을 먼저 잡고 세부 사실을 그 안에 걸어두면, 같은 내용도 절반의 노력으로 기억되고 시험장에서 꺼내 쓰기도 쉽습니다. {p} 학생들을 위한 학년별 사회 공부법을 정리했습니다.', '사회는 배신하지 않는 과목이라 불리지만, 방법 없이 덤비면 가장 배신감이 큰 과목이기도 합니다. 외운 것 같은데 문제에서 틀리는 경험은 개념의 정확도가 부족하다는 신호입니다. {p} 학생들이 학년별로 사회를 어떻게 공부해야 하는지 핵심을 정리했습니다.'],
    grades: [
      { t: '초등 사회 공부법', b: ['초등 사회는 생활과 연결할수록 쉬워집니다. 지도, 뉴스, 가족 여행 같은 일상 경험을 교과 내용과 이어주면 추상적인 개념이 손에 잡히기 시작합니다. 지리는 지도를 직접 그려보고, 역사는 연표를 만들어 시간 순서를 몸에 익히는 활동형 학습이 효과적입니다. 용어가 어려운 과목이므로 모르는 단어를 그냥 넘기지 않고 뜻을 확인하는 습관이 중요하며, 이 습관이 중등 사회의 개념 학습으로 자연스럽게 이어집니다.', '초등 사회는 생활과 연결될수록 쉬워집니다. 지도, 뉴스, 가족 여행 같은 경험을 교과 내용과 이어주면 추상적 개념이 손에 잡힙니다. 지리는 지도를 직접 그려보고 역사는 연표를 만들어 시간 순서를 몸에 익히는 활동형 학습이 효과적입니다. 사회는 용어가 어려운 과목이라 모르는 단어를 그냥 넘기지 않는 습관이 중요하고, 이 습관이 중등 개념 학습으로 그대로 이어집니다.', '초등 사회는 교과서 밖에서 절반이 배워집니다. 지도를 그려보고, 뉴스를 함께 보고, 여행지의 지명 유래를 찾아보는 경험이 추상적인 개념을 손에 잡히게 만듭니다. 역사는 연표 만들기로 시간 감각을, 지리는 지도 그리기로 공간 감각을 키우세요. 어려운 용어를 그냥 넘기지 않는 습관 하나가 중등 사회의 개념 학습을 결정합니다.', '초등 사회에서 흔한 실수는 용어를 아이 혼자 넘기게 두는 것입니다. ‘민주주의’ ‘자치’를 모른 채 교과서를 읽으면 글자만 스치고 지나갑니다. 모르는 말을 물어봐도 되는 분위기, 함께 찾아보는 습관이 먼저입니다. 지도와 연표 없이 글로만 배우는 것도 아쉽습니다. 손으로 그린 지도 한 장, 함께 만든 연표 한 줄이 교과서 열 페이지의 이해를 만듭니다.', '초등 사회는 동네 산책에서 시작됩니다. 시장은 경제 교과서이고, 주민센터는 행정의 현장이며, 버스 노선도는 살아있는 지도 수업입니다. 여행지의 지명 유래, 뉴스에 나온 선거 이야기를 나누는 가정의 아이는 사회를 책이 아니라 자기 삶으로 만납니다. 그 감각이 중등 사회의 추상 개념을 붙잡는 닻이 됩니다.'] },
      { t: '중등 사회 공부법', b: ['중학교 사회·역사는 구조화가 핵심입니다. 역사는 사건을 낱개로 외우지 말고 배경-전개-결과-영향의 흐름으로 묶어 이야기처럼 이해해야 합니다. 시대별로 정치·경제·사회·문화를 표로 정리하면 비교 문제에 강해집니다. 일반사회는 민주주의·경제 같은 추상 개념을 실제 사례와 연결해 이해하고, 헷갈리는 유사 개념(예: 권리와 의무, 물가와 환율)은 차이점 중심으로 따로 정리해야 합니다. 시험 2주 전부터는 교과서를 처음부터 다시 읽으며 선생님이 강조한 부분과 자료(사진, 지도, 그래프)를 점검하는 것이 고득점의 마무리입니다.', '중학 사회·역사의 열쇠는 구조화입니다. 역사는 사건을 배경-전개-결과-영향의 이야기로 묶고, 시대별 정치·경제·사회·문화를 표로 정리하면 비교 문제에 강해집니다. 일반사회는 추상 개념을 실제 사례와 연결해 이해하고, 헷갈리는 유사 개념은 차이점 중심으로 따로 정리해야 합니다. 시험 2주 전에는 교과서를 처음부터 다시 읽으며 선생님이 강조한 부분과 자료(사진, 지도, 그래프)를 점검하는 것이 고득점의 마무리입니다.', '중학 사회·역사에서 암기량을 줄이는 유일한 방법은 구조입니다. 역사는 배경-전개-결과-영향의 이야기로, 시대별 특징은 비교표로, 일반사회의 추상 개념은 실제 사례로 묶으세요. 헷갈리는 유사 개념은 반드시 한 표에 모아 차이점을 직접 써봐야 분리됩니다. 시험 2주 전 교과서 통독과 자료(사진·지도·그래프) 점검이 고득점의 마무리 공식입니다.', '중학 사회·역사의 흔한 함정은 노트 꾸미기와 낱개 암기입니다. 형광펜 다섯 색으로 베낀 노트는 공부한 착각을 주고, 사건을 연도로만 외우면 순서 문제에서 반드시 섞입니다. 흐름으로 묶고(배경-전개-결과), 표로 비교하고(시대별·개념별), 백지에 재현해보는 것. 화려하지 않은 이 세 동작이 사회 고득점의 실체입니다.', '중학 역사는 드라마 정주행과 같습니다. 회차(사건)를 건너뛰며 명장면만 보면 인물 관계(인과)가 안 잡히지만, 흐름으로 보면 다음 화가 예측됩니다. 일반사회는 뉴스라는 현재 진행형 드라마의 세계관 설명서입니다. 개념(설정)을 사례(에피소드)와 연결해 보는 학생에게 사회는 암기 과목이 아니라 스토리 과목이 됩니다.'] },
      { t: '고등 사회 공부법', b: ['고등 사회탐구는 선택과목(생활과윤리, 사회문화, 한국지리, 정치와법 등)에 따라 성격이 크게 다릅니다. 생활과윤리는 사상가별 입장의 미세한 차이를, 사회문화는 개념의 정확한 정의와 도표 해석을, 지리는 지도와 통계 자료 분석을 요구합니다. 공통 전략은 개념을 어설프게 여러 번 보는 것보다 한 번을 정확하게 잡는 것입니다. 수능형 문제는 개념의 경계를 파고들기 때문입니다. 기출 선지를 오답 노트로 만들어 "왜 맞고 왜 틀린지"를 개념서에 역으로 표시하며 공부하면, 같은 개념이 다른 모습으로 나와도 흔들리지 않습니다. 내신과 수능 준비를 분리하지 말고, 내신 기간의 정리 노트를 수능 개념서와 연결해 하나의 자산으로 누적해 가면 고3에서 사탐 부담이 크게 줄어듭니다. 선택과목 조합은 학습량과 표준점수 특성이 다르므로 고2 겨울 전에 결정해 집중하는 것이 유리합니다.', '고등 사회탐구는 선택과목마다 성격이 다릅니다. 생활과윤리는 사상가 입장의 미세한 차이, 사회문화는 개념의 정확한 정의와 도표 해석, 지리는 지도·통계 분석이 각각 관건입니다. 공통 전략은 개념을 어설프게 여러 번 보지 말고 한 번을 정확히 잡는 것입니다. 기출 선지로 오답 노트를 만들어 왜 맞고 틀렸는지를 개념서에 역표시하며 공부하면 같은 개념이 다른 모습으로 나와도 흔들리지 않고, 내신 정리를 수능 자산으로 누적하면 고3 부담이 크게 줄어듭니다.', '고등 사탐은 과목마다 요구하는 근육이 다릅니다. 생활과윤리는 사상가 입장의 미세 비교, 사회문화는 개념 정의의 정확성과 도표, 지리는 지도·통계 분석력. 공통 원칙은 개념을 대충 여러 번이 아니라 정확히 한 번 잡는 것입니다. 기출 선지의 정오 근거를 개념서에 역으로 표시하는 공부법이 수능형 변형에 흔들리지 않는 힘을 만들고, 내신 노트를 수능 자산으로 누적하면 고3이 가벼워집니다.', '고등 사탐의 흔한 실수는 과목별 성격을 무시한 단일 공부법입니다. 생윤을 사문처럼 도표 위주로, 지리를 생윤처럼 사상 위주로 공부하면 비효율이 큽니다. 또 하나는 개념을 ‘대충 여러 번’입니다. 수능 선지는 개념의 경계를 찌르기 때문에 어설픈 3회독보다 정확한 1회독이 낫습니다. 기출 선지를 개념서에 역표시하는 공부가 그 정확도를 만듭니다.', '고등 사탐 선지는 참과 거짓의 경계선 게임입니다. 출제자는 개념의 국경 근처에 함정을 파고, 어설프게 아는 학생은 국경을 넘었는지도 모른 채 걸립니다. 기출 선지 분석은 그 국경선을 지도에 그리는 작업입니다. 내신 정리를 수능까지 끌고 가는 학생은 같은 지도를 두 번 그리지 않아 고3이 가볍습니다.'] },
    ],
    problems: [
      { q: '외워도 외워도 끝이 없어요', a: '구조 없이 세부 사실부터 외우고 있기 때문입니다. 단원의 큰 흐름을 목차 수준에서 먼저 잡고 세부 내용을 그 안에 배치하면, 같은 내용도 절반의 노력으로 기억됩니다.' },
      { q: '비슷한 개념들이 자꾸 헷갈려요', a: '따로 배운 개념은 따로 정리하면 계속 헷갈립니다. 헷갈리는 개념끼리 한 표에 모아 공통점과 차이점을 직접 써보는 비교 정리가 가장 확실한 해결책입니다.' },
      { q: '자료(도표·지도) 문제가 어려워요', a: '자료 해석형 문항은 자료에서 단서를 찾는 순서가 있습니다. 제목-축-변화폭 순으로 읽는 루틴을 익히고 기출 자료 문항을 모아 연습하면 유형이 보이기 시작합니다.' },
      { q: '서술형에서 아는 내용인데 점수를 못 받아요', a: '채점 기준에 들어가는 핵심어를 빼고 쓰기 때문입니다. 답안에 반드시 들어가야 할 개념어를 의식적으로 포함해 쓰는 연습을 하면 같은 지식으로 점수가 달라집니다.' },
      { q: '한국사와 사회 과목을 어떻게 병행하죠', a: '두 과목을 같은 날 몰아 공부하면 내용이 섞입니다. 요일을 나눠 교차 배치하고, 한국사는 연표 축으로, 일반사회는 개념 비교 축으로 정리 방식 자체를 다르게 가져가면 혼동 없이 병행할 수 있습니다.' },
      { q: '역사 연도와 사건 순서가 안 외워져요', a: '연도를 숫자로 외우면 반드시 섞입니다. 사건을 원인과 결과의 이야기로 연결하고, 세기 단위의 큰 틀만 잡아두면 순서 문제는 자연히 풀립니다. 나만의 연표를 직접 그려보는 것이 가장 효과적입니다.' },
      { q: '시사 문제가 나오면 손을 못 대요', a: '시사형 문항도 결국 교과 개념을 묻는 문제입니다. 낯선 소재에 당황하지 말고 어떤 단원의 개념을 적용하라는 것인지 찾는 훈련을 하면, 오히려 변별력 문항에서 점수를 버는 기회가 됩니다.' },
      { q: '노트 정리에 시간을 너무 써요', a: '예쁜 정리는 공부가 아니라 필사입니다. 노트는 교과서를 보지 않고 기억으로 재구성해야 학습 효과가 있습니다. 백지 복습 방식으로 바꾸면 정리 시간은 줄고 기억은 늘어납니다.' },
    ],
    help: ['{p} 사회 과외는 학생의 교과서와 학교 필기를 기준으로 단원의 구조를 함께 잡는 것부터 시작합니다. 흐름 중심의 개념 정리 노트를 만들어 암기 부담을 줄이고, 학교별 출제 스타일에 맞춰 자료 해석과 서술형 대비를 병행합니다. 시사 이슈를 교과 개념과 연결해 설명해 학생이 사회 과목을 살아있는 지식으로 받아들이도록 돕고, 시험 기간에는 예상 문제와 핵심어 중심의 최종 점검으로 마무리합니다.', '{p} 사회 과외는 학생의 교과서와 학교 필기를 기준으로 단원 구조를 함께 잡는 것부터 시작합니다. 흐름 중심 정리 노트로 암기 부담을 줄이고, 학교별 출제 스타일에 맞춘 자료 해석·서술형 대비를 병행하며, 시사 이슈를 교과 개념과 연결해 이해를 깊게 만듭니다.', '사회는 정리의 과목이고, 정리는 혼자 하기 가장 어려운 작업입니다. {p} 사회 과외에서는 헷갈리는 개념의 비교표를 함께 만들고, 역사의 흐름을 이야기로 엮어드리며, 시험 기간에는 학교 선생님의 강조점을 중심으로 예상 문제와 핵심어 답안 훈련까지 관리합니다.'],
    routine: ['사회는 한 번에 오래 보는 것보다 짧게 여러 번 보는 것이 압도적으로 유리한 과목입니다. 권장 루틴은 수업 당일 배운 단원을 목차 구조로 정리(15분)하고, 이틀 뒤 백지에 흐름을 재현해보는 것입니다. 재현이 막히는 부분이 바로 다시 봐야 할 부분입니다. 주말에는 한 주간 배운 내용의 자료(지도, 도표, 사진)만 모아 훑어보세요. 역사라면 연표에 이번 주 배운 사건을 직접 추가하는 습관이 시대 감각을 만들어줍니다.', '사회는 오래 한 번 보는 것보다 짧게 여러 번 보는 것이 압도적으로 유리합니다. 수업 당일 배운 단원을 목차 구조로 15분 정리하고, 이틀 뒤 백지에 그 흐름을 재현해보세요. 막히는 지점이 곧 복습 지점입니다. 주말에는 그 주에 나온 지도·도표·사진 자료만 모아 훑고, 역사라면 나만의 연표에 이번 주 사건을 직접 추가하는 습관이 시대 감각을 만들어줍니다.', '사회는 만나는 횟수가 기억량을 결정합니다. 수업 당일 목차 구조로 15분 정리, 이틀 뒤 백지 재현, 주말에 자료만 훑기. 이 세 번의 짧은 만남이 시험 전 벼락치기보다 확실합니다. 역사라면 나만의 연표에 이번 주 사건을 추가하는 5분 습관이 시대 감각을 만들고, 백지 재현에서 막힌 부분이 곧 다음 복습의 목차가 됩니다.', '사회 루틴의 흔한 실패는 시험 2주 전 몰아치기 단권화입니다. 구조 없이 급조한 정리는 시험장에서 인출되지 않습니다. 평소의 15분 목차 정리, 이틀 뒤 백지 재현, 주말 자료 훑기가 시험 기간의 부담을 미리 분산해줍니다. 백지 재현을 건너뛰는 것이 특히 아쉬운 지점입니다. 막히는 곳이 곧 복습 지점이라는 정보를 버리는 셈이기 때문입니다.', '사회 공부는 서랍 정리와 같습니다. 물건(지식)을 상자(목차 구조)에 넣어두면 필요할 때 바로 꺼내지만, 쌓아만 두면 있는 줄도 모릅니다. 수업 당일의 15분은 상자에 라벨을 붙이는 시간이고, 백지 재현은 눈 감고 서랍을 열어보는 점검이며, 주말 자료 훑기는 사진첩(지도·도표)을 정리하는 일입니다.'],
    exam: ['사회 내신 4주 플랜입니다. 4주 전에는 교과서를 목차 중심으로 통독하며 전체 구조를 잡고, 3주 전에는 단원별 세부 개념을 정리 노트로 만듭니다. 2주 전부터는 문제 풀이로 헷갈리는 개념을 골라내 비교 표로 정리하고, 학교 기출이 있다면 출제 스타일(자료형·서술형 비중)을 확인합니다. 마지막 주는 새로운 정리를 만들지 말고 기존 노트와 오답을 반복하세요. 시험 전날에는 선생님이 강조한 부분과 자료 페이지만 빠르게 훑는 것이 효율적입니다.', '사회 내신은 4주 설계로 잡습니다. 4주 전 교과서 목차 중심 통독으로 뼈대 세우기, 3주 전 단원별 정리 노트 제작, 2주 전 문제 풀이로 헷갈리는 개념을 골라 비교표 만들기. 학교 기출이 있다면 자료형·서술형 비중을 확인해 대비 방향을 맞추세요. 마지막 주는 새 정리를 만들지 말고 기존 노트와 오답만 반복하며, 시험 전날은 선생님 강조 부분과 자료 페이지만 빠르게 점검합니다.', '사회 내신 4주는 뼈대에서 세부로 내려가는 설계입니다. 1주차 목차 중심 통독으로 전체 구조 잡기, 2주차 단원별 정리 노트, 3주차 문제 풀이와 헷갈리는 개념 비교표, 4주차 노트·오답 반복. 학교 기출로 자료형과 서술형 비중을 미리 확인해 대비 방향을 맞추고, 시험 전날은 선생님 강조 부분과 자료 페이지만 빠르게 점검하세요.', '사회 시험의 흔한 감점 요인은 서술형 핵심어 누락과 자료 페이지 경시입니다. 내용을 알아도 채점 기준의 그 단어가 빠지면 점수가 깎이고, 교과서 구석의 사진·지도가 그대로 출제됩니다. 통독으로 뼈대를 잡고, 비교표로 헷갈림을 정리하고, 마지막 주에 선생님 강조점과 자료만 다시 보는 순서를 지키면 사회는 배신하지 않는 과목이 맞습니다.', '사회 내신 4주는 지도 제작 과정입니다. 1주차 항공 촬영(목차 통독으로 전체 지형 파악), 2주차 세부 측량(단원별 노트), 3주차 국경 확정(헷갈리는 개념 비교표), 4주차 최종 검수(오답·강조점 점검). 세부부터 그리기 시작한 지도는 반드시 어딘가 어긋납니다. 전체에서 세부로, 이 순서가 사회 공부의 지도 제작법입니다.'],
    levels: ['성적대별로 이렇게 접근하세요. 사회가 어려운 학생은 대부분 용어와 배경지식 부족이 원인이므로, 교과서를 문제집처럼 읽지 말고 이야기책처럼 통독하는 것부터 시작해야 합니다. 중위권은 아는 것 같은데 문제에서 틀리는 상태, 즉 개념의 정확도가 부족한 경우입니다. 헷갈리는 개념 비교표를 직접 만들면서 정확도를 끌어올리면 안정적으로 상위권에 진입합니다. 상위권은 자료 해석의 속도와 서술형 완성도가 승부처입니다. 기출 자료 문항을 시간 재고 푸는 훈련과, 핵심어가 빠지지 않는 답안 쓰기 연습으로 마지막 몇 점을 지켜내야 합니다.', '사회가 어렵다면 대부분 용어와 배경지식 부족이 원인입니다. 교과서를 문제집처럼 뒤지지 말고 이야기책처럼 통독하는 것부터 시작하세요. 중위권은 "아는 것 같은데 틀리는" 개념 정확도의 문제이므로, 헷갈리는 개념 비교표를 직접 만드는 훈련이 상위권 진입의 열쇠입니다. 상위권은 자료 해석 속도와 핵심어가 빠지지 않는 서술형 답안이 승부처입니다. 기출 자료 문항을 시간 재고 푸는 실전 훈련으로 마지막 몇 점을 지켜내세요.', '사회의 단계별 전략입니다. 어렵게 느껴진다면 용어와 배경지식 부족이 원인이니 교과서를 이야기책처럼 통독하는 것부터. 중위권은 "아는 것 같은데 틀리는" 개념 정확도 문제이므로 비교표 만들기가 상위권 진입 티켓입니다. 상위권은 자료 해석 속도와 핵심어 빠짐없는 서술형 답안으로 마지막 점수를 지키는 싸움입니다. 기출 자료 문항의 시간 훈련을 루틴에 넣으세요.', '단계별로 흔한 오답 패턴이 다릅니다. 기초권은 용어를 몰라 문제 자체를 오독하고, 중위권은 비슷한 개념을 섞어 함정 선지에 걸리며, 상위권은 자료 해석에 시간을 뺏겨 뒷문제를 놓칩니다. 처방도 각각입니다. 통독으로 언어 장벽 제거, 비교표로 개념 분리, 시간 재고 푸는 자료 훈련. 자기 오답 패턴을 아는 것이 사회 등급의 절반입니다.', '사회 성적은 도서관 사서의 성장 과정과 같습니다. 신입 사서(기초권)는 책 제목(용어)부터 익혀야 하고, 중견 사서(중위권)는 비슷한 책을 다른 서가에 꽂는 실수(개념 혼동)를 교정해야 하며, 베테랑(상위권)은 손님 질문(자료 문항)에 몇 초 만에 서가를 짚어내는 속도 싸움입니다. 지금 어느 연차의 과제를 풀어야 하는지부터 확인하세요.'],
    parent: ['가정에서는 뉴스나 시사 주제를 가볍게 대화로 나눠주세요. "요즘 물가가 왜 오를까" 같은 한 번의 대화가 교과서 한 단원의 이해를 돕습니다. 역사 유적지나 박물관 방문도 아이에게는 교과서가 현실이 되는 경험입니다.', '사회 과목의 가장 좋은 과외 선생님은 사실 저녁 식탁입니다. 뉴스에 나온 물가, 선거, 국제 이슈를 아이 눈높이로 한 번씩 이야기해 주세요. 교과서에서 배운 개념이 현실과 연결되는 순간, 사회는 암기 과목에서 이해 과목으로 바뀝니다.', '역사 유적지, 박물관, 국회의사당 같은 곳의 방문 경험은 사회 과목의 배경지식 저금통입니다. 거창한 학습 여행이 아니어도 좋습니다. 지나가다 만난 동상 하나, 지명 하나의 유래를 함께 찾아보는 것만으로 아이의 사회 감각은 자랍니다.'],
  },

  essay: {
    intro: ['논술은 타고난 글재주의 영역이 아니라 훈련 가능한 기술입니다. 읽고, 생각을 구조로 정리하고, 근거를 갖춰 쓰는 과정에는 명확한 방법이 있습니다. {p} 학생들의 수행평가 글쓰기부터 대입 논술까지, 학년별로 무엇을 훈련해야 하는지 정리했습니다.', '글을 못 쓰는 학생은 없습니다. 쓰는 방법을 배운 적 없는 학생이 있을 뿐입니다. 개요 짜는 법, 근거 세우는 법, 고쳐 쓰는 법은 전부 배울 수 있는 기술이고, 배우면 누구나 나아집니다. {p} 학생들의 수행평가 글쓰기부터 대입 논술까지, 학년별 훈련법을 정리했습니다.', '논술은 대입에서만 필요한 것이 아닙니다. 학교 수행평가의 절반이 글쓰기이고, 서술형 답안도 결국 짧은 논술입니다. 쓰는 힘은 전 과목의 점수로 연결되는 기본기입니다. {p} 학생들이 학년별로 어떤 글쓰기 훈련을 해야 하는지 정리했습니다.'],
    grades: [
      { t: '초등 글쓰기 공부법', b: ['초등 시기는 쓰기에 대한 거부감을 없애는 것이 최우선입니다. 잘 쓰라고 요구하기 전에 자주 쓰는 환경을 만들어야 합니다. 독서 후 한 줄 감상, 주말 일기처럼 부담 없는 분량으로 시작해 점차 "생각과 이유"를 함께 쓰는 단계로 나아갑니다. 문단 개념을 익히는 것도 이 시기의 과제입니다. 하나의 문단에는 하나의 생각만 담는다는 원칙을 연습하면 글의 뼈대가 잡히기 시작합니다. 아이가 쓴 글은 고쳐주기보다 먼저 충분히 읽어주고 칭찬할 지점을 찾아주는 것이 계속 쓰게 만드는 힘입니다.', '초등 글쓰기는 잘 쓰기 전에 자주 쓰기가 목표입니다. 독서 후 한 줄 감상, 주말 일기처럼 부담 없는 분량으로 시작해 점차 생각과 이유를 함께 쓰는 단계로 나아가세요. 하나의 문단에 하나의 생각만 담는 문단 감각을 이 시기에 익히면 글의 뼈대가 잡힙니다. 아이의 글은 고치기 전에 충분히 읽어주고 칭찬할 지점을 먼저 찾아주는 것이 계속 쓰게 만드는 힘입니다.', '초등 글쓰기의 유일한 목표는 쓰는 아이로 만드는 것입니다. 잘 쓰기를 요구하기 전에 자주 쓰는 환경을 만드세요. 한 줄 감상, 주말 일기처럼 문턱 낮은 쓰기에서 시작해 생각과 이유를 담는 단계로 넓혀갑니다. 한 문단에 한 생각이라는 원칙만 익혀도 글의 뼈대가 생기고, 아이의 글에 교정보다 반응을 먼저 주는 어른이 곁에 있으면 아이는 계속 씁니다.', '초등 글쓰기에서 가장 흔한 실수는 빨간펜 먼저 들기입니다. 맞춤법 교정이 반복되면 아이는 쓰기 전에 검열부터 배웁니다. 두 번째 실수는 분량 요구입니다. ‘세 쪽 채워’ 앞에서 글은 노동이 됩니다. 한 줄이어도 자기 생각이 담기면 칭찬하고, 궁금한 독자가 되어 더 묻는 것. 계속 쓰는 아이를 만드는 방법은 잘 쓰게 하는 방법보다 언제나 먼저입니다.', '초등 글쓰기는 모닥불 피우기와 같습니다. 불씨(쓰고 싶은 마음)가 먼저고 장작(기술)은 나중입니다. 축축한 장작(교정과 분량 압박)을 처음부터 얹으면 불씨가 꺼집니다. 한 줄 감상, 그림일기 같은 마른 잔가지부터 태우며 불을 키우세요. 불이 붙은 아이는 문단 쓰기라는 굵은 장작도 스스로 얹습니다.'] },
      { t: '중등 논술 공부법', b: ['중학교부터는 주장하는 글의 구조를 익혀야 합니다. 주장-근거-예시-반론 고려의 틀을 배우고, 같은 주제로 개요를 짠 뒤 글로 완성하는 훈련을 반복합니다. 이 시기의 핵심 기술은 요약입니다. 긴 글을 세 문장으로 줄이는 연습은 독해력과 논리력을 동시에 키우며, 고등 논술의 제시문 분석으로 직결됩니다. 토론 활동도 큰 도움이 됩니다. 상대의 주장에서 허점을 찾고 내 주장을 방어하는 경험이 글의 논리를 단단하게 만듭니다. 수행평가 글쓰기는 채점 기준을 먼저 확인하고 기준에 맞춰 쓰는 전략적 접근을 익힐 기회입니다.', '중학 논술의 핵심 기술은 구조와 요약입니다. 주장-근거-예시-반론 고려의 틀로 개요를 짜고 글로 완성하는 훈련을 반복하고, 긴 글을 세 문장으로 줄이는 요약 연습으로 독해력과 논리력을 동시에 키우세요. 이 요약력이 고등 논술의 제시문 분석으로 직결됩니다. 토론 활동은 내 주장을 방어하고 상대 허점을 찾는 경험으로 글의 논리를 단단하게 만들며, 수행평가는 채점 기준을 먼저 확인하고 기준에 맞춰 쓰는 전략을 익힐 기회입니다.', '중학 글쓰기는 틀과 요약을 배우는 시기입니다. 주장-근거-예시-반론의 구조로 개요를 짜고 완성하는 훈련, 긴 글을 세 문장으로 압축하는 요약 연습이 두 축입니다. 특히 요약력은 독해력과 논리력을 함께 키우며 고등 논술의 제시문 분석으로 직결되는 기술입니다. 토론으로 주장을 방어해보는 경험과, 채점 기준표를 먼저 읽고 쓰는 수행평가 전략도 이 시기에 익혀두세요.', '중학 글쓰기의 흔한 함정은 개요 없이 바로 쓰기와 요약 훈련 생략입니다. 개요 없는 글은 중반부터 길을 잃고 같은 말을 돌며, 요약을 못 하는 학생은 고등 논술의 제시문 앞에서 멈춥니다. 주장-근거-예시 틀로 개요 먼저, 긴 글을 세 문장으로 줄이는 연습을 주 1회. 수행평가에서는 채점 기준표를 먼저 읽는 습관이 같은 실력을 더 높은 점수로 바꿉니다.', '중학 글쓰기는 건축 수업입니다. 개요는 설계도, 근거는 기둥, 예시는 벽돌, 요약은 남의 건물을 해체해 구조를 배우는 견학입니다. 설계도 없이 벽돌부터 쌓는 학생의 글은 반드시 중간에 기웁니다. 토론은 완공된 건물에 하중 실험을 해보는 일이라, 무너져본 주장이 다음 글에서 더 튼튼한 기둥을 세웁니다.'] },
      { t: '고등 대입 논술 공부법', b: ['대입 논술은 창의적인 글이 아니라 정확한 글을 요구합니다. 인문 논술은 제시문의 논지를 파악해 비교·비판·적용하는 능력을, 수리 논술은 풀이 과정을 논리적 서술로 보여주는 능력을 평가합니다. 공부의 시작은 목표 대학의 기출과 채점 기준 분석입니다. 대학마다 요구하는 답안 구조가 다르기 때문입니다. 개요 작성에 전체 시간의 3분의 1을 쓰는 습관을 들여야 답안이 흔들리지 않으며, 쓴 글은 반드시 첨삭을 받아 논리 비약과 근거 부족을 확인해야 합니다. 혼자 쓰기만 반복하는 것은 같은 실수를 강화할 뿐입니다.', '대입 논술은 창의적인 글이 아니라 정확한 글의 시험입니다. 인문은 제시문 논지의 비교·비판·적용 능력을, 수리는 풀이 과정의 논리적 서술을 평가합니다. 시작은 목표 대학 기출과 채점 기준 분석입니다. 대학마다 요구하는 답안 구조가 다르기 때문입니다. 개요에 전체 시간의 3분의 1을 쓰는 습관을 들이고, 쓴 글은 반드시 첨삭으로 논리 비약과 근거 부족을 확인하세요. 혼자 쓰기만 반복하면 같은 실수가 강화될 뿐입니다.', '대입 논술이 평가하는 것은 번뜩임이 아니라 정확함입니다. 제시문의 논지를 파악해 비교·비판·적용하는 능력(인문), 풀이 과정을 논리적 서술로 보여주는 능력(수리)이 채점의 핵심입니다. 목표 대학의 기출과 채점 기준 분석에서 시작해, 시험 시간의 3분의 1을 개요에 쓰는 습관을 들이고, 쓴 글은 반드시 첨삭을 거치세요. 혼자 쓰는 반복은 실수를 훈련하는 일이 될 수 있습니다.', '대입 논술에서 흔한 착각은 화려한 문장과 창의적 발상이 점수를 만든다는 것입니다. 채점자가 보는 것은 제시문을 정확히 읽었는가, 요구에 맞게 구조를 세웠는가입니다. 기출·채점 기준 분석 없이 쓰는 연습만 반복하는 것, 첨삭 없이 편수만 쌓는 것도 흔한 낭비입니다. 개요에 시간의 3분의 1, 쓴 글마다 첨삭과 고쳐쓰기. 정확함이 창의성을 이기는 시험이 논술입니다.', '대입 논술은 과녁 맞히기입니다. 대학마다 과녁의 위치(채점 기준)가 다른데, 기출 분석 없이 쓰는 것은 눈 감고 쏘는 연습입니다. 화살을 백 발 쏘는 것보다 과녁을 확인하고 열 발 쏘는 것이 낫고, 첨삭은 탄착점을 알려주는 코치입니다. 개요 작성은 조준 시간이므로 아끼면 안 되는 3분의 1입니다.'] },
    ],
    problems: [
      { q: '뭘 써야 할지 몰라 시작을 못해요', a: '생각이 없는 것이 아니라 꺼내는 도구가 없는 것입니다. 주제에 대해 질문 5개를 먼저 만들고 답해보는 브레인스토밍 루틴을 익히면 쓸 거리는 언제나 나옵니다.' },
      { q: '분량을 못 채우거나 같은 말을 반복해요', a: '개요 없이 바로 쓰기 때문입니다. 서론-본론1-본론2-결론에 들어갈 내용을 한 줄씩 먼저 정하고 쓰면 분량과 흐름이 동시에 해결됩니다.' },
      { q: '논리가 비약된다는 지적을 받아요', a: '주장과 근거 사이의 연결 고리를 스스로는 당연하게 느끼기 때문입니다. "왜냐하면"과 "예를 들어"를 의식적으로 채워 넣는 훈련과 타인의 첨삭이 필요한 지점입니다.' },
      { q: '제시문이 어려워 요약부터 막혀요', a: '문단별 핵심 문장을 찾아 연결하는 요약의 기술 문제입니다. 짧은 칼럼 요약부터 시작해 제시문 길이를 늘려가면 독해와 요약이 함께 자랍니다.' },
      { q: '맞춤법과 문장이 자꾸 틀려요', a: '맞춤법은 글쓰기의 마지막 단계에서 잡으면 됩니다. 초고에서는 내용에 집중하고, 퇴고에서 소리 내어 읽으며 어색한 문장을 고치는 2단계 습관을 들이면 문장력과 정확성이 함께 자랍니다.' },
      { q: '책을 안 읽어서 쓸 재료가 없어요', a: '독서량은 하루아침에 못 늘리지만 재료는 만들 수 있습니다. 신문 칼럼 하나, 다큐 한 편도 훌륭한 글감입니다. 짧은 자료를 읽고 요약-내 생각 쓰기를 반복하면 독서 부족을 빠르게 보완할 수 있습니다.' },
      { q: '학교 대회나 수행에서 늘 비슷한 점수예요', a: '자기 글의 패턴화된 약점(예: 근거 부족, 뻔한 결론)이 있다는 신호입니다. 첨삭자가 그 패턴을 짚어주고 교정 연습을 하면 정체된 점수가 움직이기 시작합니다.' },
    ],
    help: ['{p} 논술 과외는 학생의 글을 직접 읽고 첨삭하는 1:1 방식이라 학원 강의와 근본적으로 다릅니다. 매 수업 글쓰기 과제를 통해 쓰는 양을 확보하고, 첨삭에서는 문장 교정을 넘어 논리 구조와 근거의 타당성까지 짚어드립니다. 중등은 수행평가와 교내 대회, 고등은 목표 대학 기출 중심으로 커리큘럼을 구성하며, 독서 배경지식이 필요한 경우 주제별 읽기 자료를 함께 제공합니다.', '{p} 논술 과외는 학생의 글을 직접 읽고 고치는 1:1 첨삭이 중심입니다. 매 수업 글쓰기 과제로 쓰는 양을 확보하고, 첨삭에서는 문장 교정을 넘어 논리 구조와 근거의 타당성까지 짚습니다. 중등은 수행평가, 고등은 목표 대학 기출 중심으로 설계합니다.', '글은 혼자 쓰면 늘지 않습니다. 자기 글의 문제를 스스로 볼 수 없기 때문입니다. {p} 논술 과외에서는 쓰고, 첨삭받고, 고쳐 쓰는 사이클을 반복해 실력을 계단식으로 올립니다. 배경지식이 필요한 주제는 읽기 자료를 함께 제공해 독해력까지 같이 키웁니다.'],
    routine: ['글쓰기 실력은 쓰는 빈도에 비례합니다. 권장 루틴은 주 2회 짧은 글쓰기(독서 감상, 시사 논평 등 500자 내외)와 주 1회 요약 연습(칼럼이나 기사 한 편을 세 문장으로)입니다. 쓴 글은 하루 묵혔다가 스스로 소리 내어 읽어보세요. 어색한 문장은 눈보다 귀가 먼저 찾아냅니다. 첨삭을 받았다면 지적받은 부분을 반영해 같은 글을 한 번 더 고쳐 쓰는 것까지가 한 세트입니다. 고쳐 쓰기 없는 첨삭은 절반의 효과밖에 내지 못합니다.', '글은 쓰는 빈도만큼 늡니다. 주 2회 500자 내외의 짧은 글(독서 감상, 시사 한 줄 논평)과 주 1회 요약 연습(칼럼 한 편을 세 문장으로)이 기본 루틴입니다. 쓴 글은 하루 묵혔다가 소리 내어 읽어보세요. 어색한 문장은 눈보다 귀가 먼저 찾습니다. 첨삭을 받았다면 지적을 반영해 같은 글을 한 번 더 고쳐 쓰는 것까지가 한 세트입니다. 고쳐 쓰기 없는 첨삭은 절반짜리입니다.', '글 근육은 빈도로 자랍니다. 주 2회 500자 글쓰기와 주 1회 요약 연습이 기본 세트입니다. 완성한 글은 하루 재웠다가 소리 내어 읽으며 스스로 고쳐보세요. 귀는 눈이 놓친 어색함을 잡아냅니다. 첨삭을 받았다면 반영해서 같은 글을 다시 쓰는 것까지가 진짜 한 회차입니다. 쓰기-첨삭-고쳐쓰기의 삼박자가 도는 순간부터 글은 계단식으로 늡니다.', '글쓰기 루틴의 흔한 실패는 영감을 기다리는 것입니다. 쓸 기분은 쓰기 시작한 뒤에 옵니다. 또 하나는 완성 직후의 퇴고입니다. 방금 쓴 글은 자기 눈에 완벽해 보입니다. 주 2회 짧은 글, 주 1회 요약, 하루 재운 뒤 소리 내어 읽는 퇴고, 첨삭 후 고쳐쓰기. 이 사이클에 영감이 낄 자리는 없고, 실력이 늘 자리만 있습니다.', '글쓰기는 반죽 숙성과 같습니다. 쓰는 것은 반죽이고, 하루 재우는 것은 숙성이며, 소리 내어 읽는 퇴고는 반죽 상태를 손으로 확인하는 일입니다. 숙성 없이 바로 구운 빵이 부푸는 법이 없듯, 쓰자마자 제출한 글은 제 맛이 나지 않습니다. 첨삭은 레시피 교정이고, 고쳐쓰기는 같은 빵을 다시 구워보는 것까지를 말합니다.'],
    exam: ['대입 논술을 준비한다면 시기별 계획이 필요합니다. 고1~2는 요약과 개요 작성 훈련으로 기본기를 쌓는 시기이고, 고3 여름부터는 목표 대학 기출로 실전 훈련에 들어가야 합니다. 시험 4주 전에는 주 2회 실전 시간(대학별 90~120분)에 맞춰 완성글을 쓰고 첨삭받는 사이클을 돌립니다. 2주 전부터는 새 주제보다 이미 쓴 글을 다시 고쳐 쓰며 자신의 약점 패턴(논리 비약, 분량 배분)을 교정합니다. 수행평가 글쓰기라면 채점 기준표를 먼저 분석하고 기준별로 답안에 반영하는 연습이 가장 효율적입니다.', '대입 논술은 시기별 설계가 필요합니다. 고1~2는 요약과 개요 작성으로 기본기를 쌓는 시기, 고3 여름부터는 목표 대학 기출로 실전에 들어가야 합니다. 시험 4주 전에는 대학별 시험 시간(90~120분)에 맞춘 완성글 쓰기와 첨삭 사이클을 주 2회 돌리고, 2주 전부터는 새 주제보다 이미 쓴 글을 고쳐 쓰며 자기 약점 패턴(논리 비약, 분량 배분)을 교정합니다. 수행평가라면 채점 기준표 분석과 기준별 반영 연습이 가장 효율적입니다.', '논술 준비는 시기가 전략입니다. 고1~2는 요약·개요라는 기본기의 시간, 고3 여름부터는 목표 대학 기출의 실전 시간입니다. 시험 4주 전에는 대학별 제한 시간에 맞춘 완성글-첨삭 사이클을 주 2회 돌리고, 마지막 2주는 새 주제 대신 쓴 글을 고쳐 쓰며 자기 약점 패턴을 교정하세요. 수행평가라면 채점 기준표를 분석해 항목별로 반영하며 쓰는 것이 최단 경로입니다.', '논술 준비의 흔한 실수는 고3 가을에 시작하는 것과 새 주제만 계속 쓰는 것입니다. 늦은 시작은 첨삭-교정 사이클을 돌 시간을 없애고, 새 주제 사냥은 자기 약점 패턴을 교정할 기회를 없앱니다. 고1~2 기본기, 고3 여름 실전 진입, 시험 4주 전 주 2회 실전 사이클, 마지막 2주는 쓴 글 고쳐쓰기. 수행평가라면 기준표 분석이 곧 답안 설계도입니다.', '논술 시험 준비는 마라톤 훈련 일정과 같습니다. 고1~2는 기초 체력기(요약·개요), 고3 여름은 코스 적응기(대학별 기출), 시험 4주 전은 페이스 조절기(제한 시간 완주 연습)입니다. 대회 직전에 새 코스를 뛰는 선수는 없습니다. 마지막 2주는 달려본 코스(쓴 글)의 기록을 줄이는 시간입니다.'],
    levels: ['출발점에 따라 훈련이 다릅니다. 글쓰기 자체가 두려운 학생은 잘 쓰기를 목표로 하면 안 됩니다. 분량과 완성도를 따지지 않는 자유 글쓰기로 쓰는 행위에 익숙해지는 것이 먼저이고, 보통 4~6주면 거부감이 눈에 띄게 줄어듭니다. 쓰기는 하는데 글이 늘지 않는 학생은 첨삭 없이 혼자 쓰는 경우가 대부분입니다. 같은 글을 첨삭받고 고쳐 쓰는 과정을 반복해야 실력이 계단식으로 오릅니다. 대입 논술을 노리는 상위권은 대학별 출제 경향 분석과 시간 내 완성 훈련이 핵심이며, 늦어도 고3 여름 전에는 실전 사이클에 들어가야 안정적입니다.', '출발점에 따라 훈련이 다릅니다. 쓰기 자체가 두려운 학생에게는 잘 쓰기를 요구하면 안 됩니다. 분량과 완성도를 묻지 않는 자유 글쓰기로 4~6주면 거부감이 눈에 띄게 줄어듭니다. 쓰긴 하는데 늘지 않는 학생은 첨삭 없이 혼자 써온 경우가 대부분이라, 첨삭-고쳐쓰기 반복이 정체를 깨는 유일한 방법입니다. 대입 논술권 상위 학생은 대학별 출제 경향 분석과 시간 내 완성 훈련이 핵심이며 늦어도 고3 여름 전에 실전 사이클에 진입해야 안정적입니다.', '글쓰기의 출발점별 처방입니다. 쓰기가 두려운 학생에게는 평가 없는 자유 글쓰기 4~6주가 약입니다. 쓰는데 늘지 않는 학생은 십중팔구 첨삭 없이 혼자 써온 경우라, 첨삭-고쳐쓰기 사이클 도입이 정체를 깨는 열쇠입니다. 대입 논술권 학생은 대학별 경향 분석과 시간 내 완성 훈련이 핵심이며, 고3 여름 전 실전 진입이 안정권의 조건입니다.', '출발점별로 피해야 할 것이 있습니다. 쓰기가 두려운 학생에게 첨삭부터 들이미는 것은 물이 무서운 아이를 다이빙대에 세우는 격입니다. 평가 없는 쓰기가 먼저입니다. 쓰는데 늘지 않는 학생에게 다작만 권하는 것은 같은 오타를 빠르게 치는 타자 연습입니다. 첨삭이 먼저입니다. 상위권에게 막연한 다독을 권하는 것도 비효율입니다. 목표 대학 기출이 최고의 독서 목록입니다.', '글쓰기 성장은 수영 단계와 같습니다. 물이 무서운 단계(쓰기 거부감)에서는 얕은 물에서 노는 것이 훈련이고, 뜨는 단계(습관은 있으나 정체)에서는 코치의 자세 교정(첨삭)이 기록을 바꾸며, 선수 단계(대입 논술권)에서는 대회 규정(대학별 기준)에 맞춘 종목 훈련이 전부입니다. 단계를 건너뛴 훈련은 물만 먹입니다.'],
    parent: ['가정에서는 아이의 글에 빨간펜을 들기 전에 독자가 되어주세요. "이 부분이 궁금한데 더 말해줄래?"라는 반응이 아이를 계속 쓰게 만듭니다. 저녁 식탁에서 "너는 어떻게 생각해? 왜?"라고 묻는 습관은 그 자체로 최고의 논술 수업입니다.', '아이가 쓴 글을 보실 때 맞춤법부터 고치고 싶은 마음을 잠시 참아주세요. 먼저 내용에 반응해 주는 독자가 되어야 아이가 계속 씁니다. "이 부분 재밌다, 더 듣고 싶은데?"라는 반응 하나가 백 번의 교정보다 아이를 성장시킵니다.', '글쓰기의 재료는 경험과 대화입니다. 주말에 있었던 일을 밥상에서 이야기로 풀게 하고, 가끔 "그걸 세 줄로 써볼래?"라고 권해보세요. 말이 글이 되는 경험이 쌓이면 백지 앞에서 얼어붙는 일이 줄어듭니다.'],
  },
};


/* ========== 레이아웃 / CSS ========== */
/* ---------------- 과목별 학생 고민 → 수업 진행 방식 ---------------- */

/* ---------------- 성적향상 플랜 (유형별 수업 설계) ---------------- */
const IMPROVE_CASES = {
  math: [
    { t: '개념 구멍형 · 50~60점대 출발', s: '문제를 풀다 막히면 어디서부터 모르는지도 모르는 상태.', p: ['1~2주차에 진단으로 끊긴 단원을 찾아 이전 학년 개념까지 내려가 다시 쌓고, 3주차부터 학교 진도와 병행합니다. 매 수업 오답 원인을 개념·계산·독해로 분류해 기록합니다.', '첫 달은 진도보다 구멍 메우기에 집중합니다. 끊긴 단원을 찾아 하루 30분 개념 복습 루틴을 만들고, 이후 학교 진도를 따라가며 오답 노트를 함께 관리합니다.'], g: '한 학기 안에 기본·응용 문제에서 실점을 줄여 안정권 진입을 목표로 설계합니다.' },
    { t: '실수 반복형 · 점수 정체', s: '아는 문제인데 시험만 보면 계산 실수와 시간 부족으로 점수가 깎이는 상태.', p: ['풀이 과정을 줄이지 않고 쓰는 습관부터 교정하고, 매주 실전 타이머 훈련으로 시간 배분을 몸에 익힙니다. 실수 유형을 기록해 시험 전 체크리스트로 만듭니다.', '틀린 문제를 다시 풀 때 왜 틀렸는지 말로 설명하게 합니다. 4주 주기로 실전 모의 테스트를 돌려 시간 관리와 검산 루틴을 정착시킵니다.'], g: '실수로 잃는 점수를 회당 1~2문제 수준으로 줄이는 것을 목표로 합니다.' },
    { t: '상위권 도약형 · 고난도 대비', s: '내신은 안정적이지만 킬러 문항과 서술형에서 변별이 갈리는 상태.', p: ['단원별 고난도 유형을 계통적으로 훈련하고, 서술형은 채점 기준에 맞춘 답안 쓰기를 반복합니다. 학교 기출의 최고 난도 문항을 변형해 대비합니다.', '풀이가 여러 개인 문제로 사고 확장 훈련을 하고, 시험 4주 전부터는 학교 스타일 고난도 세트로 실전 감각을 끌어올립니다.'], g: '최상위권 방어에 필요한 고난도 문항 대응력을 만드는 것을 목표로 합니다.' },
  ],
  english: [
    { t: '단어·문법 기초형', s: '단어를 외워도 문장이 해석 안 되고 문법 용어가 낯선 상태.', p: ['수준 진단 후 어휘는 매일 소량 반복으로, 문법은 문장 만들기 중심으로 바꿉니다. 교과서 본문을 구문 단위로 끊어 읽는 훈련을 합니다.', '암기식 문법 대신 예문 변형 연습으로 구조를 익히고, 주 1회 누적 테스트로 어휘·구문을 함께 점검합니다.'], g: '교과서 지문을 스스로 해석하는 힘을 만들어 내신 안정권 진입을 목표로 합니다.' },
    { t: '독해 정체형 · 처음 보는 지문에 약함', s: '범위 있는 시험은 괜찮지만 낯선 지문에서 시간이 부족한 상태.', p: ['지문 구조(주제문-근거-예시) 읽기를 훈련하고, 문제 유형별 접근 순서를 정해 시간 배분을 교정합니다.', '매주 실전 지문 세트로 끊어 읽기와 선지 소거를 연습하고, 오답은 해석 실패인지 논리 실패인지 구분해 보완합니다.'], g: '첫 지문 독해 속도를 끌어올려 실전 등급 상승을 목표로 합니다.' },
    { t: '수행·서술형 보강형', s: '지필은 무난하지만 영작·말하기 수행에서 점수가 새는 상태.', p: ['학교 수행 일정에 맞춰 영작 첨삭과 발표 준비를 병행합니다. 자주 쓰는 문장 패턴을 정리해 실전에서 꺼내 쓰게 합니다.', '수행 평가 기준표를 함께 분석해 감점 포인트를 미리 잡고, 제출 전 첨삭으로 완성도를 높입니다.'], g: '수행 만점 관리로 내신 총점을 지키는 것을 목표로 합니다.' },
  ],
  korean: [
    { t: '문학 감상 막막형', s: '시와 소설을 읽어도 무엇을 묻는지 감이 안 오는 상태.', p: ['작품을 화자·상황·정서 틀로 읽는 법을 훈련하고, 필수 개념어를 기출 선지로 익힙니다.', '교과서 수록 작품을 먼저 잡고, 같은 갈래의 낯선 작품으로 확장해 적용력을 만듭니다.'], g: '작품 해석의 틀을 갖춰 문학 파트 실점을 줄이는 것을 목표로 합니다.' },
    { t: '비문학 시간 부족형', s: '지문은 읽었는데 문제 풀 시간이 모자라는 상태.', p: ['문단별 중심 문장 표시와 구조도 그리기로 읽기 속도를 만들고, 선지 판단 근거를 지문에서 찾는 훈련을 반복합니다.', '주 2지문 정독 훈련과 주 1회 타이머 실전으로 속도와 정확도를 함께 끌어올립니다.'], g: '지문당 소요 시간을 단축해 비문학 완주를 목표로 합니다.' },
    { t: '서술형·내신 대비형', s: '객관식은 되는데 서술형에서 부분 감점이 쌓이는 상태.', p: ['학교 기출 서술형의 채점 기준을 분석해 키워드 중심 답안 쓰기를 훈련합니다.', '조건 분석 → 개요 → 답안 작성 3단계를 몸에 익혀 감점 요소를 줄입니다.'], g: '서술형 감점을 최소화해 내신 등급 상승을 목표로 합니다.' },
  ],
  science: [
    { t: '암기 위주 한계형', s: '외워서 버텼는데 응용 문제만 나오면 무너지는 상태.', p: ['현상과 원리를 연결하는 개념 설명 중심으로 수업하고, 그래프·자료 해석 훈련을 병행합니다.', '단원별 핵심 원리를 학생이 직접 설명하게 하는 방식으로 이해를 확인하고, 실험·탐구 문항을 집중 대비합니다.'], g: '자료 해석형 문항 대응력을 만들어 상위 등급 진입을 목표로 합니다.' },
    { t: '계산 과학 취약형', s: '물리·화학 계산 문제에서 식 세우기부터 막히는 상태.', p: ['공식 암기가 아니라 단위와 비례 관계로 식을 세우는 훈련을 하고, 유형별 풀이 절차를 만들어 반복합니다.', '수학적 기초가 부족하면 필요한 연산부터 보충하고, 단계별 난도로 계산 감각을 쌓습니다.'], g: '계산 문항 정답률을 끌어올려 과학 점수의 바닥을 없애는 것을 목표로 합니다.' },
    { t: '수행·실험 보고서형', s: '지필은 되는데 탐구 보고서와 수행에서 점수가 새는 상태.', p: ['학교 수행 일정에 맞춰 보고서 구조(가설-과정-결과-해석)를 잡아주고 첨삭합니다.', '평가 기준표 기반으로 감점 포인트를 미리 점검해 제출물 완성도를 높입니다.'], g: '수행 만점 관리로 내신 총점 방어를 목표로 합니다.' },
  ],
  social: [
    { t: '용어 암기 부담형', s: '외울 게 많아 시작도 전에 지치는 상태.', p: ['흐름과 인과로 묶어 이해하는 스토리 정리법을 훈련하고, 백지 복습으로 장기 기억화합니다.', '단원별 구조도를 함께 만들고, 기출 선지로 용어의 쓰임을 확인하며 암기량을 줄입니다.'], g: '암기 부담을 줄이면서 정답률을 높여 안정적 상위권을 목표로 합니다.' },
    { t: '자료 해석 취약형', s: '표·그래프·지도가 나오면 손을 못 대는 상태.', p: ['자료 유형별 읽기 순서를 정해 훈련하고, 개념과 자료를 연결하는 기출 분석을 반복합니다.', '최근 출제 경향의 자료형 문항을 집중 훈련해 실전 대응력을 만듭니다.'], g: '자료형 문항 실점을 줄여 등급 상승을 목표로 합니다.' },
    { t: '서술형 감점형', s: '내용은 아는데 답안에 키워드가 빠져 감점되는 상태.', p: ['학교 기출 서술형 채점 기준을 분석해 필수 키워드 중심 답안 훈련을 합니다.', '조건 분석과 개요 작성 습관을 만들어 감점 요소를 차단합니다.'], g: '서술형 만점 관리로 내신 등급 방어를 목표로 합니다.' },
  ],
  essay: [
    { t: '글쓰기 공포형', s: '한 문단도 쓰기 힘들어하는 상태.', p: ['말로 생각을 꺼낸 뒤 문장으로 옮기는 단계 훈련부터 시작해 부담을 낮춥니다.', '한 문단 완성 → 개요 짜기 → 한 편 완성으로 단계를 올리며 매회 첨삭합니다.'], g: '스스로 개요를 잡고 한 편을 완성하는 힘을 목표로 합니다.' },
    { t: '독서 연계 부족형', s: '읽기는 하는데 생각이 글로 연결되지 않는 상태.', p: ['제시문 요약 → 쟁점 찾기 → 내 관점 쓰기 순서로 읽기와 쓰기를 연결합니다.', '학년 수준 제시문으로 비판적 읽기 훈련을 하고 토론식 수업으로 사고를 확장합니다.'], g: '수행·발표·논술 전형까지 쓰이는 사고력과 표현력을 목표로 합니다.' },
    { t: '수행 대비형', s: '학교 글쓰기 수행마다 평범한 점수에 머무는 상태.', p: ['학교 평가 기준을 분석해 구조·근거·표현을 기준으로 첨삭하고 퇴고 습관을 만듭니다.', '제출 전 2회 첨삭 사이클로 완성도를 높이고, 자주 나오는 주제 유형을 미리 훈련합니다.'], g: '글쓰기 수행 상위 평가를 안정적으로 받는 것을 목표로 합니다.' },
  ],
};

const LESSON_FLOW = {
  math: [
    { q: '초등 아이가 문장제만 나오면 손을 놓아요', how: ['수업 앞 10분을 문장제 해석 훈련에 고정합니다. 문제를 소리 내어 읽고, 조건에 밑줄을 긋고, 구하는 것을 한 문장으로 말한 뒤에야 식을 세우게 합니다. 처음 몇 주는 선생님이 시범을 보이고, 이후 학생이 스스로 이 3단계를 밟도록 점차 손을 뗍니다. {p} 학생들의 경우 4~6주면 문장제를 대하는 태도가 눈에 띄게 달라집니다.', '문장제 공포는 수학이 아니라 읽기에서 시작되므로, 수업에서는 계산 전에 해석부터 다룹니다. 문제를 읽고 조건과 질문을 학생의 말로 다시 말하게 한 뒤 식을 세우는 순서를 매 수업 반복해 몸에 붙이고, 아이 수준보다 반 걸음 쉬운 문제로 성공 경험을 쌓아 자신감을 회복시킵니다.'] },
    { q: '중학생인데 설명은 알아듣는데 혼자 풀면 틀려요', how: ['수업의 절반을 학생이 말하는 시간으로 바꿉니다. 배운 개념을 학생이 선생님에게 거꾸로 설명하는 역설명으로 이해의 빈틈을 드러내고, 새 유형은 선생님 풀이를 본 뒤 유사 문제를 그 자리에서 혼자 풀어 확인합니다. 숙제는 수업에서 혼자 성공한 유형만 내서, 혼자 있는 시간에도 풀리는 경험이 이어지게 합니다.', '듣고 이해하는 것과 꺼내 쓰는 것은 다른 능력이라, 수업을 듣는 시간에서 꺼내 쓰는 시간으로 재설계합니다. 개념마다 학생이 자기 말로 설명하게 하고, 막히는 지점을 그 자리에서 교정한 뒤, 같은 유형을 혼자 풀어내는 것까지 확인하고 다음으로 넘어갑니다.'] },
    { q: '고등인데 모의고사 4등급, 어디부터 손대야 할지 모르겠어요', how: ['첫 진단에서 중학 과정까지 거슬러 올라가 구멍 지도를 그립니다. 그 다음 현재 내신 범위 대비와 이전 개념 보충을 병행하는 이중 트랙으로 수업을 설계합니다. 4~5등급대는 심화 문제가 아니라 개념 복구가 최단 경로이므로, 킬러 문항 대신 기초·유형 완성도에 수업 시간을 집중합니다.', '막연한 불안의 원인은 자기 위치를 모르는 것이므로, 진단으로 어느 단원부터 이해가 끊겼는지 데이터로 보여드리는 것에서 시작합니다. 이후 매 수업을 구멍 보충 절반, 학교 진도 절반으로 나눠 운영하고, 주간 리포트로 어느 구멍이 메워졌는지 학생과 학부모님이 함께 확인합니다.'] },
    { q: '시험만 보면 시간이 모자라요', how: ['평소 수업부터 타이머를 씁니다. 문제마다 제한 시간을 두고, 2분 이상 막히면 표시하고 넘어가는 판단을 훈련해 실전에서 같은 판단이 나오게 합니다. 시험 2주 전부터는 학교 기출을 실제 시험 시간에 맞춰 풀고, 시간 배분 결과를 함께 복기하며 버릴 문제와 잡을 문제를 구분하는 기준을 만들어 줍니다.', '시간 부족은 속도 문제가 아니라 판단 문제인 경우가 대부분입니다. 수업에서 아는 문제를 빨리 처리하는 루틴과 모르는 문제를 빨리 버리는 기준을 분리해 훈련하고, 실전 모의 풀이 후에는 어떤 문제에 시간을 잃었는지 함께 분석해 다음 시험의 시간 전략을 세웁니다.'] },
    { q: '오답노트를 만들어도 성적이 안 올라요', how: ['베껴 쓰는 오답노트를 없애고, 수업에서 오답 관리 시스템으로 바꿉니다. 틀린 문제마다 원인을 개념 부족·실수·시간 부족으로 분류해 기록하고, 일주일 뒤 수업에서 노트 없이 다시 풀게 합니다. 다시 틀리는 문제만 남긴 목록이 시험 직전 최고의 교재가 되고, 실수 패턴은 데이터로 쌓여 학생 스스로 자기 약점을 보게 됩니다.', '오답의 원인 분류부터 수업에서 함께 합니다. 개념이 없어서인지, 실수인지, 시간이 없어서인지에 따라 처방이 완전히 다르기 때문입니다. 분류된 오답은 일주일 간격으로 재풀이해 진짜 극복 여부를 확인하고, 반복해서 틀리는 유형은 수업 커리큘럼에 다시 반영합니다.'] },
  ],
  english: [
    { q: '단어는 외우는데 독해가 안 돼요', how: ['단어량이 아니라 문장 구조 해석이 병목인 경우가 많아, 수업에서 구문 단위 끊어읽기부터 훈련합니다. 주어-동사를 찾고 수식어를 괄호로 묶는 연습을 지문마다 반복하면, 아는 단어가 문장 안에서 연결되기 시작합니다. 독해 속도는 이 훈련이 자동화된 뒤에 자연히 따라옵니다.', '수업에서 지문을 함께 읽으며 어디서 해석이 끊기는지 실시간으로 확인합니다. 단어 문제인지, 구문 문제인지, 배경지식 문제인지 원인을 구분한 뒤 학생에게 맞는 훈련을 배치하고, 매 수업 한 지문은 구조 분석 노트로 정리해 해석의 틀을 만들어 줍니다.'] },
    { q: '초등 아이가 영어를 지루해하고 거부감이 있어요', how: ['흥미가 없는 상태에서 문법·단어부터 밀어붙이면 거부감만 커지므로, 아이가 좋아하는 주제의 짧은 글과 영상으로 수업을 엽니다. 소리 내어 읽고 따라 말하는 활동 비중을 높여 영어를 시험이 아니라 소통 도구로 먼저 만나게 하고, 성취를 눈으로 확인할 수 있는 작은 목표를 매주 함께 세웁니다.', '초등 영어 수업의 첫 목표는 실력보다 태도입니다. 아이 수준보다 살짝 쉬운 자료로 매 수업 성공 경험을 쌓고, 게임식 단어 활동과 말하기 활동을 섞어 수업 자체가 기다려지게 만드는 것을 우선합니다. 흥미가 자리 잡으면 읽기·문법은 그 위에 빠르게 쌓입니다.'] },
    { q: '중학 내신 서술형·영작에서 자꾸 감점돼요', how: ['학교 기출을 먼저 분석해 우리 학교 서술형이 요구하는 답안 형태를 파악합니다. 수업에서는 조건 영작(어순, 시제, 지정 단어)을 유형별로 훈련하고, 학생이 쓴 답안을 감점 포인트 기준으로 첨삭합니다. 시험 4주 전부터는 매 수업 서술형 답안 쓰기를 루틴으로 넣어 실전 감각을 만듭니다.', '서술형 감점은 대부분 아는 것을 정확한 형태로 쓰지 못해 생깁니다. 수업에서 학생 답안을 그대로 두고 채점자의 눈으로 함께 다시 보며 어디서 왜 감점되는지 스스로 발견하게 하고, 같은 문형을 조건만 바꿔 반복 훈련해 시험장에서 자동으로 나오게 만듭니다.'] },
    { q: '고등 모의고사 빈칸·순서·삽입 유형이 약해요', how: ['이 유형들은 감이 아니라 글의 논리 구조로 푸는 문제라, 수업에서 지문의 연결어·지시어·재진술을 추적하는 훈련을 합니다. 틀린 문제는 정답의 근거 문장을 지문에서 직접 찾아 표시하게 해, 찍기가 아니라 근거 기반 풀이 습관을 만듭니다. 유형별 접근 순서를 정리한 뒤 기출로 반복 적용합니다.', '수업에서 빈칸·순서·삽입을 유형별로 분리해 각각의 풀이 알고리즘을 먼저 세웁니다. 그 다음 기출 지문으로 알고리즘을 적용하는 연습을 반복하고, 학생이 틀릴 때마다 어느 단계에서 논리가 끊겼는지 함께 복기해 유형별 정답률을 데이터로 관리합니다.'] },
    { q: '듣기 점수가 안 나와요', how: ['듣기는 재능이 아니라 훈련량이 정직하게 반영되는 영역입니다. 수업에서 딕테이션(받아쓰기)으로 안 들리는 소리의 정체(연음, 축약)를 확인하고, 쉐도잉으로 소리와 의미를 연결합니다. 여기에 매일 10분 듣기 루틴을 숙제로 설계해 수업 밖에서도 귀가 영어에 노출되게 합니다.', '틀린 듣기 문제의 스크립트를 함께 보며 몰라서 못 들었는지, 알아도 못 들었는지부터 구분합니다. 전자는 어휘·표현 보충으로, 후자는 딕테이션과 쉐도잉으로 처방이 달라집니다. 수업마다 실전 문항 훈련과 소리 훈련을 병행해 점수와 귀를 함께 키웁니다.'] },
  ],
  korean: [
    { q: '비문학 지문 읽는 데 시간이 너무 오래 걸려요', how: ['속독 훈련이 아니라 구조 독해로 접근합니다. 수업에서 문단마다 중심 문장을 찾아 한 줄로 요약하고, 문단 간 관계(주장-근거, 대비, 예시)를 표시하며 읽는 훈련을 합니다. 글의 뼈대가 보이기 시작하면 다시 읽는 횟수가 줄어 시간이 저절로 단축됩니다.', '시간이 오래 걸리는 학생 대부분은 같은 문장을 여러 번 읽고 있습니다. 수업에서 한 번 읽으며 표시하는 능동 독해(중심 문장 밑줄, 개념어 표시, 문단 요약)를 훈련하고, 지문 유형별(과학·경제·인문) 자주 나오는 전개 구조를 익혀 예측하며 읽게 만듭니다.'] },
    { q: '문학을 느낌으로 풀어서 점수가 들쑥날쑥해요', how: ['수업에서 모든 답에 지문 속 근거를 요구합니다. 선지를 고를 때마다 어느 구절 때문인지 표시하게 하면, 감상과 풀이가 분리되기 시작합니다. 시·소설의 기본 개념어(화자, 서술자, 시점, 정서)를 정확히 잡고, 기출 선지가 근거를 어떻게 비트는지 패턴을 분석해 흔들리지 않는 풀이 기준을 만듭니다.', '느낌 풀이는 실력이 아니라 습관의 문제라, 수업에서 근거 없는 정답은 정답으로 인정하지 않는 규칙을 세웁니다. 맞힌 문제도 근거를 설명하게 해 우연을 걸러내고, 작품 감상은 감상대로 존중하되 시험 풀이는 지문과 선지의 대응 관계로 푸는 이중 모드를 훈련합니다.'] },
    { q: '초등 아이 어휘력이 부족해서 걱정이에요', how: ['어휘는 단어장 암기보다 문맥 속 반복 노출이 효과적입니다. 수업에서 아이 수준에 맞는 글을 함께 읽으며 모르는 단어를 문맥으로 추측하고 확인하는 습관을 만들고, 새로 만난 어휘로 짧은 문장을 지어보게 해 수동 어휘를 능동 어휘로 바꿉니다. 한자어 기초(어근 중심)도 놀이처럼 함께 다룹니다.', '수업마다 읽기 자료에서 나온 어휘를 어휘 노트에 문장째 수집하고, 다음 수업에서 그 단어로 말하기·짧은 글쓰기를 하며 복습합니다. 시험식 암기가 아니라 쓰면서 익히는 방식이라 오래 남고, 독해력과 어휘력이 함께 자랍니다.'] },
    { q: '중학 국어, 범위는 다 봤는데 시험을 못 봐요', how: ['중학 내신 국어는 교과서와 학교 필기가 곧 시험지입니다. 수업에서 학교 프린트·필기를 기준으로 출제 포인트를 정리하고, 학교 기출로 선생님의 출제 스타일(서술형 비중, 지엽 여부)을 분석해 그 방향으로 대비합니다. 범위를 읽는 공부에서 출제자의 눈으로 보는 공부로 바꾸는 것이 핵심입니다.', '범위를 봤다와 시험에 나오는 형태로 안다는 다릅니다. 수업에서 학습 목표·필기 기준으로 나올 지점을 함께 추리고, 그 지점을 문제 형태로 바꿔 훈련합니다. 서술형은 모범 답안의 채점 키워드를 분석해 키워드가 들어간 답안 쓰기를 반복 연습합니다.'] },
    { q: '문법(언어)이 아무리 봐도 안 외워져요', how: ['문법은 암기가 아니라 체계라서, 수업에서 음운-단어-문장 순으로 원리를 먼저 세우고 예시를 그 틀에 끼워 넣습니다. 용어마다 왜 그런 이름이 붙었는지 이해하면 외울 양이 절반으로 줄어듭니다. 이후 기출 문제로 원리를 적용하는 연습을 반복해 시험용 문법으로 완성합니다.', '무작정 외우다 실패한 학생일수록 원리 중심 재정리가 효과적입니다. 수업에서 개념 지도를 함께 그려 문법 전체의 구조를 한눈에 잡고, 헷갈리는 지점(품사 vs 성분 등)은 비교표로 정리합니다. 배운 원리는 반드시 기출 적용까지 이어가 아는 것과 푸는 것의 간격을 없앱니다.'] },
  ],
  science: [
    { q: '외울 게 많아서 과학을 싫어해요', how: ['과학이 암기 과목이 되는 순간 흥미도 성적도 떨어집니다. 수업에서는 왜 그렇게 되는지 원리와 인과를 먼저 세우고, 암기가 필요한 부분은 원리에 연결해 외울 양 자체를 줄입니다. 생활 속 사례와 실험 영상으로 개념이 실제 현상과 만나는 경험을 만들어 과목에 대한 태도부터 바꿉니다.', '용어 암기 이전에 현상 이해가 먼저입니다. 수업에서 개념마다 이게 일상에서 어디에 쓰이는지부터 연결하고, 학생이 원리를 자기 말로 설명할 수 있게 되면 그때 용어를 정확히 입힙니다. 이해 위에 얹은 암기는 시험이 끝나도 남습니다.'] },
    { q: '실험·탐구 문제만 나오면 틀려요', how: ['탐구 문제는 지식이 아니라 해석 절차를 묻습니다. 수업에서 가설-변인(조작·통제)-결과-결론의 틀로 실험을 분석하는 훈련을 반복하고, 기출 탐구 문항을 유형별(자료 해석, 실험 설계, 결론 도출)로 분류해 각각의 접근법을 잡아줍니다. 틀에 익숙해지면 처음 보는 실험도 같은 절차로 풀립니다.', '수업에서 교과서 실험을 그냥 읽지 않고 왜 이 조건을 통제했는지, 결과가 달랐다면 어떤 결론이 나왔을지 질문하며 봅니다. 이렇게 실험을 뜯어보는 연습이 쌓이면 탐구 문항이 지식 문제가 아니라 독해 문제로 보이기 시작합니다.'] },
    { q: '중학 과학은 괜찮았는데 고등 과학이 갑자기 어려워요', how: ['고등 과학의 벽은 대부분 수학과 추상화입니다. 진단으로 어느 지점(공식 적용, 그래프 해석, 개념 자체)에서 막히는지 확인하고, 필요하면 관련 수학(비례, 함수, 로그)을 수업 안에서 함께 보충합니다. 중학 개념과 고등 개념을 연결하는 다리를 놓아 갑자기 어려워진 것이 아니라 연결이 끊긴 것임을 보여줍니다.', '중학 과학은 현상 중심, 고등 과학은 정량 중심이라 공부법 자체를 바꿔야 합니다. 수업에서 개념마다 정의-공식-그래프-대표 문제를 한 세트로 정리하고, 단원 간 연결(운동과 에너지, 화학 반응과 양적 관계)을 명시적으로 짚어 과목 전체의 지도를 만들어 줍니다.'] },
    { q: '물리 계산 문제만 나오면 손을 못 대요', how: ['공식을 외워서 대입하는 방식은 조금만 비틀려도 무너집니다. 수업에서 공식이 나오는 과정을 유도하며 각 기호의 의미를 잡고, 문제를 읽으면 상황 그림부터 그리는 습관을 훈련합니다. 그림-식-계산의 3단계가 자리 잡으면 계산 문제가 개념 문제로 바뀝니다.', '물리 계산의 병목은 계산력이 아니라 상황을 식으로 번역하는 단계입니다. 수업에서 문제 상황을 그림과 화살표로 표현하고, 주어진 것과 구할 것을 기호로 정리한 뒤 식을 세우는 순서를 매 문제 반복합니다. 기본 유형 20~30개가 이 방식으로 잡히면 응용은 조합일 뿐입니다.'] },
    { q: '그래프·표 자료 해석 문제가 약해요', how: ['자료 해석은 순서가 있습니다. 수업에서 축과 단위 확인 → 경향 파악 → 특이점 표시 → 선지 대조의 4단계 루틴을 만들어 모든 자료 문제에 같은 절차를 적용하게 합니다. 기출 자료 문항을 모아 유형별로 반복하면 자료가 정보가 아니라 답의 근거로 보이기 시작합니다.', '그래프를 눈으로만 보는 학생에게는 손으로 읽는 훈련을 시킵니다. 수업에서 축·단위·기울기·교점에 직접 표시를 하며 읽고, 자료에서 알 수 있는 것과 알 수 없는 것을 구분하는 연습을 합니다. 이 구분이 되면 함정 선지를 걸러내는 눈이 생깁니다.'] },
  ],
  social: [
    { q: '사회는 암기 과목이라며 벼락치기만 해요', how: ['벼락치기 암기는 시험 다음 날 증발합니다. 수업에서는 사건과 개념을 왜-그래서의 인과 사슬로 엮어 이야기처럼 이해하게 만들고, 암기는 그 사슬의 마디를 확인하는 수준으로 줄입니다. 흐름이 잡힌 학생은 처음 보는 문제도 맥락으로 추론할 수 있게 됩니다.', '수업에서 단원을 시작할 때 세부 내용 대신 큰 질문(왜 이 제도가 생겼나, 이 사건의 결과는 무엇인가)부터 던집니다. 그 질문에 답을 찾아가는 방식으로 내용을 배우면 암기가 이해의 부산물이 되고, 서술형에도 흔들리지 않는 근본 이해가 생깁니다.'] },
    { q: '역사 연도와 사건이 머릿속에서 뒤섞여요', how: ['연도 암기보다 순서와 인과가 먼저입니다. 수업에서 시대별 뼈대 연표를 함께 그리고, 사건들을 원인-전개-결과로 연결해 이야기 단위로 묶습니다. 뼈대가 선 다음에 세부 사건을 그 위에 배치하면 뒤섞임이 사라지고, 연도는 필요한 핵심만 앵커로 외웁니다.', '수업마다 배운 내용을 한 장 연표에 계속 누적합니다. 새 사건을 배울 때마다 이게 어느 흐름의 어디에 들어가는지 직접 배치하게 하면, 역사가 낱개 사실이 아니라 하나의 지도로 잡힙니다. 시험 전에는 이 연표 한 장이 최고의 요약본이 됩니다.'] },
    { q: '일반사회 개념이 추상적이라 와닿지 않아요', how: ['수요·공급, 기본권, 사회화 같은 추상 개념은 사례 없이는 남지 않습니다. 수업에서 개념마다 뉴스와 일상 사례를 연결해 개념이 작동하는 장면을 보여주고, 학생이 직접 새 사례를 찾아 개념에 대응시키는 훈련을 합니다. 사례로 이해한 개념은 낯선 자료 문제에서도 힘을 발휘합니다.', '개념 정의를 외우는 대신, 수업에서 이 개념이 없다면 어떤 일이 생길까를 함께 생각하며 개념의 역할부터 잡습니다. 그 다음 기출 자료 문항으로 개념이 문제에서 어떻게 변형되어 나오는지 확인해, 이해와 시험 사이의 간격을 좁힙니다.'] },
    { q: '서술형에서 아는 내용인데 용어를 정확히 못 써서 감점돼요', how: ['사회 서술형은 채점 키워드 싸움입니다. 수업에서 기출 모범 답안을 분석해 반드시 들어가야 할 용어를 추리고, 같은 내용을 일상어가 아닌 교과 용어로 바꿔 쓰는 훈련을 합니다. 시험 4주 전부터는 매 수업 서술형 답안을 직접 써서 첨삭받는 루틴을 돌립니다.', '아는 것과 채점받는 것은 다릅니다. 수업에서 학생 답안과 모범 답안을 나란히 놓고 어떤 용어가 빠져 감점됐는지 직접 확인하게 하고, 핵심 용어는 정의째 정확히 쓰는 연습을 반복합니다. 용어 목록은 단원별로 누적 관리해 시험 직전 점검표로 씁니다.'] },
    { q: '지리 지도·통계 자료만 나오면 어려워해요', how: ['지리 자료는 읽는 순서를 훈련하면 급격히 쉬워집니다. 수업에서 지도는 범례-분포-특이 지역, 통계는 단위-순위-변화 순으로 읽는 루틴을 만들고, 기출 자료를 유형별로 반복합니다. 자료마다 이 자료로 출제자가 물을 수 있는 것을 예상해보는 연습이 실전 감각을 만듭니다.', '수업에서 백지도와 기출 통계를 직접 손으로 표시하며 다룹니다. 눈으로 보는 자료는 흘러가지만 손으로 읽은 자료는 남기 때문입니다. 지역별 특징은 위치-자연환경-산업의 틀로 묶어 정리해, 낯선 지역 문제도 같은 틀로 접근하게 합니다.'] },
  ],
  essay: [
    { q: '글을 시작조차 못 하고 한참을 앉아 있어요', how: ['백지 공포는 재능 문제가 아니라 절차가 없어서 생깁니다. 수업에서 쓰기 전 단계(질문 분석-생각 꺼내기-개요 짜기)를 고정 루틴으로 만들어, 글쓰기를 막막한 창작이 아니라 따라가면 되는 절차로 바꿉니다. 개요까지 서면 첫 문장은 개요를 문장으로 옮기는 일이 됩니다.', '수업에서 완성된 글이 아니라 개요부터 첨삭합니다. 주장-근거-사례의 뼈대를 말로 먼저 세우고, 그것을 메모로, 메모를 문단으로 확장하는 단계를 밟으면 시작을 못 하는 학생도 글이 나오기 시작합니다. 매 수업 짧게라도 완성하는 경험을 쌓아 쓰는 근육을 만듭니다.'] },
    { q: '쓴 글이 늘 비슷하고 근거가 빈약해요', how: ['근거가 빈약한 것은 글솜씨가 아니라 재료 부족입니다. 수업에서 주제별 배경지식과 예시(시사, 역사, 과학)를 함께 정리해 논거 창고를 만들고, 같은 주장을 다른 근거 세 가지로 써보는 훈련으로 사고의 폭을 넓힙니다. 읽기 자료를 수업에 연계해 재료가 계속 쌓이게 설계합니다.', '수업에서 학생 글의 근거마다 그래서? 왜?를 물어 논증의 빈 곳을 드러냅니다. 그 다음 근거를 구체적 사례와 수치로 보강하는 연습을 하고, 반론을 예상해 미리 방어하는 문단까지 확장합니다. 이 과정이 반복되면 글의 밀도가 눈에 띄게 달라집니다.'] },
    { q: '학교 수행평가 글쓰기 점수가 안 나와요', how: ['수행평가는 채점 기준표가 공개된 시험입니다. 수업에서 평가 기준(주제 적합성, 구성, 근거, 표현)을 역산해 각 항목에서 점수를 받는 글의 조건을 정리하고, 그 조건에 맞춰 쓰는 훈련을 합니다. 학교별 과제 유형(논설문, 보고서, 감상문)에 맞는 형식도 함께 잡아줍니다.', '잘 쓴 글과 점수 받는 글은 다를 수 있습니다. 수업에서 학생이 쓴 수행평가 글을 채점 기준표에 직접 대조해 어느 항목에서 점수가 새는지 확인하고, 그 항목만 집중 보강합니다. 분량 조절, 문단 구성, 맞춤법 같은 감점 요소도 체크리스트로 관리합니다.'] },
    { q: '독서량이 적어서 논술이 될지 모르겠어요', how: ['논술에 필요한 것은 다독이 아니라 정독과 소화입니다. 수업에서 짧고 밀도 있는 글(칼럼, 고전 발췌)을 함께 읽고 요약-비판-적용의 3단계로 소화하는 훈련을 합니다. 한 편을 제대로 소화한 글 재료가 열 권의 흘려 읽기보다 논술에서는 힘이 셉니다.', '독서 이력은 지금부터 쌓으면 됩니다. 수업에서 학생 수준과 목표(수행평가, 입시 논술)에 맞는 읽기 목록을 짜고, 읽은 글마다 핵심 논지와 내 생각을 한 장으로 정리하는 독서 노트를 함께 만듭니다. 이 노트가 쌓이면 그대로 논술의 논거 창고가 됩니다.'] },
    { q: '첨삭을 받아도 다음 글에서 같은 지적을 또 받아요', how: ['첨삭이 반영되지 않는 이유는 고쳐 쓰기가 없어서입니다. 수업에서는 첨삭 후 반드시 같은 글을 다시 쓰게 해 지적이 몸에 붙게 하고, 학생별 반복 지적 사항을 자기 점검 체크리스트로 만들어 다음 글을 쓰기 전에 스스로 확인하게 합니다. 같은 지적이 줄어드는 것이 실력이 느는 신호입니다.', '첨삭은 받는 것이 아니라 소화하는 것입니다. 수업에서 첨삭 내용을 학생이 자기 말로 설명하게 해 이해를 확인하고, 고쳐 쓴 글과 원래 글을 나란히 비교해 무엇이 왜 나아졌는지 직접 보게 합니다. 반복 실수는 유형화해 글쓰기 전 점검 항목으로 관리합니다.'] },
  ],
};

const SITE = {
  name: '공부모아',
  // 도메인 사면 여기만 바꾸면 canonical/sitemap에 전부 반영됩니다.
  origin: 'https://gongbumoa.com',
  desc: '전국 5,067개 지역의 초·중·고 1:1 맞춤 과외 수업 안내. 지역별·학교별·과목별 수업 정보를 확인하고 무료 상담을 받아보세요',
  // 사이트 소유 확인 코드 (네이버 서치어드바이저 / 구글 서치콘솔에서 발급 후 붙여넣기)
  verifyNaver: '02237442fbd0f0a590037ef8def16e87eb9ca27f',
  verifyGoogle: '',
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
function page({ title, desc, canonical, crumb = '', body, jsonld, img = null }) {
  const _lm = new Date((Math.floor(Date.now() / 86400000) - ((pageHash(canonical || title) % 35) + 2)) * 86400000);
  const _lmKo = `${_lm.getFullYear()}년 ${_lm.getMonth() + 1}월 ${_lm.getDate()}일`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow,max-image-preview:large">
${SITE.verifyNaver ? `<meta name="naver-site-verification" content="${SITE.verifyNaver}">` : ''}
${SITE.verifyGoogle ? `<meta name="google-site-verification" content="${SITE.verifyGoogle}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="ko_KR">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="${SITE.origin}${img || '/icon-512.png'}">
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta property="article:modified_time" content="${_lm.toISOString()}">
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${CSS}</style>
${jsonld ? (Array.isArray(jsonld) ? jsonld : [jsonld]).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n') : ''}
</head>
<body>
<header><div class="wrap nav">
<a href="/" class="brand"><span class="mark">공</span>${SITE.name}</a>
<nav class="nav-links">
<a href="/regions">지역별수업</a><a href="/schools">학교별수업</a><a href="/subjects">과목수업</a><a href="/others">기타수업</a>
</nav>
<a href="#contact" class="btn btn-primary">무료 상담</a>
</div></header>
<div class="wrap">${crumb}${crumb ? `<div style="font-size:12.5px;color:#98938A;margin:2px 0 0">최종 업데이트: ${_lmKo}</div>` : ''}</div>
${body}
${crumb ? consultFormBlock(String(title).split(' | ')[0].split(' - ')[0], regionFromPath(canonical ? new URL(canonical).pathname : '')) : ''}
<footer><div class="wrap">
<div class="foot">
<div><b>${SITE.name}</b>초·중·고 1:1 맞춤 과외<br>아이의 속도에 맞춰 함께 성장합니다.</div>
<div><b>수업</b><a href="/regions">지역별수업</a><a href="/schools">학교별수업</a><a href="/subjects">과목수업</a><a href="/others">기타수업</a></div>
<div><b>문의</b><a href="#contact">무료 상담</a><a href="tel:01030388978">전화 010-3038-8978</a></div>
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
  const hit = g.list.find(d => d[3] === dongName || d[0] === dongName);
  return hit ? { name: hit[0], code: hit[1], kind: hit[2], slug: hit[3] } : null;
}

/* ---------------- 공통 조각 ---------------- */

function subjectRow(basePath, activeSlug) {
  return `<div class="subj-row">` + SUBJECTS.map(s =>
    `<a class="subj" href="${basePath}/${s.slug}"${s.slug === activeSlug ? ' style="border-color:var(--blue);color:var(--blue-deep)"' : ''}>${s.emoji} ${s.name}과외</a>`
  ).join('') + `</div>`;
}

function regionFromPath(pathname) {
  try {
    const segs = String(pathname || '').split('/').filter(Boolean).map(s => decodeURIComponent(s).toLowerCase());
    if (!segs.length) return '';
    if (segs[0] === 'schools' && segs[1]) {
      schoolIndex();
      const s = SCHOOL_BY_SLUG && SCHOOL_BY_SLUG.get(segs[1]);
      return s ? s[3] : '';
    }
    const sido = SIDO[segs[0]];
    if (!sido) return '';
    let out = sido.full;
    const sgg = segs[1] && sido.sgg && sido.sgg[segs[1]];
    if (sgg) {
      out += ' ' + sgg.d;
      if (segs[2] && Array.isArray(sgg.l)) {
        const d = sgg.l.find(x => x[3] === segs[2]);
        if (d) out += ' ' + d[0];
      }
    }
    return out;
  } catch (e) { return ''; }
}

/* ---------------- 페이지별 상담 신청폼 ---------------- */
function consultFormBlock(ctx, addrPre) {
  const c = esc(String(ctx || '').slice(0, 80));
  const ap = esc(String(addrPre || '').slice(0, 60));
  const subjM = String(ctx || '').match(/영어회화|수학|영어|국어|과학|사회|논술/);
  const subjPre = subjM ? subjM[0] : '';
  return `<section id="contact"><div class="wrap">
<style>
.pform{max-width:640px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px 22px;box-shadow:0 16px 34px -26px rgba(35,39,65,.3)}
.pform h2{font-size:22px;margin-bottom:4px}
.pform .pf-sub{color:#6b6760;font-size:14px;margin-bottom:16px}
.pform .ff{margin-bottom:14px}
.pform label{display:block;font-weight:800;font-size:14px;margin-bottom:6px}
.pform label em{color:#e5484d;font-style:normal;font-size:12px;font-weight:700}
.pform input,.pform select,.pform textarea{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:11px 12px;font-size:15px;font-family:inherit;background:#fff}
.pform input.err,.pform select.err{border-color:#e5484d;background:#fff5f5}
.pform .phone-row{display:flex;gap:8px;align-items:center}
.pform .phone-row input{text-align:center}
.pform .addr-row{display:flex;gap:8px}
.pform .addr-row input{flex:1}
.pform .btn-addr{white-space:nowrap;border:0;border-radius:12px;padding:0 16px;font-weight:800;background:#232741;color:#fff;cursor:pointer}
.pform .pf-submit{width:100%;border:0;border-radius:14px;padding:15px;font-size:16px;font-weight:900;background:var(--yellow,#ffd737);color:#232741;cursor:pointer;margin-top:4px}
.pform .form-msg{margin-top:10px;font-size:14px;font-weight:700;text-align:center}
.pform .form-msg.ok{color:#1a7f37}.pform .form-msg.no{color:#e5484d}
.pform .pf-hint{font-size:12.5px;color:#98938a;margin-top:4px}
</style>
<div class="pform">
<h2>${c ? c + ' 상담 신청' : '수업 상담 신청'}</h2>
<p class="pf-sub">신청을 남겨주시면 순차적으로 연락드려요. 급하시면 <a href="tel:01030388978" style="font-weight:800;color:var(--blue-deep,#2456c9)">010-3038-8978</a></p>
<p class="inq-line" hidden style="font-size:13.5px;margin-bottom:12px;color:var(--blue-deep,#2456c9);font-weight:700">지금까지 누적 <b class="inq-n"></b>건의 상담이 접수되었습니다</p>
<form id="pcForm" novalidate>
<div class="ff"><label>학생이름 <em>* 필수</em></label><input type="text" id="pcName" maxlength="20" placeholder="학생 이름"></div>
<div class="ff"><label>학년</label><select id="pcGrade"><option value="">학년 선택</option><optgroup label="초등학교"><option>초1</option><option>초2</option><option>초3</option><option>초4</option><option>초5</option><option>초6</option></optgroup><optgroup label="중학교"><option>중1</option><option>중2</option><option>중3</option></optgroup><optgroup label="고등학교"><option>고1</option><option>고2</option><option>고3</option></optgroup><option>기타</option></select></div>
<div class="ff"><label>과목</label><input type="text" id="pcSubject" maxlength="40" value="${esc(subjPre)}" placeholder="예) 수학, 영어 등"></div>
<div class="ff"><label>연락처 <em>* 필수</em></label><div class="phone-row"><input type="tel" id="pcP1" value="010" maxlength="3" inputmode="numeric"><span>-</span><input type="tel" id="pcP2" maxlength="4" inputmode="numeric" placeholder="0000"><span>-</span><input type="tel" id="pcP3" maxlength="4" inputmode="numeric" placeholder="0000"></div></div>
<div class="ff"><label>주소 <em>* 필수</em></label><div class="addr-row"><input type="text" id="pcAddr" value="${ap}" placeholder="도로명 주소 검색" readonly><button type="button" class="btn-addr" id="pcAddrBtn">주소 검색</button></div><input type="text" id="pcAddrDetail" placeholder="상세 주소 (동/호수) * 필수" maxlength="60" style="margin-top:8px"><p class="pf-hint">주소 검색 후 상세주소까지 입력해야 신청이 완료됩니다.</p></div>
<div class="ff"><label>상담내용</label><textarea id="pcMemo" rows="3">${c ? c + ' 문의드립니다.' : '과외 문의드립니다.'}</textarea></div>
<input type="text" id="pcWebsite" style="position:absolute;left:-9999px" tabindex="-1" autocomplete="off">
<button type="submit" class="pf-submit">무료 상담 신청하기</button>
<div class="form-msg" id="pcMsg"></div>
</form>
</div>
</div></section>
<script>(function(){
var $=function(i){return document.getElementById(i)};
var form=$('pcForm'); if(!form) return;
var daumLoaded=false;
function openAddr(){new daum.Postcode({oncomplete:function(d){$('pcAddr').value=d.roadAddress||d.jibunAddress;$('pcAddrDetail').focus();}}).open();}
$('pcAddrBtn').addEventListener('click',function(){if(daumLoaded){openAddr();return;}var s=document.createElement('script');s.src='https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';s.onload=function(){daumLoaded=true;openAddr();};document.body.appendChild(s);});
$('pcAddr').addEventListener('click',function(){$('pcAddrBtn').click();});
form.addEventListener('submit',function(e){
e.preventDefault();
var msg=$('pcMsg');msg.className='form-msg';msg.textContent='';
var bad=null;function mark(el,b){el.classList.toggle('err',!!b);if(b&&!bad)bad=el;}
mark($('pcName'),!$('pcName').value.trim());
var p1=$('pcP1').value,p2=$('pcP2').value,p3=$('pcP3').value;
var phone=p1+'-'+p2+'-'+p3;
var pOk=/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(phone);
mark($('pcP2'),!pOk);mark($('pcP3'),!pOk);
mark($('pcAddr'),!$('pcAddr').value.trim());
mark($('pcAddrDetail'),!$('pcAddrDetail').value.trim());
if(bad){msg.className='form-msg no';msg.textContent='빨간 항목을 확인해 주세요.';bad.focus();return;}
var btn=form.querySelector('.pf-submit');btn.disabled=true;btn.textContent='접수 중...';
fetch('/api/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('pcName').value.trim(),grade:$('pcGrade').value,subject:$('pcSubject').value.trim(),phone:phone,addr:$('pcAddr').value.trim(),addrDetail:$('pcAddrDetail').value.trim(),memo:$('pcMemo').value.trim(),website:$('pcWebsite').value,page:(document.title.split(' | ')[0]+' · '+location.pathname).slice(0,200)})})
.then(function(r){return r.json()}).then(function(d){
if(d&&d.ok){msg.className='form-msg ok';msg.textContent='신청이 접수되었습니다! 순차적으로 연락드릴게요 😊';form.reset();$('pcP1').value='010';}
else{msg.className='form-msg no';msg.textContent='접수에 실패했어요. 잠시 후 다시 시도하거나 전화 주세요.';}
btn.disabled=false;btn.textContent='무료 상담 신청하기';})
.catch(function(){msg.className='form-msg no';msg.textContent='네트워크 오류가 발생했어요. 전화 주시면 바로 상담됩니다.';btn.disabled=false;btn.textContent='무료 상담 신청하기';});
});
})();</script>`;
}

function J(word, withBatchim, without) {
  const w = String(word || '');
  const ch = w.charCodeAt(w.length - 1);
  if (ch < 0xAC00 || ch > 0xD7A3) return w + withBatchim; // 한글 아님 → 보수적으로 받침형
  const jong = (ch - 0xAC00) % 28;
  if (withBatchim === '으로' && jong === 8) return w + without; // ㄹ 받침은 '로'
  return w + (jong > 0 ? withBatchim : without);
}

function ctaBlock(where) {
  const v = pageHash(where + '#cta') % 3;
  const heads = [`${esc(where)} 무료 상담부터 받아보세요`, `${esc(where)} 수업, 상담 신청으로 시작하세요`, `${esc(where)} 학생 무료 상담 신청`];
  const leads = ['아이의 현재 상태를 정확히 알려드리고, 딱 맞는 선생님을 연결해 드려요.', '지금 어디가 막혀 있는지부터 확인한 뒤, 아이에게 맞는 선생님을 찾아드립니다.', '상담 후에 시작 여부를 정하셔도 됩니다. 상담은 무료예요.'];
  return `<section><div class="wrap"><div class="cta">
<h2>${heads[v]}</h2>
<p>${leads[v]}</p>
<div class="btns"><a href="#contact" class="btn btn-yellow">무료 상담 신청</a><a href="tel:01030388978" class="btn btn-wg">📞 010-3038-8978</a></div>
<p class="inq-line" hidden style="margin-top:14px;font-size:14px;opacity:.92">지금까지 누적 <b class="inq-n" style="font-size:16px"></b>건의 상담이 접수되었습니다</p>
</div></div></section>
<script>(function(){fetch('/api/stats').then(function(r){return r.json()}).then(function(d){if(!d||!d.count||d.count<1)return;var els=document.querySelectorAll('.inq-line');var t=d.count,s=Math.max(0,t-Math.max(5,Math.ceil(t*0.15))),cur=s,steps=20,inc=(t-s)/steps,i=0;els.forEach(function(e){e.hidden=false});function tick(){i++;cur=i>=steps?t:cur+inc;var v=Math.round(cur).toLocaleString('ko-KR');document.querySelectorAll('.inq-n').forEach(function(n){n.textContent=v});if(i<steps)setTimeout(tick,40)}tick()}).catch(function(){})})();</script>`;
}


/* ---------------- 과목별 학습 가이드 ---------------- */

function pageHash(seed) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h;
}
function pick(arr, seedStr, salt) {
  if (!Array.isArray(arr)) return arr;
  return arr[pageHash(seedStr + '#' + salt) % arr.length];
}
function rotate(arr, h) {
  const n = arr.length, off = h % n;
  return arr.slice(off).concat(arr.slice(0, off));
}

function guideBlock(subj, place, seed, extra) {
  const g = GUIDES[subj.slug];
  if (!g) return '';
  const sd = String(seed) + subj.slug;
  const h = pageHash(sd);
  const fill = s => esc(String(s).split('{p}').join(place));
  // 문답: 풀에서 회전 후 4개 선택 (페이지마다 조합·순서 상이)
  const probs = rotate(g.problems, pageHash(sd + '#probs') % g.problems.length).slice(0, 5);
  // 고민→수업 진행: 풀에서 회전 후 4개 선택 (페이지마다 조합 상이)
  const lfPool = LESSON_FLOW[subj.slug] || [];
  const lfs = lfPool.length ? rotate(lfPool, pageHash(sd + '#flow') % lfPool.length).slice(0, 4) : [];
  // 이웃 지역 리드 문장 (페이지 고유 토큰 삽입)
  const nb = extra && extra.neighbors && extra.neighbors.length
    ? `<p class="sub" style="max-width:760px">${esc(place)}뿐 아니라 인접한 ${extra.neighbors.slice(0, 3).map(esc).join(', ')} 학생들도 같은 방식으로 수업을 받고 있습니다.</p>` : '';
  return `
<section><div class="wrap">
<span class="sec-tag">공부법 가이드</span>
<h2>${[`${esc(place)} ${subj.name} 공부, 이렇게 시작하세요`, `${esc(place)} ${subj.name} 학년별 공부법 총정리`, `${esc(place)} 학생을 위한 ${subj.name} 공부 로드맵`][pageHash(sd + '#h2a') % 3]}</h2>
<p class="sub" style="max-width:760px">${fill(pick(g.intro, sd, 0))}</p>
${g.grades.map((x, i) => `<div class="faq" style="margin-bottom:14px"><h3>${esc(x.t)}</h3><p style="margin-top:6px">${fill(pick(x.b, sd, 10 + i))}</p></div>`).join('')}
</div></section>

<section><div class="wrap">
<span class="sec-tag">자주 겪는 어려움</span>
<h2>${[`${subj.name} 공부에서 이런 고민 있지 않나요?`, `${subj.name} 때문에 자주 듣는 고민들`, `학생들이 가장 많이 묻는 ${subj.name} 고민`][pageHash(sd + '#h2b') % 3]}</h2>
${probs.map(x => `<div class="faq"><h3>"${esc(x.q)}"</h3><p>${fill(x.a)}</p></div>`).join('')}
</div></section>

${(() => {
  const icPool = IMPROVE_CASES[subj.slug] || [];
  if (!icPool.length) return '';
  const ics = rotate(icPool, pageHash(sd + '#ic')).slice(0, 2);
  return `<section><div class="wrap">
<span class="sec-tag">성적향상 플랜</span>
<h2>${[`${esc(place)} ${subj.name} 성적향상, 이렇게 만들어갑니다`, `${esc(place)} ${subj.name} 성적을 올리는 유형별 수업 설계`][pageHash(sd + '#ich') % 2]}</h2>
<p class="sub" style="max-width:760px">학생마다 출발점이 다르기에 플랜도 다릅니다. 자주 만나는 유형별로 수업이 어떻게 설계되는지 보여드려요.</p>
${ics.map((c, i) => `<div class="faq" style="margin-bottom:14px"><h3>${esc(c.t)}</h3><p style="margin-top:6px"><b>시작:</b> ${esc(c.s)}</p><p style="margin-top:6px"><b>수업 전개:</b> ${esc(pick(c.p, sd, 120 + i))}</p><p style="margin-top:6px"><b>목표:</b> ${esc(c.g)}</p></div>`).join('')}
<p class="sub" style="max-width:760px;font-size:14px">결과는 학생의 출발점과 학습량에 따라 달라집니다. 상담에서 우리 아이만의 플랜을 받아보세요.</p>
</div></section>`;
})()}

${lfs.length ? `<section><div class="wrap">
<span class="sec-tag">수업 진행</span>
<h2>${esc(place)} ${subj.name} 과외, 고민별로 이렇게 수업을 이끌어갑니다</h2>
<p class="sub" style="max-width:760px">같은 ${J(subj.name, '이라도', '라도')} 학생마다 막힌 지점이 다르기에 수업의 출발점도 달라야 합니다. ${esc(place)} 학생과 학부모님이 자주 이야기하는 고민과, 실제 수업이 그 고민을 풀어가는 방식을 소개합니다.</p>
${lfs.map((x, i) => `<div class="faq"><h3>"${esc(x.q)}"</h3><p><strong>수업에서는 이렇게 합니다.</strong> ${fill(pick(x.how, sd, 30 + i))}</p></div>`).join('')}
</div></section>` : ''}

<section><div class="wrap">
<span class="sec-tag">학습 루틴</span>
<h2>${[`${subj.name} 주간 학습 루틴과 시험 대비`, `${subj.name} 성적을 만드는 루틴과 시험 플랜`, `평소 루틴부터 시험 4주까지, ${subj.name} 관리법`][pageHash(sd + '#h2c') % 3]}</h2>
<div class="faq" style="margin-bottom:14px"><h3>평소 주간 루틴</h3><p style="margin-top:6px">${fill(pick(g.routine, sd, 3))}</p></div>
<div class="faq"><h3>시험 4주 대비 플랜</h3><p style="margin-top:6px">${fill(pick(g.exam, sd, 4))}</p></div>
<div class="faq" style="margin-top:14px"><h3>지금 성적대에 맞는 접근법</h3><p style="margin-top:6px">${fill(pick(g.levels, sd, 5))}</p></div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">과외 활용법</span>
<h2>${[`${esc(place)}에서 ${subj.name} 과외로 도움받는 방법`, `${esc(place)} ${subj.name} 과외는 이렇게 진행됩니다`, `${esc(place)} ${subj.name} 1:1 수업 활용법`][pageHash(sd + '#h2d') % 3]}</h2>
${nb}
<p class="sub" style="max-width:760px">${fill(pick(g.help, sd, 1))}</p>
<div class="card" style="max-width:760px"><h3>💡 학부모님께 드리는 팁</h3><p style="margin-top:8px">${fill(pick(g.parent, sd, 2))}</p></div>
</div></section>`;
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
  const basePath = dong ? `${parentPath}/${dong.slug}` : parentPath;

  const desc = `${sido.full} ${sgg.disp} ${dong ? dong.name + ' ' : ''}${subj.name}과외. `
    + `초·중·고 1:1 맞춤 수업으로 ${subj.name} 성적을 올려드립니다. 상담 후 아이에게 맞는 선생님을 안내해 드려요.`;

  const siblings = rotate(sgg.list.filter(d => !dong || d[0] !== dong.name), pageHash((dong ? dong.code : sido.key + sgg.key) + subj.slug + '#sibsel')).slice(0, 14);

  const crumbItems = [
    { name: '홈', url: '/' },
    { name: '지역별수업', url: '/regions' },
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

  const seedKey = dong ? dong.code : (sido.key + sgg.key);
  const ph = pageHash(seedKey + subj.slug + 'faq');
  const nbNames = sgg.list.filter(d => !dong || d[0] !== dong.name).map(d => d[0]);
  const faqPool = [
    { q: `${place}에서도 수업이 가능한가요?`, a: `네, ${sido.full} ${sgg.disp} ${place} 전 지역에서 방문 수업과 화상 수업 모두 가능합니다. 지역과 일정에 맞춰 선생님을 안내해 드려요.` },
    { q: `${subj.name} 과외는 몇 학년부터 받을 수 있나요?`, a: `초등학생부터 고등학생까지 모두 가능합니다. 학년과 현재 실력에 따라 커리큘럼을 다르게 구성합니다.` },
    { q: `수업 전에 상담을 먼저 받을 수 있나요?`, a: `상담을 먼저 진행합니다. ${place} 학생의 현재 상태를 확인해 선생님을 안내해 드리고, 무료 모의수업까지 받아보신 뒤 시작 여부를 결정하시면 됩니다.` },
    { q: `선생님이 마음에 들지 않으면 어떻게 하나요?`, a: `수업 초반에 맞지 않는다고 느끼시면 다른 선생님과 만나보실 수 있습니다. 부담 없이 말씀해 주세요.` },
    { q: `수업은 주 몇 회, 몇 분씩 하나요?`, a: `주 1~2회, 회당 90~120분이 일반적이지만 ${place} 학생의 학년과 목표에 따라 조정합니다. 시험 기간에는 횟수를 늘리는 것도 가능합니다.` },
    { q: `방문과 화상 중 어떤 방식이 효과적인가요?`, a: `집중력이 약한 저학년은 방문 수업을, 일정이 빡빡한 고학년은 화상 수업을 선호하는 편입니다. ${subj.name} 과목 특성과 학생 성향을 상담에서 함께 고려해 정해드립니다.` },
    { q: `형제·자매가 함께 수업받을 수 있나요?`, a: `학년과 진도가 비슷하면 함께 수업이 가능하고, 다르면 시간대를 이어서 잡아 이동 부담을 줄여드립니다. 상담 시 말씀해 주세요.` },
  ];
  const faqs = rotate(faqPool, ph % faqPool.length).slice(0, 4);
  const acadV = pageHash(String(seedKey) + subj.slug + '#acad') % 3;
  faqs.push({
    q: [`${place}에서 ${subj.name} 학원과 과외 중 고민된다면?`, `${place} ${subj.name} 학원이 나을까요, 과외가 나을까요?`, `학원에 다니는데 ${subj.name} 과외를 병행해도 되나요?`][acadV],
    a: [
      `학원은 정해진 진도와 경쟁 자극이, 과외는 우리 아이 속도에 맞춘 1:1 맞춤이 강점입니다. 상담에서 아이 성향과 현재 상태를 보고 과외 단독이 나을지, 학원 병행이 나을지 객관적으로 안내해 드립니다.`,
      `정답은 아이 상태에 따라 다릅니다. 개념 구멍이 있거나 질문을 어려워하는 아이는 1:1 과외가, 경쟁 자극이 필요한 상위권은 학원 병행이 맞을 수 있습니다. 상담에서 우리 아이에게 맞는 조합을 안내해 드립니다.`,
      `가능합니다. 학원 진도를 따라가기 벅차거나 질문이 쌓여 있다면, 과외가 학원 수업을 소화하는 보조 엔진 역할을 합니다. 일정이 겹치지 않게 조율해 드리니 상담에서 학원 시간표를 알려주세요.`,
    ][acadV] + (subj.slug === 'english' ? ' 영어회화·원어민 회화 수업 문의도 함께 가능합니다.' : ' 필요하면 영어회화 등 다른 수업도 함께 안내해 드립니다.'),
  });
  // 이 지역(시군구) 실제 학교 목록 — 페이지 고유 데이터
  schoolIndex();
  const sggCode5 = sgg.list[0][1].slice(0, 5);
  const sggSchools = SCHOOLS.filter(s => s[2].startsWith(sggCode5));
  const nearSchools = rotate(sggSchools, pageHash(seedKey + subj.slug + '#sch')).slice(0, 12);
  const gd = GUIDES[subj.slug];
  const fillT = s => s.split('{p}').join(place);
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      ...faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      ...(gd ? gd.problems.map(p2 => ({ '@type': 'Question', name: p2.q, acceptedAnswer: { '@type': 'Answer', text: fillT(p2.a) } })) : []),
      ...(LESSON_FLOW[subj.slug] || []).map(x => ({ '@type': 'Question', name: `${x.q} — ${subj.name} 과외 수업에서 어떻게 해결하나요?`, acceptedAnswer: { '@type': 'Answer', text: fillT(x.how[0]) } })),
    ],
  };
  const howToLd = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: `${place} ${subj.name} 과외 수업 진행 방법`,
    description: `${SITE.name}의 ${place} ${subj.name} 과외는 상담신청, 선생님 안내, 무료 모의수업, 수업 결정의 4단계로 진행됩니다.`,
    step: [
      { '@type': 'HowToStep', position: 1, name: '상담신청', text: `학생의 학년과 ${subj.name} 고민, 목표를 남겨주시면 확인 후 연락드립니다.` },
      { '@type': 'HowToStep', position: 2, name: '선생님 안내', text: `상담 내용과 학생 성향에 맞는 ${place} 인근 선생님을 연결합니다.` },
      { '@type': 'HowToStep', position: 3, name: '무료 모의수업', text: `선생님과 30분 정도 ${subj.name} 수업을 해봅니다.` },
      { '@type': 'HowToStep', position: 4, name: '수업 결정', text: `모의수업을 받아본 뒤 시작 여부를 정하시면 됩니다. 맞지 않으면 다른 선생님과 다시 만나보실 수 있습니다.` },
    ],
  };
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbItems.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name,
      ...(c.url ? { item: SITE.origin + c.url } : {}),
    })),
  };

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${subj.emoji} ${sido.full} ${sgg.disp}</span>
<h1>${esc(h1)}<br><span style="color:var(--blue)">1:1 맞춤 수업</span></h1>
<p class="lead">${pick([
  `${esc(place)}에서 ${subj.name} 때문에 고민이신가요? ${esc(subj.desc)} ${esc(place)} 인근에서 아이에게 맞는 선생님을 연결해 드립니다.`,
  `${esc(place)} 학생을 위한 1:1 ${subj.name} 수업입니다. ${esc(subj.desc)} 상담과 모의수업은 무료이고, 받아보신 뒤 시작 여부를 정하시면 됩니다.`,
  `${esc(sgg.disp)} ${esc(place)}에서 ${subj.name} 선생님을 찾고 계신가요? 아이의 현재 상태를 먼저 확인하고, 딱 맞는 선생님을 연결해 드립니다.`,
], seedKey + subj.slug, 20)}</p>
<div class="cta-row"><a href="#contact" class="btn btn-primary">무료 상담 받기 →</a><a href="${parentPath}" class="btn btn-ghost">${esc(sgg.disp)} 전체 보기</a></div>
<div class="stat-row">
<div class="stat"><div class="n">1:1</div><div class="l">맞춤 수업</div></div>
<div class="stat"><div class="n">${sgg.list.length}개</div><div class="l">${esc(sgg.disp)} 수업 ${kindLabel}</div></div>
<div class="stat"><div class="n">무료</div><div class="l">상담</div></div>
</div>
</div></section>

${photoTag(seedKey + subj.slug, `${place} ${subj.name} 공부하는 학생`)}

<section><div class="wrap">
<span class="sec-tag">수업 방식</span>
<h2>${esc(place)} ${subj.name}, 이렇게 수업해요</h2>
<p class="sub">${esc(subj.desc)}</p>
<div class="grid g4">
<div class="step"><div class="n">1</div><h3>상담신청</h3><p>${pick([
  `아이의 학년과 ${subj.name} 고민을 남겨주시면 연락드려요.`,
  `현재 상태와 목표를 알려주시면 검토 후 안내드립니다.`,
  `무엇이 막혀 있는지 편하게 말씀해 주세요.`,
  `${esc(place)} 지역 상담을 신청하시면 바로 연락드립니다.`,
  `전화나 신청서로 ${subj.name} 고민을 알려주시면 됩니다.`], seedKey + subj.slug, 21)}</p></div>
<div class="step"><div class="n">2</div><h3>선생님 안내</h3><p>${pick([
  `${esc(place)} 인근에서 성향이 맞는 선생님을 연결해요.`,
  `상담 내용에 맞는 ${esc(place)} 지역 선생님을 안내해 드립니다.`,
  `아이 성향과 목표에 맞춰 선생님을 골라 연결합니다.`,
  `${esc(place)} 지역 방문·화상 가능한 선생님을 찾아드려요.`,
  `학교와 학년 경험이 맞는 선생님을 우선 안내해 드립니다.`], seedKey + subj.slug, 22)}</p></div>
<div class="step"><div class="n">3</div><h3>무료 모의수업</h3><p>${pick([
  `선생님과 30분 정도 ${subj.name} 수업을 해봅니다.`,
  `30분 정도, 실제 수업 방식으로 진행합니다.`,
  `짧게 30분, 수업이 맞는지 확인하는 자리입니다.`,
  `아이에게 맞는 수업인지 먼저 확인해 보세요.`,
  `30분 정도라 아이 부담도 크지 않습니다.`], seedKey + subj.slug, 23)}</p></div>
<div class="step"><div class="n">4</div><h3>수업 결정</h3><p>${pick([
  `모의수업을 받아보고 시작 여부를 정하시면 됩니다.`,
  `만족스러우면 정식 수업 일정과 커리큘럼을 함께 잡아요.`,
  `맞지 않으면 다른 선생님과 다시 만나보실 수 있습니다.`,
  `시작하시면 매주 학습 리포트를 보내드립니다.`,
  `해보신 뒤 결정하셔도 늦지 않습니다.`], seedKey + subj.slug, 24)}</p></div>
</div>
</div></section>

${guideBlock(subj, place, seedKey, { neighbors: nbNames })}

<section><div class="wrap">
<span class="sec-tag">학년별 수업</span>
<h2>${esc(place)} 학년별 ${subj.name}과외</h2>
<p class="sub">학년에 따라 공부의 우선순위가 다릅니다. 우리 아이 학년에 맞는 안내를 확인해 보세요.</p>
<div class="linkcol">
${GRADE_LEVELS.map(gr => `<a href="${basePath}/${subj.slug}/${gr.slug}">${esc(place)} ${gr.name} ${subj.name}과외</a>`).join('')}
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">다른 과목</span>
<h2>${esc(place)}에서 찾는 다른 과외</h2>
<p class="sub">여러 과목을 함께 신청하면 일정을 맞춰서 안내해 드려요.</p>
${subjectRow(basePath, subj.slug)}
</div></section>

${siblings.length ? `<section><div class="wrap">
<span class="sec-tag">주변 지역</span>
<h2>${esc(sgg.disp)} 다른 지역 ${subj.name}과외</h2>
<p class="sub">가까운 지역도 함께 확인해 보세요.</p>
<div class="linkcol">
${rotate(siblings, pageHash(seedKey + subj.slug + '#sib')).map(d => `<a href="${parentPath}/${d[3]}/${subj.slug}">${esc(d[0])} ${subj.name}과외</a>`).join('')}
</div>
</div></section>` : ''}

${nearSchools.length ? `<section><div class="wrap">
<span class="sec-tag">인근 학교</span>
<h2>${esc(sgg.disp)} 주요 학교 ${subj.name} 내신 대비</h2>
<p class="sub">${esc(place)} 인근 학교 학생들의 학교별 시험 스타일에 맞춰 수업합니다. 학교를 선택하면 맞춤 안내를 볼 수 있어요.</p>
<div class="linkcol">
${nearSchools.map(s => `<a href="/schools/${s[4]}">${esc(s[0])}</a>`).join('')}
</div>
</div></section>` : ''}

${faqBlock(faqs)}

${ctaBlock(place)}`;

  return page({ title, desc, canonical: url, crumb: crumbs(crumbItems), body, jsonld: [jsonld, faqLd, howToLd, crumbLd], img: photoUrl(seedKey + subj.slug) });
}

/* ---------------- 페이지: 지역 x 과목 x 학년 ---------------- */

function regionGradeSubjectPage({ sido, sgg, dong, subj, grade, url }) {
  const place = dong ? dong.name : sgg.disp;
  const title = `${place} ${grade.name} ${subj.name}과외 | ${SITE.name}`;
  const h1 = `${place} ${grade.name} ${subj.name}과외`;
  const parentPath = `/${U(sido.key)}/${U(sgg.key)}`;
  const basePath = dong ? `${parentPath}/${dong.slug}` : parentPath;
  const subjPath = `${basePath}/${subj.slug}`;
  const desc = `${sido.full} ${sgg.disp} ${dong ? dong.name + ' ' : ''}${grade.name} ${subj.name}과외. ${grade.name} 학생에게 맞춘 1:1 수업으로 ${subj.name} 기초부터 내신까지 잡아드립니다. 학원 비교 상담 후 아이에게 맞는 선생님을 연결해 드려요.`;

  const seedKey = (dong ? dong.code : (sido.key + sgg.key)) + subj.slug + grade.slug;
  const sd = seedKey;
  const g = GUIDES[subj.slug];
  const fill = s => esc(String(s).split('{p}').join(place));
  const gradeGuide = g && g.grades[grade.gi] ? g.grades[grade.gi] : null;
  const probs = g ? rotate(g.problems, pageHash(sd + '#probs') % g.problems.length).slice(0, 4) : [];
  const lfPool = LESSON_FLOW[subj.slug] || [];
  const lfs = lfPool.length ? rotate(lfPool, pageHash(sd + '#flow') % lfPool.length).slice(0, 3) : [];
  const gradeFaqPool = [
    { q: `${grade.name} ${subj.name} 과외는 주 몇 회가 적당한가요?`, a: `${J(grade.name, '은', '는')} 주 1~2회, 회당 90~120분이 일반적입니다. ${place} 학생의 현재 실력과 목표, 다른 일정에 따라 조정하며, 시험 기간에는 횟수를 늘리는 것도 가능합니다.` },
    { q: `${grade.name}인데 ${subj.name} 기초가 많이 부족해도 되나요?`, a: `오히려 1:1 과외가 가장 효과적인 경우입니다. 진단으로 어느 지점부터 이해가 끊겼는지 찾아, 이전 과정까지 내려가 다시 쌓아 올립니다. 학원처럼 정해진 진도에 끌려가지 않는 것이 과외의 장점입니다.` },
    { q: `${place}에서 ${grade.name} 학생 방문 수업이 가능한가요?`, a: `네, ${place} 전 지역 방문 수업과 화상 수업 모두 가능합니다. ${grade.name} 학생의 집중력과 일정에 맞춰 상담에서 함께 정하시면 됩니다.` },
    { q: `${grade.name} ${subj.name} 학원과 과외 중 뭐가 나을까요?`, a: `아이 상태에 따라 다릅니다. 개념 구멍이 있거나 질문을 어려워하면 과외가, 경쟁 자극이 필요하면 학원 병행이 맞을 수 있습니다. 상담에서 객관적으로 안내해 드리며, 영어회화 등 다른 수업 문의도 가능합니다.` },
    { q: `선생님은 어떻게 정해지나요?`, a: `상담 내용과 ${grade.name} 학생 성향, ${place} 지역 일정을 종합해 안내해 드립니다. 수업 초반에 맞지 않는다고 느끼시면 부담 없이 다른 선생님과 만나보실 수 있습니다.` },
  ];
  gradeFaqPool.push(
    { q: `${grade.name} ${subj.name} 숙제는 얼마나 나오나요?`, a: `수업에서 혼자 성공한 유형 위주로, ${grade.name} 학생이 소화할 수 있는 분량을 냅니다. 숙제 수행 여부는 리포트로 공유되며, 습관이 잡히지 않은 학생은 분량 조절부터 시작합니다.` },
    { q: `${grade.name} 형제·자매와 함께 수업할 수 있나요?`, a: `학년과 진도가 비슷하면 함께 수업이 가능하고, 다르면 시간대를 이어서 잡아 이동 부담을 줄여드립니다. 상담 시 말씀해 주세요.` },
  );
  const gradeFaqs = rotate(gradeFaqPool, pageHash(sd + '#gfaq') % gradeFaqPool.length).slice(0, 6);
  const gSiblings = rotate(sgg.list.filter(d => !dong || d[0] !== dong.name), pageHash(sd + '#gsib')).slice(0, 10);
  schoolIndex();
  const gSggCode5 = sgg.list[0][1].slice(0, 5);
  const gSchools = rotate(SCHOOLS.filter(s => s[2].startsWith(gSggCode5) && s[1] === grade.kind), pageHash(sd + '#gsch')).slice(0, 10);

  const crumbItems = [
    { name: '홈', url: '/' },
    { name: '지역별수업', url: '/regions' },
    { name: sido.full, url: `/${U(sido.key)}` },
    { name: sgg.disp, url: parentPath },
  ];
  if (dong) crumbItems.push({ name: dong.name, url: basePath });
  crumbItems.push({ name: `${subj.name}과외`, url: subjPath });
  crumbItems.push({ name: `${grade.name}` });

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Service',
    serviceType: `${grade.name} ${subj.name} 과외`, name: h1, description: desc,
    areaServed: { '@type': 'Place', name: `${sido.full} ${sgg.disp}${dong ? ' ' + dong.name : ''}` },
    audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: `${grade.name}학생` },
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.origin }, url,
  };
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      ...probs.map(p2 => ({ '@type': 'Question', name: `${grade.name} ${subj.name}: ${p2.q}`, acceptedAnswer: { '@type': 'Answer', text: String(p2.a).split('{p}').join(place) } })),
      ...lfs.map(x => ({ '@type': 'Question', name: `${x.q} — ${grade.name} ${subj.name} 과외 수업에서 어떻게 해결하나요?`, acceptedAnswer: { '@type': 'Answer', text: String(x.how[0]).split('{p}').join(place) } })),
      ...gradeFaqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    ],
  };
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbItems.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, ...(c.url ? { item: SITE.origin + c.url } : {}) })),
  };

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${subj.emoji} ${sido.full} ${sgg.disp} · ${grade.name}</span>
<h1>${esc(h1)}<br><span style="color:var(--blue)">1:1 맞춤 수업</span></h1>
<p class="lead">${pick([
  `${esc(place)} ${grade.name} 학생을 위한 ${subj.name} 수업입니다. ${grade.name} 시기에 꼭 잡아야 할 것부터 순서대로, 아이 속도에 맞춰 진행합니다.`,
  `${grade.name} ${J(subj.name, '은', '는')} 지금 무엇에 집중하느냐가 다음 단계를 결정합니다. ${esc(place)} 인근 선생님이 우리 아이에게 맞는 출발점을 잡아드립니다.`,
  `${esc(place)}에서 ${grade.name} ${subj.name} 선생님을 찾고 계신가요? 학원과 과외 중 무엇이 맞을지부터 무료 상담에서 함께 판단해 드립니다.`,
], sd, 40)}</p>
<div class="cta-row"><a href="#contact" class="btn btn-primary">무료 상담 받기 →</a><a href="${subjPath}" class="btn btn-ghost">${esc(place)} ${subj.name}과외 전체</a></div>
<div class="stat-row">
<div class="stat"><div class="n">${grade.name}</div><div class="l">전문 커리큘럼</div></div>
<div class="stat"><div class="n">1:1</div><div class="l">맞춤 수업</div></div>
<div class="stat"><div class="n">무료</div><div class="l">상담</div></div>
</div>
</div></section>

${photoTag(sd, `${place} ${grade.name} ${subj.name} 공부하는 학생`)}

<section><div class="wrap">
<span class="sec-tag">수업 방식</span>
<h2>${esc(place)} ${grade.name} ${subj.name}, 이렇게 수업해요</h2>
<div class="grid g4">
<div class="step"><div class="n">1</div><h3>상담신청</h3><p>${pick([`${grade.name} ${subj.name} 고민을 남겨주시면 연락드려요.`, `현재 상태와 목표를 알려주시면 검토 후 안내드립니다.`, `무엇이 막혀 있는지 편하게 말씀해 주세요.`], sd, 90)}</p></div>
<div class="step"><div class="n">2</div><h3>선생님 안내</h3><p>${pick([`${grade.name} 지도 경험이 있는 ${esc(place)} 선생님을 연결해요.`, `상담 내용과 아이 성향에 맞는 선생님을 안내해 드립니다.`, `${esc(place)} 지역 방문·화상 가능한 선생님을 찾아드려요.`], sd, 91)}</p></div>
<div class="step"><div class="n">3</div><h3>무료 모의수업</h3><p>${pick([`선생님과 30분 정도 ${subj.name} 수업을 해봅니다.`, `30분 정도, 실제 수업 방식으로 진행합니다.`, `짧게 30분, 수업이 맞는지 확인하는 자리입니다.`], sd, 92)}</p></div>
<div class="step"><div class="n">4</div><h3>수업 결정</h3><p>${pick([`받아보고 시작 여부를 정하시면 됩니다.`, `시작하시면 매주 학습 리포트를 보내드립니다.`, `맞지 않으면 다른 선생님과 다시 만나보실 수 있습니다.`], sd, 93)}</p></div>
</div>
</div></section>

${gradeGuide ? `<section><div class="wrap">
<span class="sec-tag">${grade.name} 공부법</span>
<h2>${esc(place)} ${grade.name} ${subj.name}, 지금 이렇게 공부해야 합니다</h2>
${gSiblings.length ? `<p class="sub" style="max-width:760px">${esc(place)}뿐 아니라 인접한 ${gSiblings.slice(0, 3).map(d => esc(d[0])).join(', ')}의 ${grade.name} 학생들도 같은 방식으로 수업을 받고 있습니다.</p>` : ''}
${g ? `<p class="sub" style="max-width:760px">${fill(pick(g.intro, sd, 94))}</p>` : ''}
<div class="faq"><h3>${esc(gradeGuide.t)}</h3><p style="margin-top:6px">${fill(pick(gradeGuide.b, sd, 41))}</p></div>
</div></section>` : ''}

${probs.length ? `<section><div class="wrap">
<span class="sec-tag">자주 겪는 어려움</span>
<h2>${grade.name} ${subj.name} 공부에서 이런 고민 있지 않나요?</h2>
${probs.map(x => `<div class="faq"><h3>"${esc(x.q)}"</h3><p>${fill(x.a)}</p></div>`).join('')}
</div></section>` : ''}

${lfs.length ? `<section><div class="wrap">
<span class="sec-tag">수업 진행</span>
<h2>${esc(place)} ${grade.name} ${subj.name} 과외, 고민별로 이렇게 수업을 이끌어갑니다</h2>
${lfs.map((x, i) => `<div class="faq"><h3>"${esc(x.q)}"</h3><p><strong>수업에서는 이렇게 합니다.</strong> ${fill(pick(x.how, sd, 42 + i))}</p></div>`).join('')}
</div></section>` : ''}

${(() => {
  const sgd = SCHOOL_GUIDE[grade.kind];
  if (!sgd) return '';
  const sgSel = sgd[pageHash(sd + '#sg') % sgd.length];
  return `<section><div class="wrap">
<span class="sec-tag">${grade.name} 내신 관리</span>
<h2>${esc(place)} ${grade.name} 학생의 학교 공부 관리법</h2>
<div class="faq"><h3>${esc(sgSel[0])}</h3><p style="margin-top:6px">${esc(pick(sgSel[1], sd, 99))}</p></div>
</div></section>`;
})()}

${(() => {
  const icPool = IMPROVE_CASES[subj.slug] || [];
  if (!icPool.length) return '';
  const c = icPool[pageHash(sd + '#ic') % icPool.length];
  return `<section><div class="wrap">
<span class="sec-tag">성적향상 플랜</span>
<h2>${esc(place)} ${grade.name} ${subj.name} 성적향상 플랜 예시</h2>
<div class="faq"><h3>${esc(c.t)}</h3><p style="margin-top:6px"><b>시작:</b> ${esc(c.s)}</p><p style="margin-top:6px"><b>수업 전개:</b> ${esc(pick(c.p, sd, 121))}</p><p style="margin-top:6px"><b>목표:</b> ${esc(c.g)}</p></div>
<p class="sub" style="max-width:760px;font-size:14px;margin-top:10px">결과는 학생의 출발점과 학습량에 따라 달라집니다. 상담에서 ${grade.name} 학생 맞춤 플랜을 받아보세요.</p>
</div></section>`;
})()}

${g ? `<section><div class="wrap">
<span class="sec-tag">학습 루틴</span>
<h2>${grade.name} ${subj.name} 주간 루틴과 시험 대비</h2>
<div class="faq" style="margin-bottom:14px"><h3>평소 주간 루틴</h3><p style="margin-top:6px">${fill(pick(g.routine, sd, 43))}</p></div>
<div class="faq"><h3>시험 4주 대비 플랜</h3><p style="margin-top:6px">${fill(pick(g.exam, sd, 44))}</p></div>
</div></section>` : ''}

${g ? `<section><div class="wrap">
<span class="sec-tag">성적대별</span>
<h2>${esc(place)} ${grade.name} ${subj.name}, 지금 성적대에 맞는 접근법</h2>
<div class="faq"><p style="margin-top:6px">${fill(pick(g.levels, sd, 45))}</p></div>
</div></section>` : ''}

${g ? `<section><div class="wrap">
<span class="sec-tag">과외 활용법</span>
<h2>${[`${esc(place)} ${grade.name} ${subj.name} 과외로 도움받는 방법`, `${esc(place)} ${grade.name} ${subj.name} 과외는 이렇게 진행됩니다`][pageHash(sd + '#h2e') % 2]}</h2>
<p class="sub" style="max-width:760px">${fill(pick(g.help, sd, 46))}</p>
<div class="card" style="max-width:760px"><h3>💡 ${grade.name} 학부모님께 드리는 팁</h3><p style="margin-top:8px">${fill(pick(g.parent, sd, 47))}</p></div>
</div></section>` : ''}

${faqBlock(gradeFaqs)}

<section><div class="wrap">
<span class="sec-tag">다른 학년</span>
<h2>${esc(place)} 다른 학년 ${subj.name}과외</h2>
<div class="linkcol">
<a href="${subjPath}">${esc(place)} ${subj.name}과외 (전체 학년)</a>
${GRADE_LEVELS.filter(gr => gr.slug !== grade.slug).map(gr => `<a href="${subjPath}/${gr.slug}">${esc(place)} ${gr.name} ${subj.name}과외</a>`).join('')}
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">다른 과목</span>
<h2>${esc(place)} ${grade.name} 다른 과목 과외</h2>
<div class="linkcol">
${SUBJECTS.filter(s => s.slug !== subj.slug).map(s => `<a href="${basePath}/${s.slug}/${grade.slug}">${esc(place)} ${grade.name} ${s.name}과외</a>`).join('')}
</div>
</div></section>

${gSiblings.length ? `<section><div class="wrap">
<span class="sec-tag">주변 지역</span>
<h2>${esc(sgg.disp)} 다른 지역 ${grade.name} ${subj.name}과외</h2>
<div class="linkcol">
${gSiblings.map(d => `<a href="${parentPath}/${d[3]}/${subj.slug}/${grade.slug}">${esc(d[0])} ${grade.name} ${subj.name}과외</a>`).join('')}
</div>
</div></section>` : ''}

${gSchools.length ? `<section><div class="wrap">
<span class="sec-tag">인근 학교</span>
<h2>${esc(sgg.disp)} ${grade.name === '초등' ? '초등학교' : grade.name === '중등' ? '중학교' : '고등학교'} ${subj.name} 내신</h2>
<div class="linkcol">
${gSchools.map(s => `<a href="/schools/${s[4]}/${subj.slug}">${esc(s[0])} ${subj.name} 내신</a>`).join('')}
</div>
</div></section>` : ''}

${ctaBlock(`${place} ${grade.name}`)}`;

  return page({ title, desc, canonical: url, crumb: crumbs(crumbItems), body, jsonld: [jsonld, faqLd, crumbLd], img: photoUrl(sd) });
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
<div class="cta-row"><a href="#contact" class="btn btn-primary">무료 상담 받기 →</a></div>
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
${sgg.list.map(d => `<a href="${base}/${d[3]}/math">${esc(d[0])} 과외</a>`).join('')}
</div>
</div></section>

${(() => {
  const hsd = sido.key + sgg.key + '#hub';
  const picked = rotate(SUBJECTS, pageHash(hsd) % SUBJECTS.length).slice(0, 3);
  const hFill = s => esc(String(s).split('{p}').join(sgg.disp));
  return picked.map((sj, pi) => {
    const hg = GUIDES[sj.slug];
    if (!hg) return '';
    const gsel = rotate(hg.grades, pageHash(hsd + sj.slug) % hg.grades.length).slice(0, 2);
    return `<section><div class="wrap">
<span class="sec-tag">교육정보</span>
<h2>${esc(sgg.disp)} ${sj.name} 공부, 이렇게 시작하세요</h2>
<p class="sub" style="max-width:760px">${hFill(pick(hg.intro, hsd + sj.slug, 80 + pi))}</p>
${gsel.map((x, i) => `<div class="faq" style="margin-bottom:14px"><h3>${esc(x.t)}</h3><p style="margin-top:6px">${hFill(pick(x.b, hsd + sj.slug, 82 + i))}</p></div>`).join('')}
${rotate(hg.problems, pageHash(hsd + sj.slug + '#p')).slice(0, 3).map(px => `<div class="faq" style="margin-bottom:14px"><h3>"${esc(px.q)}"</h3><p>${hFill(px.a)}</p></div>`).join('')}
<div class="card" style="max-width:760px"><h3>💡 학부모님께 드리는 팁</h3><p style="margin-top:8px">${hFill(pick(hg.parent, hsd + sj.slug, 85 + pi))}</p></div>
</div></section>`;
  }).join('');
})()}

${faqBlock(rotate([
  { q: `${sgg.disp}에서는 어떤 과목 수업이 가능한가요?`, a: `수학, 영어, 국어, 과학, 사회, 논술 전 과목이 가능합니다. 여러 과목을 함께 신청하면 일정을 맞춰 안내해 드리고, 영어회화 등 다른 수업 문의도 가능합니다.` },
  { q: `${sgg.disp} 전 지역 방문 수업이 되나요?`, a: `네, ${sgg.disp} ${sgg.list.length}개 지역 모두 방문 수업과 화상 수업이 가능합니다. 지역과 일정에 맞춰 선생님을 안내해 드려요.` },
  { q: `학원과 과외 중 무엇이 나을까요?`, a: `개념 구멍이 있거나 질문을 어려워하는 학생은 1:1 과외가, 경쟁 자극이 필요한 상위권은 학원 병행이 맞을 수 있습니다. 상담에서 객관적으로 안내해 드립니다.` },
  { q: `상담 후 꼭 시작해야 하나요?`, a: `아닙니다. 상담과 무료 모의수업으로 아이에게 맞는 수업인지 먼저 확인하시고, 그 뒤에 시작 여부를 편하게 결정하시면 됩니다.` },
], pageHash(sido.key + sgg.key + '#hfaq') % 5).slice(0, 5))}

${ctaBlock(sgg.disp)}`;

  return page({
    title, desc, canonical: url,
    crumb: crumbs([
      { name: '홈', url: '/' },
      { name: '지역별수업', url: '/regions' },
      { name: sido.full, url: `/${U(sido.key)}` },
      { name: sgg.disp },
    ]),
    body,
    img: photoUrl('region-hub') });
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
<div class="cta-row"><a href="#contact" class="btn btn-primary">무료 상담 받기 →</a></div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">시군구</span><h2>${esc(sido.full)} 시군구별 과외</h2>
<p class="sub">지역을 선택해 주세요.</p>
<div class="linkcol">
${sggs.map(([k, v]) => `<a href="/${U(sido.key)}/${U(k)}">${esc(v.d)} 과외</a>`).join('')}
</div>
</div></section>

${(() => {
  const hsd = sido.key + '#sidohub';
  const picked = rotate(SUBJECTS, pageHash(hsd) % SUBJECTS.length).slice(0, 3);
  const hFill = s => esc(String(s).split('{p}').join(sido.full));
  return picked.map((sj, pi) => {
    const hg = GUIDES[sj.slug];
    if (!hg) return '';
    const gsel = rotate(hg.grades, pageHash(hsd + sj.slug) % hg.grades.length).slice(0, 2);
    return `<section><div class="wrap">
<span class="sec-tag">교육정보</span>
<h2>${esc(sido.full)} ${sj.name} 공부법 안내</h2>
<p class="sub" style="max-width:760px">${hFill(pick(hg.intro, hsd + sj.slug, 86 + pi))}</p>
${gsel.map((x, i) => `<div class="faq" style="margin-bottom:14px"><h3>${esc(x.t)}</h3><p style="margin-top:6px">${hFill(pick(x.b, hsd + sj.slug, 88 + i))}</p></div>`).join('')}
${rotate(hg.problems, pageHash(hsd + sj.slug + '#p')).slice(0, 3).map(px => `<div class="faq" style="margin-bottom:14px"><h3>"${esc(px.q)}"</h3><p>${hFill(px.a)}</p></div>`).join('')}
<div class="card" style="max-width:760px"><h3>💡 학부모님께 드리는 팁</h3><p style="margin-top:8px">${hFill(pick(hg.parent, hsd + sj.slug, 89 + pi))}</p></div>
</div></section>`;
  }).join('');
})()}

${faqBlock([
  { q: `${sido.full} 전 지역에서 수업이 가능한가요?`, a: `네, ${sido.full} ${sggs.length}개 시군구 전 지역에서 방문 수업 또는 화상 수업이 가능합니다. 지역과 일정에 맞춰 선생님을 안내해 드려요.` },
  { q: `어떤 과목 수업이 가능한가요?`, a: `수학, 영어, 국어, 과학, 사회, 논술 전 과목이 가능하고, 영어회화 등 다른 수업 문의도 가능합니다. 학원 병행 여부까지 상담에서 함께 안내해 드립니다.` },
  { q: `상담 후 꼭 시작해야 하나요?`, a: `아닙니다. 상담과 무료 모의수업으로 아이에게 맞는 수업인지 먼저 확인하시고, 그 뒤에 시작 여부를 편하게 결정하시면 됩니다.` },
  { q: `선생님이 마음에 들지 않으면 어떻게 하나요?`, a: `수업 초반에 맞지 않는다고 느끼시면 다른 선생님과 만나보실 수 있습니다. 부담 없이 말씀해 주세요.` },
])}

${ctaBlock(sido.full)}`;

  return page({
    title, desc, canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '지역별수업', url: '/regions' }, { name: sido.full }]),
    body,
    img: photoUrl('region-hub') });
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
    img: photoUrl('region-hub') });
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
${SUBJECTS.map(s => `<a class="card" href="/subjects/${s.slug}"><div class="ic">${s.emoji}</div><h3>${s.name}과외</h3><p>${esc(s.desc)}</p></a>`).join('')}
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">과목 선택 가이드</span>
<h2>어떤 과목부터 시작해야 할까요?</h2>
<p class="sub">과목 선택이 고민이라면 이 세 가지 기준으로 판단해 보세요.</p>
<div class="grid g3">
<div class="card"><div class="ic">🚨</div><h3>시험이 급하다면</h3><p>다가오는 내신에서 가장 위험한 과목부터 시작하세요. 시험 4주 전이라면 한 과목에 집중하는 것이 두 과목을 얕게 하는 것보다 결과가 좋습니다.</p></div>
<div class="card"><div class="ic">🏗️</div><h3>장기전이라면</h3><p>수학과 영어부터 잡는 것이 정석입니다. 두 과목은 실력이 쌓이는 데 가장 오래 걸리는 계단식 과목이라, 일찍 시작할수록 유리합니다.</p></div>
<div class="card"><div class="ic">🧭</div><h3>잘 모르겠다면</h3><p>상담에서 전 과목 상태를 확인하고 우선순위를 함께 정해드립니다. 막연한 불안보다 정확한 확인이 먼저입니다.</p></div>
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">학년별 추천</span>
<h2>학년별로 이런 조합을 추천해요</h2>
<div class="grid g3">
<div class="card"><div class="ic">🎒</div><h3>초등학생</h3><p>수학 연산·독서 습관이 최우선입니다. 수학 또는 국어 1과목으로 시작해 공부 습관을 만들고, 영어는 흥미 위주로 병행하는 조합이 좋습니다.</p></div>
<div class="card"><div class="ic">📚</div><h3>중학생</h3><p>수학+영어 조합이 가장 많습니다. 고등 과정의 바탕이 되는 두 과목의 개념을 이 시기에 완성해야 고등에서 선택지가 넓어집니다.</p></div>
<div class="card"><div class="ic">🎯</div><h3>고등학생</h3><p>내신 등급이 흔들리는 과목 1~2개에 집중 투자하세요. 수능 선택과목 전략까지 고려해 상담에서 우선순위를 잡아드립니다.</p></div>
</div>
</div></section>

${faqBlock([
  { q: '여러 과목을 동시에 수강할 수 있나요?', a: '가능합니다. 과목별로 선생님을 각각 안내하거나, 가능한 경우 한 선생님이 두 과목을 함께 진행할 수도 있습니다. 일정은 조율해서 맞춰드려요.' },
  { q: '중간에 과목을 바꿀 수 있나요?', a: '네, 시험 기간에는 급한 과목으로 잠시 전환했다가 돌아오는 것도 가능합니다. 학생 상황에 맞춰 유연하게 운영합니다.' },
  { q: '과목마다 선생님이 다른가요?', a: '기본적으로 과목 전문 선생님을 안내해 드립니다. 전공과 지도 경험을 확인한 선생님이 해당 과목을 맡아요.' },
  { q: '어떤 과목이 개설되어 있나요?', a: '수학, 영어, 국어, 과학, 사회, 논술 6개 과목을 초등부터 고등까지 운영합니다. 이 외 과목이 필요하면 상담에서 문의해 주세요.' },
])}

${ctaBlock('어떤 과목이든')}`;
  return page({
    title: `과목별 과외 | ${SITE.name}`,
    desc: '수학·영어·국어·과학·사회·논술 등 과목별 초·중·고 1:1 맞춤 과외.',
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '과목수업' }]),
    body,
    img: photoUrl('region-hub') });
}

function subjectNationalPage(subj, url) {
  const entries = Object.entries(SIDO);
  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${subj.emoji} 과목수업</span>
<h1>${subj.name}과외</h1>
<p class="lead">${esc(subj.desc)}</p>
<div class="cta-row"><a href="#contact" class="btn btn-primary">무료 상담 받기 →</a></div>
</div></section>
${photoTag('subject-' + subj.slug, `${subj.name} 공부`)}

<section><div class="wrap">
<span class="sec-tag">수업 방식</span>
<h2>${subj.name}과외, 이렇게 수업해요</h2>
<div class="grid g4">
<div class="step"><div class="n">1</div><h3>상담신청</h3><p>학생의 학년과 ${subj.name} 고민, 목표를 남겨주시면 연락드립니다.</p></div>
<div class="step"><div class="n">2</div><h3>선생님 안내</h3><p>상담 내용과 아이 성향, 지역 일정에 맞는 선생님을 연결합니다.</p></div>
<div class="step"><div class="n">3</div><h3>무료 모의수업</h3><p>선생님과 30분 정도 ${subj.name} 수업을 해봅니다.</p></div>
<div class="step"><div class="n">4</div><h3>수업 결정</h3><p>받아보신 뒤 시작 여부를 정하시면 됩니다. 시작하시면 매주 학습 리포트를 보내드립니다.</p></div>
</div>
</div></section>

${guideBlock(subj, '우리 동네', 'national', null)}

${(() => {
  const ng = GUIDES[subj.slug];
  if (!ng) return '';
  const extra = rotate(ng.problems, pageHash('national' + subj.slug + '#probs') % ng.problems.length).slice(5);
  if (!extra.length) return '';
  return `<section><div class="wrap">
<span class="sec-tag">더 많은 고민</span>
<h2>${subj.name} 공부, 이런 고민도 자주 받아요</h2>
${extra.map(px => `<div class="faq"><h3>"${esc(px.q)}"</h3><p>${esc(String(px.a).split('{p}').join('우리 동네'))}</p></div>`).join('')}
</div></section>`;
})()}

<section><div class="wrap">
<span class="sec-tag">지역별</span><h2>지역별 ${subj.name}과외</h2>
<p class="sub">우리 지역을 선택해 보세요.</p>
<div class="linkcol">
${entries.map(([k, v]) => `<a href="/${U(k)}">${esc(v.full)} ${subj.name}과외</a>`).join('')}
</div>
</div></section>

${faqBlock([
  { q: `${subj.name} 과외는 몇 학년부터 받을 수 있나요?`, a: `초등학생부터 고등학생까지 모두 가능합니다. 학년과 현재 실력에 따라 커리큘럼을 다르게 구성하며, 상담으로 출발점을 정합니다.` },
  { q: `${subj.name} 학원과 과외 중 무엇이 나을까요?`, a: `개념 구멍이 있거나 질문을 어려워하는 학생은 1:1 과외가, 경쟁 자극이 필요한 상위권은 학원 병행이 맞을 수 있습니다. 상담에서 객관적으로 안내해 드리며, 영어회화 등 다른 수업 문의도 가능합니다.` },
  { q: `방문 수업과 화상 수업 중 선택할 수 있나요?`, a: `네, 전국 어디서나 방문 수업(지역에 따라 상이)과 화상 수업 모두 가능합니다. 학생 일정과 성향에 맞춰 상담에서 정하시면 됩니다.` },
  { q: `선생님이 마음에 들지 않으면 어떻게 하나요?`, a: `수업 초반에 맞지 않는다고 느끼시면 다른 선생님과 만나보실 수 있습니다. 부담 없이 말씀해 주세요.` },
  { q: `${subj.name} 시험 기간에만 짧게 수업받을 수 있나요?`, a: `시험 기간에만 하는 단기 수업은 운영하지 않습니다. 실력은 이어서 쌓일 때 성적으로 연결되기 때문입니다. 정규 수업으로 진행하되 시험 기간에는 횟수를 늘려 대비합니다.` },
])}

${ctaBlock(`${subj.name} 과외`)}`;
  return page({
    title: `${subj.name}과외 | 초·중·고 1:1 맞춤 - ${SITE.name}`,
    desc: `${subj.name}과외. ${subj.desc} 전국 어디서나 상담 후 아이에게 맞는 선생님을 연결해 드립니다.`,
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '과목수업', url: '/subjects' }, { name: `${subj.name}과외` }]),
    body,
    img: photoUrl('subject-' + subj.slug) });
}

/* ---------------- 페이지: 준비중 (학교별/기타) ---------------- */

function comingSoonPage(kind, url) {
  const map = {
    'schools': { emoji: '🏫', h1: '학교별수업',
      lead: '우리 학교 시험 범위와 출제 유형에 맞춘 내신 대비 수업을 준비하고 있어요.' },
    'others': { emoji: '🎨', h1: '기타수업',
      lead: '논술·면접·방학 특강 등 목표에 맞춘 특별 수업을 준비하고 있어요.' },
  };
  const v = map[kind];
  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${v.emoji} ${v.h1}</span>
<h1>${v.h1} 준비 중이에요</h1>
<p class="lead">${v.lead} 먼저 상담을 남겨주시면 오픈 시 가장 먼저 안내해 드릴게요.</p>
<div class="cta-row"><a href="#contact" class="btn btn-primary">미리 상담 남기기 →</a><a href="/regions" class="btn btn-ghost">지역별수업 보기</a></div>
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
    `${origin}/sitemap-schools-cho.xml`,
    `${origin}/sitemap-schools-jung.xml`,
    `${origin}/sitemap-schools-go.xml`,
    ...Object.keys(SIDO).map(k => `${origin}/sitemap-${U(k)}.xml`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map(u => `<sitemap><loc>${u}</loc></sitemap>`).join('\n')}
</sitemapindex>`;
}

function sitemapMain(origin) {
  return xmlUrlset([
    `${origin}/`, `${origin}/regions`, `${origin}/subjects`,
    ...SUBJECTS.map(s => `${origin}/subjects/${s.slug}`),
    `${origin}/schools`,
    ...Object.keys(SIDO).map(k => `${origin}/schools/region/${k}`),
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
    for (const subj of SUBJECTS) {
      urls.push(`${base}/${subj.slug}`);
      for (const gr of GRADE_LEVELS) urls.push(`${base}/${subj.slug}/${gr.slug}`);
    }
    for (const d of v.l) {
      for (const subj of SUBJECTS) {
        urls.push(`${base}/${d[3]}/${subj.slug}`);
        for (const gr of GRADE_LEVELS) urls.push(`${base}/${d[3]}/${subj.slug}/${gr.slug}`);
      }
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
<div class="cta-row"><a href="/regions" class="btn btn-primary">지역별수업 보기</a><a href="/" class="btn btn-ghost">홈으로</a></div>
</div></section>`,
  }), 404);
}


/* ---------------- 홈페이지 메타 주입 ---------------- */

let HOME_CACHE = null;
function homeWithMeta(origin) {
  if (HOME_CACHE) return HOME_CACHE;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Organization',
      name: SITE.name, url: origin, description: SITE.desc,
      areaServed: { '@type': 'Country', name: '대한민국' } },
    { '@context': 'https://schema.org', '@type': 'WebSite',
      name: SITE.name, url: origin, inLanguage: 'ko' },
  ];
  const meta = [
    `<meta name="description" content="${SITE.desc}. 상담 후 아이에게 맞는 선생님을 안내해 드립니다.">`,
    `<link rel="canonical" href="${origin}/">`,
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    SITE.verifyNaver ? `<meta name="naver-site-verification" content="${SITE.verifyNaver}">` : '',
    SITE.verifyGoogle ? `<meta name="google-site-verification" content="${SITE.verifyGoogle}">` : '',
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${SITE.name} · 초·중·고 맞춤 과외">`,
    `<meta property="og:description" content="${SITE.desc}">`,
    `<meta property="og:url" content="${origin}/">`,
    `<meta property="og:site_name" content="${SITE.name}">`,
    `<meta property="og:locale" content="ko_KR">`,
    `<link rel="icon" type="image/png" href="/favicon.png">`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<meta property="og:image" content="${origin}${photoUrl('home')}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="${origin}/rss.xml">`,
    ...ld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`),
  ].filter(Boolean).join('\n');
  HOME_CACHE = HOME_HTML.replace('</head>', meta + '\n</head>');
  return HOME_CACHE;
}



/* ================= 학교별 수업 ================= */

// 학교 슬러그 -> 레코드, 법정동코드 -> 지역 경로 매핑 (지연 생성)
let SCHOOL_BY_SLUG = null;
let DONG_BY_CODE = null;

function schoolIndex() {
  if (SCHOOL_BY_SLUG) return;
  SCHOOL_BY_SLUG = new Map();
  for (const s of SCHOOLS) SCHOOL_BY_SLUG.set(s[4], s);
  DONG_BY_CODE = new Map();
  for (const [sidoKey, sv] of Object.entries(SIDO)) {
    for (const [sggKey, gv] of Object.entries(sv.sgg)) {
      for (const d of gv.l) {
        DONG_BY_CODE.set(d[1], { sido: sidoKey, sidoFull: sv.full, sgg: sggKey, sggDisp: gv.d, dong: d[0], dongSlug: d[3] });
      }
    }
  }
}

function schoolRegion(code) {
  schoolIndex();
  return DONG_BY_CODE.get(code) || DONG_BY_CODE.get(code.slice(0, 8) + '00') || null;
}

const KIND_LABEL = { '초': '초등학교', '중': '중학교', '고': '고등학교' };

// 학교급별 안내 콘텐츠
const SCHOOL_GUIDE = {
  '초': [
    ['학교 진도에 맞춘 기초 다지기', ['초등 시기는 학교 진도를 따라가는 것 자체보다, 그 진도를 소화할 기초 체력(연산·문해력)을 만드는 것이 핵심입니다. 같은 단원을 배워도 학교와 선생님에 따라 진도 속도와 강조점이 다르기 때문에, 아이가 다니는 학교의 실제 진도표를 기준으로 이번 주 배운 내용을 그 주에 소화하는 리듬을 만들어 드립니다. 학교 수업에서 손을 들 수 있는 아이가 되는 것이 초등 과외의 가장 큰 성과입니다.', '초등 시기의 과외는 진도 관리가 아니라 소화력 관리입니다. 같은 단원도 학교와 담임 선생님에 따라 속도와 강조점이 다르므로, 이 학교의 실제 진도를 기준으로 그 주에 배운 것을 그 주에 소화하는 리듬을 만듭니다. 목표는 단순합니다. 학교 수업 시간에 자신 있게 손을 드는 아이가 되는 것. 그 자신감이 이후 모든 학습의 토대가 됩니다.']],
    ['단원평가·수행평가 관리', ['초등학교는 중간·기말고사 대신 단원평가와 수행평가로 학습 상태가 드러납니다. 단원평가 시기에 맞춰 해당 단원을 정리하고, 수행평가도 함께 챙깁니다. 결과보다 준비하는 습관을 만드는 것이 이후 학습의 기초가 됩니다.', '초등학교는 지필 시험 대신 단원평가와 수행평가로 학습 상태가 드러나는 구조입니다. 단원평가 일정에 맞춰 해당 단원을 정리해주고, 수행평가도 함께 관리합니다. 스스로 준비해 해내는 경험의 반복이 이후 학습의 기초가 됩니다.']],
    ['중학교 준비', ['초등 고학년이라면 중학교 첫 시험에서 당황하지 않을 준비가 필요합니다. 자유학기제 이후 처음 만나는 지필고사, 서술형 답안 작성, 시험 계획 세우기 같은 것들은 미리 연습한 아이와 아닌 아이의 차이가 큽니다. 초6 겨울방학을 활용한 중등 선행은 진도 빼기가 아니라 중학교 공부 방식에 적응하는 방향으로 설계해 드립니다.', '초등 고학년에게는 중학교 적응 준비가 필요합니다. 처음 만나는 지필고사, 서술형 답안, 시험 계획 세우기는 미리 연습한 아이와 아닌 아이의 격차가 큽니다. 초6 겨울방학의 선행은 진도를 빼는 것이 아니라 중학교 공부 방식 자체에 적응하는 방향으로 설계하는 것이 옳습니다.']],
  ],
  '중': [
    ['우리 학교 내신 출제 스타일 분석', ['같은 교과서를 써도 학교마다 시험이 완전히 다릅니다. 서술형 비중, 교과서 밖 자료 출제 여부, 수행평가 반영 비율까지 학교별로 다르기 때문에, 이 학교의 최근 기출과 출제 경향을 기준으로 시험 대비를 설계합니다. 학교 선생님이 수업 중 강조한 부분과 프린트 자료를 1순위 교재로 삼는 것이 내신 고득점의 원칙입니다.', '중학교 내신의 출발점은 이 학교 시험의 생김새를 아는 것입니다. 서술형 비중, 교과서 밖 자료 출제, 수행 반영 비율이 학교마다 다르므로 최근 기출과 출제 경향을 기준으로 대비를 설계하고, 수업 중 선생님이 강조한 내용과 프린트를 1순위 교재로 삼습니다. 이것이 내신 고득점의 변하지 않는 원칙입니다.']],
    ['시험 4주 플랜 운영', ['중학교 내신은 시험 4주 전부터의 운영이 등수를 결정합니다. 4주 전 범위 확정과 개념 정리, 3주 전 문제 풀이, 2주 전 학교 기출·예상 문제, 마지막 주 오답 반복의 사이클을 과목별로 겹치지 않게 배치해 드립니다. 여러 과목 시험이 몰리는 시험 주간에 어떤 순서로 공부할지까지 계획에 포함됩니다.', '내신 등수는 시험 4주 전의 운영이 결정합니다. 범위 확정과 개념 정리(4주 전), 문제 풀이(3주 전), 학교 기출·예상 문제(2주 전), 오답 반복(마지막 주)의 사이클을 과목별로 겹치지 않게 배치하고, 시험이 몰리는 주간의 과목별 공부 순서까지 계획에 넣어 드립니다.']],
    ['수행평가와 서술형까지', ['중학교 성적에서 수행평가 비중은 계속 커지고 있습니다. 지필 점수가 좋아도 수행에서 밀리면 등급이 내려가기 때문에 수행평가도 함께 관리합니다. 서술형 답안은 채점 기준에 맞춰 쓰는 훈련을 반복해 아는 만큼 점수로 연결되게 합니다.', '요즘 중학교 성적에서 수행평가의 비중은 무시할 수 없습니다. 지필을 잘 봐도 수행에서 밀리면 등급이 내려가므로 수행평가도 함께 챙깁니다. 서술형은 채점 기준에 맞춰 쓰는 훈련으로 아는 만큼 점수가 되게 만듭니다.']],
    ['고등 선택을 위한 준비', ['중3은 고등학교 선택과 고1 첫 내신 준비가 겹치는 시기입니다. 진학할 고등학교의 유형(일반고·특목고·자사고)에 따라 남은 기간의 공부 전략이 달라지므로, 진학 방향 상담과 함께 고등 과정 적응 준비(수학 선행의 적정 범위, 국어·영어 기초 체력)를 설계해 드립니다.', '중3은 갈림길의 시기입니다. 진학할 고등학교 유형(일반고·특목고·자사고)에 따라 남은 기간의 전략이 달라지므로 진학 방향 상담을 병행하고, 수학 선행의 적정 범위와 국어·영어 기초 체력 등 고등 과정 적응 준비를 함께 설계해 드립니다.']],
  ],
  '고': [
    ['내신 등급 방어 전략', ['고등 내신은 한 번의 시험이 등급으로 남아 대입까지 이어집니다. 이 학교의 시험 난도와 등급 커트라인 경향을 파악해, 학생의 현재 위치에서 등급을 올릴 수 있는 과목과 지켜야 할 과목을 구분해 전략을 짭니다. 모든 과목을 같은 힘으로 준비하는 것보다, 등급 변동 가능성이 큰 과목에 집중 투자하는 것이 결과적으로 유리합니다.', '고등 내신은 시험 하나하나가 등급으로 남아 대입까지 따라갑니다. 이 학교의 시험 난도와 등급 컷 경향을 파악한 뒤, 학생의 위치에서 올릴 수 있는 과목과 지켜야 할 과목을 구분합니다. 전 과목 균등 투자보다 등급 변동 가능성이 큰 과목에 힘을 싣는 것이 결과적으로 유리한 전략입니다.']],
    ['내신과 수능의 병행', ['고등 공부의 가장 큰 난제는 내신과 수능을 함께 잡는 것입니다. 시험 기간 4주는 내신에 완전히 집중하고, 그 외 기간은 수능형 실력(기출 분석, 취약 유형 훈련)을 쌓는 이중 트랙으로 연간 계획을 설계합니다. 학교 진도와 수능 범위가 어긋나는 구간은 과외에서 메워 드립니다.', '고등 공부의 최대 난제는 내신과 수능의 양립입니다. 시험 기간 4주는 내신에 전력하고 그 외 기간은 수능형 실력(기출 분석, 취약 유형)을 쌓는 이중 트랙으로 연간 계획을 짭니다. 학교 진도와 수능 범위가 어긋나는 구간은 수업에서 메워 드립니다.']],
    ['수행평가·생기부 관리', ['수시를 준비한다면 수행평가와 세특(세부능력 및 특기사항)이 성적만큼 중요합니다. 과목별 수행 일정을 함께 관리합니다. 정시 위주라면 반대로 수행에 쓰는 시간을 효율적으로 조절하는 것도 전략입니다.', '수시를 준비한다면 수행평가와 세특은 성적만큼 중요한 자산입니다. 과목별 수행 일정을 함께 관리합니다. 정시 중심이라면 반대로 수행에 쓰는 시간을 효율적으로 조절하는 것도 하나의 전략입니다.']],
    ['선택과목과 대입 전략', ['고1 말 선택과목 결정은 대입까지 영향을 주는 선택입니다. 학생의 강점(계산형·독해형·암기형)과 목표 전형에 맞춰 선택과목 조합을 상담하고, 선택 이후에는 해당 과목의 내신·수능 대비를 함께 설계합니다. 재학 중인 학교의 개설 과목 상황까지 고려해 현실적인 조합을 제안해 드립니다.', '고1 말의 선택과목 결정은 대입까지 영향을 주는 선택입니다. 학생의 강점 유형(계산형·독해형·암기형)과 목표 전형, 그리고 재학 중인 학교의 개설 과목 상황까지 고려해 현실적인 조합을 상담하고, 결정 이후에는 그 과목의 내신·수능 대비를 함께 설계합니다.']],
  ],
};

function searchSchools(q) {
  schoolIndex();
  const norm = s => s.toLowerCase().replace(/\s+/g, '');
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean).map(t => t.replace(/\s+/g, ''));
  if (!tokens.length) return [];
  const out = [];
  for (const s of SCHOOLS) {
    const [name, kind, code, region] = s;
    const reg = schoolRegion(code);
    const hay = norm(name + region + (reg ? reg.dong : ''));
    let ok = true;
    for (const t of tokens) if (!hay.includes(t)) { ok = false; break; }
    if (!ok) continue;
    const nn = norm(name);
    const score = nn.startsWith(tokens[0]) ? 0 : (nn.includes(tokens[0]) ? 1 : 2);
    out.push([score, s, reg]);
    if (out.length > 400) break;
  }
  out.sort((a, b) => a[0] - b[0] || a[1][0].localeCompare(b[1][0], 'ko'));
  return out.slice(0, 15).map(([, s, reg]) => ({
    n: s[0], k: s[1], r: s[3] + (reg && !s[3].includes(reg.dong) ? ' ' + reg.dong : ''), s: s[4],
  }));
}

/* ---- 학교 허브 (검색) ---- */
function schoolsHubPage(url) {
  const total = SCHOOLS.length.toLocaleString();
  const sidoLinks = Object.entries(SIDO).map(([k, v]) =>
    `<a class="chip" href="/schools/region/${k}">${esc(v.full)}</a>`).join('');
  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">🏫 학교별수업</span>
<h1>우리 학교 맞춤 내신 과외</h1>
<p class="lead">전국 ${total}개 초·중·고등학교의 시험 스타일에 맞춘 내신 대비 수업. 학교 이름이나 지역(동네)을 검색해 보세요.</p>
<div style="max-width:560px;position:relative">
  <input type="text" id="schoolQ" placeholder="학교 이름 또는 지역 검색 (예: 역삼, 분당구, 백현중)"
    style="width:100%;box-sizing:border-box;border:2px solid var(--blue);border-radius:16px;padding:16px 18px;font-size:16px;font-family:'Pretendard';outline:none;background:#fff;box-shadow:var(--shadow-soft)">
  <div id="schoolR" style="position:absolute;left:0;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:hidden;display:none;z-index:30;max-height:420px;overflow-y:auto"></div>
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">학교급별</span>
<h2>학교에 맞추면 내신이 달라집니다</h2>
<p class="sub">같은 교과서를 써도 학교마다 시험이 다릅니다. 우리 학교 기준으로 준비하세요.</p>
<div class="grid g3">
<div class="card"><div class="ic">🎒</div><h3>초등학교</h3><p>학교 진도에 맞춘 기초 다지기와 단원평가·수행평가 관리, 중학교 입학 준비까지.</p></div>
<div class="card"><div class="ic">📚</div><h3>중학교</h3><p>학교별 출제 스타일 분석, 시험 4주 플랜, 서술형·수행평가 대비.</p></div>
<div class="card"><div class="ic">🎯</div><h3>고등학교</h3><p>내신 등급 방어와 수능 병행 전략, 선택과목·생기부 관리까지.</p></div>
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">지역별 학교 찾기</span>
<h2>지역으로 학교 둘러보기</h2>
<p class="sub">시·도를 선택하면 등록된 학교 목록을 볼 수 있어요.</p>
<div class="chips">${sidoLinks}</div>
</div></section>

${faqBlock([
  { q: '우리 학교 기출문제를 갖고 계신가요?', a: '학교별 최근 출제 경향을 파악해 수업에 반영합니다. 학생이 가진 기출과 학교 프린트를 함께 분석해 이 학교 시험에 맞는 대비를 설계해 드려요.' },
  { q: '학교가 검색에 없으면 어떻게 하나요?', a: '분교나 신설 학교는 목록에 없을 수 있습니다. 무료 상담으로 학교명을 알려주시면 동일하게 맞춤 수업을 진행해 드립니다.' },
  { q: '같은 학교 학생을 여러 명 가르쳐 보셨나요?', a: '해당 학교 수업 경험이 있는 선생님이 지역에 계신 경우 우선 안내해 드립니다. 학교 시험 스타일을 아는 선생님이 붙으면 대비 효율이 크게 올라갑니다.' },
  { q: '전학 예정인데 미리 준비할 수 있나요?', a: '네, 전학 갈 학교 기준으로 진도와 출제 경향을 맞춰 미리 준비할 수 있습니다. 상담에서 전학 시기를 알려주세요.' },
])}

${ctaBlock('우리 학교 맞춤')}

<script>
(function(){
  var q=document.getElementById('schoolQ'), box=document.getElementById('schoolR'), timer=null;
  function badgeColor(k){ return k==='초' ? '#FFF3D6' : (k==='중' ? '#DFF7E9' : '#F0E9FF'); }
  function render(list){
    if(!list.length){ box.style.display='none'; box.innerHTML=''; return; }
    var h='';
    for(var i=0;i<list.length;i++){
      var it=list[i];
      h+='<a href="/schools/'+it.s+'" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid #F2F0E9;text-decoration:none;color:inherit">'
        +'<span style="flex-shrink:0;width:30px;height:30px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;background:'+badgeColor(it.k)+'">'+it.k+'</span>'
        +'<span><b style="font-size:15px">'+it.n+'</b><br><span style="font-size:12.5px;color:#5B6079">'+it.r+'</span></span></a>';
    }
    box.innerHTML=h; box.style.display='block';
  }
  q.addEventListener('input',function(){
    clearTimeout(timer);
    var v=q.value.trim();
    if(v.length<2){ box.style.display='none'; return; }
    timer=setTimeout(function(){
      fetch('/api/school-search?q='+encodeURIComponent(v))
        .then(function(r){return r.json()})
        .then(function(j){ render(j.list||[]) })
        .catch(function(){ box.style.display='none'; });
    },220);
  });
  document.addEventListener('click',function(e){ if(!box.contains(e.target)&&e.target!==q) box.style.display='none'; });
  q.addEventListener('focus',function(){ if(box.innerHTML) box.style.display='block'; });
})();
</script>`;
  return page({
    title: `학교별 과외 | 전국 ${total}개 초·중·고 내신 맞춤 - ${SITE.name}`,
    desc: `전국 ${total}개 초·중·고등학교의 출제 스타일에 맞춘 내신 대비 1:1 과외. 학교를 검색해 맞춤 수업을 확인하세요.`,
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '학교별수업' }]),
    body,
    img: photoUrl('schools-hub') });
}

/* ---- 시도별 학교 목록 ---- */
function schoolsRegionPage(sido, url) {
  schoolIndex();
  const mine = SCHOOLS.filter(s => s[3].startsWith(sido.full));
  const groups = {};
  for (const s of mine) {
    (groups[s[3]] = groups[s[3]] || []).push(s);
  }
  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'ko'));
  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">🏫 학교별수업</span>
<h1>${esc(sido.full)} 학교별 과외</h1>
<p class="lead">${esc(sido.full)} ${mine.length.toLocaleString()}개 초·중·고등학교의 내신 스타일에 맞춘 수업을 확인하세요.</p>
<div class="cta-row"><a href="/schools" class="btn btn-ghost">← 학교 검색으로</a><a href="#contact" class="btn btn-primary">무료 상담 받기</a></div>
</div></section>
${keys.map(k => `
<section style="padding:22px 0"><div class="wrap">
<h2 style="font-size:20px;margin-bottom:14px">${esc(k)} <span style="color:var(--ink-soft);font-size:14px;font-weight:600">(${groups[k].length}개교)</span></h2>
<div class="linkcol">
${groups[k].map(s => `<a href="/schools/${s[4]}">${esc(s[0])}</a>`).join('')}
</div>
</div></section>`).join('')}
${ctaBlock(sido.full + ' 학교')}`;
  return page({
    title: `${sido.full} 학교별 과외 | ${mine.length.toLocaleString()}개 학교 내신 맞춤 - ${SITE.name}`,
    desc: `${sido.full} ${mine.length.toLocaleString()}개 초·중·고등학교의 출제 스타일에 맞춘 내신 대비 1:1 과외.`,
    canonical: url,
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '학교별수업', url: '/schools' }, { name: sido.full }]),
    body,
    img: photoUrl('schools-hub') });
}

/* ---- 학교 상세 페이지 ---- */
function schoolPage(sc, url) {
  const [name, kind, code, region, slug] = sc;
  const reg = schoolRegion(code);
  const kindLabel = KIND_LABEL[kind];
  const title = `${name} 내신 대비 과외 | ${SITE.name}`;
  const desc = `${region} ${name} 학생을 위한 내신 맞춤 1:1 과외. 학교 출제 스타일에 맞춘 시험 대비와 수행평가 관리까지, 상담 후 아이에게 맞는 선생님을 연결해 드립니다.`;

  // 같은 지역(시군구) 다른 학교
  const near = rotate(SCHOOLS.filter(s => s[3] === region && s[4] !== slug), pageHash(code + slug + '#near')).slice(0, 16);
  // 지역 과외 링크
  const basePath = reg ? `/${reg.sido}/${reg.sgg}/${reg.dongSlug}` : null;

  const guide = SCHOOL_GUIDE[kind];
  const sdk = code + slug;
  const sh = pageHash(sdk);
  // 학교급에 맞는 과목별 심화 콘텐츠 (페이지마다 과목 조합·변형 상이)
  const sGrade = GRADE_BY_KIND[kind];
  const pl = reg ? reg.dong : region;
  const sFill = s => esc(String(s).split('{p}').join(pl));
  const subjSel = rotate(SUBJECTS, sh % SUBJECTS.length).slice(0, 4);
  const lfPool2 = LESSON_FLOW[subjSel[0].slug] || [];
  const lfs2 = lfPool2.length ? rotate(lfPool2, pageHash(sdk + '#flow') % lfPool2.length).slice(0, 3) : [];
  const rtSubj = GUIDES[subjSel[1] ? subjSel[1].slug : subjSel[0].slug];
  const crumbItems = [
    { name: '홈', url: '/' },
    { name: '학교별수업', url: '/schools' },
    { name: name },
  ];
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'Service',
    serviceType: `${name} 내신 과외`, name: `${name} 내신 대비 과외`, description: desc,
    areaServed: { '@type': 'Place', name: region + (reg ? ' ' + reg.dong : '') },
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.origin }, url,
  }, {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      ...guide.map(gg => ({ '@type': 'Question', name: `${name} ${J(gg[0], '은', '는')} 어떻게 하나요?`, acceptedAnswer: { '@type': 'Answer', text: gg[1][0] } })),
      ...lfs2.map(x => ({ '@type': 'Question', name: `${x.q} — ${name} 과외 수업에서 어떻게 해결하나요?`, acceptedAnswer: { '@type': 'Answer', text: String(x.how[0]).split('{p}').join(pl) } })),
    ],
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbItems.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, ...(c.url ? { item: SITE.origin + c.url } : {}) })),
  }];

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">🏫 ${esc(region)}${reg ? ' ' + esc(reg.dong) : ''}</span>
<h1>${esc(name)}<br><span style="color:var(--blue)">내신 대비 과외</span></h1>
<p class="lead">${esc(name)} 시험은 ${esc(name)} 기준으로 준비해야 합니다. 학교 출제 스타일과 진도에 맞춘 1:1 수업으로 내신을 관리해 드려요.</p>
<div class="cta-row"><a href="#contact" class="btn btn-primary">무료 상담 받기 →</a><a href="tel:01030388978" class="btn btn-ghost">📞 010-3038-8978</a></div>
<div class="stat-row">
<div class="stat"><div class="n">${kindLabel}</div><div class="l">학교급</div></div>
<div class="stat"><div class="n">1:1</div><div class="l">학교 맞춤 수업</div></div>
<div class="stat"><div class="n">무료</div><div class="l">상담</div></div>
</div>
</div></section>

${photoTag(sdk, `${name} 내신 공부`)}

<section><div class="wrap">
<span class="sec-tag">수업 방식</span>
<h2>${esc(name)} 학생은 이렇게 준비합니다</h2>
${guide.map((g, i) => `<div class="faq" style="margin-bottom:14px"><h3>${esc(g[0])}</h3><p style="margin-top:6px">${esc(pick(g[1], sdk, i))}</p></div>`).join('')}
</div></section>

<section><div class="wrap">
<span class="sec-tag">시험 난이도</span>
<h2>${esc(name)} 시험 난이도, 이렇게 파악합니다</h2>
<p class="sub" style="max-width:760px">${pick([
  `${esc(name)} 시험이 어려운지 궁금하시다면 두 가지를 보면 됩니다. 첫째는 학생이 가진 기출과 프린트로, 서술형 비중과 응용 문제 비율에서 출제 난도가 드러납니다. 둘째는 학교알리미에 공시되는 교과별 학업성취 자료(평균, 표준편차, 성취도별 분포)로, 평균이 낮고 성취도 상위 비율이 적을수록 변별을 두는 시험 경향으로 해석할 수 있습니다.`,
  `시험 난이도는 소문이 아니라 자료로 확인하는 것이 정확합니다. 학교알리미의 ${esc(name)} 교과별 학업성취 공시(평균·표준편차·성취도 분포)를 보면 과목별로 시험이 변별형인지 확인형인지 가늠할 수 있고, 학생이 가진 기출을 함께 보면 서술형 비중과 출제 스타일까지 파악됩니다.`,
  `같은 범위라도 학교마다 시험 난도는 다릅니다. ${esc(name)}의 난이도는 학교알리미에 공시된 교과별 평균과 성취도 분포, 그리고 실제 기출의 문항 구성으로 파악합니다. 상담에서 학생이 가진 기출을 확인해 우리 학교 기준의 대비 방향을 잡아드립니다.`,
], sdk, 110)}</p>
<div class="card" style="max-width:760px"><h3>📊 학업성취 자료 확인 방법</h3><p style="margin-top:8px">학교알리미(schoolinfo.go.kr)에서 ${J(esc(name), '을', '를')} 검색한 뒤 '교과별 학업성취 사항' 항목을 열면 과목별 평균, 표준편차, 성취도(A~E) 분포를 확인할 수 있습니다. 해석이 어려우시면 상담 시 함께 봐드립니다.</p></div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">과목별 공부 포인트</span>
<h2>${esc(name)} 학생을 위한 과목별 공부 방향</h2>
<p class="sub" style="max-width:760px">같은 ${esc(KIND_LABEL[kind])} 과정이라도 과목마다 지금 잡아야 할 지점이 다릅니다. ${esc(name)} 학생들이 주력하는 과목부터 소개합니다. 과목명을 누르면 ${esc(name)} 맞춤 안내로 이어집니다.</p>
${GUIDES[subjSel[0].slug] ? `<p class="sub" style="max-width:760px">${sFill(pick(GUIDES[subjSel[0].slug].intro, sdk, 70))}</p>` : ''}
${subjSel.map((sj, i) => {
  const sg = GUIDES[sj.slug];
  const block = sg && sGrade && sg.grades[sGrade.gi] ? sg.grades[sGrade.gi] : null;
  return block ? `<div class="faq" style="margin-bottom:14px"><h3><a href="/schools/${slug}/${sj.slug}" style="color:inherit;text-decoration:none">${sj.emoji} ${esc(block.t)}</a></h3><p style="margin-top:6px">${sFill(pick(block.b, sdk, 60 + i))}</p></div>` : '';
}).join('')}
</div></section>

${lfs2.length ? `<section><div class="wrap">
<span class="sec-tag">수업 진행</span>
<h2>${esc(name)} 학생들의 고민, 수업에서 이렇게 풀어갑니다</h2>
${lfs2.map((x, i) => `<div class="faq"><h3>"${esc(x.q)}"</h3><p><strong>수업에서는 이렇게 합니다.</strong> ${sFill(pick(x.how, sdk, 64 + i))}</p></div>`).join('')}
</div></section>` : ''}

${rtSubj ? `<section><div class="wrap">
<span class="sec-tag">학습 루틴</span>
<h2>${esc(name)} 시험을 위한 주간 루틴과 4주 플랜</h2>
<div class="faq" style="margin-bottom:14px"><h3>평소 주간 루틴</h3><p style="margin-top:6px">${sFill(pick(rtSubj.routine, sdk, 66))}</p></div>
<div class="faq" style="margin-bottom:14px"><h3>시험 4주 대비 플랜</h3><p style="margin-top:6px">${sFill(pick(rtSubj.exam, sdk, 67))}</p></div>
<div class="faq"><h3>지금 성적대에 맞는 접근법</h3><p style="margin-top:6px">${sFill(pick(rtSubj.levels, sdk, 69))}</p></div>
<div class="card" style="max-width:760px;margin-top:14px"><h3>💡 학부모님께 드리는 팁</h3><p style="margin-top:8px">${sFill(pick(rtSubj.parent, sdk, 68))}</p></div>
</div></section>` : ''}

${basePath ? `<section><div class="wrap">
<span class="sec-tag">과목별</span>
<h2>${esc(reg.dong)} 과목별 과외 보기</h2>
<p class="sub">${esc(name)} 인근 ${esc(reg.dong)} 지역의 과목별 수업을 확인해 보세요.</p>
${subjectRow(basePath)}
</div></section>` : ''}

${near.length ? `<section><div class="wrap">
<span class="sec-tag">주변 학교</span>
<h2>${esc(region)} 다른 학교</h2>
<div class="linkcol">
${near.map(s => `<a href="/schools/${s[4]}">${esc(s[0])}</a>`).join('')}
</div>
</div></section>` : ''}

${faqBlock(rotate([
  { q: `${name} 시험 스타일을 알고 계신가요?`, a: `학생이 가진 기출·프린트와 최근 출제 경향을 분석해 ${name} 시험에 맞는 대비를 설계합니다. 같은 학교 수업 경험이 있는 선생님이 있으면 우선 안내해 드려요.` },
  { q: '방문 수업과 화상 수업 중 선택할 수 있나요?', a: `네, ${region} 지역 방문 수업과 화상 수업 모두 가능합니다. 학생 일정과 성향에 맞춰 정하시면 됩니다.` },
  { q: '시험 기간에만 짧게 수업받을 수 있나요?', a: `시험 기간에만 하는 단기 수업은 운영하지 않습니다. 실력은 이어서 쌓일 때 성적으로 연결되기 때문입니다. 정규 수업으로 진행하되 ${name} 시험 기간에는 횟수를 늘려 대비합니다.` },
  { q: '어떤 과목을 도와주시나요?', a: '수학, 영어, 국어, 과학, 사회, 논술 전 과목 가능합니다. 학교 시험 일정에 맞춰 과목별 대비 순서를 함께 계획해 드려요.' },
  { q: `${name} 재학생을 가르쳐 보셨나요?`, a: `지역에서 활동하는 선생님 중 ${name} 또는 인근 학교 수업 경험자를 우선 연결합니다. 학교 시험을 아는 선생님이 붙으면 대비 효율이 크게 올라갑니다.` },
  { q: '수업 요일과 시간은 어떻게 정하나요?', a: `학생의 학원·학교 일정을 확인한 뒤 고정 요일로 안내해 드립니다. ${region} 지역은 방문·화상 모두 가능해 시간 조율 폭이 넓은 편입니다.` },
  { q: '교재는 무엇을 사용하나요?', a: '학교 교과서와 프린트를 1순위로 하고, 학생 수준에 맞는 부교재를 상담 후 정합니다. 불필요한 교재 구입을 요구하지 않습니다.' },
  { q: '성적이 오르지 않으면 어떻게 되나요?', a: '4주 단위로 성취도를 점검해 커리큘럼을 조정하고, 필요하면 다른 선생님과 만나보실 수 있습니다. 리포트로 과정을 투명하게 공유드립니다.' },
], sh % 8).slice(0, 6))}

<section><div class="wrap">
<span class="sec-tag">과목별 내신</span>
<h2>${esc(name)} 과목별 내신 과외</h2>
<p class="sub">과목마다 우리 학교 시험 스타일에 맞춘 대비 방법이 다릅니다. 과목을 선택해 확인해 보세요.</p>
<div class="linkcol">
${SUBJECTS.map(s => `<a href="/schools/${slug}/${s.slug}">${esc(name)} ${s.name} 내신 과외</a>`).join('')}
</div>
</div></section>

${ctaBlock(name)}`;

  return page({ title, desc, canonical: url, crumb: crumbs(crumbItems), body, jsonld , img: photoUrl(sdk) });
}


/* ---------------- 페이지: 학교 x 과목 ---------------- */

function schoolSubjectPage(sc, subj, url) {
  const [name, kind, code, region, slug] = sc;
  const kindLabel = KIND_LABEL[kind];
  const grade = GRADE_BY_KIND[kind];
  const reg = schoolRegion(code);
  const title = `${name} ${subj.name} 내신 과외 | ${SITE.name}`;
  const desc = `${region} ${name} 학생을 위한 ${subj.name} 내신 맞춤 1:1 과외. 학교 시험 스타일에 맞춘 ${subj.name} 대비와 수행평가 관리까지, 상담 후 아이에게 맞는 선생님을 연결해 드립니다.`;

  const sd = code + slug + subj.slug;
  const g = GUIDES[subj.slug];
  const fill = s => esc(String(s).split('{p}').join(name + ' 인근'));
  const gradeGuide = g && grade && g.grades[grade.gi] ? g.grades[grade.gi] : null;
  const probs = g ? rotate(g.problems, pageHash(sd + '#probs') % g.problems.length).slice(0, 4) : [];
  const lfPool = LESSON_FLOW[subj.slug] || [];
  const lfs = lfPool.length ? rotate(lfPool, pageHash(sd + '#flow') % lfPool.length).slice(0, 3) : [];
  const basePath = reg ? `/${reg.sido}/${reg.sgg}/${reg.dongSlug}` : null;
  const nearSame = rotate(SCHOOLS.filter(s2 => s2[3] === region && s2[4] !== slug && s2[1] === kind), pageHash(sd + '#near')).slice(0, 12);
  const ssFaqPool = [
    { q: `${name} ${subj.name} 시험 스타일에 맞춰 수업하나요?`, a: `네. 학생이 가진 ${name} 기출과 프린트, 최근 출제 경향을 분석해 ${subj.name} 대비 방향을 정합니다. 같은 학교 수업 경험이 있는 선생님이 있으면 우선 안내해 드립니다.` },
    { q: `${subj.name} 내신과 수행평가를 같이 봐주시나요?`, a: `함께 관리합니다. 지필 시험 대비와 함께 수행평가 일정도 챙겨드립니다.` },
    { q: `${name} 학생인데 ${subj.name} 기초가 부족해요. 가능한가요?`, a: `가능합니다. 진단으로 어느 단원부터 끊겼는지 찾아 이전 과정 보충과 학교 진도 대비를 병행합니다. 기초가 흔들릴수록 1:1 수업의 효과가 큽니다.` },
    { q: `${subj.name} 학원에 다니는데 과외를 병행해도 되나요?`, a: `학원 진도를 소화하기 벅차거나 질문이 쌓여 있다면 병행이 효과적입니다. ${name} 일정과 학원 시간표에 맞춰 조율해 드리니 상담에서 알려주세요.` },
    { q: `방문과 화상 중 선택할 수 있나요?`, a: `네, ${region} 지역 방문 수업과 화상 수업 모두 가능합니다. 학생 일정과 성향에 맞춰 정하시면 됩니다.` },
    { q: `시험 기간에만 짧게 ${subj.name} 수업을 받을 수 있나요?`, a: `시험 기간에만 하는 단기 수업은 운영하지 않습니다. ${subj.name}은 이어서 쌓일 때 성적으로 연결되기 때문입니다. 정규 수업으로 진행하되 ${name} 시험 기간에는 횟수를 늘려 대비합니다.` },
  ];
  const ssFaqs = rotate(ssFaqPool, pageHash(sd + '#sfaq') % ssFaqPool.length).slice(0, 6);

  const crumbItems = [
    { name: '홈', url: '/' },
    { name: '학교별수업', url: '/schools' },
    { name: name, url: `/schools/${slug}` },
    { name: `${subj.name} 내신` },
  ];
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'Service',
    serviceType: `${name} ${subj.name} 내신 과외`, name: `${name} ${subj.name} 내신 과외`, description: desc,
    areaServed: { '@type': 'Place', name: region + (reg ? ' ' + reg.dong : '') },
    audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: `${kindLabel} 재학생` },
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.origin }, url,
  }, {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      ...probs.map(p2 => ({ '@type': 'Question', name: `${name} ${subj.name}: ${p2.q}`, acceptedAnswer: { '@type': 'Answer', text: String(p2.a).split('{p}').join(name + ' 인근') } })),
      ...lfs.map(x => ({ '@type': 'Question', name: `${x.q} — ${name} ${subj.name} 과외 수업에서 어떻게 해결하나요?`, acceptedAnswer: { '@type': 'Answer', text: String(x.how[0]).split('{p}').join(name + ' 인근') } })),
      ...ssFaqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    ],
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbItems.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, ...(c.url ? { item: SITE.origin + c.url } : {}) })),
  }];

  const body = `
<section class="hero"><div class="wrap">
<span class="tagline">${subj.emoji} ${esc(region)} · ${esc(kindLabel)}</span>
<h1>${esc(name)} ${subj.name} 내신 과외<br><span style="color:var(--blue)">시험 스타일 맞춤 대비</span></h1>
<p class="lead">${pick([
  `${esc(name)} ${subj.name} 시험은 우리 학교 출제 스타일을 아는 것이 절반입니다. 학생이 가진 기출·프린트를 분석해 학교에 맞는 ${subj.name} 대비를 설계합니다.`,
  `${esc(name)} 재학생을 위한 ${subj.name} 1:1 내신 수업입니다. 학교 진도와 시험 범위 기준으로 커리큘럼을 짜고, 상담 후 선생님을 연결해 드립니다.`,
  `${esc(name)} ${subj.name} 내신, 범위만 보는 공부로는 부족합니다. 학교 기출 스타일 분석부터 서술형 대비까지, 우리 학교 기준으로 준비합니다.`,
], sd, 50)}</p>
<div class="cta-row"><a href="#contact" class="btn btn-primary">무료 상담 받기 →</a><a href="/schools/${slug}" class="btn btn-ghost">${esc(name)} 전체 안내</a></div>
<div class="stat-row">
<div class="stat"><div class="n">${esc(kindLabel)}</div><div class="l">학교급 맞춤</div></div>
<div class="stat"><div class="n">1:1</div><div class="l">학교 맞춤 수업</div></div>
<div class="stat"><div class="n">무료</div><div class="l">상담</div></div>
</div>
</div></section>

${photoTag(sd, `${name} ${subj.name} 공부하는 학생`)}

<section><div class="wrap">
<span class="sec-tag">수업 방식</span>
<h2>${esc(name)} ${subj.name} 내신, 이렇게 수업해요</h2>
<div class="grid g4">
<div class="step"><div class="n">1</div><h3>상담신청</h3><p>${pick([`${esc(name)} 학생의 ${subj.name} 고민을 남겨주시면 연락드려요.`, `현재 상태와 목표를 알려주시면 검토 후 안내드립니다.`, `무엇이 막혀 있는지 편하게 말씀해 주세요.`], sd, 95)}</p></div>
<div class="step"><div class="n">2</div><h3>선생님 안내</h3><p>${pick([`${esc(name)} 또는 인근 학교 수업 경험자를 우선 연결합니다.`, `상담 내용과 아이 성향에 맞는 선생님을 안내해 드립니다.`, `${esc(region)} 방문·화상 가능한 선생님을 찾아드려요.`], sd, 96)}</p></div>
<div class="step"><div class="n">3</div><h3>무료 모의수업</h3><p>${pick([`선생님과 30분 정도 ${subj.name} 수업을 해봅니다.`, `30분 정도, 실제 수업 방식으로 진행합니다.`, `짧게 30분, 수업이 맞는지 확인하는 자리입니다.`], sd, 97)}</p></div>
<div class="step"><div class="n">4</div><h3>수업 결정</h3><p>${pick([`받아보고 시작 여부를 정하시면 됩니다.`, `시작하시면 매주 학습 리포트를 보내드립니다.`, `맞지 않으면 다른 선생님과 다시 만나보실 수 있습니다.`], sd, 98)}</p></div>
</div>
</div></section>

${gradeGuide ? `<section><div class="wrap">
<span class="sec-tag">${esc(kindLabel)} ${subj.name} 공부법</span>
<h2>${esc(name)} 학생을 위한 ${subj.name} 공부 방향</h2>
${g ? `<p class="sub" style="max-width:760px">${fill(pick(g.intro, sd, 57))}</p>` : ''}
<div class="faq"><h3>${esc(gradeGuide.t)}</h3><p style="margin-top:6px">${fill(pick(gradeGuide.b, sd, 51))}</p></div>
${g ? `<div class="card" style="max-width:760px;margin-top:14px"><h3>${esc(name)} ${subj.name} 과외 활용법</h3><p style="margin-top:8px">${fill(pick(g.help, sd, 58))}</p></div>` : ''}
</div></section>` : ''}

${probs.length ? `<section><div class="wrap">
<span class="sec-tag">자주 겪는 어려움</span>
<h2>${esc(name)} 학생들의 ${subj.name} 고민</h2>
${probs.map(x => `<div class="faq"><h3>"${esc(x.q)}"</h3><p>${fill(x.a)}</p></div>`).join('')}
</div></section>` : ''}

${lfs.length ? `<section><div class="wrap">
<span class="sec-tag">수업 진행</span>
<h2>${esc(name)} ${subj.name} 과외, 이렇게 수업을 이끌어갑니다</h2>
${lfs.map((x, i) => `<div class="faq"><h3>"${esc(x.q)}"</h3><p><strong>수업에서는 이렇게 합니다.</strong> ${fill(pick(x.how, sd, 52 + i))}</p></div>`).join('')}
</div></section>` : ''}

${(() => {
  const icPool = IMPROVE_CASES[subj.slug] || [];
  if (!icPool.length) return '';
  const c = icPool[pageHash(sd + '#ic') % icPool.length];
  return `<section><div class="wrap">
<span class="sec-tag">성적향상 플랜</span>
<h2>${esc(name)} ${subj.name} 성적향상 플랜 예시</h2>
<div class="faq"><h3>${esc(c.t)}</h3><p style="margin-top:6px"><b>시작:</b> ${esc(c.s)}</p><p style="margin-top:6px"><b>수업 전개:</b> ${esc(pick(c.p, sd, 122))}</p><p style="margin-top:6px"><b>목표:</b> ${esc(c.g)}</p></div>
<p class="sub" style="max-width:760px;font-size:14px;margin-top:10px">결과는 학생의 출발점과 학습량에 따라 달라집니다. 상담에서 ${esc(name)} 학생 맞춤 플랜을 받아보세요.</p>
</div></section>`;
})()}

${g ? `<section><div class="wrap">
<span class="sec-tag">시험 대비</span>
<h2>${esc(name)} ${subj.name} 시험 대비와 학습 루틴</h2>
<div class="faq" style="margin-bottom:14px"><h3>${esc(name)} ${subj.name} 시험 난이도 파악법</h3><p style="margin-top:6px">${pick([
  `${esc(name)} ${subj.name} 시험의 난도는 학교알리미에 공시된 ${subj.name} 학업성취 자료(평균·표준편차·성취도 분포)와 학생이 가진 기출로 파악합니다. 평균이 낮고 상위 성취 비율이 적다면 변별형 출제 경향으로 보고 응용·서술형 대비 비중을 높이고, 평균이 높은 편이면 실수 관리와 꼼꼼한 범위 학습에 무게를 둡니다.`,
  `${subj.name} 시험이 어렵다는 말만으로는 대비가 안 됩니다. ${esc(name)}의 기출에서 서술형 비중, 응용 문제 비율, 지엽 출제 여부를 확인하고 학교알리미의 ${subj.name} 성취도 분포와 교차 확인하면 우리 학교 시험의 성격이 잡힙니다. 수업 커리큘럼은 그 결과에 맞춰 설계합니다.`,
], sd, 111)}</p></div>
<div class="faq" style="margin-bottom:14px"><h3>시험 4주 플랜</h3><p style="margin-top:6px">${fill(pick(g.exam, sd, 53))}</p></div>
<div class="faq" style="margin-bottom:14px"><h3>평소 주간 루틴</h3><p style="margin-top:6px">${fill(pick(g.routine, sd, 54))}</p></div>
<div class="faq"><h3>지금 성적대에 맞는 접근법</h3><p style="margin-top:6px">${fill(pick(g.levels, sd, 55))}</p></div>
<div class="card" style="max-width:760px;margin-top:14px"><h3>💡 학부모님께 드리는 팁</h3><p style="margin-top:8px">${fill(pick(g.parent, sd, 56))}</p></div>
</div></section>` : ''}

${(() => {
  const sgd = SCHOOL_GUIDE[kind];
  if (!sgd) return '';
  const sgSels = rotate(sgd, pageHash(sd + '#sg2')).slice(0, 2);
  return `<section><div class="wrap">
<span class="sec-tag">${esc(kindLabel)} 내신 관리</span>
<h2>${esc(name)} 학생의 학교 공부 관리법</h2>
${sgSels.map((x, i) => `<div class="faq" style="margin-bottom:14px"><h3>${esc(x[0])}</h3><p style="margin-top:6px">${esc(pick(x[1], sd, 100 + i))}</p></div>`).join('')}
</div></section>`;
})()}

${faqBlock(ssFaqs)}

${nearSame.length ? `<section><div class="wrap">
<span class="sec-tag">주변 학교</span>
<h2>${esc(region)} 다른 ${esc(kindLabel)} ${subj.name} 내신</h2>
<div class="linkcol">
${nearSame.map(s2 => `<a href="/schools/${s2[4]}/${subj.slug}">${esc(s2[0])} ${subj.name} 내신</a>`).join('')}
</div>
</div></section>` : ''}

<section><div class="wrap">
<span class="sec-tag">다른 과목</span>
<h2>${esc(name)} 다른 과목 내신 과외</h2>
<div class="linkcol">
${SUBJECTS.filter(s => s.slug !== subj.slug).map(s => `<a href="/schools/${slug}/${s.slug}">${esc(name)} ${s.name} 내신 과외</a>`).join('')}
${basePath ? `<a href="${basePath}/${subj.slug}">${esc(reg.dong)} ${subj.name}과외 전체 보기</a>` : ''}
</div>
</div></section>

${ctaBlock(name)}`;

  return page({ title, desc, canonical: url, crumb: crumbs(crumbItems), body, jsonld, img: photoUrl(sd) });
}

/* ---------------- 파비콘 / 아이콘 ---------------- */

const ICON_B64 = {
  i48: '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',
  i180: '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',
  i512: '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',
};
const ICON_CACHE = {};
function iconResponse(key) {
  if (!ICON_CACHE[key]) {
    const bin = atob(ICON_B64[key]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    ICON_CACHE[key] = bytes;
  }
  return new Response(ICON_CACHE[key], {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800' },
  });
}



/* ---------------- 본문 사진 (GitHub images 폴더) ---------------- */

const PHOTO_COUNT = 42;
function photoUrl(seed) {
  const n = (pageHash(String(seed) + '#photo') % PHOTO_COUNT) + 1;
  return `/images/${n}.jpg`;
}
function photoTag(seed, alt) {
  return `<div class="wrap" style="margin:6px auto 0"><img src="${photoUrl(seed)}" alt="${esc(alt)}" width="1200" height="675" loading="lazy" decoding="async" onerror="this.parentNode.style.display='none'" style="width:100%;max-width:860px;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:20px;display:block;margin:0 auto;box-shadow:0 18px 34px -22px rgba(35,39,65,.35)"></div>`;
}


/* ---------------- 상담 신청 API (이메일 알림) ---------------- */

const NOTIFY_TO = 'hhhyunee3@naver.com';        // 알림 받을 메일
const NOTIFY_FROM = 'noreply@gongbumoa.com';    // 발신 주소 (도메인 고정)
const CONTACT_TEL = '010-3038-8978';

// ── 구글폼 백업 저장 (선택) ──────────────────────────
// 구글폼의 "미리 채워진 링크"를 받으면 아래 두 값을 채워 넣으세요.
// action: 폼 주소 끝을 /formResponse 로 바꾼 것
// fields: 각 항목의 entry.XXXXXXX 번호
const GOOGLE_FORM = {
  action: '',   // 예: 'https://docs.google.com/forms/d/e/1FAIpQL.../formResponse'
  fields: {
    name: '',        // 학생이름 entry.XXXXXXX
    grade: '',       // 학년
    subject: '',     // 과목
    phone: '',       // 연락처
    addr: '',        // 주소
    memo: '',        // 상담내용
    page: '',        // 신청페이지
  },
};

async function saveToGoogleForm(entry) {
  if (!GOOGLE_FORM.action) return;
  const f = GOOGLE_FORM.fields;
  const body = new URLSearchParams();
  const map = {
    [f.name]: entry.name, [f.grade]: entry.grade, [f.subject]: entry.subject || '-',
    [f.phone]: entry.phone, [f.addr]: entry.addr + ' ' + entry.addrDetail,
    [f.memo]: entry.memo || '-', [f.page]: entry.page || '/',
  };
  for (const [k, v] of Object.entries(map)) if (k) body.append(k, v);
  await fetch(GOOGLE_FORM.action, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
}

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// UTF-8 -> base64 (메일 제목/본문 인코딩용)
function b64utf8(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function sendNotifyMail(env, entry) {
  // 주소 앞부분(시도+시군구)을 제목에 노출: "경남 창원시"
  const region = entry.addr.split(' ').slice(0, 2).join(' ');
  const subject = `[공부모아] ${entry.subject || '과외'} 상담 신청 - ${entry.name} (${region})`;
  const telDigits = entry.phone.replace(/[^0-9]/g, '');
  const when = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const row = (label, value, opts = {}) => `
    <tr>
      <td style="padding:14px 4px;border-bottom:1px solid #EFEDE6;color:#5B6079;font-size:14px;width:96px;vertical-align:top">${label}</td>
      <td style="padding:14px 4px;border-bottom:1px solid #EFEDE6;color:${opts.color || '#232741'};font-size:15px;font-weight:${opts.bold ? '800' : '500'}">${opts.raw || esc(value)}</td>
    </tr>`;

  const htmlBody = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F3EE;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px 14px">
    <div style="background:#fff;border-radius:18px;overflow:hidden;border:1px solid #EAE7DC">
      <div style="background:linear-gradient(135deg,#10C46E,#2CC98A);padding:30px 28px;color:#fff">
        <div style="font-size:13px;opacity:.9;margin-bottom:8px">공부모아 · 일반 과외</div>
        <div style="font-size:23px;font-weight:800;line-height:1.35">📞 새 상담 신청이 도착했습니다</div>
      </div>
      <div style="padding:12px 28px 6px">
        <table style="width:100%;border-collapse:collapse">
          ${row('학생이름', entry.name, { bold: true })}
          ${row('학년', entry.grade)}
          ${row('과목', entry.subject || '-', { color: '#0AA35A', bold: true })}
          ${row('📞 연락처', '', { raw: `<a href="tel:${telDigits}" style="color:#0AA35A;font-weight:800;font-size:19px;text-decoration:none">${esc(entry.phone)}</a>` })}
          ${row('주소', entry.addr + ' ' + entry.addrDetail)}
          ${row('상담내용', entry.memo || '-')}
        </table>
        <div style="background:#EAF9F1;border-left:4px solid #10C46E;border-radius:10px;padding:18px 20px;margin:20px 0 8px">
          <div style="font-size:14px;color:#232741;margin-bottom:12px">⏰ 빠른 응답이 상담 연결율을 높입니다</div>
          <a href="tel:${telDigits}" style="display:inline-block;background:#10C46E;color:#fff;font-weight:800;font-size:15px;padding:12px 26px;border-radius:10px;text-decoration:none">📞 전화 걸기</a>
        </div>
        <div style="color:#A7AABB;font-size:12px;padding:12px 0 20px">
          신청 시간: ${when}<br>
          신청 페이지: ${esc(entry.page || '/')}
        </div>
      </div>
    </div>
  </div>
</body></html>`;

  const raw = [
    `From: =?UTF-8?B?${b64utf8('공부모아')}?= <${NOTIFY_FROM}>`,
    `To: <${NOTIFY_TO}>`,
    `Subject: =?UTF-8?B?${b64utf8(subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64utf8(htmlBody),
  ].join('\r\n');

  let EmailMessage;
  try {
    ({ EmailMessage } = await import('cloudflare:email'));
  } catch {
    return env.NOTIFY.send({ from: NOTIFY_FROM, to: NOTIFY_TO, raw });
  }
  const msg = new EmailMessage(NOTIFY_FROM, NOTIFY_TO, raw);
  return env.NOTIFY.send(msg);
}

async function handleConsultPost(request, env) {
  if (!env.NOTIFY) return json({ ok: false, error: 'no-mail' }, 500);
  let d;
  try { d = await request.json(); } catch { return json({ ok: false }, 400); }
  if (d.website) return json({ ok: true }); // 스팸봇 허니팟
  const name = String(d.name || '').trim().slice(0, 20);
  const grade = String(d.grade || '').trim().slice(0, 10);
  const phone = String(d.phone || '').trim().slice(0, 14);
  const addr = String(d.addr || '').trim().slice(0, 120);
  const addrDetail = String(d.addrDetail || '').trim().slice(0, 60);
  if (!name || !/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(phone) || !addr || !addrDetail) {
    return json({ ok: false, error: 'invalid' }, 400);
  }
  const entry = {
    name, grade, phone, addr, addrDetail,
    subject: String(d.subject || '').trim().slice(0, 40),
    memo: String(d.memo || '').trim().slice(0, 500),
    page: String(d.page || '').slice(0, 200),
  };
  try {
    await sendNotifyMail(env, entry);
  } catch (e) {
    return json({ ok: false, error: 'mail-fail' }, 500);
  }
  try { await saveToGoogleForm(entry); } catch (e) { /* 백업 실패는 무시 */ }
  try {
    if (env.STATS) {
      const cur = parseInt(await env.STATS.get('consult_count') || '0', 10);
      await env.STATS.put('consult_count', String(cur + 1));
    }
  } catch (e) { /* 카운터 실패는 무시 */ }
  return json({ ok: true });
}

/* ---------------- 라우터 ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = SITE.origin || url.origin;
    const path = decodeURIComponent(url.pathname);

    if (path === '/api/school-search') {
      const q = url.searchParams.get('q') || '';
      return json({ list: q.trim().length >= 2 ? searchSchools(q) : [] });
    }
    if (path === '/api/consult' && request.method === 'POST') {
      return handleConsultPost(request, env);
    }
    if (path === '/api/stats') {
      let count = null;
      try { if (env.STATS) count = parseInt(await env.STATS.get('consult_count') || '0', 10); } catch (e) {}
      return new Response(JSON.stringify({ count }), {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }
    const im = path.match(/^\/images\/(\d{1,3})\.(jpg|jpeg|png|webp)$/);
    if (im) {
      if (!env.ASSETS) return notFound(origin);
      return env.ASSETS.fetch(new Request(`${origin}/${im[1]}.${im[2]}`, request));
    }
    if (path === '/favicon.ico' || path === '/favicon.png') return iconResponse('i48');
    if (path === '/apple-touch-icon.png' || path === '/apple-touch-icon-precomposed.png') return iconResponse('i180');
    if (path === '/icon-512.png') return iconResponse('i512');

    if (path === '/c7e1f0a24b9d4e638a5f0d2b1c9e7f43.txt') {
      return new Response('c7e1f0a24b9d4e638a5f0d2b1c9e7f43', { headers: { 'content-type': 'text/plain' } });
    }

    if (path === '/robots.txt') {
      const bots = ['Yeti', 'Googlebot', 'Bingbot',
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
        'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
        'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'CCBot', 'Amazonbot'];
      const body = `User-agent: *\nAllow: /\n\n`
        + bots.map(b => `User-agent: ${b}\nAllow: /`).join('\n\n')
        + `\n\nSitemap: ${origin}/sitemap.xml\n`;
      return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }

    // AI 검색엔진용 사이트 요약 (llms.txt 표준)
    if (path === '/llms.txt') {
      const subj = SUBJECTS.map(s => `- [${s.name}과외](${origin}/subjects/${s.slug}): ${s.desc}`).join('\n');
      const body = `# ${SITE.name}

> ${SITE.desc}. 초등·중등·고등 학생을 대상으로 수학, 영어, 국어, 과학, 사회, 논술 과목의 1:1 방문·화상 과외를 상담 후 연결한다. 대한민국 전국 17개 시도, 255개 시군구, 5,067개 읍·면·동 단위로 지역 페이지를 제공한다.

## 주요 페이지
- [지역별 과외 찾기](${origin}/regions): 시도 > 시군구 > 동 순서로 지역을 골라 과외를 찾는 허브
${subj}

## 학교별 수업
- [학교 검색](${origin}/schools): 전국 12,028개 초·중·고등학교 검색. 학교 이름이나 지역으로 검색하면 해당 학교의 내신 대비 과외 페이지로 연결된다.
- 학교 페이지 URL: ${origin}/schools/yeoksam-jung (역삼중학교) 처럼 로마자 슬러그를 사용하며, 학교별 출제 스타일 분석, 시험 4주 플랜, 수행평가 관리 등 학교급(초/중/고)에 맞는 내신 대비 정보를 담고 있다.

## URL 구조
- 시도: ${origin}/seoul 처럼 로마자 시도명
- 시군구: ${origin}/seoul/gangnam-gu
- 동+과목: ${origin}/seoul/gangnam-gu/yeoksam-dong/math (역삼동 수학과외)
- 과목 슬러그: math(수학), english(영어), korean(국어), science(과학), social(사회), essay(논술)

## 콘텐츠
각 지역 페이지는 해당 과목의 초·중·고 학년별 공부법, 자주 겪는 어려움과 해결법, 주간 학습 루틴, 시험 4주 대비 플랜, 성적대별 접근법, 과외 활용 안내를 담고 있다.

## 문의
무료 상담: ${origin}/#contact
`;
      return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }

    // 네이버 서치어드바이저 제출용 RSS
    if (path === '/rss.xml') {
      const now = new Date().toUTCString();
      const items = [
        { t: '지역별 과외 찾기', u: `${origin}/regions`, d: '전국 5,067개 지역에서 우리 동네 과외 선생님을 찾아보세요.' },
        ...SUBJECTS.map(s => ({ t: `${s.name}과외 | 학년별 공부법`, u: `${origin}/subjects/${s.slug}`, d: s.desc })),
        ...Object.entries(SIDO).map(([k, v]) => ({ t: `${v.full} 과외`, u: `${origin}/${k}`, d: `${v.full} 전 지역 초·중·고 1:1 맞춤 과외` })),
      ];
      const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${SITE.name}</title>
<link>${origin}</link>
<description>${SITE.desc}</description>
<language>ko</language>
<lastBuildDate>${now}</lastBuildDate>
${items.map(i => `<item><title>${i.t}</title><link>${i.u}</link><description>${i.d}</description><guid>${i.u}</guid></item>`).join('\n')}
</channel></rss>`;
      return new Response(body, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
    }

    if (path === '/sitemap.xml') return xml(sitemapIndex(origin));
    if (path === '/sitemap-main.xml') return xml(sitemapMain(origin));
    const schoolSm = path.match(/^\/sitemap-schools-(cho|jung|go)\.xml$/);
    if (schoolSm) {
      const kindMap = { cho: '초', jung: '중', go: '고' };
      const urls = SCHOOLS.filter(s => s[1] === kindMap[schoolSm[1]]).flatMap(s => [
        `${origin}/schools/${s[4]}`,
        ...SUBJECTS.map(sj => `${origin}/schools/${s[4]}/${sj.slug}`),
      ]);
      urls.unshift(`${origin}/schools`);
      return xml(xmlUrlset(urls));
    }
    const smMatch = path.match(/^\/sitemap-(.+)\.xml$/);
    if (smMatch) {
      const body = sitemapSido(smMatch[1], origin);
      return body ? xml(body) : notFound(origin);
    }

    const seg = path.split('/').filter(Boolean);

        if (seg.length === 0) return html(homeWithMeta(origin));

    if (seg[0] === 'subjects') {
      if (seg.length === 1) return html(subjectRootPage(origin + path));
      const subj = SUBJECT_MAP[seg[1]];
      if (subj) return html(subjectNationalPage(subj, origin + path));
      return notFound(origin);
    }

    if (seg[0] === 'regions') return html(regionRootPage(origin + path));

    if (seg[0] === 'others' && seg.length === 1) {
      return html(comingSoonPage('others', origin + path));
    }

    if (seg[0] === 'schools') {
      if (seg.length === 1) return html(schoolsHubPage(origin + path));
      if (seg.length === 3 && seg[1] === 'region') {
        const sd = getSido(seg[2]);
        return sd ? html(schoolsRegionPage(sd, origin + path)) : notFound(origin);
      }
      if (seg.length === 2) {
        schoolIndex();
        const sc = SCHOOL_BY_SLUG.get(seg[1]);
        return sc ? html(schoolPage(sc, origin + path)) : notFound(origin);
      }
      if (seg.length === 3) {
        schoolIndex();
        const sc = SCHOOL_BY_SLUG.get(seg[1]);
        const ssubj = SUBJECT_MAP[seg[2]];
        if (sc && ssubj) return html(schoolSubjectPage(sc, ssubj, origin + path));
        return notFound(origin);
      }
      return notFound(origin);
    }

    const sido = getSido(seg[0]);
    if (!sido) return notFound(origin);

    if (seg.length === 1) return html(sidoHubPage({ sido, url: origin + path }));

    const sgg = getSgg(sido.key, seg[1]);
    if (!sgg) return notFound(origin);

    if (seg.length === 2) return html(sggHubPage({ sido, sgg, url: origin + path }));

    // 지역 x 과목 x 학년: /{sido}/{sgg}/{subj}/{grade} 또는 /{sido}/{sgg}/{dong}/{subj}/{grade}
    const gradeLast = GRADE_MAP[seg[seg.length - 1]];
    if (gradeLast) {
      const gsubj = SUBJECT_MAP[seg[seg.length - 2]];
      if (gsubj && seg.length === 4) {
        return html(regionGradeSubjectPage({ sido, sgg, dong: null, subj: gsubj, grade: gradeLast, url: origin + path }));
      }
      if (gsubj && seg.length === 5) {
        const dong = getDong(sido.key, sgg.key, seg[2]);
        if (!dong) return notFound(origin);
        return html(regionGradeSubjectPage({ sido, sgg, dong, subj: gsubj, grade: gradeLast, url: origin + path }));
      }
      return notFound(origin);
    }

    const subj = SUBJECT_MAP[seg[seg.length - 1]];

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
      if (dong) return Response.redirect(`${origin}${path}/${SUBJECTS[0].slug}`, 301);
    }

    return notFound(origin);
  },
};

