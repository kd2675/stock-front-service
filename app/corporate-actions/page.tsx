import type { Metadata } from "next";

import CorporateActionsClient from "@/app/corporate-actions/CorporateActionsClient";

export const metadata: Metadata = {
  title: "기업 이벤트 | Stock Mock Trading",
  description: "주주배정 및 일반공모 유상증자 일정, 권리와 청약 현황",
};

export default function CorporateActionsPage() {
  return <CorporateActionsClient />;
}
