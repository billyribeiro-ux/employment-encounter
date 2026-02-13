"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}>
        <Card className="max-w-md w-full border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
              </motion.div>
              <h2 className="text-lg font-semibold mb-2">Page not found</h2>
              <p className="text-sm text-muted-foreground mb-4">
                The page you&apos;re looking for doesn&apos;t exist or has been
                moved.
              </p>
              <Link href="/dashboard">
                <Button className="shadow-sm">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
