"use client";

import { useState } from "react";

import useModalDialog from "@/app/hooks/useModalDialog";
import { formatCount, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AutoParticipant, AutoParticipantOverview } from "@/app/types/stock";

const WITHDRAWAL_CONFIRMATION = "탈퇴";

export function AdminAutoParticipantWithdrawalDialog({
  participant,
  overview,
  overviewLoading,
  onClose,
  onConfirm,
}: {
  participant: AutoParticipant;
  overview: AutoParticipantOverview | null;
  overviewLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const dialogRef = useModalDialog<HTMLDivElement>(true, onClose);
  const canConfirm = confirmation.trim() === WITHDRAWAL_CONFIRMATION;
  const reclaimableCash = (overview?.availableCash ?? participant.cashBalance ?? 0)
    + (overview?.reservedBuyCash ?? 0);

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="auto-participant-withdrawal-title"
        aria-describedby="auto-participant-withdrawal-description"
        className="mx-auto w-full max-w-2xl rounded-lg border border-admin-danger/35 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black tracking-[0.14em] text-admin-danger">영구 종료</p>
            <h3 id="auto-participant-withdrawal-title" className="mt-1 text-lg font-black text-white">
              {participant.displayName} 자동 참여자를 탈퇴 처리할까요?
            </h3>
            <p id="auto-participant-withdrawal-description" className="mt-1 break-all text-xs font-bold text-stock-subtle">
              {participant.userKey}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-muted transition hover:border-white/25 hover:text-white"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-3">
          <WithdrawalMetric
            label="회수 예정 현금"
            value={overviewLoading && overview === null ? "불러오는 중" : formatWon(reclaimableCash)}
          />
          <WithdrawalMetric
            label="보관 이전 주식"
            value={overviewLoading && overview === null ? "불러오는 중" : formatCount(overview?.totalHoldingQuantity ?? 0, "주")}
          />
          <WithdrawalMetric
            label="보유 종목"
            value={overviewLoading && overview === null ? "불러오는 중" : formatCount(overview?.holdingCount ?? 0, "종목")}
          />
        </div>

        <div className="mt-4 rounded-md border border-admin-danger/25 bg-admin-danger-surface px-3 py-3">
          <p className="text-sm font-black text-admin-danger">탈퇴와 동시에 한 트랜잭션으로 처리됩니다.</p>
          <ul className="mt-2 grid gap-1.5 text-xs font-bold leading-5 text-admin-muted">
            <li>모든 시장의 미체결 주문 {formatCount(overview?.openOrderCount ?? 0, "건")}을 취소하고 매수·매도 예약을 해제합니다.</li>
            <li>보유 주식 {formatNumber(overview?.totalHoldingQuantity ?? 0)}주는 주문이 금지된 시스템 보관계정으로 전량 이전합니다.</li>
            <li>예약 해제 후 남은 현금은 시스템으로 회수하고, 활성 정기입금·배당 재투자 예산은 만료합니다.</li>
            <li>계좌는 삭제하지 않고 <span className="text-white">CLOSED</span>로 종료해 과거 주문·체결·정산 이력을 보존합니다.</li>
          </ul>
        </div>

        <p className="mt-3 rounded-md border border-admin-warning/25 bg-admin-warning/[0.06] px-3 py-2.5 text-xs font-bold leading-5 text-admin-warning">
          시스템 보관계정이 준비되지 않았거나 지급·청약·신주 상장 등 완료되지 않은 기업행사 권리가 있으면 자산 누락을 막기 위해 탈퇴가 거부됩니다. 설정 또는 기업행사를 먼저 완료한 뒤 다시 시도하세요.
        </p>

        <label className="mt-4 block text-xs font-black text-admin-muted" htmlFor={`withdraw-${participant.userKey}`}>
          계속하려면 <span className="text-white">{WITHDRAWAL_CONFIRMATION}</span>를 입력하세요.
        </label>
        <input
          id={`withdraw-${participant.userKey}`}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          className="mt-2 min-h-11 w-full rounded-md border border-white/15 bg-black/25 px-3 text-sm font-black text-white outline-none transition placeholder:text-admin-placeholder focus:border-admin-danger/70 focus:ring-2 focus:ring-admin-danger/20"
          placeholder={WITHDRAWAL_CONFIRMATION}
        />

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-md border border-white/15 px-4 py-2 text-xs font-black text-admin-muted transition hover:border-white/25 hover:text-white"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className="min-h-10 rounded-md bg-admin-danger px-4 py-2 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
          >
            자산 정리 후 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}

function WithdrawalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-admin-surface/95 px-3 py-3">
      <p className="text-[10px] font-black text-admin-placeholder">{label}</p>
      <p className="mt-1 break-words text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}
