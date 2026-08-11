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

<!-- CTA / 상담 신청폼 -->
<section class="cta-band" id="contact">
  <div class="wrap">
    <div class="form-card reveal">
      <div class="form-head">
        <h2>수업 상담 신청</h2>
        <p>무료 30분 시범수업 받아보실 수 있습니다.<br>신청을 남겨주시면 순차적으로 연락드리고 있습니다 😊<br>급하신 경우 <a href="tel:01030388978" style="color:var(--blue-deep);font-weight:800">010-3038-8978</a> 로 전화 주세요.</p>
      </div>
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

// 학년별 태그 (페이지 내 콘텐츠 다양화용)
const GRADES = ['초등', '중등', '고등'];


/* ========== 과목별 학습 가이드 ========== */
// 과목별 상세 가이드 콘텐츠. {p} 자리에 지역명이 들어갑니다.
const GUIDES = {
  math: {
    intro: '수학은 한 번 구멍이 생기면 다음 단원까지 연쇄적으로 흔들리는 계단식 과목입니다. 그래서 지금 학년의 진도만 쫓아가기보다, 어디서부터 이해가 끊겼는지 찾아 그 지점부터 다시 쌓는 것이 가장 빠른 길입니다. {p} 학생들의 학교 진도와 시험 범위에 맞춰, 학년별로 무엇을 어떻게 공부해야 하는지 정리했습니다.',
    grades: [
      { t: '초등 수학 공부법', b: '초등 시기의 목표는 두 가지입니다. 연산의 자동화와 수학에 대한 좋은 감정 만들기. 사칙연산과 분수·소수 계산이 느리거나 자주 틀리면 중학교 방정식에서 반드시 발목을 잡히므로, 하루 15~20분씩 짧게라도 매일 연산을 연습하는 습관이 중요합니다. 문장제를 어려워한다면 수학 문제가 아니라 독해 문제인 경우가 많습니다. 문제를 소리 내어 읽고, 구하는 것이 무엇인지 한 문장으로 말해보게 한 뒤 식을 세우는 훈련이 효과적입니다. 그리고 이 시기에 "나는 수학을 못해"라는 인식이 생기지 않도록, 아이 수준보다 반 걸음 쉬운 문제부터 성공 경험을 쌓아주는 것이 무엇보다 중요합니다.' },
      { t: '중등 수학 공부법', b: '중학교 수학은 개념 이해, 유형 연습, 서술형 대비 세 단계로 나눠 접근해야 합니다. 개념은 정의를 외우는 것이 아니라 자기 말로 설명할 수 있어야 하고, 설명이 막히는 지점이 곧 복습할 지점입니다. 유형 연습은 같은 문제집을 여러 권 푸는 것보다 한 권을 세 번 반복하며 틀린 문제만 다시 푸는 방식이 효율적입니다. 특히 함수와 방정식은 고등 수학의 뼈대가 되므로 이 단원만큼은 완성도를 높여야 합니다. 서술형은 답이 맞아도 풀이 과정에서 감점되는 경우가 많으니, 등호와 기호를 정확히 쓰고 근거를 한 줄씩 남기는 답안 작성 연습을 시험 4주 전부터 시작하는 것을 권합니다.' },
      { t: '고등 수학 공부법', b: '고등부터는 내신과 수능을 함께 관리해야 하며, 현재 등급대에 따라 전략이 완전히 달라집니다. 4~5등급이라면 심화 문제를 붙잡기보다 중학 과정을 포함한 개념의 구멍을 먼저 메우는 것이 등급을 올리는 가장 빠른 방법입니다. 2~3등급은 개념은 알지만 준킬러 문항에서 막히는 경우가 많으므로, 기출문제를 유형별로 분류해 풀이의 첫 단추(발상)를 정리하는 훈련이 필요합니다. 1등급 목표라면 킬러 문항 대비와 함께 실수 관리가 핵심입니다. 틀린 문제마다 "몰라서 틀렸는지, 실수인지, 시간이 없었는지"를 구분해 기록하면 자신의 약점이 데이터로 보이기 시작합니다. 학교별 내신 기출의 출제 스타일 분석도 필수입니다.' },
    ],
    problems: [
      { q: '개념은 아는데 문제만 보면 못 풀어요', a: '개념을 "읽어서 아는 것"과 "꺼내 쓰는 것"은 다른 능력입니다. 문제를 보고 어떤 개념이 필요한지 연결하는 훈련이 부족한 경우로, 문제를 풀기 전에 "이 문제는 무슨 단원, 무슨 개념을 묻는 문제인지" 말로 먼저 정리하는 연습이 효과적입니다.' },
      { q: '문장제·서술형만 유독 틀려요', a: '계산력이 아니라 문제 해석력의 문제입니다. 문제 속 조건에 밑줄을 긋고, 구하는 값을 기호로 정리한 뒤 식을 세우는 3단계 루틴을 몸에 붙이면 문장제 정답률이 눈에 띄게 올라갑니다.' },
      { q: '시험 시간이 늘 부족해요', a: '아는 문제를 빨리 푸는 속도보다, 모르는 문제를 빨리 버리는 판단이 시간 관리의 핵심입니다. 평소 문제를 풀 때부터 시간을 재고, 2분 이상 막히면 표시하고 넘어가는 연습을 해야 실전에서 같은 판단이 나옵니다.' },
      { q: '수학이 무섭고 자신감이 없어요', a: '수학 불안은 실력 문제가 아니라 경험 문제입니다. 지금 수준보다 살짝 쉬운 단계부터 "풀린다"는 경험을 반복해 쌓으면 몇 주 안에 태도가 달라집니다. 1:1 수업이 특히 효과적인 영역입니다.' },
    ],
    help: '{p}에서 수학 과외를 시작하면 첫 수업 전에 무료 진단으로 학생이 어느 단원에서부터 이해가 끊겼는지 찾아냅니다. 학교 진도만 따라가는 수업이 아니라, 구멍 난 이전 개념을 병행 보충하면서 현재 시험 범위를 준비하는 이중 트랙으로 커리큘럼을 짭니다. 매 수업 숙제를 통해 혼자 푸는 시간을 관리하고, 오답은 유형별로 분류해 시험 전 다시 풀게 합니다. 학부모님께는 매주 학습 리포트로 진도와 성취도, 다음 주 계획을 공유해 드립니다.',
    routine: '수학은 주 2회 과외 수업만으로는 부족하고, 수업 사이의 자기 학습이 성적을 결정합니다. 권장 주간 루틴은 이렇습니다. 수업 당일에는 배운 내용을 30분 안에 백지에 다시 정리해보고, 다음 날 숙제로 유형 문제를 풀며, 주말에는 한 주간 틀린 문제만 모아 다시 풉니다. 여기에 매일 15분의 연산 또는 기초 문제 루틴을 더하면 감이 끊기지 않습니다. 중요한 것은 총 공부 시간이 아니라 "매일 수학을 만나는 것"입니다. 주말에 몰아서 4시간 하는 것보다 매일 40분이 수학에서는 확실히 효과적입니다.',
    exam: '시험 4주 전부터는 계획이 달라져야 합니다. 4주 전에는 시험 범위의 개념을 처음부터 훑으며 구멍을 확인하고, 3주 전에는 유형서로 범위 내 전 유형을 한 바퀴 돕니다. 2주 전부터는 학교 기출과 유사 문제로 실전 감각을 만들고 서술형 답안 쓰기를 연습합니다. 마지막 1주는 새 문제를 벌리지 말고 그동안 틀린 문제만 다시 푸는 기간입니다. 시험 전날 밤에 새 유형을 만나 불안해지는 것이 최악의 시나리오이므로, 마지막 3일은 오답 복습과 컨디션 관리에 집중하세요.',
    levels: '지금 성적대에 따라 우선순위가 다릅니다. 기초가 부족한 학생이라면 현재 학년 문제집을 붙잡기 전에 이전 학년의 핵심 단원(연산, 방정식, 함수)부터 빠르게 복습하는 것이 결국 더 빠릅니다. 보통 4~6주의 집중 보충으로 현재 진도를 따라갈 발판이 만들어집니다. 중위권 학생은 아는 문제를 더 많이 푸는 함정에 빠지기 쉽습니다. 틀리는 유형을 골라 그 유형만 집중 훈련하는 약점 공략이 등급을 바꿉니다. 상위권 학생은 새로운 문제보다 틀린 문제의 원인 분석에 시간을 써야 하며, 실수 기록장을 만들어 시험 직전에 자신의 실수 패턴만 점검하는 것이 만점을 지키는 방법입니다.',
    parent: '가정에서는 채점 결과보다 풀이 과정을 봐주세요. 몇 점인지보다 "어떤 유형에서 왜 틀렸는지"를 아이와 함께 이야기하는 것이 성적 향상에 훨씬 큰 영향을 줍니다. 그리고 하루 몰아서 3시간보다 매일 40분이 수학에서는 확실히 유리합니다. 짧아도 끊기지 않는 학습 리듬을 만들어 주세요.',
  },

  english: {
    intro: '영어는 단어·문법·독해·듣기가 따로 노는 과목이 아니라 서로를 받쳐주는 과목입니다. 어느 하나가 약하면 다른 영역도 같이 흔들리기 때문에, 학년별로 힘을 실어야 할 영역이 다릅니다. {p} 학생들이 학교 내신과 수능형 시험을 함께 대비할 수 있도록 시기별 공부법을 정리했습니다.',
    grades: [
      { t: '초등 영어 공부법', b: '초등 시기는 소리와 어휘의 기초 체력을 만드는 시기입니다. 파닉스가 불안정하면 단어를 통째로 그림처럼 외우게 되어 학년이 올라갈수록 한계가 옵니다. 소리 규칙을 먼저 잡고, 음원을 들으며 따라 읽는 낭독 훈련을 병행하면 읽기와 듣기가 같이 자랍니다. 어휘는 단어장 암기보다 쉬운 책을 많이 읽으며 문장 속에서 만나는 방식이 오래갑니다. 이 시기에 영어를 시험 과목이 아니라 재미있는 언어로 만나게 해주는 것이 이후 6년의 학습 태도를 결정합니다.' },
      { t: '중등 영어 공부법', b: '중학교부터는 문법을 체계로 정리해야 합니다. 낱개로 배운 문법 규칙들을 문장의 구조(주어-동사-목적어) 안에서 연결해 이해하면 암기량이 줄어듭니다. 어휘는 하루 20~30개를 외우되, 다음 날과 일주일 뒤 두 번 복습하는 주기 반복이 핵심입니다. 한 번에 많이 외우고 잊는 것보다 훨씬 효율적입니다. 내신 대비는 교과서 본문 분석이 절반입니다. 본문의 문장 구조를 해석할 수 있게 만들고, 서술형에 자주 나오는 어법 포인트(시제, 수일치, 관계사 등)를 본문 문장으로 연습하면 감점을 크게 줄일 수 있습니다.' },
      { t: '고등 영어 공부법', b: '고등 영어의 벽은 문장의 길이입니다. 단어를 다 알아도 해석이 안 되는 건 구문 독해력이 없기 때문입니다. 긴 문장을 주어부와 동사부로 끊고 수식 관계를 표시하며 읽는 훈련을 해야 지문 이해 속도가 올라갑니다. 유형별 접근법도 필요합니다. 빈칸은 글의 논리, 순서·삽입은 연결어와 대명사, 주제·제목은 반복되는 핵심어를 단서로 잡는 식으로 유형마다 공략법이 다릅니다. 내신은 학교 부교재와 변형 문제 대비가 관건이므로 학교별 출제 경향을 아는 것이 유리하고, 수능은 EBS 연계 교재를 지문 암기가 아닌 구문 분석용으로 활용해야 합니다.' },
    ],
    problems: [
      { q: '단어를 외워도 해석이 안 돼요', a: '어휘가 아니라 구문의 문제입니다. 문장이 길어지면 어디가 주어이고 동사인지 놓치는 것이므로, 문장 성분을 표시하며 읽는 구문 독해 훈련을 4~6주만 해도 해석 속도가 달라집니다.' },
      { q: '문법 용어가 어려워서 포기하게 돼요', a: '용어 암기가 아니라 문장 구조로 접근하면 됩니다. 관계대명사·분사구문 같은 용어를 몰라도 "이 덩어리가 앞의 명사를 꾸민다"는 구조를 그림으로 이해하면 문제는 풀립니다. 용어는 그다음입니다.' },
      { q: '지문 읽는 시간이 부족해요', a: '모든 문장을 같은 힘으로 읽고 있기 때문입니다. 주제문과 예시를 구분해 강약을 두고 읽는 스캐닝 훈련, 그리고 문제를 먼저 보고 지문에서 근거를 찾는 순서로 바꾸면 시간이 확보됩니다.' },
      { q: '서술형에서 늘 감점돼요', a: '아는 것과 정확히 쓰는 것의 차이입니다. 시제·수일치·어순 같은 감점 포인트를 체크리스트로 만들어 답안 작성 후 스스로 검토하는 습관을 들이면 같은 실수가 반복되지 않습니다.' },
      { q: '내신은 괜찮은데 모의고사만 보면 등급이 떨어져요', a: '내신은 범위 암기로 커버되지만 모의고사는 처음 보는 지문을 읽어내는 실력 그 자체를 묻기 때문입니다. 범위 없는 시험에 강해지려면 평소에 낯선 지문으로 구문 독해와 유형 훈련을 병행해야 하며, 이 격차는 방치할수록 고3 때 커집니다.' },
    ],
    help: '{p} 영어 과외는 진단 테스트로 어휘·문법·구문·독해 중 어느 영역이 병목인지부터 찾습니다. 그다음 학교 교과서와 부교재 중심의 내신 트랙, 구문·유형 중심의 실력 트랙을 학생 상황에 맞는 비율로 섞어 수업합니다. 어휘는 수업마다 테스트로 주기 복습을 강제하고, 서술형 답안은 첨삭으로 감점 요인을 하나씩 제거합니다. 학교별 기출과 변형 문제 스타일을 반영해 시험 2주 전부터는 실전 대비로 전환합니다.',
    routine: '영어는 하루에 몰아 하는 과목이 아니라 매일 쪼개서 하는 과목입니다. 권장 루틴은 매일 어휘 20분(새 단어 + 복습 단어), 격일 구문 독해 30분, 주 2회 듣기 15분입니다. 어휘는 외운 날 기준으로 다음 날과 일주일 뒤 두 번 복습하는 주기를 지키는 것이 양보다 중요합니다. 독해는 하루 한 지문이라도 구조를 분석하며 정독하는 것이 열 지문 훑는 것보다 낫습니다. 수업이 있는 날에는 수업에서 배운 구문 포인트가 들어간 문장을 스스로 두세 개 찾아보면 배움이 자기 것이 됩니다.',
    exam: '내신 4주 플랜은 이렇게 짭니다. 4주 전에는 교과서와 부교재 본문의 해석을 완성하고 모르는 어휘를 정리합니다. 3주 전에는 본문 속 문법 포인트(시제, 관계사, 분사 등)를 문장 단위로 분석하고, 2주 전부터는 학교별 기출과 변형 문제로 출제 스타일에 적응합니다. 서술형 배점이 큰 학교라면 이 시기에 영작 연습을 반드시 포함해야 합니다. 마지막 주는 본문 흐름과 빈출 문장을 최종 점검하고, 틀렸던 변형 문제를 다시 풀며 마무리합니다.',
    levels: '수준별로 가장 효율이 높은 지점이 다릅니다. 기초 단계라면 어휘와 기본 문장 구조에 학습 시간의 대부분을 쓰는 것이 맞습니다. 이 단계에서 어려운 독해 문제집은 오히려 독이 됩니다. 중위권은 어휘는 되는데 긴 문장에서 무너지는 경우가 대부분이라, 구문 독해 훈련에 집중하면 가장 빠르게 점수가 오릅니다. 상위권은 고난도 유형(빈칸, 순서)의 정답률 관리와 함께, 서술형·수행평가 같은 감점 요소를 촘촘히 막는 것이 1등급 안착의 관건입니다. 자신이 어느 단계인지 애매하다면 진단 테스트로 확인하고 시작하는 것이 시행착오를 줄입니다.',
    parent: '가정에서는 영어 노출 시간을 자연스럽게 늘려주세요. 하루 10분이라도 영어 음원이나 영상 콘텐츠를 꾸준히 접하는 아이와 시험 기간에만 영어를 보는 아이는 고등학교에서 확연히 갈립니다. 단어 시험 점수보다 "오늘 배운 문장 하나 읽어봐" 같은 가벼운 확인이 부담 없이 오래갑니다.',
  },

  korean: {
    intro: '국어는 모든 과목의 바탕이 되는 과목이면서, 정작 어떻게 공부해야 하는지 가장 막막한 과목이기도 합니다. 감으로 푸는 습관을 근거로 푸는 습관으로 바꾸는 것이 국어 공부의 전부라고 해도 과언이 아닙니다. {p} 학생들을 위해 학년별 국어 공부의 핵심을 정리했습니다.',
    grades: [
      { t: '초등 국어 공부법', b: '초등 국어의 핵심은 독서 습관과 어휘력입니다. 이 시기의 독서량은 이후 모든 과목의 독해력으로 전환되는 자산입니다. 다만 그냥 많이 읽는 것보다, 읽은 내용을 한두 문장으로 말해보게 하는 요약 습관을 붙이면 효과가 배가됩니다. 어휘는 모르는 단어를 만났을 때 사전을 찾고 자기 문장으로 한 번 써보는 것이 단어장 암기보다 오래갑니다. 일기나 짧은 글쓰기를 주 2~3회 꾸준히 하면 문장력과 맞춤법이 자연스럽게 잡히고, 이는 중·고등 서술형의 기초가 됩니다.' },
      { t: '중등 국어 공부법', b: '중학교 국어는 문학 개념어와 비문학 읽기 방법을 장착하는 시기입니다. 문학은 비유·상징·시점·갈등 같은 개념어를 정확히 알아야 작품 해석의 언어가 생깁니다. 작품을 외우는 것이 아니라 개념을 작품에 적용하는 연습이 중요합니다. 비문학은 문단마다 중심 문장을 찾고 문단 간 관계(원인-결과, 대조, 예시)를 표시하며 읽는 구조 독해를 훈련해야 합니다. 문법은 품사와 문장 성분 등 기초 체계를 이 시기에 잡아두지 않으면 고등 언어와 매체에서 크게 고생하므로, 내신 시험 범위와 별개로 기본 개념을 정리해 두는 것을 권합니다.' },
      { t: '고등 국어 공부법', b: '고등 국어는 기출 분석이 공부의 중심입니다. 지문을 많이 푸는 것보다 한 지문을 깊게 분석하는 것이 실력을 만듭니다. 틀린 문제는 정답의 근거가 지문 어디에 있는지 찾아 표시하고, 매력적인 오답이 왜 틀렸는지까지 설명할 수 있어야 같은 유형에서 다시 틀리지 않습니다. 문학은 주요 작품의 주제와 표현상 특징을 정리한 자기만의 노트가 내신과 수능 모두에서 무기가 됩니다. 선택과목(화법과작문/언어와매체)은 문법 자신감에 따라 결정하되, 언어와매체를 선택한다면 중등 문법부터 체계적으로 다시 쌓는 것이 안전합니다.' },
    ],
    problems: [
      { q: '지문을 읽어도 머리에 남지 않아요', a: '눈으로만 읽고 있기 때문입니다. 문단마다 핵심어에 표시하고 한 줄 요약을 메모하며 읽는 능동적 독해로 바꾸면, 처음엔 느려져도 2~3주 뒤 이해도와 속도가 함께 올라갑니다.' },
      { q: '시와 소설 해석을 어떻게 해야 할지 모르겠어요', a: '작품마다 새로 해석하려 하면 끝이 없습니다. 화자·상황·정서·태도라는 틀로 시를, 인물·갈등·시점의 틀로 소설을 읽는 공식적인 접근법을 먼저 익히면 처음 보는 작품도 길이 보입니다.' },
      { q: '문법이 외계어 같아요', a: '문법은 암기 과목이 아니라 규칙 발견 과목입니다. 예문에서 규칙을 스스로 찾아보는 방식으로 배우면 훨씬 오래 남고, 음운변동·품사 같은 빈출 영역만 우선 잡아도 시험 체감 난도가 내려갑니다.' },
      { q: '다 풀면 시간이 없고, 시간 맞추면 정답률이 떨어져요', a: '지문 유형별로 시간 배분 기준을 정해두지 않아서입니다. 화작/언매-비문학-문학 순서와 영역별 제한 시간을 정해 모의 훈련을 반복하면 자기만의 시간 운영이 만들어집니다.' },
      { q: '어릴 때 책을 안 읽어서 이미 늦은 것 같아요', a: '독서량 부족은 불리한 출발점일 뿐 결승점이 아닙니다. 고등학생도 올바른 지문 분석 훈련을 체계적으로 하면 6개월 안에 유의미한 변화가 나타납니다. 늦었다고 느끼는 지금이 방법을 바꿀 가장 빠른 시점입니다.' },
    ],
    help: '{p} 국어 과외는 학생이 지문을 어떻게 읽는지 직접 관찰하는 것부터 시작합니다. 눈이 어디서 머무는지, 무엇을 놓치는지 확인한 뒤 읽기 습관 자체를 교정합니다. 문학 개념어와 문법은 학년 수준에 맞게 체계를 잡아주고, 내신 기간에는 학교 필기와 교과서 작품 중심으로, 그 외 기간에는 독해력과 기출 분석 중심으로 수업을 운영합니다. 서술형과 수행평가 글쓰기는 첨삭을 통해 문장 단위로 다듬어 드립니다.',
    routine: '국어 실력은 벼락치기가 통하지 않는 대신, 짧은 루틴의 누적에 가장 정직하게 반응합니다. 권장 루틴은 매일 비문학 한 지문 정독(15~20분), 주 3회 문학 작품 하나 분석, 주 1회 어휘·문법 정리입니다. 지문을 풀 때는 채점보다 분석에 시간을 쓰세요. 정답과 오답의 근거를 지문에서 찾아 표시하는 10분이 문제 열 개를 더 푸는 것보다 실력이 됩니다. 수업이 있는 날에는 수업에서 배운 독해 방법을 다른 지문 하나에 직접 적용해보는 것이 가장 좋은 복습입니다.',
    exam: '내신 국어는 범위가 명확한 만큼 전략이 통합니다. 4주 전에는 시험 범위의 작품과 지문을 교과서 기준으로 정독하고 학교 필기를 정리합니다. 3주 전에는 작품별 핵심(주제, 표현상 특징, 시어·소재의 의미)을 노트로 만들고, 2주 전부터는 학교 기출과 문제집으로 출제 포인트를 확인합니다. 문법 단원이 범위에 있다면 이 시기에 개념-예문-문제의 순환을 두 바퀴 돌아야 합니다. 마지막 주는 필기 노트와 오답만 반복하며, 서술형 예상 문제의 모범 답안을 직접 써보는 것으로 마무리합니다.',
    levels: '국어는 성적대별 처방이 특히 뚜렷한 과목입니다. 기초 단계 학생은 문제 풀이보다 어휘력과 정독 습관부터 잡아야 합니다. 지문의 절반을 이해하지 못한 채 문제 기술만 배우면 성적이 오르지 않습니다. 중위권은 감으로 푸는 습관이 병목입니다. 모든 문제의 근거를 지문에서 찾는 훈련으로 "느낌상 2번"을 "지문 셋째 문단 때문에 2번"으로 바꾸는 것이 핵심 과제입니다. 상위권은 고난도 비문학과 문학의 매력적 오답 판별력, 그리고 시간 운영이 승부처입니다. 자주 틀리는 갈래(현대시, 고전 등)를 좁혀 집중 보완하는 것이 효율적입니다.',
    parent: '가정에서는 정답 여부보다 "왜 그렇게 생각했는지"를 물어봐 주세요. 자기 생각의 근거를 말로 설명하는 습관이 국어 실력의 본질입니다. 그리고 스마트폰 짧은 글에만 익숙해지지 않도록, 분량 있는 글을 끝까지 읽는 경험을 주기적으로 만들어 주는 것이 좋습니다.',
  },

  science: {
    intro: '과학은 암기 과목이라는 오해가 가장 많은 과목입니다. 실제로는 원리를 이해하면 외울 것이 절반으로 줄고, 원리 없이 외우면 조금만 문제를 비틀어도 무너집니다. {p} 학생들이 과학을 원리 중심으로 공부할 수 있도록 학년별 방법을 정리했습니다.',
    grades: [
      { t: '초등 과학 공부법', b: '초등 과학의 목표는 지식의 양이 아니라 호기심과 관찰 습관입니다. 교과서 실험을 "결과 외우기"로 넘기지 말고, 왜 그런 결과가 나오는지 아이의 말로 설명해보게 하는 것이 중요합니다. 일상에서 만나는 현상(그림자, 계절, 물의 상태 변화)을 교과 개념과 연결해주면 과학이 시험 과목이 아니라 세상을 설명하는 도구라는 감각이 생깁니다. 이 감각이 중·고등 과학의 학습 태도를 결정합니다. 과학 독서나 다큐멘터리를 함께 보는 것도 배경지식을 넓히는 좋은 방법입니다.' },
      { t: '중등 과학 공부법', b: '중학교 과학은 물리·화학·생명·지구과학 네 영역이 섞여 나오며, 영역마다 공부법이 다릅니다. 물리·화학은 개념과 공식이 왜 성립하는지 유도 과정을 이해해야 계산 문제가 풀리고, 생명·지구과학은 용어와 과정을 그림과 흐름도로 정리하는 것이 효과적입니다. 공통적으로 중요한 것은 그래프와 표 해석 능력입니다. 시험 문제의 절반 이상이 자료 해석형으로 출제되므로, 개념을 배울 때마다 관련 그래프의 축과 의미를 함께 정리하는 습관을 들여야 합니다. 탐구 과정 서술형은 "가설-과정-결과-결론"의 틀로 답안을 쓰는 연습이 필요합니다.' },
      { t: '고등 과학 공부법', b: '고등 과학은 통합과학을 기반으로 선택과목(물리학·화학·생명과학·지구과학)으로 심화됩니다. 선택은 흥미와 진로, 그리고 계산형(물리·화학)과 자료해석형(생명·지구) 중 자신의 강점을 함께 고려해야 합니다. 어느 과목이든 개념 학습 후 기출 문제로 출제 포인트를 확인하는 순환이 기본이며, 특히 수능형 문제는 여러 개념을 한 문제에 엮어 내므로 단원 간 연결 정리가 중요합니다. 내신은 학교 선생님의 필기와 프린트가 출제의 중심이므로 수업 자료를 1순위 교재로 삼고, 실험 관련 문항은 과정과 유의점까지 정리해야 합니다.' },
    ],
    problems: [
      { q: '외울 게 너무 많아서 과학이 싫어요', a: '원리 없이 결과만 외우고 있기 때문입니다. "왜"를 한 번 이해하면 연결된 사실들이 한 덩어리로 기억됩니다. 암기량이 많다고 느껴지는 단원일수록 원리부터 다시 잡는 것이 지름길입니다.' },
      { q: '개념은 이해했는데 계산 문제가 안 풀려요', a: '공식을 외우기만 하고 상황에 적용하는 연습이 부족한 경우입니다. 문제 속 물리량을 기호로 정리하고 어떤 공식이 연결되는지 판단하는 과정을 단계별로 훈련하면 해결됩니다.' },
      { q: '그래프·표 문제만 나오면 막혀요', a: '자료 해석은 별도의 기술입니다. 축이 무엇인지, 기울기와 넓이가 무엇을 의미하는지 먼저 읽는 루틴을 만들고, 기출의 자료 해석 문항만 모아 연습하면 빠르게 좋아집니다.' },
      { q: '실험 서술형에서 점수가 깎여요', a: '결과는 아는데 과정 서술이 빈약한 경우가 많습니다. 조작 변인과 통제 변인, 유의점을 포함하는 답안 틀을 익혀두면 같은 지식으로도 점수가 달라집니다.' },
      { q: '어떤 선택과목을 골라야 할지 모르겠어요', a: '흥미, 진로 연계, 그리고 자신의 강점(계산형인지 자료해석형인지)을 함께 봐야 합니다. 중등 성적에서 물리·화학 계산과 생명·지구 암기 중 어느 쪽이 편했는지가 좋은 힌트가 되며, 진단 상담에서 학생 데이터를 보고 함께 정해드릴 수 있습니다.' },
    ],
    help: '{p} 과학 과외는 학생이 어느 영역(물·화·생·지)에서 막히는지, 개념·계산·자료해석 중 무엇이 약한지를 진단으로 구분한 뒤 시작합니다. 원리를 그림과 실생활 예시로 풀어 설명해 암기 부담을 줄이고, 학교 진도와 시험 범위에 맞춰 개념-문제-오답의 순환을 관리합니다. 내신 기간에는 학교 프린트와 기출 스타일을 반영한 예상 문제로 마무리하고, 서술형 답안 작성법까지 첨삭해 드립니다.',
    routine: '과학은 개념을 배운 직후의 복습이 가장 중요합니다. 권장 루틴은 수업 당일 배운 단원의 개념을 그림·흐름도로 한 장에 정리하고, 이틀 안에 관련 문제를 풀어 이해를 확인하는 것입니다. 주말에는 한 주 동안 배운 내용의 그래프와 표만 모아 다시 읽어보세요. 자료 해석 감각은 이렇게 짧게 자주 만나야 자랍니다. 계산형 단원(물리·화학)은 공식 유도 과정을 일주일에 한 번 백지에 재현해보는 것이 공식 암기보다 오래갑니다.',
    exam: '과학 내신 4주 플랜입니다. 4주 전에는 교과서와 학교 프린트로 시험 범위 개념을 정리하고, 3주 전에는 단원별 문제 풀이로 이해를 점검합니다. 2주 전부터는 학교 기출 스타일의 자료 해석·계산 문제를 집중 연습하고, 실험 단원이 범위에 있다면 과정·변인·유의점을 서술형 틀로 정리합니다. 마지막 주는 오답과 학교 필기 중심으로 반복하되, 선생님이 수업 중 강조한 부분을 최우선으로 점검하세요. 과학 내신은 수업 자료에서 그대로 출제되는 비율이 높은 과목입니다.',
    levels: '상황별로 접근이 달라야 합니다. 과학이 처음부터 어려운 학생은 대부분 용어의 벽에 막혀 있습니다. 개념어를 일상 언어로 풀어 이해하는 과정을 거치면 교과서가 읽히기 시작합니다. 중위권은 개념형은 맞는데 자료 해석·계산형에서 틀리는 패턴이 많으므로, 취약 유형만 골라 집중 훈련하는 것이 점수를 올리는 최단 경로입니다. 상위권은 단원 간 통합 문항과 실험 설계형 문제 대비가 관건이며, 교과서 탐구 활동과 심화 자료까지 정리해야 최고 등급이 안정됩니다. 진로가 이공계라면 지금 과목별 강점을 파악해 고등 선택과목 전략까지 미리 그려두는 것이 좋습니다.',
    parent: '가정에서는 "그건 왜 그럴까?"라는 질문을 아이에게 돌려주세요. 답을 알려주는 것보다 스스로 설명해보게 하는 것이 과학적 사고를 키웁니다. 박물관·과학관 방문이나 다큐 시청처럼 교과 밖 경험도 배경지식이 되어 독해형 문항에서 힘을 발휘합니다.',
  },

  social: {
    intro: '사회는 범위가 넓어 무작정 외우기 시작하면 끝이 없는 과목입니다. 흐름과 구조를 먼저 잡고 세부 사실을 그 위에 얹는 순서로 공부해야 암기량이 줄고 오래 남습니다. 특히 사회는 학교 선생님의 수업 강조점이 시험에 직결되는 과목이라, 학교 수업 필기를 중심에 두고 공부 체계를 세우는 것이 중요합니다. {p} 학생들을 위한 학년별 사회 공부법을 정리했습니다.',
    grades: [
      { t: '초등 사회 공부법', b: '초등 사회는 생활과 연결할수록 쉬워집니다. 지도, 뉴스, 가족 여행 같은 일상 경험을 교과 내용과 이어주면 추상적인 개념이 손에 잡히기 시작합니다. 지리는 지도를 직접 그려보고, 역사는 연표를 만들어 시간 순서를 몸에 익히는 활동형 학습이 효과적입니다. 용어가 어려운 과목이므로 모르는 단어를 그냥 넘기지 않고 뜻을 확인하는 습관이 중요하며, 이 습관이 중등 사회의 개념 학습으로 자연스럽게 이어집니다.' },
      { t: '중등 사회 공부법', b: '중학교 사회·역사는 구조화가 핵심입니다. 역사는 사건을 낱개로 외우지 말고 배경-전개-결과-영향의 흐름으로 묶어 이야기처럼 이해해야 합니다. 시대별로 정치·경제·사회·문화를 표로 정리하면 비교 문제에 강해집니다. 일반사회는 민주주의·경제 같은 추상 개념을 실제 사례와 연결해 이해하고, 헷갈리는 유사 개념(예: 권리와 의무, 물가와 환율)은 차이점 중심으로 따로 정리해야 합니다. 시험 2주 전부터는 교과서를 처음부터 다시 읽으며 선생님이 강조한 부분과 자료(사진, 지도, 그래프)를 점검하는 것이 고득점의 마무리입니다.' },
      { t: '고등 사회 공부법', b: '고등 사회탐구는 선택과목(생활과윤리, 사회문화, 한국지리, 정치와법 등)에 따라 성격이 크게 다릅니다. 생활과윤리는 사상가별 입장의 미세한 차이를, 사회문화는 개념의 정확한 정의와 도표 해석을, 지리는 지도와 통계 자료 분석을 요구합니다. 공통 전략은 개념을 어설프게 여러 번 보는 것보다 한 번을 정확하게 잡는 것입니다. 수능형 문제는 개념의 경계를 파고들기 때문입니다. 기출 선지를 오답 노트로 만들어 "왜 맞고 왜 틀린지"를 개념서에 역으로 표시하며 공부하면, 같은 개념이 다른 모습으로 나와도 흔들리지 않습니다. 내신과 수능 준비를 분리하지 말고, 내신 기간의 정리 노트를 수능 개념서와 연결해 하나의 자산으로 누적해 가면 고3에서 사탐 부담이 크게 줄어듭니다. 선택과목 조합은 학습량과 표준점수 특성이 다르므로 고2 겨울 전에 결정해 집중하는 것이 유리합니다.' },
    ],
    problems: [
      { q: '외워도 외워도 끝이 없어요', a: '구조 없이 세부 사실부터 외우고 있기 때문입니다. 단원의 큰 흐름을 목차 수준에서 먼저 잡고 세부 내용을 그 안에 배치하면, 같은 내용도 절반의 노력으로 기억됩니다.' },
      { q: '비슷한 개념들이 자꾸 헷갈려요', a: '따로 배운 개념은 따로 정리하면 계속 헷갈립니다. 헷갈리는 개념끼리 한 표에 모아 공통점과 차이점을 직접 써보는 비교 정리가 가장 확실한 해결책입니다.' },
      { q: '자료(도표·지도) 문제가 어려워요', a: '자료 해석형 문항은 자료에서 단서를 찾는 순서가 있습니다. 제목-축-변화폭 순으로 읽는 루틴을 익히고 기출 자료 문항을 모아 연습하면 유형이 보이기 시작합니다.' },
      { q: '서술형에서 아는 내용인데 점수를 못 받아요', a: '채점 기준에 들어가는 핵심어를 빼고 쓰기 때문입니다. 답안에 반드시 들어가야 할 개념어를 의식적으로 포함해 쓰는 연습을 하면 같은 지식으로 점수가 달라집니다.' },
      { q: '한국사와 사회 과목을 어떻게 병행하죠', a: '두 과목을 같은 날 몰아 공부하면 내용이 섞입니다. 요일을 나눠 교차 배치하고, 한국사는 연표 축으로, 일반사회는 개념 비교 축으로 정리 방식 자체를 다르게 가져가면 혼동 없이 병행할 수 있습니다.' },
    ],
    help: '{p} 사회 과외는 학생의 교과서와 학교 필기를 기준으로 단원의 구조를 함께 잡는 것부터 시작합니다. 흐름 중심의 개념 정리 노트를 만들어 암기 부담을 줄이고, 학교별 출제 스타일에 맞춰 자료 해석과 서술형 대비를 병행합니다. 시사 이슈를 교과 개념과 연결해 설명해 학생이 사회 과목을 살아있는 지식으로 받아들이도록 돕고, 시험 기간에는 예상 문제와 핵심어 중심의 최종 점검으로 마무리합니다.',
    routine: '사회는 한 번에 오래 보는 것보다 짧게 여러 번 보는 것이 압도적으로 유리한 과목입니다. 권장 루틴은 수업 당일 배운 단원을 목차 구조로 정리(15분)하고, 이틀 뒤 백지에 흐름을 재현해보는 것입니다. 재현이 막히는 부분이 바로 다시 봐야 할 부분입니다. 주말에는 한 주간 배운 내용의 자료(지도, 도표, 사진)만 모아 훑어보세요. 역사라면 연표에 이번 주 배운 사건을 직접 추가하는 습관이 시대 감각을 만들어줍니다.',
    exam: '사회 내신 4주 플랜입니다. 4주 전에는 교과서를 목차 중심으로 통독하며 전체 구조를 잡고, 3주 전에는 단원별 세부 개념을 정리 노트로 만듭니다. 2주 전부터는 문제 풀이로 헷갈리는 개념을 골라내 비교 표로 정리하고, 학교 기출이 있다면 출제 스타일(자료형·서술형 비중)을 확인합니다. 마지막 주는 새로운 정리를 만들지 말고 기존 노트와 오답을 반복하세요. 시험 전날에는 선생님이 강조한 부분과 자료 페이지만 빠르게 훑는 것이 효율적입니다.',
    levels: '성적대별로 이렇게 접근하세요. 사회가 어려운 학생은 대부분 용어와 배경지식 부족이 원인이므로, 교과서를 문제집처럼 읽지 말고 이야기책처럼 통독하는 것부터 시작해야 합니다. 중위권은 아는 것 같은데 문제에서 틀리는 상태, 즉 개념의 정확도가 부족한 경우입니다. 헷갈리는 개념 비교표를 직접 만들면서 정확도를 끌어올리면 안정적으로 상위권에 진입합니다. 상위권은 자료 해석의 속도와 서술형 완성도가 승부처입니다. 기출 자료 문항을 시간 재고 푸는 훈련과, 핵심어가 빠지지 않는 답안 쓰기 연습으로 마지막 몇 점을 지켜내야 합니다.',
    parent: '가정에서는 뉴스나 시사 주제를 가볍게 대화로 나눠주세요. "요즘 물가가 왜 오를까" 같은 한 번의 대화가 교과서 한 단원의 이해를 돕습니다. 역사 유적지나 박물관 방문도 아이에게는 교과서가 현실이 되는 경험입니다.',
  },

  essay: {
    intro: '논술은 타고난 글재주의 영역이 아니라 훈련 가능한 기술입니다. 읽고, 생각을 구조로 정리하고, 근거를 갖춰 쓰는 과정에는 명확한 방법이 있습니다. {p} 학생들의 수행평가 글쓰기부터 대입 논술까지, 학년별로 무엇을 훈련해야 하는지 정리했습니다.',
    grades: [
      { t: '초등 글쓰기 공부법', b: '초등 시기는 쓰기에 대한 거부감을 없애는 것이 최우선입니다. 잘 쓰라고 요구하기 전에 자주 쓰는 환경을 만들어야 합니다. 독서 후 한 줄 감상, 주말 일기처럼 부담 없는 분량으로 시작해 점차 "생각과 이유"를 함께 쓰는 단계로 나아갑니다. 문단 개념을 익히는 것도 이 시기의 과제입니다. 하나의 문단에는 하나의 생각만 담는다는 원칙을 연습하면 글의 뼈대가 잡히기 시작합니다. 아이가 쓴 글은 고쳐주기보다 먼저 충분히 읽어주고 칭찬할 지점을 찾아주는 것이 계속 쓰게 만드는 힘입니다.' },
      { t: '중등 논술 공부법', b: '중학교부터는 주장하는 글의 구조를 익혀야 합니다. 주장-근거-예시-반론 고려의 틀을 배우고, 같은 주제로 개요를 짠 뒤 글로 완성하는 훈련을 반복합니다. 이 시기의 핵심 기술은 요약입니다. 긴 글을 세 문장으로 줄이는 연습은 독해력과 논리력을 동시에 키우며, 고등 논술의 제시문 분석으로 직결됩니다. 토론 활동도 큰 도움이 됩니다. 상대의 주장에서 허점을 찾고 내 주장을 방어하는 경험이 글의 논리를 단단하게 만듭니다. 수행평가 글쓰기는 채점 기준을 먼저 확인하고 기준에 맞춰 쓰는 전략적 접근을 익힐 기회입니다.' },
      { t: '고등 대입 논술 공부법', b: '대입 논술은 창의적인 글이 아니라 정확한 글을 요구합니다. 인문 논술은 제시문의 논지를 파악해 비교·비판·적용하는 능력을, 수리 논술은 풀이 과정을 논리적 서술로 보여주는 능력을 평가합니다. 공부의 시작은 목표 대학의 기출과 채점 기준 분석입니다. 대학마다 요구하는 답안 구조가 다르기 때문입니다. 개요 작성에 전체 시간의 3분의 1을 쓰는 습관을 들여야 답안이 흔들리지 않으며, 쓴 글은 반드시 첨삭을 받아 논리 비약과 근거 부족을 확인해야 합니다. 혼자 쓰기만 반복하는 것은 같은 실수를 강화할 뿐입니다.' },
    ],
    problems: [
      { q: '뭘 써야 할지 몰라 시작을 못해요', a: '생각이 없는 것이 아니라 꺼내는 도구가 없는 것입니다. 주제에 대해 질문 5개를 먼저 만들고 답해보는 브레인스토밍 루틴을 익히면 쓸 거리는 언제나 나옵니다.' },
      { q: '분량을 못 채우거나 같은 말을 반복해요', a: '개요 없이 바로 쓰기 때문입니다. 서론-본론1-본론2-결론에 들어갈 내용을 한 줄씩 먼저 정하고 쓰면 분량과 흐름이 동시에 해결됩니다.' },
      { q: '논리가 비약된다는 지적을 받아요', a: '주장과 근거 사이의 연결 고리를 스스로는 당연하게 느끼기 때문입니다. "왜냐하면"과 "예를 들어"를 의식적으로 채워 넣는 훈련과 타인의 첨삭이 필요한 지점입니다.' },
      { q: '제시문이 어려워 요약부터 막혀요', a: '문단별 핵심 문장을 찾아 연결하는 요약의 기술 문제입니다. 짧은 칼럼 요약부터 시작해 제시문 길이를 늘려가면 독해와 요약이 함께 자랍니다.' },
    ],
    help: '{p} 논술 과외는 학생의 글을 직접 읽고 첨삭하는 1:1 방식이라 학원 강의와 근본적으로 다릅니다. 매 수업 글쓰기 과제를 통해 쓰는 양을 확보하고, 첨삭에서는 문장 교정을 넘어 논리 구조와 근거의 타당성까지 짚어드립니다. 중등은 수행평가와 교내 대회, 고등은 목표 대학 기출 중심으로 커리큘럼을 구성하며, 독서 배경지식이 필요한 경우 주제별 읽기 자료를 함께 제공합니다.',
    routine: '글쓰기 실력은 쓰는 빈도에 비례합니다. 권장 루틴은 주 2회 짧은 글쓰기(독서 감상, 시사 논평 등 500자 내외)와 주 1회 요약 연습(칼럼이나 기사 한 편을 세 문장으로)입니다. 쓴 글은 하루 묵혔다가 스스로 소리 내어 읽어보세요. 어색한 문장은 눈보다 귀가 먼저 찾아냅니다. 첨삭을 받았다면 지적받은 부분을 반영해 같은 글을 한 번 더 고쳐 쓰는 것까지가 한 세트입니다. 고쳐 쓰기 없는 첨삭은 절반의 효과밖에 내지 못합니다.',
    exam: '대입 논술을 준비한다면 시기별 계획이 필요합니다. 고1~2는 요약과 개요 작성 훈련으로 기본기를 쌓는 시기이고, 고3 여름부터는 목표 대학 기출로 실전 훈련에 들어가야 합니다. 시험 4주 전에는 주 2회 실전 시간(대학별 90~120분)에 맞춰 완성글을 쓰고 첨삭받는 사이클을 돌립니다. 2주 전부터는 새 주제보다 이미 쓴 글을 다시 고쳐 쓰며 자신의 약점 패턴(논리 비약, 분량 배분)을 교정합니다. 수행평가 글쓰기라면 채점 기준표를 먼저 분석하고 기준별로 답안에 반영하는 연습이 가장 효율적입니다.',
    levels: '출발점에 따라 훈련이 다릅니다. 글쓰기 자체가 두려운 학생은 잘 쓰기를 목표로 하면 안 됩니다. 분량과 완성도를 따지지 않는 자유 글쓰기로 쓰는 행위에 익숙해지는 것이 먼저이고, 보통 4~6주면 거부감이 눈에 띄게 줄어듭니다. 쓰기는 하는데 글이 늘지 않는 학생은 첨삭 없이 혼자 쓰는 경우가 대부분입니다. 같은 글을 첨삭받고 고쳐 쓰는 과정을 반복해야 실력이 계단식으로 오릅니다. 대입 논술을 노리는 상위권은 대학별 출제 경향 분석과 시간 내 완성 훈련이 핵심이며, 늦어도 고3 여름 전에는 실전 사이클에 들어가야 안정적입니다.',
    parent: '가정에서는 아이의 글에 빨간펜을 들기 전에 독자가 되어주세요. "이 부분이 궁금한데 더 말해줄래?"라는 반응이 아이를 계속 쓰게 만듭니다. 저녁 식탁에서 "너는 어떻게 생각해? 왜?"라고 묻는 습관은 그 자체로 최고의 논술 수업입니다.',
  },
};


