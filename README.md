# stock-front-service

주식 모의투자 서비스의 사용자용 Next.js 앱입니다.

## 현재 라우트

- `/`
- `/login`
- `/auth/callback` - OAuth 성공 후 HttpOnly refresh 세션으로 access token을 교환하는 전용 콜백
- `/trade` - 주문장
- `/orders` - 내 주문
- `/portfolio`
- `/research` - 종목 분석
- `/corporate-actions`
- `/admin/**` - 관리자 운영 화면

이전 `/supply-demand`, `/reports`, `/supply-demand/admin/**` 주소는 canonical route로 영구 redirect합니다. 사용자 화면은 상단 5개 탭, 관리자 화면은 독립 상단 바와 업무별 좌측 navigation을 사용합니다.

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
npm run clean:dev-cache
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

Next.js 개발 서버는 이 프로젝트에서 Turbopack 파일 시스템 캐시를 사용하지 않습니다. 이전 실행의 캐시·chunk·trace가 `.next/dev`에 과도하게 쌓였거나 개발 trace에 민감한 URL이 남았다면 서버를 종료한 뒤 `npm run clean:dev-cache`로 개발 산출물 전체를 제거합니다. 생산 빌드는 Next.js 기본 증분 캐시를 유지하며 배포 산출물은 `npm run build`로 별도 생성합니다.

