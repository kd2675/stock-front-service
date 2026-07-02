"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import AuthSessionBridge from "@/app/components/AuthSessionBridge";
import AuthWatcher from "@/app/components/AuthWatcher";
import { createQueryClient } from "@/app/lib/queryClient";

const ReactQueryDevtools = process.env.NODE_ENV === "development"
  ? dynamic(
    () =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    { ssr: false },
  )
  : null;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBridge />
      <AuthWatcher />
      {children}
      {ReactQueryDevtools ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      ) : null}
    </QueryClientProvider>
  );
}
