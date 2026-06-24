"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import AuthReduxBridge from "@/app/components/AuthReduxBridge";
import AuthWatcher from "@/app/components/AuthWatcher";
import { createQueryClient } from "@/app/lib/queryClient";
import { store } from "@/app/redux/store";

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
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthReduxBridge />
        <AuthWatcher />
        {children}
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        ) : null}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
