"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import AuthSessionBridge from "@/app/components/AuthSessionBridge";
import AuthWatcher from "@/app/components/AuthWatcher";
import { createQueryClient } from "@/app/lib/queryClient";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((module) => ({
      default: module.ReactQueryDevtools,
    })),
  { ssr: false },
);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBridge />
      <AuthWatcher />
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      ) : null}
    </QueryClientProvider>
  );
}
