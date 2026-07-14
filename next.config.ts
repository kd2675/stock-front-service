import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "61.80.148.197",
    "61.80.148.197:3005",
  ],
  async redirects() {
    return [
      { source: "/supply-demand", destination: "/trade", permanent: true },
      { source: "/supply-demand/orders", destination: "/orders", permanent: true },
      { source: "/reports", destination: "/research", permanent: true },
      { source: "/virtual-price", destination: "/", permanent: true },
      { source: "/supply-demand/admin", destination: "/admin", permanent: true },
      { source: "/supply-demand/admin/market", destination: "/admin/market/instruments", permanent: true },
      { source: "/supply-demand/admin/accounts", destination: "/admin/funds/accounts", permanent: true },
      { source: "/supply-demand/admin/accounts/cash-flows", destination: "/admin/funds/ledger", permanent: true },
      { source: "/supply-demand/admin/accounts/salary", destination: "/admin/funds/payroll", permanent: true },
      { source: "/supply-demand/admin/accounts/profiles", destination: "/admin/participants/overview", permanent: true },
      { source: "/supply-demand/admin/accounts/participants", destination: "/admin/participants/list", permanent: true },
      { source: "/supply-demand/admin/participants", destination: "/admin/participants/list", permanent: true },
      { source: "/supply-demand/admin/automation", destination: "/admin/participants/profiles", permanent: true },
      { source: "/supply-demand/admin/automation/strategies", destination: "/admin/participants/list", permanent: true },
      { source: "/supply-demand/admin/automation/symbols", destination: "/admin/participants/symbols", permanent: true },
      { source: "/supply-demand/admin/automation/listing-auto", destination: "/admin/market/liquidity", permanent: true },
      { source: "/supply-demand/admin/automation/batch", destination: "/admin/system/jobs", permanent: true },
      { source: "/supply-demand/admin/events", destination: "/admin/corporate/actions", permanent: true },
    ];
  },
};

export default nextConfig;
