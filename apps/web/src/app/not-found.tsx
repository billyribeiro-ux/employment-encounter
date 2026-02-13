import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex flex-col items-center justify-center px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/40 dark:bg-blue-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-100/40 dark:bg-indigo-900/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* 404 heading with subtle animated gradient */}
        <div className="relative mb-6">
          <h1
            className="text-[10rem] font-extrabold leading-none tracking-tighter bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-clip-text text-transparent select-none"
            style={{
              animation: "pulse404 4s ease-in-out infinite",
            }}
          >
            404
          </h1>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes pulse404 {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.7; }
                }
              `,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/80 dark:bg-slate-800/80 p-4 shadow-lg backdrop-blur-sm">
              <Search className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or navigate back to a safe place.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>

      {/* Branding footer */}
      <div className="absolute bottom-8 flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-foreground tracking-wide">
          Talent OS
        </p>
        <p className="text-xs text-muted-foreground">
          Next-Gen Hiring Platform
        </p>
      </div>
    </div>
  );
}
