"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h2 className="text-lg font-semibold">Authentication Error</h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong during authentication. Please try again.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.href = "/login"}>
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
