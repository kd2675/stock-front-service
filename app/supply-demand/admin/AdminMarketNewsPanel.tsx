"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { correctMarketNews, createMarketNews, getAdminMarketNews, getAdminMarketNewsStorylines, retractMarketNews } from "@/app/lib/stock";
import { invalidateMarketNewsQueries } from "@/app/lib/react-query/stockInvalidations";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { getStockErrorMessage, unwrapAuthenticatedStockRequest } from "@/app/lib/react-query/stockResult";
import type {
  MarketNews,
  MarketNewsCreatePayload,
  MarketNewsFactType,
  MarketNewsStoryline,
  OrderBookInstrument,
} from "@/app/types/stock";

type AdminMarketNewsPanelProps = {
  instruments: OrderBookInstrument[];
};

type NewsDraft = {
  body: string;
  certainty: MarketNewsCreatePayload["certainty"];
  direction: MarketNewsCreatePayload["direction"];
  embargoUntil: string;
  factType: MarketNewsFactType;
  headline: string;
  materiality: string;
  payloadText: string;
  publicationType: MarketNewsCreatePayload["publicationType"];
  scopeKey: string;
  sourceLabel: string;
  summary: string;
};

const FACT_TYPES: MarketNewsFactType[] = [
  "LARGE_CONTRACT",
  "CONTRACT_TERMINATION",
  "PRODUCTION_HALT",
  "LITIGATION",
  "MANAGEMENT_CHANGE",
  "CAPITAL_INCREASE",
  "CASH_DIVIDEND",
];

const INITIAL_DRAFT: NewsDraft = {
  body: "",
  certainty: "CONFIRMED",
  direction: "NEUTRAL",
  embargoUntil: "",
  factType: "LARGE_CONTRACT",
  headline: "",
  materiality: "0.50",
  payloadText: "{}",
  publicationType: "DISCLOSURE",
  scopeKey: "",
  sourceLabel: "관리자 구조화 공시",
  summary: "",
};

