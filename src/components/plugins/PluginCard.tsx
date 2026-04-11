"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Star, Download } from "lucide-react";
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

function DefaultPreview({ type }: { type: string }) {
  const colors =
    type === "theme"
      ? ["#6366f1", "#8b5cf6", "#a855f7"]
      : type === "buddy"
        ? ["#f97316", "#fb923c", "#fdba74"]
        : ["#3b82f6", "#60a5fa", "#93c5fd"];
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 p-4">
      {colors.map((c, i) => (
        <div
          key={i}
          className="h-8 w-8 rounded-full opacity-60"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function PluginCard({ plugin }: { plugin: Plugin }) {
  const { locale, t } = useI18n();

  const displayName =
    locale === "en" ? plugin.name_en || plugin.name : plugin.name;

  return (
    <Link href={`/plugins/${plugin.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-[#CAFF00]/30 hover:glow-lime">
        {/* Preview area */}
        <div className="relative h-40 bg-gradient-to-br from-secondary to-accent overflow-hidden">
          {plugin.type === "theme" && plugin.preview?.colors ? (
            <ThemePreview colors={plugin.preview.colors} />
          ) : (
            <DefaultPreview type={plugin.type} />
          )}

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium uppercase tracking-wider ${typeColors[plugin.type]}`}
            >
              {t.categories[
                plugin.type === "buddy"
                  ? "buddies"
                  : plugin.type === "theme"
                    ? "themes"
                    : "sounds"
              ]}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate group-hover:text-[#CAFF00] transition-colors">
                {displayName}
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
              <Star className="h-3 w-3" />
              {plugin.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {plugin.downloads.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
