import Link from "next/link";
import { FileQuestion, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* 404 badge */}
        <div className="mb-4 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          404 Error
        </div>

        {/* Messages */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Page not found in dashboard
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The dashboard page you&apos;re looking for doesn&apos;t exist or has been
          moved. Try navigating from the sidebar or return to the dashboard home.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
