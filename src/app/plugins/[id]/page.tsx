"use client";

import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PluginCard } from "@/components/plugins/PluginCard";
import { getPlugin, plugins } from "@/data/plugins";

const typeColors: Record<string, string> = {
  theme: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  buddy: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  sound: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

function ThemeDetailPreview({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-full w-full items-end gap-2 p-6">
      {colors.map((color, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-lg transition-all duration-500 hover:opacity-80"
          style={{
            backgroundColor: color,
            height: `${25 + (i + 1) * 15}%`,
          }}
        />
      ))}
    </div>
  );
}

function BuddyDetailPreview({ emoji }: { emoji: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-8xl animate-bounce" style={{ animationDuration: "2s" }}>
        {emoji}
      </span>
    </div>
  );
}

function SoundDetailPreview({ icon }: { icon: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative">
        <span className="text-8xl">{icon}</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end gap-1 mt-20">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-[#CAFF00]/60 rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.random() * 24}px`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const versionHistory = [
  { version: "Current", date: "2026-03-15", notes: "Latest release" },
  { version: "Previous", date: "2026-02-01", notes: "Bug fixes and improvements" },
  { version: "Initial", date: "2025-12-01", notes: "Initial release" },
];

export default function PluginDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locale, t } = useI18n();
  const plugin = getPlugin(id);

  if (!plugin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Plugin not found</h1>
        <Link href="/plugins" className="mt-4 inline-block text-[#CAFF00] hover:underline">
          {t.plugin.backToStore}
        </Link>
      </div>
    );
  }

  const related = plugins
    .filter((p) => p.type === plugin.type && p.id !== plugin.id)
    .slice(0, 3);

  const installPath =
    plugin.type === "theme"
      ? "themes"
      : plugin.type === "buddy"
        ? "buddies"
        : "sounds";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/plugins" className="hover:text-[#CAFF00] transition-colors">
          {t.nav.browse}
        </Link>
        <span>/</span>
        <span className="text-foreground">{plugin.name[locale]}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Preview */}
        <div className="lg:col-span-3">
          <div className="relative h-72 sm:h-96 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-secondary to-accent">
            {plugin.type === "theme" && plugin.preview.colors && (
              <ThemeDetailPreview colors={plugin.preview.colors} />
            )}
            {plugin.type === "buddy" && plugin.preview.emoji && (
              <BuddyDetailPreview emoji={plugin.preview.emoji} />
            )}
            {plugin.type === "sound" && plugin.preview.icon && (
              <SoundDetailPreview icon={plugin.preview.icon} />
            )}
          </div>

          {plugin.type === "theme" && plugin.preview.colors && (
            <div className="mt-4 flex gap-2">
              {plugin.preview.colors.map((color, i) => (
                <div key={i} className="group relative">
                  <div
                    className="h-10 w-10 rounded-lg border border-border/50 cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border/50 whitespace-nowrap">
                    {color}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-medium uppercase tracking-wider ${typeColors[plugin.type]}`}
              >
                {t.categories[plugin.type === "buddy" ? "buddies" : plugin.type === "theme" ? "themes" : "sounds"]}
              </Badge>
              <span className="text-xs text-muted-foreground">v{plugin.version}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold">{plugin.name[locale]}</h1>
            <a
              href={`https://github.com/${plugin.authorGithub}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {plugin.author}
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {plugin.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {plugin.downloads.toLocaleString()} {t.plugin.downloads}
            </span>
          </div>

          {/* Price + Install */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="mb-4">
              <span className="text-2xl font-bold text-[#CAFF00]">
                {plugin.price === 0 ? t.plugin.free : `$${plugin.price.toFixed(2)}`}
              </span>
            </div>
            <Button className="w-full bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600] h-11 text-base">
              {plugin.price === 0 ? t.plugin.install : t.plugin.buy}
            </Button>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold mb-2">{t.plugin.description}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {plugin.description[locale]}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {plugin.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-accent text-xs text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator className="my-12 bg-border/50" />

      {/* Install Instructions */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">{t.plugin.installInstructions}</h2>
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#CAFF00]/10 text-xs font-bold text-[#CAFF00]">
              1
            </div>
            <p className="text-sm text-muted-foreground">{t.plugin.installStep1}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#CAFF00]/10 text-xs font-bold text-[#CAFF00]">
              2
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.plugin.installStep2}</p>
              <code className="block rounded-lg bg-background px-4 py-3 text-xs font-mono text-[#CAFF00] border border-border/50">
                ~/.config/codeisland/plugins/{installPath}/{plugin.id}/
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Version History */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">{t.plugin.versionHistory}</h2>
        <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
          {versionHistory.map((v, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">
                  {i === 0 ? `v${plugin.version}` : v.version}
                </span>
                <span className="ml-3 text-xs text-muted-foreground">{v.notes}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {i === 0 ? plugin.createdAt : v.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">{t.plugin.relatedPlugins}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PluginCard key={p.id} plugin={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
