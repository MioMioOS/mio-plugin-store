"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { PluginCardSkeleton } from "@/components/motion/ShimmerSkeleton";
import { LoginButton } from "@/components/auth/LoginButton";
import type { Plugin } from "@/data/plugins";

export default function MyPluginsPage() {
  const { t, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    apiFetch<{ data: Plugin[] }>("/api/public/user/plugins")
      .then((res) => setPlugins(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="h-8 w-8 mx-auto border-2 border-[#CAFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t.auth.myPlugins}</h1>
        <p className="text-muted-foreground mb-6">{t.auth.loginRequired}</p>
        <LoginButton />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.auth.myPlugins}</h1>
        <p className="mt-2 text-muted-foreground">
          {t.myPlugins.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <PluginCardSkeleton key={i} />
          ))}
        </div>
      ) : plugins.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-20 text-center"
        >
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-4">
            {t.myPlugins.empty}
          </p>
          <Link href="/plugins">
            <Button className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]">
              {t.hero.browse}
            </Button>
          </Link>
        </motion.div>
      ) : (
        <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => {
            const displayName =
              locale === "en"
                ? plugin.name_en || plugin.name
                : plugin.name;
            return (
              <StaggerItem key={plugin.id}>
                <AnimatedCard>
                  <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
                    <div className="relative h-32 bg-gradient-to-br from-secondary to-accent overflow-hidden flex items-center justify-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium uppercase tracking-wider"
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
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold">{displayName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        v{plugin.version}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Link
                          href={`/plugins/${plugin.id}`}
                          className="text-xs text-[#CAFF00] hover:underline"
                        >
                          {t.plugin.description}
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto text-xs border-border/50 hover:border-[#CAFF00]/30 hover:text-[#CAFF00]"
                          onClick={() => {
                            window.location.href = `mioIsland://install?plugin=${plugin.id}`;
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {t.myPlugins.reinstall}
                        </Button>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      )}
    </PageTransition>
  );
}
