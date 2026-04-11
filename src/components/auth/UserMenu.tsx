"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Package, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/i18n/context";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border/50 p-0.5 pr-3 transition-colors hover:border-[#CAFF00]/30"
      >
        <img
          src={user.avatar_url}
          alt={user.github_login}
          className="h-7 w-7 rounded-full"
        />
        <span className="text-sm font-medium hidden sm:block">
          {user.github_login}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border/50">
              <div className="text-sm font-medium">{user.github_login}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {user.role}
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/my-plugins"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Package className="h-4 w-4" />
                {t.auth.myPlugins}
              </Link>
              <Link
                href="/developer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t.auth.developerDashboard}
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-border/50 py-1">
              <button
                onClick={async () => {
                  setOpen(false);
                  await logout();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t.auth.logout}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
