"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export function UtilizationChart() {
  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: { name: string; value: number; seriesName: string }[]) => {
        const lines = params.map((p) => `${p.seriesName}: ${p.value}h`);
        return `<strong>${params[0].name}</strong><br/>${lines.join("<br/>")}`;
      },
    },
    legend: {
      data: ["Billable", "Non-billable"],
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
      data: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => `${v}h` },
      max: 10,
    },
    series: [
      {
        name: "Billable",
        type: "bar",
        stack: "hours",
        itemStyle: { color: "#2563eb", borderRadius: [0, 0, 0, 0] },
        data: [6.5, 7, 5.5, 8, 6],
      },
      {
        name: "Non-billable",
        type: "bar",
        stack: "hours",
        itemStyle: { color: "#94a3b8", borderRadius: [4, 4, 0, 0] },
        data: [1.5, 1, 2.5, 0.5, 2],
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
