"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Palette, Smile, Volume2 } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Plugin } from "@/data/plugins";
import { PageTransition } from "@/components/motion/PageTransition";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { PluginCardSkeleton } from "@/components/motion/ShimmerSkeleton";
import { PluginCard } from "@/components/plugins/PluginCard";

interface StatsResponse {
  total_plugins: number;
  total_developers: number;
  total_downloads: number;
}

const categoryIcons = {
  themes: <Palette className="h-6 w-6" />,
  buddies: <Smile className="h-6 w-6" />,
  sounds: <Volume2 className="h-6 w-6" />,
};

export default function HomePage() {
  const { t } = useI18n();
  const [featured, setFeatured] = useState<Plugin[]>([]);
  const [stats, setStats] = useState<StatsResponse>({
    total_plugins: 0,
    total_developers: 0,
    total_downloads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pluginsRes, statsRes] = await Promise.allSettled([
          apiFetch<{ data: Plugin[] }>(
            "/api/public/plugins?sort=popular&limit=6",
          ),
          apiFetch<StatsResponse>("/api/public/stats"),
        ]);

        if (pluginsRes.status === "fulfilled") {
          setFeatured(pluginsRes.value.data);
        }
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value);
        }
      } catch {
        // API may not be available yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CAFF00] blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#CAFF00] blur-3xl"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              <span className="text-gradient-lime">{t.hero.title}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg text-muted-foreground sm:text-xl leading-relaxed"
            >
              {t.hero.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#CAFF00] sm:text-3xl">
                <AnimatedCounter value={stats.total_plugins} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t.stats.plugins}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#CAFF00] sm:text-3xl">
                <AnimatedCounter value={stats.total_developers} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t.stats.developers}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#CAFF00] sm:text-3xl">
                <AnimatedCounter
                  value={Math.round(stats.total_downloads / 1000)}
                  suffix="K"
                />
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
          {(["themes", "buddies", "sounds"] as const).map((cat, i) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
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
                </div>
              </Link>
            </motion.div>
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

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <PluginCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map((plugin) => (
              <StaggerItem key={plugin.id}>
                <AnimatedCard>
                  <PluginCard plugin={plugin} />
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            {t.plugin.noResults}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
