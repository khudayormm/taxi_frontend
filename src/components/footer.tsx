"use client"

import { useKeyboardOpen } from "@/hooks/use-keyboard-open-ts";
import { ChartBarBig, Home, ShieldUser } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";


export function Footer() {
  const keyboardOpen = useKeyboardOpen(120)
  const pathname = usePathname()

  return (
    <>

      {!keyboardOpen && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-md px-4">
            <nav className="grid grid-cols-3 gap-2 py-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
              <Link
                href="/"
                className={[
                  "group flex items-center justify-center rounded-2xl py-3 transition-all ring-1 ring-border active:scale-[0.98]",
                  pathname === "/" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/30 hover:bg-muted/60",
                ].join(" ")}
              >
                <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
              </Link>

              <Link
                href="/chart"
                className={[
                  "group flex items-center justify-center rounded-2xl py-3 transition-all ring-1 ring-border active:scale-[0.98]",
                  pathname === "/chart" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/30 hover:bg-muted/60",
                ].join(" ")}
              >
                <ChartBarBig className="h-5 w-5 transition-transform group-hover:scale-110" />
              </Link>

              <Link
                href="/settings"
                className={[
                  "group flex items-center justify-center rounded-2xl py-3 transition-all ring-1 ring-border active:scale-[0.98]",
                  pathname === "/settings" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/30 hover:bg-muted/60",
                ].join(" ")}
              >
                <ShieldUser className="h-5 w-5 transition-transform group-hover:scale-110" />
              </Link>
            </nav>
          </div>
        </footer>
      )}

    </>
  );
}
