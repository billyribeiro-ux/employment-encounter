"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  iconColor?: string;
  iconBg?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: StatCardProps) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : trend.value < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"
    : "";

  return (
    <motion.div variants={cardVariants}>
      <Card className={cn("card-hover overflow-hidden", className)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              {(trend || description) && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  {trend && TrendIcon && (
                    <>
                      <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
                      <span className={cn("text-xs font-medium", trendColor)}>
                        {trend.value > 0 ? "+" : ""}
                        {trend.value}%
                      </span>
                    </>
                  )}
                  {description && (
                    <span className="text-xs text-muted-foreground">{description}</span>
                  )}
                </div>
              )}
            </div>
            {Icon && (
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
