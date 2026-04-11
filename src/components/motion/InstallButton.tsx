"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

type InstallState = "idle" | "loading" | "success";

interface InstallButtonProps {
  pluginId: string;
  price: number;
  freeLabel: string;
  buyLabel: string;
  className?: string;
}

export function InstallButton({
  pluginId,
  price,
  freeLabel,
  buyLabel,
  className = "",
}: InstallButtonProps) {
  const { user, login } = useAuth();
  const [state, setState] = useState<InstallState>("idle");

  async function handleClick() {
    if (!user) {
      login();
      return;
    }

    setState("loading");

    try {
      const data = await apiFetch<{ token: string }>(
        `/api/public/user/install-token`,
        {
          method: "POST",
          body: JSON.stringify({ pluginId }),
        },
      );

      // Trigger mioIsland URL scheme
      window.location.href = `mioIsland://install?token=${data.token}&plugin=${pluginId}`;

      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("idle");
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={state === "loading"}
      whileHover={{ scale: state === "idle" ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center justify-center gap-2 rounded-xl font-semibold h-11 text-base transition-colors ${
        state === "success"
          ? "bg-green-500 text-white"
          : "bg-[#CAFF00] text-black hover:bg-[#b8e600]"
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {price === 0 ? freeLabel : buyLabel}
          </motion.span>
        )}
        {state === "loading" && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </motion.span>
        )}
        {state === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