/* ========== 레이아웃 / CSS ========== */
const SITE = {
  name: '공부모아',
  // 도메인 사면 여기만 바꾸면 canonical/sitemap에 전부 반영됩니다.
  origin: 'https://gongbumoa.com',
  desc: '전국 5,067개 지역에서 초·중·고 1:1 맞춤 과외를 연결하는 과외 매칭 서비스',
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
function page({ title, desc, canonical, crumb = '', body, jsonld }) {
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
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
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
<a href="/#contact" class="btn btn-primary">무료 상담</a>
</div></header>
<div class="wrap">${crumb}</div>
${body}
<footer><div class="wrap">
<div class="foot">
<div><b>${SITE.name}</b>초·중·고 1:1 맞춤 과외<br>아이의 속도에 맞춰 함께 성장합니다.</div>
<div><b>수업</b><a href="/regions">지역별수업</a><a href="/schools">학교별수업</a><a href="/subjects">과목수업</a><a href="/others">기타수업</a></div>
<div><b>문의</b><a href="/#contact">무료 상담</a><a href="tel:01030388978">전화 010-3038-8978</a></div>
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

function ctaBlock(where) {
  return `<section><div class="wrap"><div class="cta">
<h2>${esc(where)} 무료 진단부터 받아보세요</h2>
<p>아이의 현재 상태를 정확히 알려드리고, 딱 맞는 선생님을 연결해 드려요.</p>
<div class="btns"><a href="/#contact" class="btn btn-yellow">무료 상담 신청</a><a href="tel:01030388978" class="btn btn-wg">📞 010-3038-8978</a></div>
</div></div></section>`;
}


/* ---------------- 과목별 학습 가이드 ---------------- */

function guideBlock(subj, place) {
  const g = GUIDES[subj.slug];
  if (!g) return '';
  const fill = s => esc(s.split('{p}').join(place));
  return `
<section><div class="wrap">
<span class="sec-tag">공부법 가이드</span>
<h2>${esc(place)} ${subj.name} 공부, 이렇게 시작하세요</h2>
<p class="sub" style="max-width:760px">${fill(g.intro)}</p>
${g.grades.map(x => `<div class="faq" style="margin-bottom:14px"><h3>${esc(x.t)}</h3><p style="margin-top:6px">${fill(x.b)}</p></div>`).join('')}
</div></section>

<section><div class="wrap">
<span class="sec-tag">자주 겪는 어려움</span>
<h2>${subj.name} 공부에서 이런 고민 있지 않나요?</h2>
${g.problems.map(x => `<div class="faq"><h3>"${esc(x.q)}"</h3><p>${fill(x.a)}</p></div>`).join('')}
</div></section>

<section><div class="wrap">
<span class="sec-tag">학습 루틴</span>
<h2>${subj.name} 주간 학습 루틴과 시험 대비</h2>
<div class="faq" style="margin-bottom:14px"><h3>평소 주간 루틴</h3><p style="margin-top:6px">${fill(g.routine)}</p></div>
<div class="faq"><h3>시험 4주 대비 플랜</h3><p style="margin-top:6px">${fill(g.exam)}</p></div>
<div class="faq" style="margin-top:14px"><h3>지금 성적대에 맞는 접근법</h3><p style="margin-top:6px">${fill(g.levels)}</p></div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">과외 활용법</span>
<h2>${esc(place)}에서 ${subj.name} 과외로 도움받는 방법</h2>
<p class="sub" style="max-width:760px">${fill(g.help)}</p>
<div class="card" style="max-width:760px"><h3>💡 학부모님께 드리는 팁</h3><p style="margin-top:8px">${fill(g.parent)}</p></div>
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
    + `초·중·고 1:1 맞춤 수업으로 ${subj.name} 성적을 올려드립니다. 무료 진단 상담 후 선생님을 연결해 드려요.`;

  const siblings = sgg.list.filter(d => !dong || d[0] !== dong.name).slice(0, 40);

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

  const faqs = [
    { q: `${place}에서도 수업이 가능한가요?`, a: `네, ${sido.full} ${sgg.disp} ${place} 전 지역에서 방문 수업과 화상 수업 모두 가능합니다. 지역과 일정에 맞춰 선생님을 배정해 드려요.` },
    { q: `${subj.name} 과외는 몇 학년부터 받을 수 있나요?`, a: `초등학생부터 고등학생까지 모두 가능합니다. 학년과 현재 실력에 따라 커리큘럼을 다르게 구성합니다.` },
    { q: `수업 전에 상담을 먼저 받을 수 있나요?`, a: `무료 진단 상담을 먼저 진행합니다. 아이의 현재 상태를 확인한 뒤 수업 방향을 제안해 드리고, 그 후에 시작 여부를 결정하시면 됩니다.` },
    { q: `선생님이 마음에 들지 않으면 어떻게 하나요?`, a: `수업 초반에 맞지 않는다고 느끼시면 다른 선생님으로 다시 매칭해 드립니다. 부담 없이 말씀해 주세요.` },
  ];
  const gd = GUIDES[subj.slug];
  const fillT = s => s.split('{p}').join(place);
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      ...faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      ...(gd ? gd.problems.map(p2 => ({ '@type': 'Question', name: p2.q, acceptedAnswer: { '@type': 'Answer', text: fillT(p2.a) } })) : []),
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

${guideBlock(subj, place)}

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
${siblings.map(d => `<a href="${parentPath}/${d[3]}/${subj.slug}">${esc(d[0])} ${subj.name}과외</a>`).join('')}
</div>
</div></section>` : ''}

${faqBlock(faqs)}

${ctaBlock(place)}`;

  return page({ title, desc, canonical: url, crumb: crumbs(crumbItems), body, jsonld: [jsonld, faqLd, crumbLd] });
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
${sgg.list.map(d => `<a href="${base}/${d[3]}/math">${esc(d[0])} 과외</a>`).join('')}
</div>
</div></section>

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
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '지역별수업', url: '/regions' }, { name: sido.full }]),
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
<div class="card"><div class="ic">🧭</div><h3>잘 모르겠다면</h3><p>무료 진단 상담에서 전 과목 상태를 확인하고 우선순위를 함께 정해드립니다. 막연한 불안보다 정확한 진단이 먼저입니다.</p></div>
</div>
</div></section>

<section><div class="wrap">
<span class="sec-tag">학년별 추천</span>
<h2>학년별로 이런 조합을 추천해요</h2>
<div class="grid g3">
<div class="card"><div class="ic">🎒</div><h3>초등학생</h3><p>수학 연산·독서 습관이 최우선입니다. 수학 또는 국어 1과목으로 시작해 공부 습관을 만들고, 영어는 흥미 위주로 병행하는 조합이 좋습니다.</p></div>
<div class="card"><div class="ic">📚</div><h3>중학생</h3><p>수학+영어 조합이 가장 많습니다. 고등 과정의 바탕이 되는 두 과목의 개념을 이 시기에 완성해야 고등에서 선택지가 넓어집니다.</p></div>
<div class="card"><div class="ic">🎯</div><h3>고등학생</h3><p>내신 등급이 흔들리는 과목 1~2개에 집중 투자하세요. 수능 선택과목 전략까지 고려해 진단 상담에서 우선순위를 잡아드립니다.</p></div>
</div>
</div></section>

${faqBlock([
  { q: '여러 과목을 동시에 수강할 수 있나요?', a: '가능합니다. 과목별로 선생님을 각각 배정하거나, 가능한 경우 한 선생님이 두 과목을 함께 진행할 수도 있습니다. 일정은 조율해서 맞춰드려요.' },
  { q: '중간에 과목을 바꿀 수 있나요?', a: '네, 시험 기간에는 급한 과목으로 잠시 전환했다가 돌아오는 것도 가능합니다. 학생 상황에 맞춰 유연하게 운영합니다.' },
  { q: '과목마다 선생님이 다른가요?', a: '기본적으로 과목 전문 선생님을 배정합니다. 전공과 지도 경험을 확인한 선생님이 해당 과목을 맡아요.' },
  { q: '어떤 과목이 개설되어 있나요?', a: '수학, 영어, 국어, 과학, 사회, 논술 6개 과목을 초등부터 고등까지 운영합니다. 이 외 과목이 필요하면 상담에서 문의해 주세요.' },
])}

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
${guideBlock(subj, '전국')}

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
    crumb: crumbs([{ name: '홈', url: '/' }, { name: '과목수업', url: '/subjects' }, { name: `${subj.name}과외` }]),
    body,
  });
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
<div class="cta-row"><a href="/#contact" class="btn btn-primary">미리 상담 남기기 →</a><a href="/regions" class="btn btn-ghost">지역별수업 보기</a></div>
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
    `${origin}/`, `${origin}/regions`, `${origin}/subjects`,
    ...SUBJECTS.map(s => `${origin}/subjects/${s.slug}`),
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
    for (const subj of SUBJECTS) urls.push(`${base}/${subj.slug}`);
    for (const d of v.l) {
      for (const subj of SUBJECTS) urls.push(`${base}/${d[3]}/${subj.slug}`);
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
    `<meta name="description" content="${SITE.desc}. 무료 진단 상담 후 딱 맞는 선생님을 연결해 드립니다.">`,
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
    `<meta name="twitter:card" content="summary">`,
    `<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="${origin}/rss.xml">`,
    ...ld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`),
  ].filter(Boolean).join('\n');
  HOME_CACHE = HOME_HTML.replace('</head>', meta + '\n</head>');
  return HOME_CACHE;
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
          <div style="font-size:14px;color:#232741;margin-bottom:12px">⏰ 빠른 응답이 매칭률을 높입니다</div>
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
  if (!name || !grade || !/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(phone) || !addr || !addrDetail) {
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
  return json({ ok: true });
}

