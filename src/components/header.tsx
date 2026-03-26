"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, SettingsIcon, Clock, Moon, ChartArea } from "lucide-react";
import { format } from "date-fns";

import { Mark } from "./mark";
import { ToggleTheme } from "./toggle-theme";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Image from "next/image";

type HeaderUser = {
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  username?: string;
};

type HeaderProps = {
  user: HeaderUser;
  dateText?: number;
  onSignOut?: () => void;
};

const menuItems = [
  { icon: SettingsIcon, label: "Settings", href: "/settings-profile" },
  { icon: ChartArea, label: "Chart", href: "/chart" },
  { icon: ChartArea, label: "Kategoriyalar", href: "/chart-category" },
] as const;

export function Header({ user, dateText, onSignOut }: HeaderProps) {
  const pathname = usePathname();

  const fullName =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "User";
  const fallback =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.trim() || "U";

  const now = dateText ? new Date(dateText) : new Date();
  const timeLabel = format(now, "yyyy-MM-dd HH:mm:ss");

  const handleSignOut = () => {
    if (onSignOut) return onSignOut();
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.close();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background pt-2">
      <div className="relative flex h-16 items-center border-t border-b px-4">
        {/* Left: Logo */}
        <Link
          className="flex items-center gap-2 text-base leading-none font-semibold tracking-tight"
          href="/"
        >
          <div className="flex items-center">
            <Image src={'/main-logo.png'} alt="logo" className="max-w-9" width={64} height={64} />
          </div>
        </Link>

        <div className="flex-1" />

        {/* Right: user + time + dropdown */}
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight max-w-45 sm:max-w-65">
            <div className="text-sm font-medium text-foreground truncate">
              {fullName}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <span className="tabular-nums">{timeLabel}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full p-0"
                aria-label="Profile menu"
              >
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarImage
                    src={user.photo_url || "/placeholder.svg"}
                    alt={fullName}
                  />
                  <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="space-y-1">
                <div className="text-sm font-medium">{fullName}</div>
                {user.username ? (
                  <div className="text-xs text-muted-foreground">
                    @{user.username}
                  </div>
                ) : null}
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{timeLabel}</span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Theme toggle (dropdown ichida) */}
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Theme</span>
                </div>
                <ToggleTheme />
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* ✅ menuItems map */}
              <DropdownMenuGroup>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 ${active ? "text-primary" : ""
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOutIcon className="h-4 w-4" />
                <span>Chiqish</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Corner dots */}
        <div className="absolute right-[-4.5px] bottom-[-4.5px] flex size-2 rounded-[2px] border border-zinc-300 bg-popover dark:border-border" />
        <div className="absolute bottom-[-4.5px] left-[-4.5px] flex size-2 rounded-[2px] border border-zinc-300 bg-popover dark:border-border" />
      </div>
    </header>
  );
}