# stock-front-service

주식 모의투자 서비스의 사용자용 Next.js 앱입니다.

## 현재 라우트

- `/`
- `/login`
- `/portfolio`
- `/corporate-actions`
- `/reports`
- `/supply-demand`
- `/supply-demand/admin`

## 역할

- 관심 종목과 최신가 표시
- 선택 종목 주문장 표시
- 실제 DB/배치 기반 자동장 상태 표시
- 현재가 기준 주문 입력 UI
- 주문장 기준 주문 입력 UI
- 미체결 주문 목록
- 미체결/부분체결 주문 정정과 부분 취소 UI
- 평가 자산, 수익률, 누적 손익 요약
- 배당/신주 배정 내역 표시
- 주주배정/일반공모 유상증자 목록, 상세와 청약
- 장 마감 자산 기록 표시
- 로그인, 회원가입, Naver/Kakao OAuth 진입

## 실행

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run verify:corporate-actions
npm run verify:contract
```

## 포트

- dev: `3005`
- start: `3005`

## 환경 변수

`.env.local`은 `.env.example`을 기준으로 만듭니다.

```bash
NEXT_PUBLIC_API_MODE=direct
NEXT_PUBLIC_STOCK_API_URL=http://localhost:20480
NEXT_PUBLIC_AUTH_API_URL=http://localhost:9000
```

## 연동 포인트

- 기본 local direct 모드:
  - Stock API base: `http://localhost:20480`
  - Auth/OAuth API base: `http://localhost:9000`
- Gateway/Eureka 모드:
  - `NEXT_PUBLIC_API_MODE=gateway`
  - `NEXT_PUBLIC_API_URL=http://localhost:8080`
