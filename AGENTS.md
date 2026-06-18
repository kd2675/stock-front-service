<!-- Parent: ../AGENTS.md -->
<!-- Updated: 2026-06-17 -->

# stock-front-service

## Purpose

주식 모의투자 서비스의 Next.js 사용자 앱입니다. 관심 종목, 주문 입력, 미체결 주문, 보유/수익률 화면을 담당합니다.

## Route Surface

- `/`
- `/login`

## Key Files

- `app/page.tsx`
- `app/login/page.tsx`
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
- `NEXT_PUBLIC_API_URL` 기본값은 `http://localhost:8080`입니다.
- Gateway 경유 API는 `/api/stock/v1/**` 기준으로 붙입니다.
- 로그인은 `stock-front-service` client id와 기존 auth 서버를 사용합니다.

## For AI Agents

- 마케팅 랜딩보다 실제 투자 워크스페이스 화면을 우선합니다.
- 시세 표시, 주문 입력, 미체결 주문, 보유 자산 화면을 분리 가능한 컴포넌트 경계로 유지합니다.
- `any`를 쓰지 않고 `app/types`에 응답 타입을 둡니다.
- 주문 체결이 즉시 된다고 가정하지 말고, batch 서버가 PENDING 주문을 체결한다는 UX를 유지합니다.
