"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { PluginCard } from "@/components/plugins/PluginCard";
import {
  plugins,
  getFeaturedPlugins,
  totalDownloads,
  totalDevelopers,
} from "@/data/plugins";

const categoryIcons = {
  themes: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  ),
  buddies: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  sounds: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  ),
};

export default function HomePage() {
  const { t } = useI18n();
  const featured = getFeaturedPlugins();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CAFF00]/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#CAFF00]/3 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient-lime">{t.hero.title}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/plugins">
                <Button
                  size="lg"
                  className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600] px-8 h-12 text-base"
                >
                  {t.hero.browse}
                </Button>
              </Link>
              <Link href="/developer">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-[#CAFF00]/30 text-[#CAFF00] hover:bg-[#CAFF00]/10 px-8 h-12 text-base"
                >
                  {t.hero.develop}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#CAFF00] sm:text-3xl">
                {plugins.length}
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t.stats.plugins}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#CAFF00] sm:text-3xl">
                {totalDevelopers}
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t.stats.developers}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#CAFF00] sm:text-3xl">
                {(totalDownloads / 1000).toFixed(1)}K
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t.stats.downloads}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(["themes", "buddies", "sounds"] as const).map((cat) => (
            <Link
              key={cat}
              href={`/plugins?type=${cat === "buddies" ? "buddy" : cat === "themes" ? "theme" : "sound"}`}
              className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-[#CAFF00]/30 hover:glow-lime"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#CAFF00]/10 text-[#CAFF00] transition-colors group-hover:bg-[#CAFF00]/20">
                {categoryIcons[cat]}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-[#CAFF00] transition-colors">
                  {t.categories[cat]}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plugins.filter((p) =>
                    cat === "buddies"
                      ? p.type === "buddy"
                      : cat === "themes"
                        ? p.type === "theme"
                        : p.type === "sound"
                  ).length}{" "}
                  {t.stats.plugins}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t.featured.title}</h2>
          <Link
            href="/plugins"
            className="text-sm text-[#CAFF00] hover:underline"
          >
            {t.featured.viewAll} &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
        </div>
      </section>
    </div>
  );
}
