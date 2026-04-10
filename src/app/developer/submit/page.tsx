"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Step = 1 | 2 | 3 | 4;

export default function SubmitPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [pluginName, setPluginName] = useState("");
  const [pluginDesc, setPluginDesc] = useState("");
  const [pluginType, setPluginType] = useState<"theme" | "buddy" | "sound">("theme");
  const [repoUrl, setRepoUrl] = useState("");
  const [pricing, setPricing] = useState<"free" | "paid">("free");
  const [price, setPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { num: 1, label: t.developer.step1 },
    { num: 2, label: t.developer.step2 },
    { num: 3, label: t.developer.step3 },
    { num: 4, label: t.developer.step4 },
  ];

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#CAFF00]/10">
          <svg className="h-8 w-8 text-[#CAFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">{t.developer.submit}</h1>
        <p className="text-muted-foreground mb-6">
          Your plugin has been submitted for review. We'll notify you once it's approved.
        </p>
        <Link href="/developer">
          <Button variant="outline" className="border-[#CAFF00]/30 text-[#CAFF00]">
            {t.developer.dashboard}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/developer" className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors">
          &larr; {t.developer.dashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold">{t.developer.submitPlugin}</h1>
      </div>

      {/* Step Indicator */}
      <div className="mb-10 flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  step >= s.num
                    ? "bg-[#CAFF00] text-black"
                    : "bg-card border border-border/50 text-muted-foreground"
                }`}
              >
                {s.num}
              </div>
              <span className="mt-2 text-[10px] text-muted-foreground hidden sm:block">
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-2 h-px w-8 sm:w-16 lg:w-24 transition-colors ${
                  step > s.num ? "bg-[#CAFF00]" : "bg-border/50"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t.developer.pluginName}</label>
              <Input
                value={pluginName}
                onChange={(e) => setPluginName(e.target.value)}
                placeholder="My Awesome Plugin"
                className="bg-background border-border/50 h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.developer.pluginDesc}</label>
              <textarea
                value={pluginDesc}
                onChange={(e) => setPluginDesc(e.target.value)}
                placeholder="Describe your plugin..."
                rows={3}
                className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-[#CAFF00]/50 focus:ring-1 focus:ring-[#CAFF00]/20 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.developer.pluginType}</label>
              <div className="flex gap-2">
                {(["theme", "buddy", "sound"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPluginType(type)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pluginType === type
                        ? "bg-[#CAFF00] text-black"
                        : "bg-background border border-border/50 text-muted-foreground hover:border-[#CAFF00]/30"
                    }`}
                  >
                    {t.categories[type === "buddy" ? "buddies" : type === "theme" ? "themes" : "sounds"]}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload zone */}
            <div>
              <label className="block text-sm font-medium mb-2">{t.developer.uploadTitle}</label>
              <div className="rounded-xl border-2 border-dashed border-border/50 bg-background p-10 text-center hover:border-[#CAFF00]/30 transition-colors cursor-pointer">
                <svg className="mx-auto h-10 w-10 text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-muted-foreground">{t.developer.uploadDesc}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.developer.orPaste}</label>
              <Input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/my-plugin"
                className="bg-background border-border/50 h-11"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
                disabled={!pluginName.trim()}
              >
                {t.developer.next} &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{t.developer.preview}</h2>

            {/* Preview card mock */}
            <div className="rounded-2xl border border-border/50 bg-background overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                <span className="text-4xl">
                  {pluginType === "theme" ? "🎨" : pluginType === "buddy" ? "🐱" : "🎵"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pluginName || "Plugin Name"}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">@developer</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {t.categories[pluginType === "buddy" ? "buddies" : pluginType === "theme" ? "themes" : "sounds"]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {pluginDesc || "Plugin description..."}
                </p>
              </div>
            </div>

            {/* Validation */}
            <div>
              <h3 className="text-sm font-medium mb-3">{t.developer.validation}</h3>
              <div className="space-y-2">
                {[
                  { label: "plugin.json", pass: true },
                  { label: "README.md", pass: true },
                  { label: "Assets valid", pass: true },
                  { label: "No conflicts", pass: true },
                ].map((check) => (
                  <div
                    key={check.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10">
                      <svg className="h-3 w-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">{check.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-green-400">{t.developer.validationPass}</p>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-border/50"
              >
                &larr; {t.developer.prev}
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
              >
                {t.developer.next} &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{t.developer.setPricing}</h2>

            <div className="flex gap-3">
              <button
                onClick={() => setPricing("free")}
                className={`flex-1 rounded-xl border p-6 text-center transition-all ${
                  pricing === "free"
                    ? "border-[#CAFF00] bg-[#CAFF00]/5 glow-lime"
                    : "border-border/50 hover:border-[#CAFF00]/30"
                }`}
              >
                <div className="text-2xl mb-2">🆓</div>
                <div className="font-semibold">{t.developer.freeOption}</div>
                <div className="text-xs text-muted-foreground mt-1">$0.00</div>
              </button>
              <button
                onClick={() => setPricing("paid")}
                className={`flex-1 rounded-xl border p-6 text-center transition-all ${
                  pricing === "paid"
                    ? "border-[#CAFF00] bg-[#CAFF00]/5 glow-lime"
                    : "border-border/50 hover:border-[#CAFF00]/30"
                }`}
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold">{t.developer.paidOption}</div>
                <div className="text-xs text-muted-foreground mt-1">USD</div>
              </button>
            </div>

            {pricing === "paid" && (
              <div>
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
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-border/50"
              >
                &larr; {t.developer.prev}
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
              >
                {t.developer.next} &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{t.developer.submit}</h2>

            {/* Summary */}
            <div className="rounded-xl border border-border/50 bg-background p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.developer.pluginName}</span>
                <span className="font-medium">{pluginName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.developer.pluginType}</span>
                <Badge variant="outline" className="text-[10px]">
                  {t.categories[pluginType === "buddy" ? "buddies" : pluginType === "theme" ? "themes" : "sounds"]}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.filter.price}</span>
                <span className="font-medium text-[#CAFF00]">
                  {pricing === "free" ? t.plugin.free : `$${price || "0.00"}`}
                </span>
              </div>
              {repoUrl && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GitHub</span>
                  <span className="font-medium truncate ml-4">{repoUrl}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                className="border-border/50"
              >
                &larr; {t.developer.prev}
              </Button>
              <Button
                onClick={() => setSubmitted(true)}
                className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]"
              >
                {t.developer.submit}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