- Stock API: `/api/stock/v1/**`
- Virtual Market API: `/api/stock/v1/markets/virtual-market`
- Order Book Market API: `/api/stock/v1/markets/order-book-market`
- Auto Market API: `/api/stock/v1/markets/auto-market`
- Corporate Action Feed API: `/api/stock/v1/markets/corporate-actions?actionType=PAID_IN_CAPITAL_INCREASE&limit=200`
- Auth API: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/api/users`
- OAuth:
  - `/oauth2/authorize/naver-stock`
  - `/oauth2/authorize/kakao-stock`

## 참고

- 홈 화면은 `stock-back-service` API와 연동합니다.
- 홈 화면은 로그인 후 먼저 `/api/stock/v1/accounts/me/status`로 주식계좌 존재 여부를 확인합니다. 계좌가 없으면 투자 워크스페이스를 열지 않고 계좌 만들기/기존 계좌 재확인 화면을 보여준 뒤, 사용자가 명시적으로 선택할 때 `POST /api/stock/v1/accounts/me`를 호출합니다.
- 홈 화면 주문은 `VIRTUAL_PRICE`, 공급/수요 화면 주문은 `ORDER_BOOK` market type으로 접수합니다.
- 공통 API 함수는 주문 접수, 전체 취소, 정정, 부분 취소를 모두 stock-back 주문 원장 API로 보냅니다.
- 홈 주문 목록은 미체결/부분체결 주문의 전체 취소, 부분 취소, LIMIT 주문 정정을 지원합니다.
- 홈과 공급/수요 주문 입력은 서버의 호가 단위와 가격제한폭 정책에 맞춰 LIMIT 주문을 사전 검증합니다.
- 홈 상단 지표는 포트폴리오와 손익 요약 API를 함께 읽어 총자산, 현금, 평가금액, 총 손익, 실현손익, 미체결 수를 표시합니다.
- `/corporate-actions`는 유상증자 공개 이벤트 목록과 사용자 권리 내역을 함께 읽습니다. 주주배정은 계좌별 배정 권리 수량, 일반공모는 전체 남은 모집 수량을 청약 상한으로 표시합니다.
- 기업 이벤트 feed와 사용자 권리·예수금은 5초 주기로 갱신해 다른 사용자·자동 참여자의 청약 및 배치 상태 전이를 반영합니다.
- `/reports`는 최신 전체 장마감일을 기준으로 종가·거래실적, 5/20/60일 성과와 차트, 최근 20거래일 체결 빈도, 참가자 수급, 마감 보유 집중도, 기준일까지의 기업 이벤트, 동일 기준일 시장 순위, 관리자 평가와 데이터 품질을 표시합니다. 현재 호가·슬리피지·미체결 주문·주관사 운영 상태와 주문 집행 품질은 제외하며 5분 주기로 갱신합니다.
- 유상증자 청약은 서버 계약과 동일하게 청약 기간 중 `AFTER_CLOSE` 세션에서만 활성화되며, 접수 후 이벤트·권리·포트폴리오·보유 캐시를 갱신합니다.
- 홈 최근 체결 카드는 순금액, 비용, 매도 실현손익을 표시합니다.
- 공급/수요 화면은 브라우저 localStorage 시뮬레이션을 하지 않고 stock-back API와 batch가 만든 실제 주문장/자동장 상태를 읽습니다.
- 공급/수요 화면은 사용자의 주문장 주문 상태와 최근 주문장 체결 내역을 함께 읽고, 미체결/부분체결 주문의 전체 취소를 지원합니다.
- 공급/수요 화면의 주문/체결 조회는 `/orders?marketType=ORDER_BOOK`, `/executions?source=INTERNAL_ORDER_BOOK`를 사용합니다. 최근 50건 응답을 받은 뒤 프론트에서 시장을 필터링하지 않습니다.
- 공급/수요 관리자 화면은 `ADMIN` 계정 로그인 후 접근하는 내부 운영 화면입니다. stock-back 쓰기 API도 `ADMIN` 권한을 요구합니다.
- 공급/수요 관리자 화면에서 종목별 호가 단위와 가격제한폭을 함께 설정합니다. 기본값은 1원 tick, ±30%입니다.
- 공급/수요 관리자 화면의 유상증자는 주주배정 또는 일반공모만 지원합니다. 두 방식 모두 발행수·발행가·청약 시작/마감일·납입일·신주상장일을 입력하고, 주주배정에만 권리락일을 입력합니다. 보유자 snapshot이 필요한 주주배정·현금배당·무상증자·주식배당의 권리락일은 현재 시뮬레이션 날짜보다 미래만 허용합니다. 액면분할은 효력일, 현금배당은 1주당 배당금/배당락일/지급일, 무상증자/주식배당은 배정 주식수/권리락일/신주상장일을 입력합니다.
- 공급/수요 관리자 화면은 선택 종목의 기업 이벤트 이력을 조회합니다.
- 공급/수요 관리자 화면은 주문장 종목별 평가 보고서를 발행, 수정, 삭제할 수 있습니다. 보고서에는 1~10 점수와 상승/하락 이유를 입력하며, batch 자동장은 최신 활성 보고서 점수를 장 시작 시 생성된 일일 방향/자산 선호와 자동 참여자 성향에 함께 사용합니다.
- local-direct에서는 stock-back이 JWT를 직접 해석하지 않으므로 프론트가 access token payload의 `X-User-Key`, `X-User-Role`을 함께 붙입니다. Gateway 모드에서는 gateway가 같은 헤더를 다시 주입합니다.
- 실제 주식시장 기능 확장 범위와 우선순위는 `../stock-back-service/STOCK_MARKET_FEATURE_ROADMAP.md`를 기준으로 봅니다.
- 기능별 현재 구현, 코드 위치, 다음 개발 순서는 `../stock-back-service/docs/market-simulation/00-overview.md`부터 확인합니다.
- 프론트 코드 파일별 책임은 `../stock-back-service/docs/market-simulation/13-code-ownership-map.md`, 기능별 변경 순서는 `../stock-back-service/docs/market-simulation/14-feature-change-playbooks.md`를 기준으로 봅니다.
- access token은 메모리에 보관하고 refresh token은 기존 auth 서버의 HttpOnly 쿠키 흐름을 사용합니다.
