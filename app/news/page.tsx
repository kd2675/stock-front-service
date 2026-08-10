import type { Metadata } from "next";

import NewsClient from "@/app/news/NewsClient";

export const metadata: Metadata = {
  title: "시장 뉴스 | Stock Mock Trading",
  description: "시뮬레이션 시장에 공개된 기업 공시와 정정·철회 이력",
};

export default function NewsPage() {
  return <NewsClient />;
}
