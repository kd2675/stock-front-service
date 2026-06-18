# stock-front-service

주식 모의투자 서비스의 사용자용 Next.js 앱입니다.

## 현재 라우트

- `/`
- `/login`

## 역할

- 관심 종목과 최신가 표시
- 선택 종목 주문장 표시
- 주문 입력 UI
- 미체결 주문 목록
- 평가 자산과 수익률 요약
- 장 마감 자산 기록 표시
- 로그인, 회원가입, Naver/Kakao OAuth 진입

## 실행

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run verify:contract
```

## 포트

- dev: `3005`
- start: `3005`

## 환경 변수

`.env.local`은 `.env.example`을 기준으로 만듭니다.

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 연동 포인트

- API base 기본값: `http://localhost:8080`
- Stock API: `/api/stock/v1/**`
- Auth API: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/api/users`
- OAuth:
  - `/oauth2/authorize/naver-stock`
  - `/oauth2/authorize/kakao-stock`

## 참고

- 홈 화면은 `stock-back-service` API와 연동합니다.
- access token은 메모리에 보관하고 refresh token은 기존 auth 서버의 HttpOnly 쿠키 흐름을 사용합니다.
