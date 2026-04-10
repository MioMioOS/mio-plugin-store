"use client";

import { I18nProvider } from "@/i18n/context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </I18nProvider>
  );
}
