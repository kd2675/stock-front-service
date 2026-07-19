<!-- Parent: ../AGENTS.md -->
<!-- Updated: 2026-07-14 -->

# stock-front-service

## Purpose

주식 모의투자 서비스의 Next.js 사용자 앱입니다. 관심 종목, 주문 입력, 미체결 주문, 보유/수익률 화면을 담당합니다.

## Route Surface

- `/`
- `/login`
- `/auth/callback`
- `/trade`
- `/orders`
- `/portfolio`
- `/research`
- `/corporate-actions`
- `/admin/**`

이전 `/supply-demand`, `/reports`, `/supply-demand/admin/**` 주소는 `next.config.ts`에서 위 canonical route로 redirect합니다.

## Key Files

- `app/page.tsx`
- `app/login/page.tsx`
- `app/corporate-actions/page.tsx`
- `app/trade/page.tsx`
- `app/orders/page.tsx`
- `app/research/page.tsx`
- `app/admin/[[...slug]]/page.tsx`
- `app/navigation/publicNavigation.ts`
- `app/navigation/adminNavigation.ts`
- `app/globals.css`
- `app/lib/api.ts`
- `app/lib/auth.ts`
- `app/lib/stock.ts`
- `app/types/response.ts`
- `app/types/stock.ts`

## Runtime

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Operational Notes

- 포트: `3005`
- local direct 기본값은 stock API `http://localhost:20480`, auth/OAuth `http://localhost:9000`입니다.
- Gateway/Eureka 경유가 필요하면 `NEXT_PUBLIC_API_MODE=gateway`, `NEXT_PUBLIC_API_URL=http://localhost:8080`으로 전환합니다.
- Gateway 경유 stock API는 `/api/stock/v1/**` 기준으로 붙입니다.
- 로그인은 `stock-front-service` client id와 기존 auth 서버를 사용합니다.
- `local-direct` 보호 API 호출은 access token과 함께 `X-User-Key`, `X-User-Role` 헤더를 붙입니다.
- 홈 화면 주문은 `VIRTUAL_PRICE`, 공급/수요 화면 주문은 `ORDER_BOOK`으로 접수합니다.
- 공급/수요 화면은 stock-back API의 주문장, 가격, 자동장 상태를 읽고 프론트 localStorage 기반 가짜 체결 로직을 만들지 않습니다.
- 기업 이벤트 화면은 stock-back의 실제 유상증자 이벤트/사용자 권리/시뮬레이션 장 상태를 읽으며, 주주배정과 일반공모만 지원합니다.
- 청약 버튼은 서버 계약과 동일하게 청약 기간의 `AFTER_CLOSE`에서만 활성화하고, 주주배정은 계좌별 권리 수량, 일반공모는 서버 잔여 수량을 상한으로 사용합니다.

## For AI Agents

- 마케팅 랜딩보다 실제 투자 워크스페이스 화면을 우선합니다.
- 사용자 투자 화면과 관리자 운영 화면의 navigation context를 섞지 않습니다. 사용자 상단 탭은 `publicNavigation.ts`, 관리자 사이드바는 `adminNavigation.ts`를 단일 기준으로 사용합니다.
- 시세 표시, 주문 입력, 미체결 주문, 보유 자산 화면을 분리 가능한 컴포넌트 경계로 유지합니다.
- `any`를 쓰지 않고 `app/types`에 응답 타입을 둡니다.
- 주문 체결이 즉시 된다고 가정하지 말고, batch 서버가 PENDING 주문을 체결한다는 UX를 유지합니다.
- 자동 참여자 주문 생성, 체결, 현재가 갱신은 batch 서버 책임이며 프론트는 조회/표시만 담당합니다.
- 운영·EOD 화면의 폴링은 해당 페이지가 열려 있을 때만 실행하고 background refetch를 끕니다. 무거운 주문·체결 원장 조회를 짧은 주기로 반복하지 말고 cycle/요약 API를 사용하며, 보고서 조회는 명시적 새로고침 또는 충분한 stale time을 둡니다.
- 주문장 깊이·최근 소량 체결처럼 bounded 조회만 2초 갱신을 허용합니다. 거래일 누적 거래요약·캔들·관리자 전체 요약은 10초 이상으로 두고, 비동기 요약값이면 최대 지연을 라벨에 표시합니다.
- 계좌 주문·최근 체결 같은 bounded 활동 조회는 5초, 현재 포지션은 10초, 비동기 손익·권리 요약은 30초, 장마감 자산 이력은 60초 이상으로 분리합니다. 모든 주기 조회는 백그라운드 탭에서 중지하며 화면 편의를 이유로 전체 체결 원장 집계 주기를 줄이지 않습니다.
- 자동 참여자 월급·정기 현금 입력은 운영 정책과 같은 `DAY`·`MONTH`·`YEAR`만 선택지로 제공합니다. 과거 sub-day 응답은 표시 포맷 호환만 유지하고 새 payload로 만들지 않습니다.