/* ---------------- 라우터 ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = SITE.origin || url.origin;
    const path = decodeURIComponent(url.pathname);

    if (path === '/api/consult' && request.method === 'POST') {
      return handleConsultPost(request, env);
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

> ${SITE.desc}. 초등·중등·고등 학생을 대상으로 수학, 영어, 국어, 과학, 사회, 논술 과목의 1:1 방문·화상 과외를 무료 진단 후 연결한다. 대한민국 전국 17개 시도, 255개 시군구, 5,067개 읍·면·동 단위로 지역 페이지를 제공한다.

## 주요 페이지
- [지역별 과외 찾기](${origin}/regions): 시도 > 시군구 > 동 순서로 지역을 골라 과외를 찾는 허브
${subj}

## URL 구조
- 시도: ${origin}/seoul 처럼 로마자 시도명
- 시군구: ${origin}/seoul/gangnam-gu
- 동+과목: ${origin}/seoul/gangnam-gu/yeoksam-dong/math (역삼동 수학과외)
- 과목 슬러그: math(수학), english(영어), korean(국어), science(과학), social(사회), essay(논술)

## 콘텐츠
각 지역 페이지는 해당 과목의 초·중·고 학년별 공부법, 자주 겪는 어려움과 해결법, 주간 학습 루틴, 시험 4주 대비 플랜, 성적대별 접근법, 과외 활용 안내를 담고 있다.

## 문의
무료 진단 상담: ${origin}/#contact
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

    if ((seg[0] === 'schools' || seg[0] === 'others') && seg.length === 1) {
      return html(comingSoonPage(seg[0], origin + path));
    }

    const sido = getSido(seg[0]);
    if (!sido) return notFound(origin);

    if (seg.length === 1) return html(sidoHubPage({ sido, url: origin + path }));

    const sgg = getSgg(sido.key, seg[1]);
    if (!sgg) return notFound(origin);

    if (seg.length === 2) return html(sggHubPage({ sido, sgg, url: origin + path }));

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