장중 조회는 주문·체결 엔진의 DB 자원을 보호하기 위해 비용별 주기를 구분합니다. 주문장 깊이·최근 30체결·현재가처럼 bounded 조회만 2초를 유지하고, 당일 거래요약·자동시장 상태·1분 캔들은 10초, 5분 캔들은 15초, 15분·1시간 캔들은 30초로 조회합니다. 관리자 시장 요약도 10초이며 당일 전체/자동 참여자 체결 수는 비동기 요약이라 정상 flush 상태에서 약 30초 늦을 수 있습니다. flush 실패·프로세스 재기동·요약 슬롯 상한 초과 시에는 더 늦을 수 있으며, 야간 REPORTS 단계가 원본 체결로 정확한 값을 다시 확정합니다. 모든 공통 React Query 주기 조회는 브라우저 탭이 백그라운드일 때 중지합니다.

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
- 포트폴리오 손익의 체결금액·수수료·세금·실현손익은 주문·체결 원장 보호를 위한 비동기 일별 요약이므로 정상 flush 상태에서 약 30초 늦을 수 있습니다. flush 실패·재기동 등으로 더 늦어진 값은 야간 REPORTS 원본 대사에서 확정됩니다. 최근 주문·체결은 5초, 현재 포지션은 10초, 손익·권리는 30초, 장마감 자산 이력은 60초로 갱신하며 백그라운드 탭에서는 폴링하지 않습니다.
- `/corporate-actions`는 유상증자 공개 이벤트 목록과 사용자 권리 내역을 함께 읽습니다. 주주배정은 계좌별 배정 권리 수량, 일반공모는 전체 남은 모집 수량을 청약 상한으로 표시합니다.
- 기업 이벤트 feed와 사용자 권리·예수금은 30초 주기로 갱신하고 접수 mutation 직후에는 관련 query를 즉시 무효화해 다른 사용자·자동 참여자의 청약 및 배치 상태 전이를 반영합니다.
- `/research`는 최신 전체 장마감일을 기준으로 종가·거래실적, 5/20/60일 성과와 차트, 최근 20거래일 체결 빈도, 참가자 수급, 마감 보유 집중도, 기준일까지의 기업 이벤트, 동일 기준일 시장 순위, 관리자 평가와 데이터 품질을 표시합니다. 현재 호가·슬리피지·미체결 주문·주관사 운영 상태와 주문 집행 품질은 제외하며 5분 주기로 갱신합니다.
- 유상증자 청약은 서버 계약과 동일하게 청약 기간 중 `AFTER_CLOSE` 세션에서만 활성화되며, 접수 후 이벤트·권리·포트폴리오·보유 캐시를 갱신합니다.
- 홈 최근 체결 카드는 순금액, 비용, 매도 실현손익을 표시합니다.
- 공급/수요 화면은 브라우저 localStorage 시뮬레이션을 하지 않고 stock-back API와 batch가 만든 실제 주문장/자동장 상태를 읽습니다.
- 공급/수요 화면은 사용자의 주문장 주문 상태와 최근 주문장 체결 내역을 함께 읽고, 미체결/부분체결 주문의 전체 취소를 지원합니다.
- 공급/수요 화면의 주문/체결 조회는 `/orders?marketType=ORDER_BOOK`, `/executions?source=INTERNAL_ORDER_BOOK`를 사용합니다. 최근 50건 응답을 받은 뒤 프론트에서 시장을 필터링하지 않습니다.
- `/admin/**`은 `ADMIN` 계정 로그인 후 접근하는 내부 운영 화면입니다. stock-back 쓰기 API도 `ADMIN` 권한을 요구합니다. 대시보드, 시장 운영, 계좌·자금, 자동참여자, 기업 관리, 시스템 영역으로 분리하며 현재 section에 필요한 query만 활성화합니다.
- `/admin/system/eod`는 화면이 열려 있을 때만 15초 주기로 cycle 제어·요약 데이터를 조회합니다. 실패한 가장 오래된 전체시장 cycle은 시장 CLOSED일 때 현재 phase 재시도를 요청할 수 있지만, 버튼은 backoff만 해제하고 Job을 직접 실행하거나 `DEFERRED` 정책 대기·강제 마감을 우회하지 않습니다. 이 화면은 주문·체결 원장을 집계하지 않습니다.
- 관리자 시뮬레이션 경계 이동은 `오늘 18:00 진입`, `다음 일자 00:00 진입`, `다음 장 06:00 진입`으로 구분합니다. 세 버튼은 EOD Job을 직접 실행하지 않고 시계만 이동하며, 서버가 `active_business_date`, `preparing_business_date`, cycle 정산 대사와 `READY_TO_OPEN`을 확인해 반환한 `availableJumpActions`만 활성화합니다. 1초 상태 조회는 주문·체결 원장을 읽지 않습니다.
- 공급/수요 관리자 화면에서 종목별 호가 단위와 가격제한폭을 함께 설정합니다. 기본값은 1원 tick, ±30%입니다.
- 공급/수요 관리자 화면의 유상증자는 주주배정 또는 일반공모만 지원합니다. 두 방식 모두 발행수·발행가·청약 시작/마감일·납입일·신주상장일을 입력하고, 주주배정에만 권리락일을 입력합니다. 보유자 snapshot이 필요한 주주배정·현금배당·무상증자·주식배당의 권리락일은 현재 시뮬레이션 날짜보다 미래만 허용합니다. 액면분할은 효력일, 현금배당은 1주당 배당금/배당락일/지급일, 무상증자/주식배당은 배정 주식수/권리락일/신주상장일을 입력합니다.
- 공급/수요 관리자 화면은 선택 종목의 기업 이벤트 이력을 조회합니다.
- 공급/수요 관리자 화면은 주문장 종목별 평가 보고서를 발행, 수정, 삭제할 수 있습니다. 보고서에는 1~10 점수와 상승/하락 이유를 입력하며, batch 자동장은 최신 활성 보고서 점수를 장 시작 시 생성된 일일 방향/자산 선호와 자동 참여자 성향에 함께 사용합니다.
- local-direct에서는 stock-back이 JWT를 직접 해석하지 않으므로 프론트가 access token payload의 `X-User-Key`, `X-User-Role`을 함께 붙입니다. Gateway 모드에서는 gateway가 같은 헤더를 다시 주입합니다.
- 실제 주식시장 기능 확장 범위와 우선순위는 `../stock-back-service/STOCK_MARKET_FEATURE_ROADMAP.md`를 기준으로 봅니다.
- 기능별 현재 구현, 코드 위치, 다음 개발 순서는 `../stock-back-service/docs/market-simulation/00-overview.md`부터 확인합니다.
- 프론트 코드 파일별 책임은 `../stock-back-service/docs/market-simulation/13-code-ownership-map.md`, 기능별 변경 순서는 `../stock-back-service/docs/market-simulation/14-feature-change-playbooks.md`를 기준으로 봅니다.
- access token은 메모리에 보관하고 refresh token은 기존 auth 서버의 HttpOnly 쿠키 흐름을 사용합니다.
- OAuth 성공 응답은 토큰 없는 `/auth/callback`으로 들어옵니다. callback은 `Path=/auth`의 HttpOnly refresh 쿠키로 `/auth/refresh`를 호출해 access token을 메모리에만 보관하고, 로그인 시작 전 화면으로 복귀합니다. access token은 URL, 브라우저 저장소, 서버 access log에 남기지 않습니다.