export function AdminMarketNewsPanel({ instruments }: AdminMarketNewsPanelProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<NewsDraft>(INITIAL_DRAFT);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const [editingPublication, setEditingPublication] = useState<MarketNews | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [retractionReason, setRetractionReason] = useState("");
  const newsQuery = useQuery({
    queryKey: stockKeys.adminMarketNews(),
    queryFn: () => unwrapAuthenticatedStockRequest(
      (token) => getAdminMarketNews(token),
      "공시·뉴스 이력을 조회하지 못했습니다.",
    ),
    refetchInterval: 5_000,
  });
  const storylineQuery = useQuery({
    queryKey: stockKeys.adminMarketNewsStorylines(),
    queryFn: () => unwrapAuthenticatedStockRequest(
      (token) => getAdminMarketNewsStorylines(token),
      "자동 뉴스 스토리 상태 조회에 실패했습니다.",
    ),
    refetchInterval: 15_000,
  });
  const saveMutation = useMutation({
    mutationFn: (payload: MarketNewsCreatePayload) => unwrapAuthenticatedStockRequest(
      (token) => editingPublication
        ? correctMarketNews(token, editingPublication.publicationId, payload)
        : createMarketNews(token, payload),
      editingPublication ? "정정 공시 등록에 실패했습니다." : "공시 등록에 실패했습니다.",
    ),
    onSuccess: async () => {
      setMessage(editingPublication ? "정정 공시를 새 revision으로 등록했습니다." : "구조화된 공시를 등록했습니다.");
      setEditingPublication(null);
      setDraft(INITIAL_DRAFT);
      setIdempotencyKey(createIdempotencyKey());
      await invalidateMarketNewsQueries(queryClient);
    },
    onError: (error) => setMessage(getStockErrorMessage(error, "공시 저장에 실패했습니다.")),
  });
  const retractMutation = useMutation({
    mutationFn: (publicationId: number) => unwrapAuthenticatedStockRequest(
      (token) => retractMarketNews(token, publicationId, retractionReason),
      "공시 철회에 실패했습니다.",
    ),
    onSuccess: async () => {
      setMessage("철회 publication을 새 revision으로 등록했습니다.");
      setEditingPublication(null);
      setRetractionReason("");
      setDraft(INITIAL_DRAFT);
      setIdempotencyKey(createIdempotencyKey());
      await invalidateMarketNewsQueries(queryClient);
    },
    onError: (error) => setMessage(getStockErrorMessage(error, "공시 철회에 실패했습니다.")),
  });
  const sortedInstruments = useMemo(
    () => [...instruments].sort((left, right) => left.symbol.localeCompare(right.symbol)),
    [instruments],
  );

  const updateDraft = <K extends keyof NewsDraft>(key: K, value: NewsDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    try {
      const parsedPayload: unknown = JSON.parse(draft.payloadText);
      if (!parsedPayload || Array.isArray(parsedPayload) || typeof parsedPayload !== "object") {
        throw new Error("구조화 사실 JSON은 객체여야 합니다.");
      }
      if (!draft.scopeKey) {
        throw new Error("대상 종목을 선택해 주세요.");
      }
      const materiality = Number(draft.materiality);
      if (!Number.isFinite(materiality) || materiality < 0 || materiality > 1) {
        throw new Error("중요도는 0 이상 1 이하이어야 합니다.");
      }
      setMessage(null);
      saveMutation.mutate({
        factType: draft.factType,
        scopeType: "SYMBOL",
        scopeKey: draft.scopeKey,
        sourceType: "ADMIN_STRUCTURED_FACT",
        certainty: draft.certainty,
        direction: draft.direction,
        materiality,
        payload: parsedPayload as MarketNewsCreatePayload["payload"],
        embargoUntil: draft.embargoUntil || null,
        publicationType: draft.publicationType,
        headline: draft.headline.trim(),
        summary: draft.summary.trim(),
        body: draft.body.trim(),
        sourceLabel: draft.sourceLabel.trim(),
        idempotencyKey,
      });
    } catch (error) {
      setMessage(getStockErrorMessage(error, "입력값을 확인해 주세요."));
    }
  };

  const beginCorrection = (news: MarketNews) => {
    setEditingPublication(news);
    setIdempotencyKey(createIdempotencyKey());
    setRetractionReason("");
    setDraft({
      body: news.body,
      certainty: news.certainty,
      direction: news.direction,
      embargoUntil: "",
      factType: news.factType,
      headline: news.headline.replace(/^\[정정\]\s*/, ""),
      materiality: String(news.materiality),
      payloadText: JSON.stringify(news.payload, null, 2),
      publicationType: "DISCLOSURE",
      scopeKey: news.scopeKey,
      sourceLabel: news.sourceLabel,
      summary: news.summary,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditing = () => {
    setEditingPublication(null);
    setRetractionReason("");
    setDraft(INITIAL_DRAFT);
    setIdempotencyKey(createIdempotencyKey());
    setMessage(null);
  };

  const busy = saveMutation.isPending || retractMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="admin-panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-black tracking-[0.12em] text-admin-accent">AUTOMATIC STORYLINES</p>
          <h2 className="mt-1 text-lg font-black text-white">종목별 자동 뉴스 흐름</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
            뉴스 활동성은 새 사건의 발생 간격에만 작용합니다. 방향·뉴스 건수·가격·거래량은 목표값으로 강제하지 않습니다.
          </p>
        </div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {(storylineQuery.data ?? []).map((storyline) => (
            <StorylineCard key={storyline.symbol} storyline={storyline} />
          ))}
          {storylineQuery.isLoading ? <p className="bg-[#111827] px-5 py-8 text-sm font-bold text-stock-subtle">스토리 상태를 불러오고 있습니다.</p> : null}
          {storylineQuery.isError ? <p className="bg-[#111827] px-5 py-8 text-sm font-bold text-stock-danger-strong">{getStockErrorMessage(storylineQuery.error, "스토리 상태를 조회하지 못했습니다.")}</p> : null}
          {!storylineQuery.isLoading && !storylineQuery.isError && (storylineQuery.data?.length ?? 0) === 0 ? <p className="bg-[#111827] px-5 py-8 text-sm font-bold text-stock-subtle">아직 초기화된 자동 뉴스 스토리가 없습니다.</p> : null}
        </div>
      </section>
      <section className="admin-panel mt-5 overflow-hidden">
        <div className="border-b border-white/10 bg-black/20 px-5 py-4">
          <p className="text-xs font-black tracking-[0.12em] text-admin-accent">STRUCTURED MARKET NEWS</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">{editingPublication ? "정정 공시 등록" : "구조화 공시 등록"}</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-stock-muted">
                사실과 공개 시각만 등록합니다. 이 화면은 가격·주문·거래량을 직접 변경하지 않습니다.
              </p>
            </div>
            {editingPublication ? (
              <span className="rounded-md bg-admin-accent-surface px-3 py-2 text-xs font-black text-admin-accent">
                lineage {editingPublication.lineageKey.slice(0, 8)} · revision {editingPublication.revisionNo + 1}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-4">
          <NewsField label="대상 종목">
            <select value={draft.scopeKey} onChange={(event) => updateDraft("scopeKey", event.target.value)} disabled={Boolean(editingPublication)} className="news-input">
              <option value="">종목 선택</option>
              {sortedInstruments.map((instrument) => <option key={instrument.symbol} value={instrument.symbol}>{instrument.symbol} · {instrument.name}</option>)}
            </select>
          </NewsField>
          <NewsField label="사실 유형">
            <select value={draft.factType} onChange={(event) => updateDraft("factType", event.target.value as MarketNewsFactType)} disabled={Boolean(editingPublication)} className="news-input">
              {FACT_TYPES.map((type) => <option key={type} value={type}>{factTypeLabel(type)}</option>)}
            </select>
          </NewsField>
          <NewsField label="방향">
            <select value={draft.direction} onChange={(event) => updateDraft("direction", event.target.value as NewsDraft["direction"])} className="news-input">
              <option value="POSITIVE">긍정</option><option value="NEUTRAL">중립</option><option value="NEGATIVE">부정</option><option value="UNCERTAIN">불확실</option>
            </select>
          </NewsField>
          <NewsField label="중요도 (0~1)">
            <input type="number" min="0" max="1" step="0.01" value={draft.materiality} onChange={(event) => updateDraft("materiality", event.target.value)} className="news-input" />
          </NewsField>
          <NewsField label="확실성">
            <select value={draft.certainty} onChange={(event) => updateDraft("certainty", event.target.value as NewsDraft["certainty"])} className="news-input">
              <option value="CONFIRMED">확정</option><option value="ESTIMATED">추정</option><option value="UNCONFIRMED">미확인</option>
            </select>
          </NewsField>
          <NewsField label="공개 형태">
            <select value={draft.publicationType} onChange={(event) => updateDraft("publicationType", event.target.value as NewsDraft["publicationType"])} disabled={Boolean(editingPublication)} className="news-input">
              <option value="DISCLOSURE">공시</option><option value="FLASH">속보</option><option value="FULL_ARTICLE">상세 기사</option>
            </select>
          </NewsField>
          <NewsField label="예약 공개 시각" hint="비우면 현재 시뮬레이션 시각에 공개">
            <input type="datetime-local" value={draft.embargoUntil} onChange={(event) => updateDraft("embargoUntil", event.target.value)} className="news-input" />
          </NewsField>
          <NewsField label="출처 표시">
            <input value={draft.sourceLabel} maxLength={100} onChange={(event) => updateDraft("sourceLabel", event.target.value)} className="news-input" />
          </NewsField>
          <div className="lg:col-span-4"><NewsField label="제목"><input value={draft.headline} maxLength={200} onChange={(event) => updateDraft("headline", event.target.value)} className="news-input" /></NewsField></div>
          <div className="lg:col-span-2"><NewsField label="요약"><textarea value={draft.summary} maxLength={1500} rows={5} onChange={(event) => updateDraft("summary", event.target.value)} className="news-input min-h-32 resize-y" /></NewsField></div>
          <div className="lg:col-span-2"><NewsField label="본문"><textarea value={draft.body} rows={5} onChange={(event) => updateDraft("body", event.target.value)} className="news-input min-h-32 resize-y" /></NewsField></div>
          <div className="lg:col-span-4"><NewsField label="구조화 사실 JSON" hint="기사의 숫자·조건과 동일한 원본 값을 입력합니다."><textarea value={draft.payloadText} rows={7} spellCheck={false} onChange={(event) => updateDraft("payloadText", event.target.value)} className="news-input min-h-40 resize-y font-mono text-xs" /></NewsField></div>
        </div>

        {editingPublication ? (
          <div className="mx-5 mb-5 rounded-md border border-white/10 bg-black/20 p-4">
            <label className="text-xs font-black text-stock-muted" htmlFor="market-news-retraction">이 revision을 철회할 사유</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input id="market-news-retraction" value={retractionReason} onChange={(event) => setRetractionReason(event.target.value)} className="news-input flex-1" placeholder="철회 사유" />
              <button type="button" disabled={busy || !retractionReason.trim()} onClick={() => retractMutation.mutate(editingPublication.publicationId)} className="h-11 rounded-md bg-admin-danger-surface px-4 text-sm font-black text-admin-danger disabled:opacity-40">철회 revision 등록</button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <p className={message?.includes("실패") || message?.includes("확인") ? "text-sm font-bold text-stock-danger-strong" : "text-sm font-bold text-stock-muted"}>{message ?? "예약 공개 전에는 사용자와 자동참여자에게 노출되지 않습니다."}</p>
          <div className="flex gap-2">
            {editingPublication ? <button type="button" onClick={cancelEditing} disabled={busy} className="h-11 rounded-md bg-white/10 px-4 text-sm font-black text-white">취소</button> : null}
            <button type="button" onClick={submit} disabled={busy} className="h-11 rounded-md bg-stock-accent px-5 text-sm font-black text-white disabled:opacity-40">{editingPublication ? "정정 등록" : "공시 등록"}</button>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div><h2 className="text-lg font-black text-white">공개·예약·정정 이력</h2><p className="mt-1 text-xs font-bold text-stock-subtle">원문을 덮어쓰지 않고 lineage별 revision으로 보존합니다.</p></div>
          <button type="button" onClick={() => void newsQuery.refetch()} disabled={newsQuery.isFetching} className="h-10 rounded-md bg-white/10 px-3 text-xs font-black text-white disabled:opacity-50">새로고침</button>
        </div>
        <div className="divide-y divide-white/10">
          {(newsQuery.data ?? []).map((news) => (
            <article key={news.publicationId} className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                  <span className="rounded bg-white/10 px-2 py-1 text-white">{news.scopeKey}</span>
                  <span className={directionClass(news.direction)}>{directionLabel(news.direction)}</span>
                  <span className="text-stock-muted">{publicationLabel(news.publicationType)}</span>
                  <span className="text-stock-subtle">revision {news.revisionNo}</span>
                  <span className={news.publicationStatus === "PUBLISHED" ? "text-admin-success" : "text-admin-warning"}>{news.publicationStatus === "PUBLISHED" ? "공개" : "예약"}</span>
                </div>
                <h3 className="mt-3 text-base font-black text-white">{news.headline}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-stock-muted">{news.summary}</p>
                <p className="mt-3 text-xs font-bold text-stock-subtle">발생 {formatSimulationDateTime(news.occurredAt)} · 공개 {formatSimulationDateTime(news.publishedAt ?? news.embargoUntil)} · 중요도 {news.materiality.toFixed(2)} · {news.sourceLabel}</p>
              </div>
              <button type="button" onClick={() => beginCorrection(news)} disabled={news.publicationType === "RETRACTION" || busy} className="h-10 self-start rounded-md bg-white/10 px-4 text-xs font-black text-white disabled:opacity-40">정정·철회</button>
            </article>
          ))}
          {newsQuery.isLoading ? <p className="px-5 py-10 text-center text-sm font-bold text-stock-subtle">공시 이력을 불러오고 있습니다.</p> : null}
          {newsQuery.isError ? <p className="px-5 py-10 text-center text-sm font-bold text-stock-danger-strong">{getStockErrorMessage(newsQuery.error, "공시 이력을 조회하지 못했습니다.")}</p> : null}
          {!newsQuery.isLoading && !newsQuery.isError && (newsQuery.data?.length ?? 0) === 0 ? <p className="px-5 py-10 text-center text-sm font-bold text-stock-subtle">등록된 공시·뉴스가 없습니다.</p> : null}
        </div>
      </section>
      <style jsx>{`
        :global(.news-input) {
          width: 100%;
          min-height: 2.75rem;
          border: 1px solid rgb(255 255 255 / 0.12);
          border-radius: 0.375rem;
          background: rgb(0 0 0 / 0.22);
          padding: 0.625rem 0.75rem;
          color: white;
          font-weight: 700;
          outline: none;
        }
        :global(.news-input:focus) {
          border-color: var(--color-stock-accent);
          box-shadow: 0 0 0 2px var(--color-stock-accent-surface);
        }
        :global(.news-input:disabled) {
          cursor: not-allowed;
          background: rgb(255 255 255 / 0.06);
          color: var(--admin-subtle);
        }
      `}</style>
    </div>
  );
}

function StorylineCard({ storyline }: { storyline: MarketNewsStoryline }) {
  const pattern = storyline.patternType ? {
    SHOCK_DECAY: "충격 후 감쇠",
    ISOLATED_EVENT: "독립 단발",
    CASCADE: "연쇄 공개",
    GRADUAL_BUILD: "점진 누적",
  }[storyline.patternType] : "대기";
  return (
    <article className="min-w-0 bg-[#111827] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-black text-white">{storyline.symbol}</strong>
        <span className={storyline.status === "ACTIVE" ? "text-xs font-black text-admin-success" : "text-xs font-black text-stock-subtle"}>{storyline.status === "ACTIVE" ? "진행 중" : "대기"}</span>
      </div>
      <p className="mt-3 text-sm font-black text-admin-accent-label">{pattern}</p>
      <p className="mt-1 text-xs font-bold text-stock-muted">단계 {storyline.stageNo} · revision {storyline.revisionNo}</p>
      <p className="mt-3 truncate text-[11px] font-bold text-stock-subtle">다음 후보 {storyline.nextEventAt ? formatSimulationDateTime(storyline.nextEventAt) : "-"}</p>
    </article>
  );
}

function NewsField({ children, hint, label }: { children: React.ReactNode; hint?: string; label: string }) {
  return <label className="block"><span className="text-xs font-black text-stock-muted">{label}</span>{hint ? <span className="ml-2 text-[11px] font-bold text-stock-subtle">{hint}</span> : null}<span className="mt-2 block">{children}</span></label>;
}

function factTypeLabel(type: MarketNewsFactType) {
  const labels: Partial<Record<MarketNewsFactType, string>> = { LARGE_CONTRACT: "대형 계약", CONTRACT_TERMINATION: "계약 해지", PRODUCTION_HALT: "생산 중단", LITIGATION: "소송", MANAGEMENT_CHANGE: "경영진 변경", CAPITAL_INCREASE: "유상증자", CASH_DIVIDEND: "현금배당" };
  return labels[type] ?? type;
}

function directionLabel(direction: MarketNews["direction"]) {
  return { POSITIVE: "긍정", NEUTRAL: "중립", NEGATIVE: "부정", UNCERTAIN: "불확실" }[direction];
}

function directionClass(direction: MarketNews["direction"]) {
  if (direction === "POSITIVE") return "text-admin-success";
  if (direction === "NEGATIVE") return "text-stock-danger-strong";
  return "text-stock-muted";
}

function publicationLabel(type: MarketNews["publicationType"]) {
  return { DISCLOSURE: "공시", FLASH: "속보", FULL_ARTICLE: "상세", CORRECTION: "정정", RETRACTION: "철회" }[type];
}

function formatSimulationDateTime(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

function createIdempotencyKey() {
  return `admin-news:${crypto.randomUUID()}`;
}
