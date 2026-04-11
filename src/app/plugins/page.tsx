"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PluginCard } from "@/components/plugins/PluginCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { PluginCardSkeleton } from "@/components/motion/ShimmerSkeleton";
import { apiFetch } from "@/lib/api";
import type { Plugin, PluginType } from "@/data/plugins";

const ITEMS_PER_PAGE = 9;

type PriceFilter = "all" | "free" | "paid";
type SortOption = "newest" | "popular";

function BrowseContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") as PluginType | null;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PluginType | "all">(
    initialType || "all",
  );
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [page, setPage] = useState(1);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (priceFilter !== "all") params.set("price", priceFilter);
      params.set("sort", sortBy);
      params.set("page", String(page));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await apiFetch<{
        data: Plugin[];
        total: number;
      }>(`/api/public/plugins?${params.toString()}`);
      setPlugins(res.data);
      setTotalCount(res.total);
    } catch {
      setPlugins([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, priceFilter, sortBy, page]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const typeOptions: { value: PluginType | "all"; label: string }[] = [
    { value: "all", label: t.filter.all },
    { value: "theme", label: t.categories.themes },
    { value: "buddy", label: t.categories.buddies },
    { value: "sound", label: t.categories.sounds },
  ];

  const priceOptions: { value: PriceFilter; label: string }[] = [
    { value: "all", label: t.filter.all },
    { value: "free", label: t.filter.free },
    { value: "paid", label: t.filter.paid },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "popular", label: t.filter.popular },
    { value: "newest", label: t.filter.newest },
  ];

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.nav.browse}</h1>
        <p className="mt-2 text-muted-foreground">
          {totalCount} {t.stats.plugins}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.nav.search}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10 bg-card border-border/50 h-11 focus:border-[#CAFF00]/50 focus:ring-[#CAFF00]/20"
        />
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-6">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.filter.type}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {typeOptions.map((opt) => (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setTypeFilter(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  typeFilter === opt.value
                    ? "bg-[#CAFF00] text-black"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-[#CAFF00]/30"
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.filter.price}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {priceOptions.map((opt) => (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setPriceFilter(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  priceFilter === opt.value
                    ? "bg-[#CAFF00] text-black"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-[#CAFF00]/30"
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.filter.sort}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortOptions.map((opt) => (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  sortBy === opt.value
                    ? "bg-[#CAFF00] text-black"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-[#CAFF00]/30"
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {(typeFilter !== "all" || priceFilter !== "all" || search) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 flex items-center gap-2 flex-wrap"
          >
            {typeFilter !== "all" && (
              <Badge
                variant="secondary"
                className="bg-[#CAFF00]/10 text-[#CAFF00] border border-[#CAFF00]/20 cursor-pointer"
                onClick={() => setTypeFilter("all")}
              >
                {typeOptions.find((o) => o.value === typeFilter)?.label}{" "}
                &times;
              </Badge>
            )}
            {priceFilter !== "all" && (
              <Badge
                variant="secondary"
                className="bg-[#CAFF00]/10 text-[#CAFF00] border border-[#CAFF00]/20 cursor-pointer"
                onClick={() => setPriceFilter("all")}
              >
                {priceOptions.find((o) => o.value === priceFilter)?.label}{" "}
                &times;
              </Badge>
            )}
            {search && (
              <Badge
                variant="secondary"
                className="bg-[#CAFF00]/10 text-[#CAFF00] border border-[#CAFF00]/20 cursor-pointer"
                onClick={() => setSearch("")}
              >
                &ldquo;{search}&rdquo; &times;
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <PluginCardSkeleton key={i} />
          ))}
        </div>
      ) : plugins.length > 0 ? (
        <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <StaggerItem key={plugin.id}>
              <AnimatedCard>
                <PluginCard plugin={plugin} />
              </AnimatedCard>
            </StaggerItem>
          ))}
        </StaggerGrid>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-20 text-center"
        >
          <p className="text-lg text-muted-foreground">{t.plugin.noResults}</p>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-border/50"
          >
            &larr;
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                Math.abs(p - page) <= 2,
            )
            .map((p, i, arr) => {
              const prev = arr[i - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis && (
                    <span className="px-1 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={
                      p === page
                        ? "bg-[#CAFF00] text-black"
                        : "border-border/50"
                    }
                  >
                    {p}
                  </Button>
                </span>
              );
            })}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-border/50"
          >
            &rarr;
          </Button>
        </motion.div>
      )}
    </PageTransition>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-8 w-32 rounded bg-card animate-pulse mb-8" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <PluginCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
