"use client";

import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Animated background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-[40%] -left-[20%] h-[80vh] w-[80vh] rounded-full bg-primary/5 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-[40%] -right-[20%] h-[80vh] w-[80vh] rounded-full bg-chart-2/5 blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0_0/3%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/3%)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
