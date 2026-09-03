/**
 * 레벨업과외 · 공부모아 — 상담 신청을 구글 시트에 모으는 스크립트
 * ─────────────────────────────────────────────────────────────
 * 두 사이트의 신청이 하나의 시트로 들어옵니다.
 * 사이트별로 탭이 자동으로 나뉘고, "전체" 탭에 모두 함께 쌓입니다.
 *
 * ■ 설치 (한 번만, 약 5분)
 *
 *  1) 구글 드라이브 → 새로 만들기 → Google 스프레드시트
 *     이름을 "과외 상담신청" 정도로 지어둡니다.
 *
 *  2) 시트 상단 [확장 프로그램] → [Apps Script]
 *
 *  3) 기본 코드를 모두 지우고 이 파일 내용을 통째로 붙여넣기 → 저장(💾)
 *
 *  4) 오른쪽 위 [배포] → [새 배포]
 *       유형(톱니바퀴) → 웹 앱
 *       설명           → 상담신청 수집
 *       실행 계정      → 나
 *       액세스 권한    → 모든 사용자      ← 이걸 꼭 확인하세요
 *     [배포] → 구글 계정 권한 승인
 *
 *  5) 나오는 "웹 앱 URL"을 복사합니다.
 *     https://script.google.com/macros/s/AKfy.../exec
 *
 *  6) 두 워커에 같은 URL을 넣습니다.
 *     Cloudflare → Workers & Pages → 각 워커 → Settings → Variables
 *       이름  SHEET_WEBHOOK_URL
 *       값    (5번에서 복사한 URL)
 *     · level-up-lesson
 *     · gongbumoa
 *     둘 다 넣어야 두 사이트가 함께 쌓입니다.
 *
 *  7) 사이트에서 상담을 한 건 넣어보고 시트에 줄이 생기는지 확인합니다.
 *
 * ■ 코드를 고친 뒤에는
 *   [배포] → [배포 관리] → 연필 아이콘 → 버전 "새 버전" → [배포]
 *   새 배포를 만들면 URL이 바뀌므로, 기존 배포를 수정하세요.
 */

var ALL_TAB = '전체';

var HEADERS = [
  '접수시각', '사이트', '학생이름', '학부모연락처', '학년',
  '희망과목', '주소', '문의내용', '유입페이지'
];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var site = String(d.site || '기타').trim();
    var subjects = Array.isArray(d.subjects)
      ? d.subjects.join(', ')
      : String(d.subjects || '');

    var row = [
      d.atDisplay || new Date(),
      site,
      d.name || '',
      d.phone || '',
      d.grade || '',
      subjects,
      d.address || '',
      d.message || '',
      d.page || ''
    ];

    // 사이트별 탭 + 전체 탭에 각각 한 줄씩
    appendRow_(ss, site, row);
    appendRow_(ss, ALL_TAB, row);

    return json_({ ok: true });
  } catch (err) {
    // 실패해도 워커 쪽 메일 발송은 이미 끝났으므로 신청 자체는 살아 있다.
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

/** 탭이 없으면 만들고, 헤더가 없으면 붙인 뒤 한 줄 추가한다. */
function appendRow_(ss, tabName, row) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) sheet = ss.insertSheet(tabName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#EAF3FB');
    sheet.setFrozenRows(1);
    sheet.getRange('D:D').setNumberFormat('@');   // 연락처: 앞자리 0 보존
    sheet.setColumnWidth(1, 155);                  // 접수시각
    sheet.setColumnWidth(7, 240);                  // 주소
    sheet.setColumnWidth(8, 280);                  // 문의내용
    sheet.setColumnWidth(9, 260);                  // 유입페이지
  }
  sheet.appendRow(row);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 설치가 잘 됐는지 확인용. Apps Script 편집기에서 이 함수를 직접 실행하면
 * 시트에 테스트 줄이 하나 들어갑니다. 확인 후 그 줄은 지우세요.
 */
function 테스트_한줄넣기() {
  doPost({
    postData: {
      contents: JSON.stringify({
        site: '테스트',
        name: '홍길동',
        phone: '010-1234-5678',
        grade: '중2',
        subjects: ['수학'],
        address: '[06234] 서울 강남구 테헤란로 1, 101호',
        message: '설치 확인용 테스트입니다. 확인 후 이 줄은 지워주세요.',
        page: '역삼동 수학 과외 · /seoul-gangnamgu-yeoksamdong-math',
        atDisplay: new Date().toLocaleString('ko-KR')
      })
    }
  });
}
