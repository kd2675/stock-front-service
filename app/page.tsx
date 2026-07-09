"use client";

import Link from "next/link";

import useAuthSession from "@/app/hooks/useAuthSession";
import { buildAccountRequiredPath } from "@/app/lib/accountRouting";
import { isAdminRole } from "@/app/lib/auth";

const EXPERIENCES = [
  {
    href: "/virtual-price",
    eyebrow: "PRICE TRIGGER",
    title: "특정가격 자동주문체결",
    description: "외부 가격 흐름을 기준으로 사용자가 걸어둔 지정가 조건을 배치 서버가 검사하고 체결합니다.",
    metrics: ["가격 조건", "예약 주문", "배치 체결"],
    accent: "#3182f6",
  },
  {
    href: "/supply-demand",
    eyebrow: "ORDER BOOK",
    title: "수요와 공급 주문 체결",
    description: "관리자가 만든 종목의 매수/매도 호가가 실제 주문장처럼 만나며 가격과 체결이 형성됩니다.",
    metrics: ["호가", "부분체결", "자동 참여자"],
    accent: "#f04452",
  },
];

export default function StockHomePage() {
  const { authStatus, isHydrated, user } = useAuthSession();
  const isLoggedIn = isHydrated && authStatus === "in";
  const isAdmin = isAdminRole(user?.role);

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#191f28]">
      <section className="border-b border-[#e5e8eb] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-black tracking-tight">
            Stock Mock Trading
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Link href="/supply-demand/admin" className="rounded-md bg-[#191f28] px-3 py-2 text-sm font-bold text-white">
                관리자 설정
              </Link>
            ) : null}
            {isLoggedIn ? (
              <Link href="/portfolio" className="rounded-md bg-[#f2f4f6] px-3 py-2 text-sm font-black text-[#333d4b]">
                내 주식
              </Link>
            ) : null}
            <Link href={isLoggedIn ? "/" : "/login"} className="rounded-md bg-[#3182f6] px-3 py-2 text-sm font-black text-white">
              {isLoggedIn ? "홈" : "로그인"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:px-8 lg:py-14">
        <div className="min-w-0 self-center">
          <p className="text-xs font-black tracking-[0.22em] text-[#3182f6]">SIMULATED MARKET WORKSPACE</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-normal sm:text-5xl lg:text-6xl">
            두 개의 장을 분리해서 연습하는 모의 주식시장
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#4e5968]">
            특정가격 자동주문체결과 수요/공급 주문장은 종목, 체결 방식, 운영 책임이 다른 별도 영역입니다.
            원하는 장을 선택해서 계좌 확인 후 진입합니다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <HomeMetric label="서버 데이터" value="React Query" />
            <HomeMetric label="내부 상태" value="Zustand" />
            <HomeMetric label="주문 검증" value="Zod" />
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          {EXPERIENCES.map((experience) => (
            <Link
              key={experience.href}
              href={experience.href}
              className="group min-w-0 rounded-lg border border-[#e5e8eb] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(25,31,40,0.08)]"
            >
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black tracking-[0.18em]" style={{ color: experience.accent }}>
                    {experience.eyebrow}
                  </p>
                  <h2 className="mt-2 min-w-0 break-words text-2xl font-black">{experience.title}</h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#6b7684]">{experience.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#f2f4f6] px-3 py-2 text-sm font-black text-[#333d4b] transition-colors group-hover:bg-[#191f28] group-hover:text-white">
                  이동
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {experience.metrics.map((metric) => (
                  <span key={metric} className="rounded-sm bg-[#f6f7f9] px-2 py-1 text-xs font-bold text-[#4e5968]">
                    {metric}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-lg bg-[#191f28] p-5 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[0.18em] text-[#8b95a1]">ACCOUNT GATE</p>
            <p className="mt-2 text-lg font-black">실제 주문 화면은 모의투자 계좌 확인 후 진입합니다.</p>
          </div>
          <Link href={buildAccountRequiredPath("/virtual-price")} className="rounded-md bg-white px-4 py-3 text-center text-sm font-black text-[#191f28]">
            계좌 확인
          </Link>
        </div>
      </section>
    </main>
  );
}

function HomeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
      <p className="text-xs font-bold text-[#6b7684]">{label}</p>
      <p className="mt-2 min-w-0 break-words text-sm font-black text-[#191f28]">{value}</p>
    </div>
  );
}
