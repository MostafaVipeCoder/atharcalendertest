/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CalendarEvent, Project, UserRole } from "./types";
import CalendarGrid from "./components/CalendarGrid";
import AdminDashboard from "./components/AdminDashboard";
import { supabase } from "./supabaseClient";
import { syncWithGoogleSheets, SyncResult } from "./services/googleSheetsSync";
import { 
  Shield, Sparkles, Moon, Sun, Calendar, AreaChart, Users, CheckSquare, 
  Download, Upload, AlertCircle, RefreshCw, Menu, Settings, Search, 
  HelpCircle, Grid, ChevronDown, Plus, ChevronLeft, ChevronRight, User, CheckCircle2,
  FolderPlus, Trash2, Database
} from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true); // Default to true (Dark mode)
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectNames, setSelectedProjectNames] = useState<string[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#8ab4f8");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; type: "success" | "error" | "info" | null }>({ message: "", type: null });

  // Selected projects filter (all visible by default)
  useEffect(() => {
    if (projects.length > 0) {
      setSelectedProjectNames(projects.map(p => p.name));
    }
  }, [projects]);

  // Calendar dates navigation state
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); // Default to actual today
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "dashboard">("month"); // Default to month view

  // Add Event Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Theme effect
  useEffect(() => {
    const savedTheme = localStorage.getItem("athar_dark_mode");
    if (savedTheme !== null) {
      setDarkMode(savedTheme === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("athar_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Write variables inside localStorage on change
  useEffect(() => {
    localStorage.setItem("athar_cal_events", JSON.stringify(events));
  }, [events]);

  // Fetch projects and schedules from Supabase
  const fetchData = async () => {
    console.log("Supabase Client Instance:", !!supabase);
    if (!supabase) {
      console.warn("Supabase client is not configured. Skipping fetch.");
      return;
    }

    // Fetch Projects
    console.log("Fetching projects...");
    const { data: projData, error: projError } = await supabase
      .from('projects')
      .select('*');

    if (projError) {
      console.error("Error fetching projects:", projError);
    } else if (projData) {
      console.log("Projects fetched:", projData);
      setProjects(projData);
    }

    // Fetch Schedules
    console.log("Fetching schedules...");
    const { data: schedData, error: schedError } = await supabase
      .from('project_schedules')
      .select('*');

    if (schedError) {
      console.error("Error fetching project schedules:", schedError);
    } else if (schedData) {
      console.log("Schedules fetched:", schedData.length);
      // Create a map for project colors
      const projectColorMap = new Map();
      if (projData) {
        projData.forEach(proj => projectColorMap.set(proj.name, proj.color));
      }
      
      const formattedEvents: CalendarEvent[] = schedData.map((item: any) => ({
        id: item.id,
        project: item.project || "Default",
        category: item.category || "General",
        activity: item.activity || "Untitled",
        startDate: item.start_date || new Date().toISOString().substring(0, 10),
        endDate: item.end_date || new Date().toISOString().substring(0, 10),
        startTime: item.start_time || "09:00",
        endTime: item.end_time || "10:00",
        type: item.event_type || "timed", 
        status: item.status || "in_progress",
        priority: item.priority || "medium",
        description: item.description || `Project: ${item.project} - Category: ${item.category}`,
        color: projectColorMap.get(item.project) || item.color || "#8ab4f8",
        title: item.activity || "Untitled"
      }));

      setEvents(formattedEvents);
    }
  };

  // Real-time subscription to database changes
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('realtime-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'project_schedules' },
        () => {
          console.log("Project schedules changed, refreshing...");
          fetchData();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          console.log("Projects changed, refreshing...");
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ message: "جاري المزامنة مع الجدول...", type: "info" });
    
    try {
      const result = await syncWithGoogleSheets(supabase, "manual");
      if (result.error) {
        setSyncStatus({ message: result.message, type: "error" });
      } else {
        setSyncStatus({ message: result.message, type: "success" });
        if (result.updated) {
          await fetchData();
        }
      }
    } catch (error) {
      setSyncStatus({ message: "حدث خطأ غير متوقع أثناء المزامنة", type: "error" });
    } finally {
      setIsSyncing(false);
      // Clear status after 5 seconds
      setTimeout(() => setSyncStatus({ message: "", type: null }), 5000);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim() || !supabase) return;
    
    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: newProjectName, color: newProjectColor }])
      .select()
      .single();

    if (error) {
      console.error("Error adding project:", error);
    } else if (data) {
      setProjects(prev => [...prev, data]);
      setSelectedProjectNames(prev => [...prev, data.name]);
      setNewProjectName("");
      setIsAddingProject(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف مشروع "${name}"؟ سيؤدي ذلك لحذف جميع المواعيد المرتبطة به.`) || !supabase) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting project:", error);
    } else {
      setProjects(prev => prev.filter(p => p.id !== id));
      setSelectedProjectNames(prev => prev.filter(n => n !== name));
      setEvents(prev => prev.filter(e => e.project !== name));
    }
  };

  const userRole = "admin"; // Public access allows all edits

  // Callback handlers for schedule mutation
  const handleAddEvent = async (newEvt: CalendarEvent) => {
    setEvents((prev) => [newEvt, ...prev]);

    if (supabase) {
      const { error } = await supabase
        .from('project_schedules')
        .insert([{
          id: newEvt.id.startsWith('evt-') ? undefined : newEvt.id, 
          activity: newEvt.activity,
          category: newEvt.category,
          project: newEvt.project,
          start_date: newEvt.startDate,
          end_date: newEvt.endDate,
          start_time: newEvt.startTime,
          end_time: newEvt.endTime,
          event_type: newEvt.type,
          status: newEvt.status,
          priority: newEvt.priority,
          color: newEvt.color,
          description: newEvt.description
        }]);

      if (error) console.error("Error adding event to Supabase:", error);
    }
  };

  const handleUpdateEvent = async (updated: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));

    if (supabase) {
      const { error } = await supabase
        .from('project_schedules')
        .update({
          activity: updated.activity,
          category: updated.category,
          project: updated.project,
          start_date: updated.startDate,
          end_date: updated.endDate,
          start_time: updated.startTime,
          end_time: updated.endTime,
          event_type: updated.type,
          status: updated.status,
          priority: updated.priority,
          color: updated.color,
          description: updated.description
        })
        .eq('id', updated.id);

      if (error) console.error("Error updating event in Supabase:", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));

    if (supabase) {
      const { error } = await supabase
        .from('project_schedules')
        .delete()
        .eq('id', id);

      if (error) console.error("Error deleting event from Supabase:", error);
    }
  };

  // Toggle single project overlay sync
  const toggleProjectFilter = (projectName: string) => {
    setSelectedProjectNames((prev) =>
      prev.includes(projectName) ? prev.filter((n) => n !== projectName) : [...prev, projectName]
    );
  };

  // Reset demo events and clear state
  const handleResetApp = () => {
    if (window.confirm("هذه الخطوة ستعيد التقويم والبيانات إلى الضبط الافتراضي للمشروع. هل تود الاستمرار؟")) {
      setSelectedProjectNames(projects.map(p => p.name));
    }
  };

  // Real ICS file export helper for integration with Google Calendar, Outlook, or Apple Calendar
  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Athar Corporate Calendar//AR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    events.forEach((evt) => {
      const cleanStart = evt.startDate.replace(/[-:]/g, "") + "00";
      const cleanEnd = evt.endDate.replace(/[-:]/g, "") + "00";
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${evt.id}@athareg.com\n`;
      icsContent += `SUMMARY:${evt.title}\n`;
      icsContent += `DESCRIPTION:${evt.description || ""}\n`;
      icsContent += `DTSTART:${cleanStart}\n`;
      icsContent += `DTEND:${cleanEnd}\n`;
      icsContent += `CATEGORIES:${evt.category}\n`;
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "athar_gantt_calendar.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date Navigation Functions
  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === "day") {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handlePrev = () => {
    const prev = new Date(currentDate);
    if (viewMode === "month") {
      prev.setMonth(prev.getMonth() - 1);
    } else if (viewMode === "week") {
      prev.setDate(prev.getDate() - 7);
    } else if (viewMode === "day") {
      prev.setDate(prev.getDate() - 1);
    }
    setCurrentDate(prev);
  };

  // Mini Calendar rendering (dynamic)
  const renderMiniCalendar = () => {
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayWeekday = firstDay.getDay(); // 0 = Sunday
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Last day of previous month
    const lastDayPrevMonth = new Date(year, month, 0);
    const daysInPrevMonth = lastDayPrevMonth.getDate();
    
    // Build cells array
    const cells = [];
    
    // Previous month days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      cells.push({
        d: daysInPrevMonth - i,
        m: month - 1,
        y: year,
        current: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        d: i,
        m: month,
        y: year,
        current: true
      });
    }
    
    // Next month days to fill the grid (up to 42 total cells)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        d: i,
        m: month + 1,
        y: year,
        current: false
      });
    }

    // Check if a cell is today
    const isTodayCell = (cell: any) => {
      return cell.d === today.getDate() && 
             cell.m === today.getMonth() && 
             cell.y === today.getFullYear();
    };
    
    // Check if a cell is selected
    const isSelectedCell = (cell: any) => {
      return cell.d === currentDate.getDate() && 
             cell.m === currentDate.getMonth() && 
             cell.y === currentDate.getFullYear();
    };

    return (
      <div className="text-center font-sans">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold text-[#e3e3e3]">{months[month]} {year}</span>
          <div className="flex gap-1">
            <button onClick={handlePrev} className="p-1 hover:bg-[#2d2f31] rounded-full text-[#c4c7c5]">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleNext} className="p-1 hover:bg-[#2d2f31] rounded-full text-[#c4c7c5]">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-[11px] text-[#c4c7c5] font-semibold mb-1">
          {daysOfWeek.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-xs">
          {cells.map((cell, idx) => {
            const isToday = isTodayCell(cell);
            const isSelected = isSelectedCell(cell);
            return (
              <button
                key={idx}
                onClick={() => setCurrentDate(new Date(cell.y, cell.m, cell.d, 12, 0, 0))}
                className={`w-6 h-6 mx-auto flex items-center justify-center rounded-full transition-colors ${
                  isToday
                    ? "bg-[#8ab4f8] text-black font-bold"
                    : isSelected
                    ? "bg-[#8ab4f8]/25 text-[#8ab4f8] font-bold"
                    : cell.current
                    ? "text-[#e3e3e3] hover:bg-[#2d2f31]"
                    : "text-[#5f6368]"
                }`}
              >
                {cell.d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col font-sans bg-[#131314] text-[#e3e3e3] transition-colors duration-250 ${darkMode ? "dark" : ""}`} dir="ltr">
      {/* Top Google Calendar Navigation Header */}
      <header className="h-16 border-b border-[#2d2f31] bg-[#131314] px-3 flex items-center justify-between select-none">
        {/* Left corner: Logo and Navigation controls */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-[#2d2f31] text-[#c4c7c5]">
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Calendar App Logo */}
          <div className="flex items-center gap-2 ml-2">
            <div className="bg-[#4285f4] text-white font-bold w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm">
              <span>{currentDate.getDate()}</span>
            </div>
            <span className="text-xl font-medium text-white hidden sm:block">Calendar</span>
          </div>

          {/* Today selector */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="gcal-btn gcal-btn-outline ml-4"
          >
            Today
          </button>

          {/* Nav arrows */}
          <div className="flex items-center gap-0.5">
            <button onClick={handlePrev} className="gcal-btn-icon">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNext} className="gcal-btn-icon">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Current Date Display */}
          <span className="text-xl font-medium text-white ml-4">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Right corner: Search, Settings, View switcher, Profile */}
        <div className="flex items-center gap-2">
          {/* Action icons */}
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-[#c4c7c5]" />
            <input
              type="text"
              placeholder="Search events..."
              className="bg-[#1e1f20] border border-[#3c4043] rounded-full pl-10 pr-4 py-1.5 text-sm text-[#e3e3e3] outline-none focus:border-[#8ab4f8] focus:bg-[#131314] transition-all w-40 focus:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Dark Mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="gcal-btn-icon"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>

          {/* View selector dropdown */}
          <div className="relative mx-1">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="bg-[#131314] border border-[#3c4043] rounded-md px-3.5 py-1.5 text-sm text-[#e3e3e3] outline-none cursor-pointer hover:bg-[#2d2f31] font-semibold pr-8"
              style={{ appearance: "none" }}
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="dashboard">Dashboard 📊</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#c4c7c5] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

      </div>
    </header>

      {/* Main workspace section */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR (Mock Create button, Mini calendar, checklist overlays, tools) */}
        <aside className="w-64 border-r border-[#2d2f31] flex flex-col p-4 gap-4 overflow-y-auto shrink-0 bg-[#131314]">
          {/* Create Floating Action Button */}
          <div className="flex flex-col gap-2 mb-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-3 px-6 py-4 bg-[#1e1f20] hover:bg-[#2d2f31] text-white rounded-2xl shadow-md border border-[#3c4043] transition-colors self-start ml-2 font-medium w-full"
            >
              <Plus className="w-5 h-5 text-[#8ab4f8]" />
              <span>Create</span>
              <ChevronDown className="w-4 h-4 text-[#c4c7c5] ml-auto" />
            </button>

            {/* Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`flex items-center gap-3 px-6 py-3 bg-[#1e1f20] hover:bg-[#2d2f31] text-white rounded-2xl shadow-md border border-[#3c4043] transition-colors self-start ml-2 font-medium w-full ${isSyncing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="text-sm">تزامن مع الشيت</span>
            </button>

            {/* Sync Status Message */}
            {syncStatus.message && (
              <div className={`mx-2 p-2 rounded-lg text-[10px] flex items-center gap-2 ${
                syncStatus.type === "success" ? "bg-emerald-500/10 text-emerald-400" : 
                syncStatus.type === "error" ? "bg-rose-500/10 text-rose-400" : 
                "bg-blue-500/10 text-blue-400"
              }`}>
                {syncStatus.type === "success" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>

          {/* Sidebar Mini Calendar */}
          <div className="mb-4">
            {renderMiniCalendar()}
          </div>

          {/* Search box (Now integrated with top search) */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#c4c7c5]" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1e1f20] border border-[#2d2f31] rounded-md text-[#e3e3e3] focus:outline-none focus:border-[#8ab4f8]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* My Calendars checklist -> Projects */}
          <div className="space-y-2 border-b border-[#2d2f31] pb-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-[#c4c7c5] uppercase tracking-wider block">Projects</span>
              <button 
                onClick={() => setIsAddingProject(!isAddingProject)}
                className="p-1 hover:bg-[#2d2f31] rounded-full text-[#8ab4f8]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAddingProject && (
              <div className="px-1 py-2 space-y-2 bg-[#1e1f20] rounded-lg border border-[#2d2f31] mb-2">
                <input
                  type="text"
                  placeholder="Project name"
                  className="w-full px-2 py-1.5 text-[11px] bg-[#131314] border border-[#3c4043] rounded focus:outline-none focus:border-[#8ab4f8] text-white"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-6 h-6 bg-transparent border-none cursor-pointer"
                    value={newProjectColor}
                    onChange={(e) => setNewProjectColor(e.target.value)}
                  />
                  <button
                    onClick={handleAddProject}
                    className="flex-1 py-1 bg-[#0b57d0] text-white text-[10px] font-bold rounded"
                  >
                    Add Project
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {projects.map((proj) => {
                const isChecked = selectedProjectNames.includes(proj.name);
                return (
                  <div key={proj.id} className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#2d2f31] cursor-pointer">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProjectFilter(proj.name)}
                        className="w-4 h-4 rounded text-[#8ab4f8] bg-[#1e1f20] border-[#3c4043] focus:ring-0 cursor-pointer"
                      />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: proj.color }} />
                      <span className="text-xs text-[#e3e3e3] truncate">{proj.name}</span>
                    </label>
                    <button 
                      onClick={() => handleDeleteProject(proj.id, proj.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:bg-rose-900/20 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Project List Section (Static Display) */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-semibold text-[#c4c7c5] uppercase tracking-wider block px-1">Project Names List</span>
            <div className="space-y-1 px-2">
              {projects.map((proj) => (
                <div key={proj.id} className="flex items-center gap-2 text-xs text-[#e3e3e3] py-1 border-b border-[#2d2f31]/30 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                  <span className="truncate">{proj.name}</span>
                </div>
              ))}
              {projects.length === 0 && (
                <span className="text-[10px] text-[#5f6368] italic">No projects found</span>
              )}
            </div>
          </div>
        </aside>

        {/* Calendar / Dashboard grid pane */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#131314]">
          {viewMode === "dashboard" ? (
            <div className="flex-1 overflow-y-auto p-6" dir="rtl">
              <AdminDashboard
                events={events.filter(e => 
                  (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   e.project.toLowerCase().includes(searchQuery.toLowerCase()))
                )}
                projects={projects}
                userRole={userRole}
              />
            </div>
          ) : (
            <CalendarGrid
              events={events.filter((e) => 
                selectedProjectNames.includes(e.project) &&
                (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 e.project.toLowerCase().includes(searchQuery.toLowerCase()))
              )}
              projects={projects}
              userRole={userRole}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              viewMode={viewMode}
              setViewMode={setViewMode}
              showAddModal={showAddModal}
              setShowAddModal={setShowAddModal}
            />
          )}
        </main>

      </div>
    </div>
  );
}
