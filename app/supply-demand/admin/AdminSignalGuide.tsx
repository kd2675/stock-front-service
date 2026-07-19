export default function AutoSignalGuide() {
  return (
    <section className="mt-5 rounded-lg border border-stock-accent/20 bg-[#10233a] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-admin-accent">AUTO SIGNAL FLOW</p>
          <h2 className="mt-1 text-base font-black">자동 주문 활동 강도 계산 기준</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-admin-muted">
            주문 활동 강도는 다섯 압력과 함께 최종 주문 행동을 만드는 여섯 번째 요인입니다. 다만 압력처럼 랜덤 생성되는 -100~100 값이 아니라 참여자·종목별 1~10 기준값입니다.
          </p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft">1-10 척도</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <SignalGuideCard
          label="낮음 · 1-3"
          title="드문 주문 · 약한 가격 반응"
          body="프로필·유동성 보정 전 기본 주문 수는 보통 1건입니다. 가격 압력의 호가 반영 강도도 10~30% 수준이라 관망형 참여자에 적합합니다."
        />
        <SignalGuideCard
          label="중간 · 4-7"
          title="기본 주문 활동 구간"
          body="프로필·유동성 보정 전 기본 주문 수는 보통 2건입니다. 별도 설정이 없는 참여자는 5를 사용하며, 방향성보다 활동량을 적당히 늘리는 중립 구간입니다."
        />
        <SignalGuideCard
          label="높음 · 8-10"
          title="잦은 주문 · 강한 가격 반응"
          body="프로필·유동성 보정 전 기본 주문 수는 보통 3건입니다. 9 이상에서는 압력이 충분히 강할 때 일부 프로필이 매수·매도를 더 단호하게 선택할 수 있습니다."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md bg-black/20 px-3 py-3 text-xs font-bold leading-5 text-admin-muted">
          <p className="font-black text-white">실제 적용 순서</p>
          <p className="mt-1">
            참여자·종목 설정값을 기본으로 사용하고, 최신 보고서가 있으면 프로필의 뉴스 민감도만큼 보고서 점수와 섞어 유효 활동 강도를 만듭니다. 이 값이 주문 후보 우선순위, 주문 건수, 가격 압력의 호가 반영 강도에 쓰입니다.
          </p>
        </div>
        <div className="rounded-md border border-admin-warning/20 bg-admin-warning/[0.06] px-3 py-3 text-xs font-bold leading-5 text-[#d8c49c]">
          <p className="font-black text-admin-warning-soft">강도가 정하지 않는 것</p>
          <p className="mt-1">
            활동 강도 자체는 상승·하락 방향, 1회 주문 수량, 보유 목표, TTL을 정하지 않습니다. 방향은 다섯 압력·프로필·보고서·수익률·계좌 상태가 정하며, 활동 강도는 그 결과가 주문 건수와 호가에 반영되는 크기를 조절합니다.
          </p>
        </div>
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
      name: "주·보조 분포 편향(-100~100)",
      description: "압력 결과값이 아니라 삼각분포의 최빈 위치입니다. 같은 편향에서도 -100~100 사이의 다른 값이 나올 수 있으며, 주 압력 70%와 보조 압력 30%를 합쳐 최종 신호를 만듭니다.",
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
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
            주 압력은 06시와 가중치로 선택된 추가 슬롯에서 하루 1~4회 갱신되고, 30분 보조 압력과 70:30으로 합성됩니다. 실제 주문은 참여자별 전략, 심리 프로필, 보고서 점수, 계좌 상태도 함께 계산합니다.
          </p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent">stock_auto_market_config</span>
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.name} className="rounded-md bg-white/[0.04] px-3 py-3">
            <p className="text-xs font-black text-white">{item.name}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-black text-white">여섯 주문 행동 요인의 실제 영향</p>
            <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
              다섯 압력은 종목별 랜덤 시장환경이고 주문 활동 강도는 참여자·종목별 기준 활동도입니다. 서로 척도와 생성 방식은 다르지만 최종 주문 건수·방향·호가를 함께 만듭니다.
            </p>
          </div>
          <span className="text-[11px] font-black text-stock-subtle">압력 -100~100 · 활동 강도 1~10</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {ORDER_BEHAVIOR_GUIDE_ITEMS.map((item) => (
            <article key={item.name} className="rounded-md border border-white/[0.07] bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-white">{item.name}</p>
                <span className="text-[10px] font-black text-[#73808d]">{item.scale}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-black">
                <span className="text-[#fca5a5]">{item.low}</span>
                <span className="text-right text-[#86efac]">{item.high}</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-[#9aa7b4]">{item.description}</p>
              <p className="mt-2 border-t border-white/[0.07] pt-2 text-[11px] font-bold leading-4 text-[#73808d]">{item.caution}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

const ORDER_BEHAVIOR_GUIDE_ITEMS = [
  {
    name: "가격 압력",
    scale: "-100~100",
    low: "− 하락·매도 우세",
    high: "+ 상승·매수 우세",
    description: "매수·매도 선택 확률과 주문 호가의 중심을 움직입니다. 호가는 고정 틱 수가 아니라 현재가 대비 비율로 이동하며, 최신 종목 보고서 점수도 프로필의 뉴스 민감도만큼 이 축에 추가됩니다.",
    caution: "호가 중심의 기본 이동률은 압력 100 기준 0.6%이며 변동성 반영 후에도 0.8%로 제한됩니다. 현재가를 직접 변경하지는 않습니다.",
  },
  {
    name: "자산 선호",
    scale: "-100~100",
    low: "− 현금화 선호",
    high: "+ 주식 보유 선호",
    description: "가격 압력과 별도로 매수·매도 확률을 보정합니다. 양수면 매수·보유 쪽, 음수면 매도·현금 쪽 선택 가능성이 커집니다.",
    caution: "목표 보유 수량이나 현금 비율을 강제로 맞추지는 않습니다.",
  },
  {
    name: "변동성",
    scale: "-100~100",
    low: "− 좁은 호가 범위",
    high: "+ 넓은 호가 범위",
    description: "주문가격을 현재가 주변에 얼마나 넓게 흩을지 조절하고 가격 압력의 비율 이동 폭에도 반영됩니다. 최종 -100은 약 0.35배, +100은 약 1.65배입니다.",
    caution: "실제 체결가 변동성 통계가 아니라 주문 호가 생성 범위 신호입니다.",
  },
  {
    name: "유동성",
    scale: "-100~100",
    low: "− 주문 공급 축소",
    high: "+ 주문 공급 확대",
    description: "한 번의 실행에서 만들 주문 건수를 조절하고 상대 호가에 붙을 확률을 일부 높입니다. 최종 -100은 약 0.2배, +100은 약 1.8배의 주문 건수 배율입니다.",
    caution: "현재 주문장의 실제 유동성 측정치가 아니라 자동장이 공급하려는 밀도입니다.",
  },
  {
    name: "체결 공격성",
    scale: "-100~100",
    low: "− 수동 지정가",
    high: "+ 상대 호가 교차",
    description: "상대 최우선 호가를 교차할 기본 확률을 조절합니다. 상승 압력은 매수 교차 확률을 높이고 매도 교차 확률을 낮추며, 하락 압력은 반대로 적용됩니다.",
    caution: "교차 추첨은 상대 호가를 직접 기준으로 시장성 지정가를 만드는 주 경로입니다. 추첨에 실패해도 가격 압력으로 이동한 호가가 상대 호가를 넘을 수 있으며, +100도 계좌·자기체결·가격 제한이나 상대 유동성을 무시해 체결을 보장하지는 않습니다.",
  },
  {
    name: "주문 활동 강도",
    scale: "1~10",
    low: "1 · 적은 주문",
    high: "10 · 많은 주문",
    description: "참여자별 주문 후보 우선순위, 기본 주문 건수, 가격 압력의 호가 반영 크기를 조절합니다. 설정이 없으면 5이며 최신 보고서가 있으면 프로필 뉴스 민감도만큼 유효 강도가 보정됩니다.",
    caution: "압력처럼 랜덤 생성되지 않습니다. 프로필별 주문·공격성 배율과 방향·가격 노이즈가 이후 단계에서 별도로 적용됩니다.",
  },
] as const;

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
      <p className="text-[11px] font-black text-admin-accent">{label}</p>
      <h3 className="mt-1 text-sm font-black text-white">{title}</h3>
      <p className="mt-2 text-xs font-bold leading-5 text-admin-muted">{body}</p>
    </div>
  );
}
