/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalendarEvent, Project } from "../types";
import { FileDown, Sparkles, TrendingUp, CheckCircle, Clock, AlertTriangle, Play, FileText, ClipboardCopy, Check } from "lucide-react";

interface AdminDashboardProps {
  events: CalendarEvent[];
  projects: Project[];
  userRole: string;
}

export default function AdminDashboard({ events, projects, userRole }: AdminDashboardProps) {
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Compute stats
  const totalTasks = events.length;
  const completedTasks = events.filter((e) => e.status === "completed").length;
  const inProgressTasks = events.filter((e) => e.status === "in_progress").length;
  const pendingTasks = events.filter((e) => e.status === "pending").length;
  const delayedTasks = events.filter((e) => e.status === "delayed").length;

  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const delayRate = totalTasks ? Math.round((delayedTasks / totalTasks) * 100) : 0;

  // 1. Data for Task Status Distribution (Pie Chart)
  const statusData = [
    { name: "منجز", value: completedTasks, color: "#14b8a6" },
    { name: "قيد التنفيذ", value: inProgressTasks, color: "#0ea5e9" },
    { name: "معلق", value: pendingTasks, color: "#64748b" },
    { name: "متأخر", value: delayedTasks, color: "#f43f5e" }
  ].filter(item => item.value > 0);

  // 2. Data for Project Workloads (Bar Chart)
  const workloadData = projects.map((proj) => {
    const projEvents = events.filter((e) => e.project === proj.name);
    const completed = projEvents.filter((e) => e.status === "completed").length;
    const pendingActive = projEvents.filter((e) => e.status !== "completed").length;

    return {
      name: proj.name.substring(0, 15), // Truncate for display
      "منجز": completed,
      "نشط/معلق": pendingActive,
      total: projEvents.length
    };
  });

  const generateAiReport = async () => {
    setIsGenerating(true);
    setReportContent(null);
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events, projects }),
      });

      if (!response.ok) throw new Error("فشل توليد التقرير من خادم أثر.");
      const data = await response.json();
      setReportContent(data.report || "عذراً، لم ينجح الذكاء الاصطناعي في صياغة التقرير.");
    } catch (err: any) {
      console.error(err);
      setReportContent(`⚠️ فشل التوليد الذكي: ${err.message || "الخدمة غير متوفرة حالياً"}. الرجاء المحاولة لاحقاً.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!reportContent) return;
    navigator.clipboard.writeText(reportContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasAccess = userRole === "admin" || userRole === "manager";

  return (
    <div className="space-y-6" id="dashboard-main-container">
      {/* Upper quick stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">المهام المكتملة</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{completedTasks}</span>
              <span className="text-xs text-slate-400">/ {totalTasks}</span>
            </div>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">{completionRate}% نسبة الإنجاز</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">مهام جارية العمل</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{inProgressTasks}</span>
              <span className="text-xs text-slate-400">نشطة</span>
            </div>
            <span className="text-[10px] text-slate-400">تحت المتابعة الفورية</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">مهام متأخرة</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100 text-rose-600 dark:text-rose-400">{delayedTasks}</span>
              <span className="text-xs text-slate-400">تجاوزت الخطة</span>
            </div>
            <span className="text-[10px] text-rose-500 font-semibold">{delayRate}% نسبة الخلل</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">إجمالي عدد المشاريع</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{projects.length}</span>
              <span className="text-xs text-slate-400">مسجلين</span>
            </div>
            <span className="text-[10px] text-slate-400">متزامنين بالكامل</span>
          </div>
        </div>
      </div>

      {/* Graphics container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workloads - Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">توزيع أعباء العمل والمهام على المشاريع</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">يقارن بين عدد المهام المكتملة مقابل النشطة لكل مشروع لمتابعة التقدم التشغيلي</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888888" }} />
                <Tooltip
                  contentStyle={{
                    direction: "rtl",
                    textAlign: "right",
                    fontSize: "11px",
                    borderRadius: "10px",
                    background: "#0f172a",
                    color: "#ffffff"
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="منجز" stackId="a" fill="#14b8a6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="نشط/معلق" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Ratio - Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">نسبة توازن تسليمات المشروع</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">حالات الإنجاز والتعليق الفورية</p>
          </div>
          <div className="h-48 flex items-center justify-center relative">
            {statusData.length === 0 ? (
              <p className="text-xs text-slate-400">لا تتوفر مهام كافية لإجراء التحليل والتمثيل البياني.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-xs text-slate-400">الإنجاز</span>
              <span className="text-base font-bold text-teal-600 dark:text-teal-400">{completionRate}%</span>
            </div>
          </div>
          {/* Custom legends list */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Periodic Performance Report Generation section */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500 animate-pulse" />
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">مستشار أثر الذكي: إصدار التقرير الدوري والمؤشرات</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              نقوم بتحليل المخططات الزمنية ونسب التأخير وإنجاز المشاريع، لإنتاج تحليل إداري شامل بـ AI في ثوانٍ.
            </p>
          </div>

          {!hasAccess ? (
            <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/40">
              🔒 يقتصر التوليد على الإدارة
            </span>
          ) : (
            <button
              onClick={generateAiReport}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-medium text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-75"
            >
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: isGenerating ? "3s" : "0s" }} />
              <span>{isGenerating ? "جاري التدقيق وصياغة التحليل..." : "توليد تقرير الأداء الشامل (AI)"}</span>
            </button>
          )}
        </div>

        {isGenerating && (
          <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-sky-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              يقوم Gemini الآن بتحليل البيانات التفصيلية للمشاريع، تداخلات الساعات، ومستويات الأولوية لصياغة التقارير التشغيلية...
            </p>
          </div>
        )}

        {reportContent && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">تقرير المراقبة التشغيلية والالتزام اليومي</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-1 px-2 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                  title="نسخ التقرير إلى الحافظة"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "تم النسخ" : "نسخ التقرير"}</span>
                </button>
              </div>
            </div>

            <div className="prose dark:prose-invert prose-xs max-w-none text-slate-700 dark:text-slate-300 text-xs text-right leading-relaxed space-y-3 whitespace-pre-line" dir="rtl">
              {reportContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
