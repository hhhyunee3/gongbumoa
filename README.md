# 공부모아 (gongbumoa)

초·중·고 1:1 맞춤 과외 사이트. Cloudflare Workers로 배포하고, GitHub에 올리면 자동 배포됩니다.

## 파일 구성

```
gongbumoa/
├── .github/workflows/deploy.yml   자동 배포 설정
├── public/images/                  본문 사진 1.jpg ~ 42.jpg
├── README.md
├── gongbumoa_worker.js             사이트 전체 (홈 + 지역 페이지 + 라우팅)
├── regions.js                      법정동 데이터 5,067개 (자동 생성)
├── schools.js                      학교 데이터 (자동 생성)
└── wrangler.toml                   Cloudflare 설정
```

> `public/` 안의 파일은 사이트 루트 기준 주소로 그대로 서빙됩니다.
> 예: `public/images/1.jpg` → `https://gongbumoa.com/images/1.jpg`
> 사진을 추가할 때는 `public/images/` 에 넣고, `gongbumoa_worker.js` 의
> `PHOTO_COUNT` 값을 파일 개수에 맞게 올려야 합니다.

---

## 처음 세팅 (딱 한 번만)

### 1단계 — GitHub 저장소 만들기

1. https://github.com/new 접속
2. **Repository name** 에 `gongbumoa` 입력
3. **Public** 선택
4. 아래 체크박스는 전부 **해제**한 채로 (README 등 추가하지 않기)
5. **Create repository** 클릭

### 2단계 — 파일 올리기

만들어진 저장소 화면에서:

1. **uploading an existing file** 링크 클릭
   (또는 `Add file` → `Upload files`)
2. 압축을 푼 폴더 안의 파일을 **전부 드래그**해서 올리기
3. 아래 **Commit changes** 클릭

> **주의:** `.github` 폴더는 이름이 점(.)으로 시작해서 파일 탐색기에서 숨겨져 있을 수 있어요.
> 숨김 파일 보기를 켜고 이 폴더도 꼭 같이 올려야 자동 배포가 작동합니다.
> 폴더째 드래그가 안 되면, 저장소에서 `Add file` → `Create new file` 을 누르고
> 파일명에 `.github/workflows/deploy.yml` 을 그대로 입력하면 폴더가 자동으로 만들어집니다.

### 3단계 — Cloudflare 값 2개 준비

**API 토큰**
1. Cloudflare 대시보드 → 우측 상단 프로필 → **My Profile**
2. **API Tokens** → **Create Token**
3. **Edit Cloudflare Workers** 템플릿의 `Use template` 클릭
4. 그대로 두고 생성 → 나온 토큰 문자열 복사 (이 화면을 벗어나면 다시 못 봅니다)

**Account ID**
1. Cloudflare 대시보드 → 좌측 메뉴 **Compute (Workers)** 클릭
2. 우측에 표시된 **Account ID** 복사

### 4단계 — GitHub에 비밀값 등록

GitHub 저장소에서 **Settings** → 좌측 **Secrets and variables** → **Actions**
→ **New repository secret** 버튼으로 아래 2개를 각각 등록합니다.

| Name (정확히 이대로) | Secret |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 3단계에서 복사한 API 토큰 |
| `CLOUDFLARE_ACCOUNT_ID` | 3단계에서 복사한 Account ID |

### 5단계 — 배포 확인

1. 저장소 상단 **Actions** 탭 클릭
2. "Deploy to Cloudflare Workers" 가 노란 점(진행 중) → 초록 체크(성공) 로 바뀌는지 확인
3. 성공하면 `https://gongbumoa.<계정이름>.workers.dev` 에서 사이트 확인

> 만약 빨간 X가 뜨면 그 줄을 클릭해 로그를 보세요.
> 대부분 4단계의 Secret 이름 오타이거나, API 토큰 권한이 부족한 경우입니다.

---

## 이후 수정하는 방법

1. GitHub에서 파일 클릭 → 연필 아이콘(Edit) → 수정 → Commit
2. 자동으로 다시 배포됩니다 (약 30초)

파일을 통째로 바꾸려면 `Add file` → `Upload files` 로 같은 이름의 파일을 올리면 덮어써집니다.

---

## 사이트 구조

### 페이지 수

법정동 기준으로 약 **32,000개 페이지**가 자동 생성됩니다.

- 동 × 과목: 5,067 × 6 = 30,402
- 시군구 × 과목: 255 × 6 = 1,530
- 허브 페이지: 280

정적 파일로 만들면 Cloudflare 무료 플랜 상한(20,000개)을 넘기 때문에,
Worker가 주소를 받아 그때그때 페이지를 만듭니다.

### URL 예시

| 유형 | 주소 |
|---|---|
| 지역 허브 | `/지역` |
| 시도 | `/서울` |
| 시군구 | `/서울/강남구` |
| 시군구 + 과목 | `/서울/강남구/수학과외` |
| 동 + 과목 | `/서울/강남구/역삼동/수학과외` |
| 과목 전국 | `/과목/수학과외` |

동 이름은 전국에 중복이 많아서(교동 18곳, 중동 13곳) 주소에 시도·시군구를 함께 넣어 구분합니다.

---

## 자주 바꾸게 되는 것

| 하고 싶은 것 | 수정할 곳 |
|---|---|
| 과목 추가/삭제 | `gongbumoa_worker.js` 의 `SUBJECTS` 배열 |
| 도메인 연결 후 주소 반영 | `gongbumoa_worker.js` 의 `SITE.origin` |
| 홈페이지 내용 | `gongbumoa_worker.js` 의 `HOME_HTML` |
| 색상·폰트 | `gongbumoa_worker.js` 의 `CSS` 상수 |
| 워커 이름 | `wrangler.toml` 의 `name` |

과목을 하나 추가하면 지역 페이지가 5,000개씩 자동으로 늘어납니다.

---

## 도메인 연결 (나중에)

1. Cloudflare에 도메인 추가 (네임서버 변경)
2. `wrangler.toml` 의 `routes` 주석 해제 후 도메인 입력
3. `gongbumoa_worker.js` 의 `SITE.origin` 을 실제 주소로 변경
4. Commit → 자동 배포

---

## SEO

- `/sitemap.xml` — 사이트맵 인덱스 (시도별 분할)
- `/robots.txt` — 자동 생성
- 페이지마다 고유 title / description / canonical / JSON-LD

배포 후 Google Search Console에 `sitemap.xml` 을 등록하면 색인이 시작됩니다.
