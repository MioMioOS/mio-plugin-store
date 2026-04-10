"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Placeholder dev data
const myPlugins = [
  { id: "ocean-night", name: "Ocean Night", downloads: 12580, revenue: 0, status: "published" },
  { id: "sunset-glow", name: "Sunset Glow", downloads: 8420, revenue: 25182, status: "published" },
  { id: "forest", name: "Forest", downloads: 6750, revenue: 13433.5, status: "review" },
];

export default function DeveloperPage() {
  const { t } = useI18n();
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CAFF00]/10">
            <svg className="h-8 w-8 text-[#CAFF00]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">{t.developer.title}</h1>
          <p className="mt-2 text-muted-foreground">{t.developer.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="space-y-4">
            <Input
              placeholder={t.developer.loginPlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background border-border/50 h-11"
            />
            <Button
              onClick={() => username.trim() && setLoggedIn(true)}
              className="w-full bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600] h-11"
              disabled={!username.trim()}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {t.developer.login}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = myPlugins.reduce((sum, p) => sum + p.revenue, 0);
  const totalDL = myPlugins.reduce((sum, p) => sum + p.downloads, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t.developer.dashboard}</h1>
          <p className="mt-1 text-sm text-muted-foreground">@{username}</p>
        </div>
        <Link href="/developer/submit">
          <Button className="bg-[#CAFF00] text-black font-semibold hover:bg-[#b8e600]">
            + {t.developer.submitPlugin}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.developer.myPlugins}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#CAFF00]">{myPlugins.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.developer.totalRevenue}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#CAFF00]">
              ${(totalRevenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.developer.totalDownloads}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#CAFF00]">
              {totalDL.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="border-border/50 bg-card mb-10">
        <CardHeader>
          <CardTitle className="text-lg">{t.developer.revenue}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-2 px-4">
            {[35, 45, 30, 55, 70, 60, 80, 65, 90, 75, 85, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-[#CAFF00]/20 rounded-t-md transition-all duration-300 hover:bg-[#CAFF00]/40"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between px-4 mt-2 text-[10px] text-muted-foreground">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </CardContent>
      </Card>

      {/* My Plugins Table */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-lg">{t.developer.myPlugins}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {myPlugins.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{p.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      p.status === "published"
                        ? "text-green-400 border-green-500/30 bg-green-500/10 text-[10px]"
                        : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 text-[10px]"
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
