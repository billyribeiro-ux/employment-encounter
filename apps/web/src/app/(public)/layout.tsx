"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCheck, Search } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserCheck className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">Talent OS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/jobs">
              <Button variant="ghost" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
