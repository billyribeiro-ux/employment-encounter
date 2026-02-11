"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

export function ClientDistributionChart() {
  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold" },
        },
        data: [
          { value: 12, name: "S Corp", itemStyle: { color: "#2563eb" } },
          { value: 8, name: "LLC", itemStyle: { color: "#7c3aed" } },
          { value: 15, name: "Individual", itemStyle: { color: "#059669" } },
          { value: 5, name: "C Corp", itemStyle: { color: "#d97706" } },
          { value: 3, name: "Partnership", itemStyle: { color: "#dc2626" } },
          { value: 2, name: "Nonprofit", itemStyle: { color: "#64748b" } },
        ],
      },
    ],
  };

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: "100%", width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
