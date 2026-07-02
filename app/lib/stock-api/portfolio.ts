import { authenticatedGetJson } from "@/app/lib/stock-api/core";
import type { Portfolio, PortfolioSnapshot, ProfitSummary } from "@/app/types/stock";

export function getPortfolio(token: string) {
  return authenticatedGetJson<Portfolio>(token, "/api/stock/v1/portfolio/me");
}

export function getPortfolioSnapshots(token: string) {
  return authenticatedGetJson<PortfolioSnapshot[]>(token, "/api/stock/v1/portfolio/me/snapshots");
}

export function getProfitSummary(token: string) {
  return authenticatedGetJson<ProfitSummary>(token, "/api/stock/v1/portfolio/me/profit-summary");
}
