export function formatCashFlowReason(reason: string) {
  switch (reason) {
    case "OPENING_GRANT":
      return "계좌 개설 지급";
    case "ADMIN_DEPOSIT":
      return "관리자 입금";
    case "ADMIN_WITHDRAW":
      return "관리자 회수";
    case "DIVIDEND_PAYMENT":
      return "배당 지급";
    case "AUTO_PROFILE_RECURRING_DEPOSIT":
      return "프로필 정기 지급";
    case "AUTO_PARTICIPANT_RECURRING_DEPOSIT":
      return "자동 참여자 정기 지급";
    default:
      return reason;
  }
}
