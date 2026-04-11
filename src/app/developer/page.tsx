"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { useI18n } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/motion/PageTransition";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { LoginButton } from "@/components/auth/LoginButton";

interface DeveloperPlugin {
  id: string;
  name: string;
  name_en: string;
  downloads: number;
  revenue: number;
  status: string;
}

interface DeveloperStats {
  total_plugins: number;
  total_revenue: number;
  total_downloads: number;
}

export default function DeveloperPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [plugins, setPlugins] = useState<DeveloperPlugin[]>([]);
  const [stats, setStats] = useState<DeveloperStats>({
    total_plugins: 0,
    total_revenue: 0,
    total_downloads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [needsInstallation, setNeedsInstallation] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await apiFetch<{
          plugins: DeveloperPlugin[];
          stats: DeveloperStats;
          needs_installation?: boolean;
        }>("/api/public/developer/plugins");
        setPlugins(res.plugins);
        setStats(res.stats);
        if (res.needs_installation) {
          setNeedsInstallation(true);
        }
      } catch {
        // API may not be available
      } finally {
        setLoading(false);
      }
    }
    load();
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
      <PageTransition className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CAFF00]/10"
          >
            <GitHubIcon className="h-8 w-8 text-[#CAFF00]" />
          </motion.div>
          <h1 className="text-3xl font-bold">{t.developer.title}</h1>
          <p className="mt-2 text-muted-foreground">{t.developer.subtitle}</p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <LoginButton />
        </motion.div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t.developer.dashboard}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            @{user.github_login}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {needsInstallation && (
            <a
              href="https://github.com/apps/mio-island/installations/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-[#CAFF00]/30 text-[#CAFF00] hover:bg-[#CAFF00]/10"
              >
                <GitHubIcon className="h-4 w-4 mr-2" />
                {t.developer.connectRepos}
              </Button>
            </a>
          )}
          <Link href="/developer/submit">
            <Button className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]">
              <Plus className="h-4 w-4 mr-2" />
              {t.developer.submitPlugin}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.developer.myPlugins}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#CAFF00]">
                <AnimatedCounter value={stats.total_plugins} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.developer.totalRevenue}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#CAFF00]">
                <AnimatedCounter
                  value={stats.total_revenue / 100}
                  prefix="$"
                  decimals={2}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.developer.totalDownloads}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#CAFF00]">
                <AnimatedCounter value={stats.total_downloads} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* My Plugins Table */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-lg">{t.developer.myPlugins}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              <div className="h-6 w-6 mx-auto border-2 border-[#CAFF00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plugins.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted-foreground mb-4">
                {t.developer.noPluginsYet}
              </p>
              <Link href="/developer/submit">
                <Button className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.developer.submitPlugin}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {plugins.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/plugins/${p.id}`}
                      className="font-medium text-sm hover:text-[#CAFF00] transition-colors flex items-center gap-1.5"
                    >
                      {p.name}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                    <Badge
                      variant="outline"
                      className={
                        p.status === "published"
                          ? "text-green-400 border-green-500/30 bg-green-500/10 text-[10px]"
                          : p.status === "review"
                            ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 text-[10px]"
                            : "text-muted-foreground border-border/50 text-[10px]"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>{p.downloads.toLocaleString()} DL</span>
                    <span className="text-[#CAFF00] font-medium">
                      ${(p.revenue / 100).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
