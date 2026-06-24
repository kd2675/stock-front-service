import type { AutoParticipantProfileType } from "@/app/types/stock";

export const AUTO_PARTICIPANT_PROFILE_OPTIONS: Array<{
  value: AutoParticipantProfileType;
  label: string;
  description: string;
}> = [
  { value: "NEWS_REACTIVE", label: "뉴스 민감형", description: "보고서 점수에 크게 반응" },
  { value: "MOMENTUM_FOLLOWER", label: "추세추종형", description: "최근 상승/하락을 따라감" },
  { value: "CONTRARIAN", label: "역추세형", description: "급등 후 매도, 급락 후 매수" },
  { value: "LOSS_AVERSE", label: "손실회피형", description: "손실 중인 종목 매도를 꺼림" },
  { value: "OVERCONFIDENT", label: "과신형", description: "수익 중일수록 주문 빈도와 공격성이 높음" },
  { value: "HERD_FOLLOWER", label: "군중추종형", description: "매수/매도세가 몰리면 따라감" },
  { value: "MARKET_MAKER", label: "시장조성형", description: "재고와 스프레드 중심으로 호가 공급" },
  { value: "NOISE_TRADER", label: "노이즈형", description: "랜덤성이 크지만 현금/보유 제약은 지킴" },
  { value: "VALUE_ANCHOR", label: "가치기준형", description: "기준가와 괴리를 보고 천천히 반응" },
  { value: "SCALPER", label: "단타형", description: "짧은 흐름에 자주 반응" },
  { value: "PANIC_SELLER", label: "공포매도형", description: "급락과 군중 신호에 민감" },
  { value: "DIP_BUYER", label: "저점매수형", description: "하락 후 반등 기회를 탐색" },
  { value: "LIQUIDITY_AVOIDANT", label: "유동성회피형", description: "호가 공격성과 주문 빈도가 낮음" },
  { value: "WHALE", label: "고래형", description: "큰 주문을 선호하되 최대 수량은 지킴" },
  { value: "SMALL_DIVERSIFIER", label: "소액분산형", description: "작은 주문을 여러 번 나눔" },
  { value: "OBSERVER", label: "관망형", description: "강한 신호가 아니면 거의 움직이지 않음" },
];

export function formatAutoParticipantProfile(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTIONS.find((profile) => profile.value === profileType)?.label ?? "노이즈형";
}

export function formatAutoParticipantProfileDescription(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTIONS.find((profile) => profile.value === profileType)?.description ?? "랜덤성이 크지만 현금/보유 제약은 지킴";
}
