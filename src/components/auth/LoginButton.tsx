"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { useI18n } from "@/i18n/context";

export function LoginButton() {
  const { login } = useAuth();
  const { t } = useI18n();

  return (
    <motion.button
      onClick={login}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[#CAFF00]/30 hover:text-[#CAFF00]"
    >
      <GitHubIcon className="h-4 w-4" />
      {t.auth.login}
    </motion.button>
  );
}
