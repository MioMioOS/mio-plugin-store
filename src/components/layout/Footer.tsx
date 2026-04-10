"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CAFF00]">
                <span className="text-sm font-bold text-black">M</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Mio<span className="text-[#CAFF00]">Island</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              {t.footer.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold">{t.footer.links}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/plugins"
                  className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
                >
                  {t.nav.browse}
                </Link>
              </li>
              <li>
                <Link
                  href="/developer"
                  className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
                >
                  {t.nav.developers}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
                >
                  {t.nav.about}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold">{t.footer.resources}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://github.com/MioMioOS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
                >
                  {t.footer.github}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/MioMioOS/mio-plugin-template"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
                >
                  {t.footer.template}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/MioMioOS/mio-plugin-admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-[#CAFF00] transition-colors"
                >
                  {t.footer.admin}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold">{t.footer.docs}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground cursor-default">
                  {t.footer.privacy}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground cursor-default">
                  {t.footer.terms}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/50 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
