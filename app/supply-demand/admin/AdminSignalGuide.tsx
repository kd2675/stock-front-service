export default function AutoSignalGuide() {
  return (
    <section className="mt-5 rounded-lg border border-[#3182f6]/20 bg-[#10233a] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#64a8ff]">AUTO SIGNAL FLOW</p>
          <h2 className="mt-1 text-base font-black">자동장 강도 계산 기준</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-[#b8c2cc]">
            자동 주문은 종목 기본 강도, 참여자별 종목 전략, 최신 평가 보고서 점수를 순서대로 반영해 최종 매수/매도 압력과 호가 공격성을 정합니다.
          </p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#d8ecff]">1-10 척도</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <SignalGuideCard
          label="종목별 자동 알고리즘 강도"
          title="종목 기본 분위기"
          body="참여자별 전략이 없을 때 쓰는 기본값입니다. 10에 가까우면 매수 우위, 1에 가까우면 매도 우위로 동작합니다."
        />
        <SignalGuideCard
          label="참여자별 종목 전략 강도"
          title="참여자 실제 성향"
          body="같은 종목이라도 참여자마다 다르게 줄 수 있는 우선값입니다. 저장된 전략이 있으면 종목 기본 강도보다 먼저 적용됩니다."
        />
        <SignalGuideCard
          label="종목 평가 보고서 점수"
          title="최신 관리자 신호"
          body="주문을 직접 만들지는 않고 참여자 전략을 보정합니다. 뉴스 민감형은 크게 반응하고 관망형은 작게 반응합니다."
        />
      </div>

      <div className="mt-4 rounded-md bg-black/20 px-3 py-3 text-xs font-bold leading-5 text-[#b8c2cc]">
        최종 강도는 참여자별 전략 강도를 기본으로 하되, 자동 참여자의 심리 프로필에 따라 최신 보고서 점수 반영 비율이 달라집니다. 참여자별 전략이 없으면 종목별 자동 알고리즘 강도가 참여자 전략의 기본값이 됩니다.
      </div>
    </section>
  );
}

export function AutoMarketConfigGuide() {
  const items = [
    {
      name: "자동장 대상 종목",
      description: "자동참여자 주문을 생성할 주문장 종목입니다. 주문장 종목이 비활성화되었거나 장 상태가 OPEN이 아니면 배치가 이 종목을 읽지 않습니다.",
    },
    {
      name: "자동 주문 생성",
      description: "가동이면 배치가 이 종목의 자동 주문을 생성합니다. 정지하면 새 자동 주문 생성 대상에서 빠지며, 이미 쌓인 미체결 주문을 즉시 일괄 취소한다는 의미는 아닙니다.",
    },
    {
      name: "기본 방향 강도(1-10)",
      description: "종목 기본 가격 압력입니다. 10에 가까울수록 매수 우위와 상승 방향 호가가 강해지고, 1에 가까울수록 매도 우위와 하락 방향 호가가 강해집니다. 참여자별 종목 전략이 있으면 그 값이 우선 적용됩니다.",
    },
    {
      name: "1회 주문 최대 수량",
      description: "자동장이 한 번에 만들 수 있는 주문 수량의 종목 단위 상한입니다. 실제 수량은 이 값에 프로필 수량 배율, 계좌 현금, 보유 수량, 예약 수량 제약을 반영해 더 작아질 수 있습니다.",
    },
    {
      name: "미체결 호가 TTL(초)",
      description: "자동장이 낸 미체결 주문을 유지하는 시뮬레이션 시간 기준 기본값입니다. 프로필 TTL 배율을 거친 뒤 만료 기준으로 쓰이며, 시간이 지나면 배치가 주문을 취소하고 예약 현금/수량을 돌려줍니다. 실제 주식시장에는 이런 일괄 TTL 설정은 없고, 주문 유효기간/정정/취소 정책이 별도로 운영됩니다.",
    },
  ];

  return (
    <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">항목 설명</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">
            이 설정은 종목 단위 기본값입니다. 실제 주문은 종목 기본값, 참여자별 종목 전략, 심리 프로필, 보고서 점수, 계좌 상태를 함께 계산해 생성됩니다.
          </p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#64a8ff]">stock_auto_market_config</span>
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.name} className="rounded-md bg-white/[0.04] px-3 py-3">
            <p className="text-xs font-black text-white">{item.name}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalGuideCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[11px] font-black text-[#64a8ff]">{label}</p>
      <h3 className="mt-1 text-sm font-black text-white">{title}</h3>
      <p className="mt-2 text-xs font-bold leading-5 text-[#b8c2cc]">{body}</p>
    </div>
  );
}
