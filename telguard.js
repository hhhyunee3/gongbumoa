// 전화번호 노출 정리 (2026-10-10 사용자 요청: "모든 사이트 푸터에 내 전화번호 삭제, 피씨버전에선 번호 못보게").
// 워커가 만든 HTML 응답을 마지막에 한 번 거친다 — 페이지 코드·문장 풀을 사이트마다 고치지 않고 한곳에서 처리한다.
//  1) <footer> 안의 번호는 지운다 (휴대폰에서도 안 보임). tel: 링크도 함께 지운다.
//  2) 그 밖의 본문 번호는 <span class="pc-hide"> 로 감싸고, tel: 링크와 함께 PC 너비(901px 이상)에서 숨긴다.
//  head 의 meta·JSON-LD(검색엔진용)와 script·style 안은 건드리지 않는다.
const TEL = '010-3038-8978';
const TEL_RE = /010[-.\s]?3038[-.\s]?8978/g;
const CSS = '<style id="pc-tel">@media (min-width:901px){.pc-hide,a[href^="tel:"],.callmodal,#callmodal{display:none!important}}</style>';

function wrapText(seg) {
  // 태그 바깥 텍스트에만 번호 감싸기. script/style/textarea/title/noscript 블록은 먼저 빼 두었다가 되돌린다
  // (스크립트 안의 '<' 때문에 태그 경계를 잘못 읽는 일을 막는다).
  const keep = [];
  let x = seg.replace(/<(script|style|textarea|title|noscript)\b[\s\S]*?<\/\1>/gi, m => `\u0000${keep.push(m) - 1}\u0000`);
  x = x.split(/(<[^>]+>)/).map(p => p.startsWith('<') ? p : p.replace(TEL_RE, s => `<span class="pc-hide">${s}</span>`)).join('');
  return x.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
}
function cleanFooter(f) {
  let x = f.replace(/<a\b[^>]*href="tel:[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  x = x.replace(/(\s*[·|ㆍ]\s*)?(대표\s*)?(상담|전화|문의|번호|연락처|Tel\.?|TEL|☎|📞)?\s*[:：]?\s*010[-.\s]?3038[-.\s]?8978(\s*[·|ㆍ]\s*(문자\s*상담|문자|카톡)?)?/g, '');
  x = x.replace(/<(span|p|div|li|strong|b|em)\b[^>]*>\s*<\/\1>/gi, '');
  return x;
}
export function guardHtml(html) {
  if (!html.includes('3038') && !/href="tel:/.test(html)) return html;
  const i = html.search(/<body[\s>]/i); if (i < 0) return html;
  let head = html.slice(0, i), body = html.slice(i);
  body = body.replace(/<footer\b[\s\S]*?<\/footer>/gi, cleanFooter);
  body = wrapText(body);
  if (!head.includes('id="pc-tel"')) head = head.includes('</head>') ? head.replace('</head>', CSS + '</head>') : head + CSS;
  return head + body;
}
export async function guardResponse(res) {
  const r = await res;
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('text/html') || !r.body) return r;
  const html = guardHtml(await r.text());
  const h = new Headers(r.headers); h.delete('content-length');
  return new Response(html, { status: r.status, statusText: r.statusText, headers: h });
}
export const OWNER_TEL = TEL;
