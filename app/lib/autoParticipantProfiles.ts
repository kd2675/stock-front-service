import type { AutoParticipantProfileType } from "@/app/types/stock";

export type AutoParticipantProfileOption = {
  value: AutoParticipantProfileType;
  label: string;
  description: string;
  behavior: string;
};

export const AUTO_PARTICIPANT_PROFILE_OPTIONS: AutoParticipantProfileOption[] = [
  { value: "NEWS_REACTIVE", label: "뉴스 민감형", description: "최근 보고서 방향에 시간 감쇠로 반응", behavior: "최신 종목 보고서의 방향과 작성 후 경과시간을 함께 봅니다. 6시간 반감기로 신호를 줄이며, 약해진 보고서는 주문하지 않습니다." },
  { value: "MOMENTUM_FOLLOWER", label: "추세추종형", description: "1시간과 1거래일 추세를 함께 확인", behavior: "1시간 모멘텀과 직전 거래일 수익률의 방향이 일치할 때만 추세를 따라 주문합니다." },
  { value: "CONTRARIAN", label: "역추세형", description: "3·5거래일 과도한 움직임에 역행", behavior: "3거래일과 5거래일 수익률이 함께 과도하게 하락하면 매수하고, 함께 과도하게 상승하면 보유분을 매도합니다." },
  { value: "LOSS_AVERSE", label: "손실회피형", description: "손실 중인 종목 매도를 꺼림", behavior: "평균단가 대비 손실이면 추가 매수로 뒤집지 않고 주문을 쉬어 손실 확정을 미룹니다. 물타기 행동은 물타기형 프로필이 담당합니다." },
  { value: "OVERCONFIDENT", label: "과신형", description: "최근 실현 성과와 확인된 상승 추세에 과잉 반응", behavior: "미실현 수익 또는 최근 5거래일 중 충분한 수익 일수가 있고 1시간·1거래일 상승이 함께 확인되면 주문 수와 매수 성향을 높입니다. 손실 중에는 추가 행동을 쉽니다." },
  { value: "HERD_FOLLOWER", label: "군중추종형", description: "호가 깊이와 실제 단기 참여를 함께 추종", behavior: "상위 매수·매도 호가 깊이와 5분 모멘텀이 같은 방향이고, 최근 5분 체결량과 서로 다른 참여 계좌 수가 확인된 경우에만 군중을 따라갑니다. 재시작 직후 관측 창이 덜 찼으면 주문하지 않습니다." },
  { value: "PASSIVE_LIMIT_TRADER", label: "수동 지정가형", description: "시장 의무 없이 낮은 공격도로 한 방향 지정가를 제출", behavior: "관심 이벤트가 발생한 경우에만 한 종목과 한 방향을 선택합니다. 양방향 호가 유지나 자동 재호가는 하지 않으며 공식 LP와 역할을 분리합니다." },
  { value: "NOISE_TRADER", label: "노이즈형", description: "랜덤성이 크지만 현금/보유 제약은 지킴", behavior: "방향성보다 무작위성이 크지만 현금 부족, 보유 부족, 예약 수량 제한은 반드시 지킵니다." },
  { value: "VALUE_ANCHOR", label: "중기 기준가 회귀형", description: "20거래일 가격 괴리를 천천히 되돌림", behavior: "펀더멘털 적정가가 아니라 20거래일 수익률을 기준으로 과도한 하락은 매수, 과도한 상승은 보유분 매도로 대응합니다." },
  { value: "SCALPER", label: "단타형", description: "5분 흐름과 3~5분 보유시간에 반응", behavior: "계좌별 고정 성향으로 5분 모멘텀, +0.4~0.6% 익절, -0.6~-0.9% 손절, 3~5분 최대 보유시간을 사용합니다. 다음 거래일까지 넘긴 포지션과 장 마감 10~20분 전 포지션도 청산하며, 재시작 후 보유 시작시각을 증명할 수 없으면 시간만으로 강제 청산하지 않습니다." },
  { value: "DAY_TRADER", label: "데이 트레이더형", description: "당일 신호로 거래하고 장 마감 전에 청산", behavior: "계좌별 고정 성향에 따라 마감 90~150분 전 신규 행동을 멈추고, 마지막 45~75분에는 남은 보유량을 주문 상한에 맞춰 분할 청산합니다." },
  { value: "SWING_TRADER", label: "스윙형", description: "2~10거래일 보유와 3·5일 추세를 사용", behavior: "계좌별 고정 성향에 따라 최소 2~3거래일은 일반 신호에 매도하지 않고 3·5거래일 추세로 진입·청산합니다. 8~10거래일 이후 추세가 약하면 정리하고 -15%는 위험 청산합니다." },
  { value: "LONG_TERM_HOLDER", label: "장기투자형", description: "최소 보유기간과 저빈도 리밸런싱을 사용", behavior: "비상 위험이 아니면 계좌별 15~25거래일 최소 보유기간 전에는 매도하지 않고, 고정 시드에 따른 5거래일 리밸런싱 창에서만 목표 비중을 조정합니다." },
  { value: "PAYDAY_ACCUMULATOR", label: "월급매수형", description: "실제 입금에서 남은 전용 예산만 매수", behavior: "정기 입금 발생액을 별도 예산 원장으로 추적하고, 아직 예약·체결에 쓰지 않은 금액 안에서만 매수합니다. 입금 설정 자체는 상시 매수 편향으로 사용하지 않습니다." },
  { value: "DIVIDEND_REINVESTOR", label: "배당재투자형", description: "배당 원천 종목의 남은 예산만 재투자", behavior: "배당 현금의 발생·예약·체결·취소 반환을 별도 예산으로 대사하며, 해당 종목의 남은 배당 예산 안에서만 매수합니다." },
  { value: "LIMIT_DOWN_TRAPPED", label: "하한가 물림형", description: "하한가 매도 의도는 있으나 체결이 어려운 상태", behavior: "하한가에서는 보유분 매도를 시도하고, 깊은 손실이지만 하한가가 아니면 성급한 추가매수·손절 없이 보유합니다." },
  { value: "AVERAGE_DOWN_BUYER", label: "물타기형", description: "계좌별 -4.5~-6% 구간에서 제한적으로 평균단가를 낮춤", behavior: "거래일당 1회, 최대 3회, 종목 예상 비중 25% 이내에서만 계좌별 고정 손실 임계값의 물타기 매수를 허용합니다." },
  { value: "STOP_LOSS_TRADER", label: "칼손절형", description: "계좌별 손실 임계값에서 빠르게 매도", behavior: "계좌별 고정 성향인 평균단가 대비 -4~-6% 또는 강한 하락 모멘텀 임계값에 도달하면 매도를 우선하고, 그보다 작은 손실에서는 반복 손절을 막기 위해 주문을 쉽니다." },
  { value: "FOMO_BUYER", label: "급등추격형", description: "5분·1시간 상승과 실제 단기 참여를 확인", behavior: "5분·1시간 상승, 매수 호가 깊이, 최근 5분 체결량과 참여 계좌 수가 모두 확인될 때만 추격 매수합니다. 관측 창이 준비되지 않았으면 주문하지 않습니다." },
  { value: "PANIC_SELLER", label: "공포매도형", description: "5분·1시간 급락과 실제 단기 참여에 반응", behavior: "보유 종목의 5분·1시간 하락, 매도 호가 깊이, 최근 5분 체결량과 참여 계좌 수가 모두 확인될 때 매도합니다. 관측 창이 준비되지 않았으면 주문하지 않습니다." },
  { value: "DIP_BUYER", label: "저점매수형", description: "1시간 하락 뒤 5분 반전을 확인", behavior: "1시간 급락만으로 사지 않고 5분 흐름이 반전된 경우에만 저점 매수를 시도해 물타기형과 구분합니다." },
  { value: "PROFIT_LOCKER", label: "익절우선형", description: "계좌별 +4~6%부터 보유량 일부를 이익 확정", behavior: "계좌별 고정 수익 임계값에 도달하면 한 번에 가용 보유량의 35%를 익절 대상으로 계획합니다." },
  { value: "LIQUIDITY_AVOIDANT", label: "유동성회피형", description: "넓은 스프레드·얕은 호가·적은 체결을 회피", behavior: "스프레드가 4틱을 넘거나 양쪽 가시 호가 깊이가 주문 상한의 2배보다 작으면 주문하지 않습니다. 최근 5분 관측이 준비된 뒤 체결량 또는 참여 계좌가 너무 적어도 쉽니다." },
  { value: "CASH_DEFENSIVE", label: "현금방어형", description: "현금 비중 60~70% 범위를 방어", behavior: "현금 비중이 60% 아래면 보유분 매도를 우선하고, 70% 이상이면서 강한 상승 신호가 있을 때만 제한적으로 매수합니다." },
  { value: "WHALE", label: "고래형", description: "큰 주문을 내되 시장 깊이와 거래량으로 제한", behavior: "큰 수량 배율을 사용하지만 5일 평균 거래량의 2%, 반대 호가 깊이의 25%, 계좌 자산 위험 한도를 넘지 않습니다." },
  { value: "SMALL_DIVERSIFIER", label: "소액분산형", description: "종목 집중도를 낮추며 작은 주문으로 분산", behavior: "보유 종목이 3개 미만이거나 종목 비중이 15% 미만이면, 현재 보유와 미체결 매수 평가액이 낮은 활성 종목을 우선해 작은 주문으로 늘립니다. 25% 이상인 종목은 비중을 줄입니다." },
  { value: "OBSERVER", label: "관망형", description: "강한 신호가 아니면 거의 움직이지 않음", behavior: "중립 신호에서는 주문을 쉬고 강한 신호에서도 작은 주문을 한 번만 냅니다." },
];

const AUTO_PARTICIPANT_PROFILE_OPTION_BY_TYPE = new Map<AutoParticipantProfileType, AutoParticipantProfileOption>(
  AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => [profile.value, profile]),
);

export function formatAutoParticipantProfile(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTION_BY_TYPE.get(profileType)?.label ?? "노이즈형";
}

export function formatAutoParticipantProfileDescription(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTION_BY_TYPE.get(profileType)?.description ?? "랜덤성이 크지만 현금/보유 제약은 지킴";
}

export function formatAutoParticipantProfileBehavior(profileType: AutoParticipantProfileType): string {
  return AUTO_PARTICIPANT_PROFILE_OPTION_BY_TYPE.get(profileType)?.behavior ?? "무작위성이 크지만 현금, 보유수량, 예약 수량 제한은 반드시 지킵니다.";
}

export function isFundingBudgetProfile(profileType: AutoParticipantProfileType): boolean {
  return profileType === "PAYDAY_ACCUMULATOR" || profileType === "DIVIDEND_REINVESTOR";
}
