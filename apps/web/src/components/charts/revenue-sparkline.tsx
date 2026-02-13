"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, CanvasRenderer]);

export function RevenueSparkline() {
  const option = {
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: "category",
      show: false,
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#22c55e" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(34, 197, 94, 0.25)" },
            { offset: 1, color: "rgba(34, 197, 94, 0)" },
          ]),
        },
        data: [320, 380, 420, 390, 450, 480, 520, 510, 560, 590, 620, 650],
      },
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: "cubicOut",
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
