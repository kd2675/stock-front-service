import type { Metadata } from "next";
import AuthWatcher from "@/app/components/AuthWatcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Mock Trading",
  description: "주식 모의투자 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthWatcher />
        {children}
      </body>
    </html>
  );
}
