"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Download, ExternalLink, Clock } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PluginCard } from "@/components/plugins/PluginCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { InstallButton } from "@/components/motion/InstallButton";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { ShimmerSkeleton } from "@/components/motion/ShimmerSkeleton";
import { apiFetch } from "@/lib/api";
import type { Plugin } from "@/data/plugins";

const typeColors: Record<string, string> = {
  theme: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  buddy: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  sound: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

function ThemeDetailPreview({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-full w-full items-end gap-2 p-6">
      {colors.map((color, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${25 + (i + 1) * 15}%` }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
          className="flex-1 rounded-t-lg transition-all duration-500 hover:opacity-80"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function DefaultDetailPreview({ type }: { type: string }) {
  const colors =
    type === "theme"
      ? ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e9d5ff"]
      : type === "buddy"
        ? ["#f97316", "#fb923c", "#fdba74"]
        : ["#3b82f6", "#60a5fa", "#93c5fd"];
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 p-6">
      {colors.map((c, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.08, type: "spring" }}
          className="h-12 w-12 rounded-full"
          style={{ backgroundColor: c, opacity: 0.7 }}
        />
      ))}
    </div>
  );
}

export default function PluginDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locale, t } = useI18n();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [related, setRelated] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Plugin>(`/api/public/plugins/${id}`);
        setPlugin(data);

        // Fetch related
        try {
          const relatedRes = await apiFetch<{ data: Plugin[] }>(
            `/api/public/plugins?type=${data.type}&limit=3&exclude=${id}`,
          );
          setRelated(relatedRes.data);
        } catch {
          // ignore
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ShimmerSkeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ShimmerSkeleton className="h-72 sm:h-96 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <ShimmerSkeleton className="h-8 w-3/4" />
            <ShimmerSkeleton className="h-5 w-1/2" />
            <ShimmerSkeleton className="h-32 rounded-2xl" />
            <ShimmerSkeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !plugin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Plugin not found</h1>
        <Link
          href="/plugins"
          className="mt-4 inline-block text-[#CAFF00] hover:underline"
        >
          {t.plugin.backToStore}
        </Link>
      </div>
    );
  }

  const displayName =
    locale === "en" ? plugin.name_en || plugin.name : plugin.name;
  const displayDesc =
    locale === "en"
      ? plugin.description_en || plugin.description
      : plugin.description;

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/plugins"
          className="hover:text-[#CAFF00] transition-colors"
        >
          {t.nav.browse}
        </Link>
        <span>/</span>
        <span className="text-foreground">{displayName}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Preview */}
        <div className="lg:col-span-3">
          <div className="relative h-72 sm:h-96 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-secondary to-accent">
            {plugin.type === "theme" && plugin.preview?.colors ? (
              <ThemeDetailPreview colors={plugin.preview.colors} />
            ) : (
              <DefaultDetailPreview type={plugin.type} />
            )}
          </div>

          {plugin.type === "theme" && plugin.preview?.colors && (
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
                {
                  t.categories[
                    plugin.type === "buddy"
                      ? "buddies"
                      : plugin.type === "theme"
                        ? "themes"
                        : "sounds"
                  ]
                }
              </Badge>
              <span className="text-xs text-muted-foreground">
                v{plugin.version}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold">{displayName}</h1>
            <a
              href={`https://github.com/${plugin.author_github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {plugin.author}
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-400" />
              {plugin.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              {plugin.downloads.toLocaleString()} {t.plugin.downloads}
            </span>
          </div>

          {/* Price + Install */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="mb-4">
              <span className="text-2xl font-bold text-[#CAFF00]">
                {plugin.price === 0
                  ? t.plugin.free
                  : `$${plugin.price.toFixed(2)}`}
              </span>
            </div>
            <InstallButton
              pluginId={plugin.id}
              price={plugin.price}
              freeLabel={t.plugin.install}
              buyLabel={t.plugin.buy}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold mb-2">
              {t.plugin.description}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayDesc}
            </p>
          </div>

          {/* Tags */}
          {plugin.tags && plugin.tags.length > 0 && (
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
          )}
        </div>
      </div>

      <Separator className="my-12 bg-border/50" />

      {/* Version History */}
      {plugin.versions && plugin.versions.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">
            {t.plugin.versionHistory}
          </h2>
          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
            {plugin.versions.map((v, i) => (
              <motion.div
                key={v.version}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">v{v.version}</span>
                    <span className="ml-3 text-xs text-muted-foreground">
                      {v.notes}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {v.created_at}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">
            {t.plugin.relatedPlugins}
          </h2>
          <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <StaggerItem key={p.id}>
                <AnimatedCard>
                  <PluginCard plugin={p} />
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>
      )}
    </PageTransition>
  );
}
