"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PluginCard } from "@/components/plugins/PluginCard";
import { plugins, type PluginType } from "@/data/plugins";

const ITEMS_PER_PAGE = 9;

type PriceFilter = "all" | "free" | "paid";
type SortOption = "newest" | "popular";

function BrowseContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") as PluginType | null;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PluginType | "all">(
    initialType || "all"
  );
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...plugins];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.zh.toLowerCase().includes(q) ||
          p.name.en.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }

    if (priceFilter === "free") {
      result = result.filter((p) => p.price === 0);
    } else if (priceFilter === "paid") {
      result = result.filter((p) => p.price > 0);
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      result.sort((a, b) => b.downloads - a.downloads);
    }

    return result;
  }, [search, typeFilter, priceFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.nav.browse}</h1>
        <p className="mt-2 text-muted-foreground">
          {plugins.length} {t.stats.plugins}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder={t.nav.search}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md bg-card border-border/50 h-11 focus:border-[#CAFF00]/50 focus:ring-[#CAFF00]/20"
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
              <button
                key={opt.value}
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
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.filter.price}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {priceOptions.map((opt) => (
              <button
                key={opt.value}
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
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.filter.sort}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  sortBy === opt.value
                    ? "bg-[#CAFF00] text-black"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-[#CAFF00]/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(typeFilter !== "all" || priceFilter !== "all" || search) && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          {typeFilter !== "all" && (
            <Badge
              variant="secondary"
              className="bg-[#CAFF00]/10 text-[#CAFF00] border border-[#CAFF00]/20 cursor-pointer"
              onClick={() => setTypeFilter("all")}
            >
              {typeOptions.find((o) => o.value === typeFilter)?.label} &times;
            </Badge>
          )}
          {priceFilter !== "all" && (
            <Badge
              variant="secondary"
              className="bg-[#CAFF00]/10 text-[#CAFF00] border border-[#CAFF00]/20 cursor-pointer"
              onClick={() => setPriceFilter("all")}
            >
              {priceOptions.find((o) => o.value === priceFilter)?.label} &times;
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
        </div>
      )}

      {/* Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">{t.plugin.noResults}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-border/50"
          >
            &larr;
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
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
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-border/50"
          >
            &rarr;
          </Button>
        </div>
      )}
    </div>
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
              <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
