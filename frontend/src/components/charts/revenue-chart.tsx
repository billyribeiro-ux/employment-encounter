"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function RevenueChart() {
  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: { name: string; value: number; seriesName: string }[]) => {
        const lines = params.map(
          (p) => `${p.seriesName}: $${(p.value / 100).toLocaleString()}`
        );
        return `<strong>${params[0].name}</strong><br/>${lines.join("<br/>")}`;
      },
    },
    legend: {
      data: ["Revenue", "Expenses"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: months,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v: number) => `$${(v / 100000).toFixed(0)}k`,
      },
    },
    series: [
      {
        name: "Revenue",
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
        itemStyle: { color: "#2563eb" },
        data: [
          320000, 380000, 420000, 390000, 450000, 480000,
          520000, 510000, 560000, 590000, 620000, 650000,
        ],
      },
      {
        name: "Expenses",
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.1 },
        lineStyle: { width: 2 },
        itemStyle: { color: "#ef4444" },
        data: [
          180000, 200000, 210000, 195000, 220000, 230000,
          240000, 235000, 250000, 260000, 270000, 280000,
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
