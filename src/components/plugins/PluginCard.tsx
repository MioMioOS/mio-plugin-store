"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Badge } from "@/components/ui/badge";
import type { Plugin } from "@/data/plugins";

const typeColors: Record<string, string> = {
  theme: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  buddy: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  sound: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

function ThemePreview({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-full w-full items-end gap-1 p-4">
      {colors.map((color, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md transition-all duration-300"
          style={{
            backgroundColor: color,
            height: `${30 + (i + 1) * 14}%`,
          }}
        />
      ))}
    </div>
  );
}

function BuddyPreview({ emoji }: { emoji: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
        {emoji}
      </span>
    </div>
  );
}

function SoundPreview({ icon }: { icon: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative">
        <span className="text-5xl">{icon}</span>
        <div className="absolute -inset-4 animate-pulse rounded-full bg-[#CAFF00]/5" />
      </div>
    </div>
  );
}

export function PluginCard({ plugin }: { plugin: Plugin }) {
  const { locale, t } = useI18n();

  return (
    <Link href={`/plugins/${plugin.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-[#CAFF00]/30 hover:glow-lime">
        {/* Preview area */}
        <div className="relative h-40 bg-gradient-to-br from-secondary to-accent overflow-hidden">
          {plugin.type === "theme" && plugin.preview.colors && (
            <ThemePreview colors={plugin.preview.colors} />
          )}
          {plugin.type === "buddy" && plugin.preview.emoji && (
            <BuddyPreview emoji={plugin.preview.emoji} />
          )}
          {plugin.type === "sound" && plugin.preview.icon && (
            <SoundPreview icon={plugin.preview.icon} />
          )}

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium uppercase tracking-wider ${typeColors[plugin.type]}`}
            >
              {t.categories[plugin.type === "buddy" ? "buddies" : plugin.type === "theme" ? "themes" : "sounds"]}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate group-hover:text-[#CAFF00] transition-colors">
                {plugin.name[locale]}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {plugin.author}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[#CAFF00]">
              {plugin.price === 0
                ? t.plugin.free
                : `$${plugin.price.toFixed(2)}`}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {plugin.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {plugin.downloads.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
