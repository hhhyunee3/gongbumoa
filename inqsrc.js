// 상담 신청 알림에 붙이는 "신청 페이지 / 처음 들어온 페이지 / 유입" (2026-11-05, 그룹스터디센터 방식을 전 사이트로).
// 브라우저: 세션 첫 페이지에서 경로(cn_f)와 그때의 referrer(cn_r)를 sessionStorage 에 적어 두고(CAPTURE_JS),
//           폼 제출 때 지금 경로(ctx_p)·cn_f(ctx_f)·cn_r(ctx_r)를 함께 보낸다. 키 이름은 그룹스터디센터 callnotify.js 와 같다.
// 서버: 경로만 받아 이 사이트 주소로 전체 URL 을 만든다(다른 도메인 링크는 만들지 않는다). referrer 는 '네이버 검색 (검색어: …)' 한 줄로.
export const CAPTURE_JS = `<script>(function(){try{var S=sessionStorage;if(S.getItem('cn_f')===null){S.setItem('cn_f',location.pathname+location.search);S.setItem('cn_r',document.referrer||'')}}catch(e){}})()</script>`;
// 폼 제출 본문에 펼쳐 넣는 식(브라우저 쪽 JS 문자열). 예: body:JSON.stringify(Object.assign({...}, INQ_CTX))
export const CTX_EXPR = `(function(){var g=function(k){try{return sessionStorage.getItem(k)||''}catch(e){return ''}};return {ctx_p:location.pathname+location.search,ctx_f:g('cn_f'),ctx_r:g('cn_r')}})()`;

const SOURCES = [
  [/^(m\.)?search\.naver\.com$/, '네이버 검색', 'query'],
  [/(^|\.)naver\.com$/, '네이버', ''],
  [/^(www\.)?google\.[a-z.]+$/, '구글', 'q'],
  [/^(m\.)?search\.daum\.net$/, '다음 검색', 'q'],
  [/(^|\.)daum\.net$/, '다음', ''],
  [/(^|\.)bing\.com$/, '빙', 'q'],
  [/(^|\.)zum\.com$/, '줌', 'query'],
  [/(^|\.)yahoo\.com$/, '야후', 'p'],
  [/^(chatgpt\.com|chat\.openai\.com)$/, 'ChatGPT', ''],
  [/^gemini\.google\.com$/, 'Gemini', ''],
  [/(^|\.)perplexity\.ai$/, 'Perplexity', ''],
  [/(^|\.)(instagram|facebook|youtube|kakao)\.com$|^t\.co$/, '', ''],
];
const clip = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';

export function describeRef(ref, host) {
  let u; try { u = new URL(clip(ref, 1000)); } catch (e) { return '직접 (주소 입력·즐겨찾기·앱 등)'; }
  if (!/^https?:$/.test(u.protocol)) return '직접 (주소 입력·즐겨찾기·앱 등)';
  const h = u.hostname.toLowerCase(), base = String(host || '').replace(/^www\./, '');
  if (h === base || h === 'www.' + base) return '사이트 안에서 이동';
  for (const [re, label, key] of SOURCES) {
    if (!re.test(h)) continue;
    const q = key ? clip(u.searchParams.get(key) || '', 60).trim() : '';
    return (label || h) + (q ? ` (검색어: ${q})` : '');
  }
  return h;
}

// 경로 → 이 사이트 전체 URL. '/' 로 시작하지 않으면(옛 폼의 '제목 · /경로' 포함) 마지막 ' · /…' 부분을 꺼내 쓴다.
export function pageUrl(origin, p) {
  p = clip(String(p || ''), 300).trim();
  if (!p.startsWith('/')) { const i = p.lastIndexOf(' · /'); p = i >= 0 ? p.slice(i + 3).trim() : ''; }
  if (!p.startsWith('/') || p.startsWith('//')) return '';
  try { const u = new URL(p, origin); return u.origin === new URL(origin).origin ? u.href : ''; } catch (e) { return ''; }
}

// 신청 본문 d 에서 세 항목을 만든다. legacyPage 는 예전 page 값(제목 · 경로)이 있으면 넘긴다.
export function inquirySource(d, origin, legacyPage = '') {
  const host = new URL(origin).hostname;
  const page = pageUrl(origin, d.ctx_p) || pageUrl(origin, legacyPage);
  const first = pageUrl(origin, d.ctx_f);
  const source = d.ctx_f || d.ctx_r ? describeRef(d.ctx_r, host) : '';
  return { pageUrl: page, firstUrl: first, source };
}

// 페이지 틀이 여러 벌인 한 파일짜리 워커(공부모아·레벨업과외)용: HTML 응답의 </body> 앞에 CAPTURE_JS 를 붙인다.
export async function withCapture(res) {
  const r = await res;
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('text/html') || !r.body || r.status !== 200) return r;
  const html = await r.text();
  const i = html.lastIndexOf('</body>');
  if (i < 0 || html.includes("getItem('cn_f')===null")) return new Response(html, r);
  const h = new Headers(r.headers); h.delete('content-length');
  return new Response(html.slice(0, i) + CAPTURE_JS + html.slice(i), { status: r.status, statusText: r.statusText, headers: h });
}

// 텔레그램 본문: URL 은 한글이 보이게 풀어서 쓰고(decodeURI), 누르면 원래 주소로 열리도록 text_link 엔티티를 단다.
// 일반 텍스트 + entities 라 이스케이프가 필요 없다. 오프셋은 UTF-16 길이(JS 문자열 길이)와 같다.
const safeDecode = u => { try { return decodeURI(u); } catch (e) { return u; } };
export function tgPayload(chat, text) {
  const entities = [];
  let out = '', last = 0;
  for (const m of text.matchAll(/https?:\/\/[^\s]+/g)) {
    out += text.slice(last, m.index);
    const shown = safeDecode(m[0]);
    entities.push({ type: 'text_link', offset: out.length, length: shown.length, url: m[0] });
    out += shown; last = m.index + m[0].length;
  }
  out += text.slice(last);
  return { chat_id: chat, text: out, entities, disable_web_page_preview: true };
}
export const tgPreview = text => tgPayload(0, text).text;
