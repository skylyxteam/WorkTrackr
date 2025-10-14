"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@/types";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { RoleGate } from "@/components/auth/role-gate";
import { clsx } from "clsx";
import { Clock, Menu, X } from "lucide-react";
import { useState } from "react";

function NavLinks() {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "My Time" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(
            "rounded-full px-4 py-2 transition",
            pathname === link.href
              ? "bg-blue-600 text-white shadow"
              : "text-[rgb(var(--color-subtle))] hover:bg-slate-100 hover:text-[rgb(var(--color-foreground))] dark:hover:bg-slate-800",
          )}
        >
          {link.label}
        </Link>
      ))}
      <RoleGate allow="admin">
        <Link
          href="/admin"
          className={clsx(
            "rounded-full px-4 py-2 transition",
            pathname === "/admin"
              ? "bg-blue-600 text-white shadow"
              : "text-[rgb(var(--color-subtle))] hover:bg-slate-100 hover:text-[rgb(var(--color-foreground))] dark:hover:bg-slate-800",
          )}
        >
          Admin
        </Link>
      </RoleGate>
    </>
  );
}

export function TopNav({ user }: { user: UserProfile }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-20 border-b border-[rgb(var(--color-border))] bg-white/80 backdrop-blur dark:bg-[rgb(var(--color-surface))]/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            <Clock className="h-3.5 w-3.5" /> WorkTrackr
          </span>
           {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <NavLinks />
          </nav>
        </div>
        
        {/* Desktop User Info & Sign Out */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span data-testid="nav-user-name" className="text-sm font-medium">{user.displayName}</span>
            <span className="text-xs text-[rgb(var(--color-subtle))]">{user.email}</span>
          </div>
          <SignOutButton />
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-lg p-2 text-[rgb(var(--color-foreground))] hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-surface))]">
          <div className="flex flex-col gap-2 p-4">
            {/* User Info */}
            <div className="flex flex-col gap-1 border-b border-[rgb(var(--color-border))] pb-4 mb-2">
              <span data-testid="nav-user-name-mobile" className="text-sm font-medium">{user.displayName}</span>
              <span className="text-xs text-[rgb(var(--color-subtle))]">{user.email}</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-2 text-sm">
              <NavLinks />
            </nav>

            {/* Sign Out Button */}
            <div className="pt-2 mt-2 border-t border-[rgb(var(--color-border))]">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
