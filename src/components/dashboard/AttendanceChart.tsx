import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart, ArrowUpRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface AttendanceData {
  day: string;
  count: number;
}

interface AttendanceChartProps {
  dailyData?: AttendanceData[];
  weeklyData?: AttendanceData[];
  monthlyData?: AttendanceData[];
}

const defaultDailyData: AttendanceData[] = [
  { day: "السبت", count: 24 },
  { day: "الأحد", count: 18 },
  { day: "الإثنين", count: 30 },
  { day: "الثلاثاء", count: 22 },
  { day: "الأربعاء", count: 28 },
  { day: "الخميس", count: 32 },
  { day: "الجمعة", count: 15 },
];

const defaultWeeklyData: AttendanceData[] = [
  { day: "الأسبوع 1", count: 120 },
  { day: "الأسبوع 2", count: 145 },
  { day: "الأسبوع 3", count: 132 },
  { day: "الأسبوع 4", count: 150 },
];

const defaultMonthlyData: AttendanceData[] = [
  { day: "يناير", count: 520 },
  { day: "فبراير", count: 480 },
  { day: "مارس", count: 510 },
  { day: "أبريل", count: 550 },
  { day: "مايو", count: 590 },
  { day: "يونيو", count: 600 },
];

const AttendanceChart = ({
  dailyData = defaultDailyData,
  weeklyData = defaultWeeklyData,
  monthlyData = defaultMonthlyData,
}: AttendanceChartProps) => {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");

  // Function to get the maximum value for scaling
  const getMaxValue = (data: AttendanceData[]) => {
    return Math.max(...data.map((item) => item.count)) * 1.2; // Add 20% padding
  };

  // Render the chart based on the selected type
  const renderChart = (data: AttendanceData[]) => {
    const maxValue = getMaxValue(data);

    switch (chartType) {
      case "bar":
        return (
          <div className="h-[300px] w-full flex items-end justify-between gap-2 mt-6">
            {data.map((item, index) => {
              const height = (item.count / maxValue) * 100;
              return (
                <div key={index} className="flex flex-col items-center w-full">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-r from-blue-500 to-purple-600 relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatNumber(item.count)}
                    </div>
                  </div>
                  <div className="text-xs mt-2 text-center">{item.day}</div>
                </div>
              );
            })}
          </div>
        );

      case "line":
        return (
          <div className="h-[300px] w-full relative mt-6">
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${data.length * 100} 100`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>

              {/* Line */}
              <polyline
                points={data
                  .map((item, index) => {
                    const x = index * (100 / (data.length - 1));
                    const y = 100 - (item.count / maxValue) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {data.map((item, index) => {
                const x = index * (100 / (data.length - 1));
                const y = 100 - (item.count / maxValue) * 100;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#9333ea"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y="98"
                      textAnchor="middle"
                      fontSize="8"
                      fill="currentColor"
                    >
                      {item.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        );

      case "pie":
        const total = data.reduce((sum, item) => sum + item.count, 0);
        let cumulativePercent = 0;

        return (
          <div className="h-[300px] w-full flex justify-center items-center mt-6">
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {data.map((item, index) => {
                  const percent = (item.count / total) * 100;
                  const startPercent = cumulativePercent;
                  cumulativePercent += percent;

                  const startX =
                    50 + 50 * Math.cos((2 * Math.PI * startPercent) / 100);
                  const startY =
                    50 + 50 * Math.sin((2 * Math.PI * startPercent) / 100);
                  const endX =
                    50 + 50 * Math.cos((2 * Math.PI * cumulativePercent) / 100);
                  const endY =
                    50 + 50 * Math.sin((2 * Math.PI * cumulativePercent) / 100);

                  const largeArcFlag = percent > 50 ? 1 : 0;

                  const hue = (index * 40) % 360;

                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                      fill={`hsl(${hue}, 70%, 60%)`}
                      stroke="white"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg font-bold">{formatNumber(total)}</div>
              </div>
            </div>

            <div className="ml-4 flex flex-col gap-2">
              {data.map((item, index) => {
                const hue = (index * 40) % 360;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${hue}, 70%, 60%)` }}
                    />
                    <span className="text-xs">
                      {item.day}: {formatNumber(item.count)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/20">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          إحصائيات الحضور
        </CardTitle>
        <div className="flex items-center gap-1 bg-white/20 rounded-full p-1 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChartType("bar")}
            className={`h-8 w-8 rounded-full transition-all duration-200 ${
              chartType === "bar"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "hover:bg-white/20 text-gray-600"
            }`}
          >
            <BarChart className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChartType("line")}
            className={`h-8 w-8 rounded-full transition-all duration-200 ${
              chartType === "line"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "hover:bg-white/20 text-gray-600"
            }`}
          >
            <LineChart className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChartType("pie")}
            className={`h-8 w-8 rounded-full transition-all duration-200 ${
              chartType === "pie"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "hover:bg-white/20 text-gray-600"
            }`}
          >
            <PieChart className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="daily" dir="rtl" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6 bg-white/20 backdrop-blur-sm rounded-full p-1 border border-white/20">
            <TabsTrigger
              value="daily"
              className="rounded-full font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              يومي
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="rounded-full font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              أسبوعي
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="rounded-full font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              شهري
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="daily"
            className="space-y-4 bg-white/10 rounded-xl p-4 border border-white/20"
          >
            {renderChart(dailyData)}
          </TabsContent>
          <TabsContent
            value="weekly"
            className="space-y-4 bg-white/10 rounded-xl p-4 border border-white/20"
          >
            {renderChart(weeklyData)}
          </TabsContent>
          <TabsContent
            value="monthly"
            className="space-y-4 bg-white/10 rounded-xl p-4 border border-white/20"
          >
            {renderChart(monthlyData)}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6 pt-4 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50/20 rounded-full px-4 py-2 font-medium transition-all duration-200 hover:scale-105"
          >
            عرض التقرير الكامل
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
