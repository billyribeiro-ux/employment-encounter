"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}>
        <Card className="max-w-md w-full border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 0.5, delay: 0.3 }}>
                <div className="rounded-full bg-destructive/10 p-4 mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </motion.div>
              <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mb-4">
                An unexpected error occurred. Please try again or contact support
                if the problem persists.
              </p>
              {error.message && (
                <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2 mb-4 font-mono max-w-full overflow-hidden text-ellipsis">
                  {error.message}
                </p>
              )}
              <div className="flex gap-2">
                <Button className="shadow-sm" onClick={reset}>Try Again</Button>
                <Button className="shadow-sm" variant="outline" onClick={() => window.location.href = "/dashboard"}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
