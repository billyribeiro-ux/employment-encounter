"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } } };

export default function DashboardLoading() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </motion.div>
      <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </motion.div>
      <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </motion.div>
    </motion.div>
  );
}
