"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Check,
  ChevronLeft,
  ChevronRight,
  FileArchive,
  X,
  Search,
  Settings2,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { useI18n } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, getAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageTransition } from "@/components/motion/PageTransition";
import { LoginButton } from "@/components/auth/LoginButton";

type Step = 1 | 2 | 3 | 4;

interface Repo {
  id: number;
  full_name: string;
  description: string;
}

export default function SubmitPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [needsInstallation, setNeedsInstallation] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [pluginName, setPluginName] = useState("");
  const [pluginNameEn, setPluginNameEn] = useState("");
  const [pluginDesc, setPluginDesc] = useState("");
  const [pluginDescEn, setPluginDescEn] = useState("");
  const [pluginType, setPluginType] = useState<"theme" | "buddy" | "sound">(
    "theme",
  );
  const [pricing, setPricing] = useState<"free" | "paid">("free");
  const [price, setPrice] = useState("");
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Load repos
  useEffect(() => {
    if (!user) return;
    setLoadingRepos(true);
    apiFetch<{ repos: Repo[]; needs_installation: boolean }>(
      "/api/public/developer/repos",
    )
      .then((res) => {
        setRepos(res.repos || []);
        setNeedsInstallation(!!res.needs_installation);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoadingRepos(false));
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setBundleFile(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setBundleFile(file);
    },
    [],
  );

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Submit metadata
      const res = await apiFetch<{ plugin_id: string }>(
        "/api/public/developer/submit",
        {
          method: "POST",
          body: JSON.stringify({
            repo: selectedRepo,
            name: pluginName,
            name_en: pluginNameEn,
            description: pluginDesc,
            description_en: pluginDescEn,
            type: pluginType,
            price: pricing === "free" ? 0 : parseFloat(price) || 0,
          }),
        },
      );

      // Upload bundle if present
      if (bundleFile && res.plugin_id) {
        const formData = new FormData();
        formData.append("file", bundleFile);
        formData.append("plugin_id", res.plugin_id);

        const adminApi =
          process.env.NEXT_PUBLIC_ADMIN_API || "https://cat.wdao.chat";
        await fetch(`${adminApi}/api/public/developer/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: formData,
        });
      }

      setSubmitted(true);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="h-8 w-8 mx-auto border-2 border-[#CAFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold mb-4">{t.developer.submitPlugin}</h1>
        <p className="text-muted-foreground mb-6">{t.auth.loginRequired}</p>
        <LoginButton />
      </PageTransition>
    );
  }

  if (submitted) {
    return (
      <PageTransition className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#CAFF00]/10"
        >
          <Check className="h-8 w-8 text-[#CAFF00]" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-2"
        >
          {t.developer.submit}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6"
        >
          {t.developer.submitSuccess}
        </motion.p>
        <Link href="/developer">
          <Button
            variant="outline"
            className="border-[#CAFF00]/30 text-[#CAFF00]"
          >
            {t.developer.dashboard}
          </Button>
        </Link>
      </PageTransition>
    );
  }

  const steps = [
    { num: 1, label: t.developer.step1 },
    { num: 2, label: t.developer.step2 },
    { num: 3, label: t.developer.step3 },
    { num: 4, label: t.developer.step4 },
  ];

  return (
    <PageTransition className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/developer"
          className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
        >
          &larr; {t.developer.dashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          {t.developer.submitPlugin}
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="mb-10 flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  backgroundColor:
                    step >= s.num ? "#CAFF00" : "transparent",
                  color: step >= s.num ? "#000" : "rgb(136 136 136)",
                  borderColor:
                    step >= s.num
                      ? "#CAFF00"
                      : "rgba(255,255,255,0.08)",
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold border-2"
              >
                {step > s.num ? (
                  <Check className="h-4 w-4" />
                ) : (
                  s.num
                )}
              </motion.div>
              <span className="mt-2 text-[10px] text-muted-foreground hidden sm:block">
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <motion.div
                animate={{
                  backgroundColor:
                    step > s.num
                      ? "#CAFF00"
                      : "rgba(255,255,255,0.08)",
                }}
                className="mx-2 h-px w-8 sm:w-16 lg:w-24"
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Repo */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6 space-y-6">
                {needsInstallation && (
                  <div className="rounded-xl border border-[#CAFF00]/20 bg-[#CAFF00]/5 p-4 flex items-center gap-3">
                    <GitHubIcon className="h-5 w-5 text-[#CAFF00] shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t.developer.connectGithub}
                      </p>
                    </div>
                    <a
                      href="https://github.com/apps/mio-island/installations/new"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="bg-[#CAFF00] text-black hover:bg-[#b8e600]"
                      >
                        {t.developer.connectRepos}
                      </Button>
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.developer.selectRepo}
                  </label>
                  {loadingRepos ? (
                    <div className="h-11 bg-background rounded-lg border border-border/50 animate-pulse" />
                  ) : (
                    <>
                      {/* Search input — filters the list below */}
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="text"
                          value={repoSearchQuery}
                          onChange={(e) => setRepoSearchQuery(e.target.value)}
                          placeholder={t.developer.searchRepos}
                          className="pl-9 h-11 bg-background border-border/50 focus:border-[#CAFF00]/50 focus:ring-1 focus:ring-[#CAFF00]/20"
                        />
                      </div>

                      {/* Scrollable repo list, fixed max height, no clipping */}
                      <div className="rounded-lg border border-border/50 bg-background max-h-64 overflow-y-auto divide-y divide-border/30">
                        {(() => {
                          const q = repoSearchQuery.trim().toLowerCase();
                          const filtered = q
                            ? repos.filter((r) =>
                                r.full_name.toLowerCase().includes(q),
                              )
                            : repos;

                          if (filtered.length === 0) {
                            return (
                              <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                                {t.developer.noMatchingRepos}
                              </div>
                            );
                          }

                          return filtered.map((r) => {
                            const active = selectedRepo === r.full_name;
                            return (
                              <button
                                type="button"
                                key={r.id}
                                onClick={() => setSelectedRepo(r.full_name)}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 ${
                                  active
                                    ? "bg-[#CAFF00]/10 text-foreground"
                                    : "hover:bg-accent/30"
                                }`}
                              >
                                <GitHubIcon
                                  className={`h-4 w-4 shrink-0 ${
                                    active
                                      ? "text-[#CAFF00]"
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <span className="truncate flex-1">
                                  {r.full_name}
                                </span>
                                {active && (
                                  <Check className="h-4 w-4 text-[#CAFF00] shrink-0" />
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      {/* Always-visible "don't see your repo?" link — GitHub App
                          scopes repos individually, new repos need manual grant */}
                      <a
                        href="https://github.com/apps/mio-island/installations/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
                      >
                        <Settings2 className="h-4 w-4" />
                        <span>
                          {t.developer.notSeeingRepo}{" "}
                          <span className="underline underline-offset-4">
                            {t.developer.configureAccess}
                          </span>
                        </span>
                      </a>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
                  >
                    {t.developer.next}{" "}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Metadata */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.developer.pluginName} (CN)
                    </label>
                    <Input
                      value={pluginName}
                      onChange={(e) => setPluginName(e.target.value)}
                      placeholder="..."
                      className="bg-background border-border/50 h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.developer.pluginName} (EN)
                    </label>
                    <Input
                      value={pluginNameEn}
                      onChange={(e) => setPluginNameEn(e.target.value)}
                      placeholder="My Plugin"
                      className="bg-background border-border/50 h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.developer.pluginDesc} (CN)
                    </label>
                    <textarea
                      value={pluginDesc}
                      onChange={(e) => setPluginDesc(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-[#CAFF00]/50 focus:ring-1 focus:ring-[#CAFF00]/20 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.developer.pluginDesc} (EN)
                    </label>
                    <textarea
                      value={pluginDescEn}
                      onChange={(e) => setPluginDescEn(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-[#CAFF00]/50 focus:ring-1 focus:ring-[#CAFF00]/20 outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.developer.pluginType}
                  </label>
                  <div className="flex gap-2">
                    {(["theme", "buddy", "sound"] as const).map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPluginType(type)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          pluginType === type
                            ? "bg-[#CAFF00] text-black"
                            : "bg-background border border-border/50 text-muted-foreground hover:border-[#CAFF00]/30"
                        }`}
                      >
                        {
                          t.categories[
                            type === "buddy"
                              ? "buddies"
                              : type === "theme"
                                ? "themes"
                                : "sounds"
                          ]
                        }
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-border/50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                    {t.developer.prev}
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
                    disabled={!pluginName.trim()}
                  >
                    {t.developer.next}{" "}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Bundle + Price */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6 space-y-6">
                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.developer.uploadTitle}
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`rounded-xl border-2 border-dashed bg-background p-10 text-center transition-colors cursor-pointer ${
                      dragOver
                        ? "border-[#CAFF00] bg-[#CAFF00]/5"
                        : "border-border/50 hover:border-[#CAFF00]/30"
                    }`}
                    onClick={() =>
                      document.getElementById("bundle-input")?.click()
                    }
                  >
                    <input
                      id="bundle-input"
                      type="file"
                      accept=".zip,.tar.gz"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    {bundleFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileArchive className="h-8 w-8 text-[#CAFF00]" />
                        <div className="text-left">
                          <p className="text-sm font-medium">
                            {bundleFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(bundleFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBundleFile(null);
                          }}
                          className="p-1 rounded hover:bg-accent"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {t.developer.uploadDesc}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.developer.setPricing}
                  </label>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setPricing("free")}
                      className={`flex-1 rounded-xl border p-6 text-center transition-all ${
                        pricing === "free"
                          ? "border-[#CAFF00] bg-[#CAFF00]/5 glow-lime"
                          : "border-border/50 hover:border-[#CAFF00]/30"
                      }`}
                    >
                      <div className="font-semibold">
                        {t.developer.freeOption}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        $0.00
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setPricing("paid")}
                      className={`flex-1 rounded-xl border p-6 text-center transition-all ${
                        pricing === "paid"
                          ? "border-[#CAFF00] bg-[#CAFF00]/5 glow-lime"
                          : "border-border/50 hover:border-[#CAFF00]/30"
                      }`}
                    >
                      <div className="font-semibold">
                        {t.developer.paidOption}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        USD
                      </div>
                    </motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {pricing === "paid" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium mb-2">
                        {t.developer.priceInput}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.99"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="2.99"
                          className="bg-background border-border/50 h-11 pl-7"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="border-border/50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                    {t.developer.prev}
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
                  >
                    {t.developer.next}{" "}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold">
                  {t.developer.reviewSubmit}
                </h2>

                <div className="rounded-xl border border-border/50 bg-background p-4 space-y-3">
                  {selectedRepo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t.developer.repoUrl}
                      </span>
                      <span className="font-medium truncate ml-4">
                        {selectedRepo}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t.developer.pluginName}
                    </span>
                    <span className="font-medium">
                      {pluginName}
                      {pluginNameEn ? ` / ${pluginNameEn}` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t.developer.pluginType}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {
                        t.categories[
                          pluginType === "buddy"
                            ? "buddies"
                            : pluginType === "theme"
                              ? "themes"
                              : "sounds"
                        ]
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t.filter.price}
                    </span>
                    <span className="font-medium text-[#CAFF00]">
                      {pricing === "free"
                        ? t.plugin.free
                        : `$${price || "0.00"}`}
                    </span>
                  </div>
                  {bundleFile && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t.developer.uploadTitle}
                      </span>
                      <span className="font-medium truncate ml-4">
                        {bundleFile.name} (
                        {(bundleFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="border-border/50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                    {t.developer.prev}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t.developer.submit
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
