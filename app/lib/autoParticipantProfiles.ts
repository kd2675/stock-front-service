import type { AutoParticipantProfileType } from "@/app/types/stock";

export type AutoParticipantProfileOption = {
  value: AutoParticipantProfileType;
  label: string;
  description: string;
  behavior: string;
};

export const AUTO_PARTICIPANT_PROFILE_OPTIONS: AutoParticipantProfileOption[] = [
  { value: "NEWS_REACTIVE", label: "뉴스 민감형", description: "보고서 점수에 크게 반응", behavior: "최신 종목 평가 점수가 유효 강도를 크게 바꿔 호재에는 매수, 악재에는 매도 쪽으로 기웁니다." },
  { value: "MOMENTUM_FOLLOWER", label: "추세추종형", description: "최근 상승/하락을 따라감", behavior: "현재가가 전일 기준 크게 오르면 매수, 크게 내리면 매도 쪽으로 따라붙습니다." },
  { value: "CONTRARIAN", label: "역추세형", description: "급등 후 매도, 급락 후 매수", behavior: "상승 압력이 강할수록 매도, 하락 압력이 강할수록 매수 쪽으로 반대로 움직입니다." },
  { value: "LOSS_AVERSE", label: "손실회피형", description: "손실 중인 종목 매도를 꺼림", behavior: "평균단가 대비 손실이면 매도보다 보유나 추가 매수 쪽으로 기울고 현금 부족 때도 손절을 늦춥니다." },
  { value: "OVERCONFIDENT", label: "과신형", description: "수익 중일수록 주문 빈도와 공격성이 높음", behavior: "수익 중인 포지션이 있으면 주문 수와 매수 편향이 증가해 최근 성공을 과대 반영합니다." },
  { value: "HERD_FOLLOWER", label: "군중추종형", description: "매수/매도세가 몰리면 따라감", behavior: "호가창 미체결 수량이 한쪽으로 쏠리면 같은 방향의 매수 또는 매도 주문을 냅니다." },
  { value: "MARKET_MAKER", label: "시장조성형", description: "재고와 스프레드 중심으로 호가 공급", behavior: "현금과 보유수량이 있으면 매수/매도 양쪽 호가를 번갈아 공급해 스프레드를 만듭니다." },
  { value: "NOISE_TRADER", label: "노이즈형", description: "랜덤성이 크지만 현금/보유 제약은 지킴", behavior: "방향성보다 무작위성이 크지만 현금 부족, 보유 부족, 예약 수량 제한은 반드시 지킵니다." },
  { value: "VALUE_ANCHOR", label: "가치기준형", description: "기준가와 괴리를 보고 천천히 반응", behavior: "기준가보다 많이 오르면 매도, 많이 내리면 매수 쪽으로 움직이는 기준가 회귀형입니다." },
  { value: "SCALPER", label: "단타형", description: "짧은 흐름에 자주 반응", behavior: "주문 빈도와 익절 성향이 높고 TTL이 짧아 미체결 주문을 빨리 회수합니다." },
  { value: "DAY_TRADER", label: "데이 트레이더형", description: "하루 안의 흐름에 빠르게 사고팔음", behavior: "단타형보다 주문 빈도가 더 높고 강한 신호에서 여러 주문을 빠르게 냅니다." },
  { value: "SWING_TRADER", label: "스윙형", description: "며칠 단위 추세와 반전 신호를 함께 봄", behavior: "추세와 역추세를 섞어 보고 큰 미실현 수익이 생기면 일부 익절 쪽으로 움직입니다." },
  { value: "LONG_TERM_HOLDER", label: "장기투자형", description: "매도 빈도가 낮고 하락에도 보유 성향이 큼", behavior: "중립 신호에서는 쉬고, 큰 손실이나 큰 수익에서도 성급한 매도를 피하며 TTL을 길게 둡니다." },
  { value: "PAYDAY_ACCUMULATOR", label: "월급매수형", description: "설정한 입금 주기마다 현금 유입 후 꾸준히 매수", behavior: "설정 주기마다 자동 입금 원장을 만들고 현금 유입 후 매수 편향을 유지합니다." },
  { value: "DIVIDEND_REINVESTOR", label: "배당재투자형", description: "정기 현금 유입을 다시 매수에 사용", behavior: "작은 정기 현금 유입을 만들고 장기 보유 성향을 유지하면서 하락 구간에서는 추가 매수 쪽으로 움직입니다." },
  { value: "LIMIT_DOWN_TRAPPED", label: "하한가 물림형", description: "큰 손실 구간에서 매도를 강하게 회피", behavior: "하한가나 깊은 손실에서는 강제 손절을 피하고 현금이 있으면 물타기 매수 쪽으로 갑니다." },
  { value: "AVERAGE_DOWN_BUYER", label: "물타기형", description: "손실 구간에서 평균단가를 낮추려 추가 매수", behavior: "평균단가 대비 손실과 급락 구간을 추가 매수 기회로 보고 수량을 키워 물타기 쪽으로 움직입니다." },
  { value: "STOP_LOSS_TRADER", label: "칼손절형", description: "손실 구간에서 빠르게 매도", behavior: "평균단가 대비 손실과 하락 모멘텀에 민감하게 반응해 보유 인내보다 매도 전환을 우선합니다." },
  { value: "FOMO_BUYER", label: "급등추격형", description: "급등과 군중 매수세를 보고 뒤늦게 따라삼", behavior: "가격 상승과 매수 잔량 쏠림에 강하게 반응해 주문 빈도와 호가 공격성을 높입니다." },
  { value: "PANIC_SELLER", label: "공포매도형", description: "급락과 군중 신호에 민감", behavior: "전일 대비 급락이나 매도 군중 신호가 강하면 현금이 있어도 매도 쪽으로 급히 반응합니다." },
  { value: "DIP_BUYER", label: "저점매수형", description: "하락 후 반등 기회를 탐색", behavior: "급락과 손실 구간을 저점 매수 기회로 보고 기존 보유가 있어도 추가 매수 쪽으로 기웁니다." },
  { value: "PROFIT_LOCKER", label: "익절우선형", description: "수익이 나면 빠르게 이익 확정", behavior: "평균단가 대비 수익 구간에서 보유보다 매도 전환을 우선하고 TTL과 주문 빈도를 짧게 가져갑니다." },
  { value: "LIQUIDITY_AVOIDANT", label: "유동성회피형", description: "호가 공격성과 주문 빈도가 낮음", behavior: "중립 신호에서는 쉬고 강한 신호에서도 작은 수량만 내며 호가 공격성을 낮게 유지합니다." },
  { value: "CASH_DEFENSIVE", label: "현금방어형", description: "현금 보유를 선호하고 거래를 줄임", behavior: "중립 신호에서는 쉬고 강한 신호에서도 작은 주문만 내며 보유보다 현금 여력을 남기려 합니다." },
  { value: "WHALE", label: "고래형", description: "큰 주문을 선호하되 최대 수량은 지킴", behavior: "주문 수보다 주문 크기를 키우는 쪽이며 종목별 최대 수량과 계좌 제약은 넘지 않습니다." },
  { value: "SMALL_DIVERSIFIER", label: "소액분산형", description: "작은 주문을 여러 번 나눔", behavior: "큰 주문 대신 작은 수량을 여러 번 나눠 내며 한 번에 노출되는 수량을 낮춥니다." },
  { value: "OBSERVER", label: "관망형", description: "강한 신호가 아니면 거의 움직이지 않음", behavior: "중립 신호에서는 주문을 쉬고 강한 신호에서도 작은 주문 한두 개만 냅니다." },
];

export function formatAutoParticipantProfile(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTIONS.find((profile) => profile.value === profileType)?.label ?? "노이즈형";
}

export function formatAutoParticipantProfileDescription(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTIONS.find((profile) => profile.value === profileType)?.description ?? "랜덤성이 크지만 현금/보유 제약은 지킴";
}

export function formatAutoParticipantProfileBehavior(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTIONS.find((profile) => profile.value === profileType)?.behavior ?? "무작위성이 크지만 현금, 보유수량, 예약 수량 제한은 반드시 지킵니다.";
}
