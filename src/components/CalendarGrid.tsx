/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalendarEvent, EventPriority, EventStatus, Project } from "../types";

interface CalendarGridProps {
  events: CalendarEvent[];
  projects: Project[];
  userRole: string;
  onAddEvent: (newEvent: CalendarEvent) => void;
  onUpdateEvent: (updatedEvent: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  // Lifted from parent
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  viewMode: "month" | "week" | "day";
  setViewMode: (mode: "month" | "week" | "day") => void;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
}

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const ARABIC_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_SHORT_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarGrid({
  events,
  projects,
  userRole,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  showAddModal,
  setShowAddModal
}: CalendarGridProps) {
  // Modals / Details states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("إدارة");
  const [newPriority, setNewPriority] = useState<EventPriority>("medium");
  const [newProject, setNewProject] = useState("");
  const [newColor, setNewColor] = useState("#1d63bd");
  const [newStartDate, setNewStartDate] = useState("2026-06-08T09:00");
  const [newEndDate, setNewEndDate] = useState("2026-06-08T11:00");

  const handleProjectChange = (projectName: string) => {
    setNewProject(projectName);
    const selected = projects.find(p => p.name === projectName);
    if (selected) setNewColor(selected.color);
  };

  // Ensure initial project selection when modal opens
  React.useEffect(() => {
    if (showAddModal && projects.length > 0 && !newProject) {
      setNewProject(projects[0].name);
      setNewColor(projects[0].color);
    }
  }, [showAddModal, projects]);

  // Get start of the current week aligned with Sunday
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return days;
  };

  const handleOpenAdd = (defaultTimeISO?: string) => {
    if (defaultTimeISO) {
      setNewStartDate(defaultTimeISO);
      const parts = defaultTimeISO.split("T");
      const hr = parseInt(parts[1].split(":")[0]);
      const nextHr = String((hr + 2) % 24).padStart(2, "0");
      setNewEndDate(`${parts[0]}T${nextHr}:00`);
    }
    setNewTitle("");
    setNewDesc("");
    setShowAddModal(true);
  };

  const submitNewEvent = () => {
    if (!newTitle.trim() || !newProject) return;

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      startDate: newStartDate,
      endDate: newEndDate,
      status: "pending",
      priority: newPriority,
      category: newCategory,
      project: newProject,
      color: newColor
    };

    onAddEvent(newEvt);
    setShowAddModal(false);
  };

  const handleEventClick = (evt: CalendarEvent) => {
    setActiveEvent(evt);
    setShowDetailModal(true);
  };

  const updateActiveStatus = (status: EventStatus) => {
    if (!activeEvent) return;
    const updated = { ...activeEvent, status };
    onUpdateEvent(updated);
    setActiveEvent(updated);
  };

  const updateActiveSlotTime = (field: "startDate" | "endDate", value: string) => {
    if (!activeEvent) return;
    const updated = { ...activeEvent, [field]: value };
    onUpdateEvent(updated);
    setActiveEvent(updated);
  };

  const deleteActiveEvent = () => {
    if (!activeEvent) return;
    onDeleteEvent(activeEvent.id);
    setShowDetailModal(false);
    setActiveEvent(null);
  };

  // Helper: Shift events quickly (simulated Drag & Drop)
  const executeMoveEvent = (evt: CalendarEvent, offsetDays: number) => {
    const start = new Date(evt.startDate);
    const end = new Date(evt.endDate);
    start.setDate(start.getDate() + offsetDays);
    end.setDate(end.getDate() + offsetDays);

    const isoStart = start.toISOString().substring(0, 16);
    const isoEnd = end.toISOString().substring(0, 16);

    const updated = {
      ...evt,
      startDate: isoStart,
      endDate: isoEnd
    };
    onUpdateEvent(updated);
  };

  // Helper: check if an event is a dot event
  const isDotEvent = (evt: CalendarEvent) => {
    const title = evt.title.toLowerCase();
    return title.includes("اجتماع") || 
           title.includes("nqubator") || 
           title.includes("heaven") || 
           title.includes("مكتب جديد") || 
           title.includes("استوكات");
  };

  // Helper: Get formatted time e.g., 2pm, 12:30pm, etc.
  const getFormattedTime = (isoString: string) => {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0'+minutes : minutes;
    const timeStr = minutes === 0 ? `${hours}${ampm}` : `${hours}:${minutesStr}${ampm}`;
    return timeStr;
  };

  // Helper: get the banner styling classes
  const getBannerStyle = (evt: CalendarEvent) => {
    if (evt.color) {
      return ""; // We will use inline style for custom colors
    }
    if (evt.title.includes("pending task")) {
      return "bg-[#8ab4f8]/20 text-[#8ab4f8] hover:bg-[#8ab4f8]/30";
    }
    if (evt.title.includes("كراتين") || evt.category === "برمجة") {
      return "bg-[#8ab4f8]/20 text-[#8ab4f8] hover:bg-[#8ab4f8]/30";
    }
    return "bg-[#b39ddb]/20 text-[#d7c4f2] hover:bg-[#b39ddb]/30";
  };

  // Helper: get the dot color class
  const getDotColor = (evt: CalendarEvent) => {
    if (evt.color) {
      return ""; // Inline style will handle it
    }
    const title = evt.title.toLowerCase();
    if (title.includes("استوكات") || title.includes("جالانيكس")) {
      return "bg-[#c4c7c5]";
    }
    return "bg-[#8ab4f8]";
  };

  // Helper: format title text for dot events (append time if not present in title)
  const renderDotEventText = (evt: CalendarEvent) => {
    const timeStr = getFormattedTime(evt.startDate);
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        <span className="text-[10px] text-[#c4c7c5] whitespace-nowrap">{timeStr}</span>
        <span className="truncate text-white">{evt.title}</span>
      </div>
    );
  };

  const getIsoWeekNumber = (date: Date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Build the 42 continuous cells for Month View
  const getMonthViewCells = () => {
    const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOffset = firstOfMonth.getDay(); // Sunday=0
    const startGridDate = new Date(firstOfMonth);
    startGridDate.setDate(firstOfMonth.getDate() - startOffset);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startGridDate);
      cellDate.setDate(startGridDate.getDate() + i);
      cells.push(cellDate);
    }
    return cells;
  };

  const monthCells = getMonthViewCells();
  const monthRows = Array.from({ length: 6 }, (_, rowIdx) =>
    monthCells.slice(rowIdx * 7, rowIdx * 7 + 7)
  );

  // Time Indicator Logic
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeLinePosition = () => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Grid starts at 5 AM
    if (hours < 5 || hours > 23) return null;
    
    const minutesFromStart = (hours - 5) * 60 + minutes;
    const totalMinutes = (23 - 5 + 1) * 60;
    return (minutesFromStart / totalMinutes) * 100;
  };

  // Helper to calculate layout for overlapping events
  const getEventLayouts = (dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return [];

    const sorted = [...dayEvents].sort((a, b) => {
      const startA = new Date(a.startDate).getTime();
      const startB = new Date(b.startDate).getTime();
      if (startA !== startB) return startA - startB;
      const endA = new Date(a.endDate).getTime();
      const endB = new Date(b.endDate).getTime();
      return endB - endA; // Longer events first if same start
    });

    const columns: CalendarEvent[][] = [];
    const layouts: { event: CalendarEvent; column: number; totalColumns: number }[] = [];

    sorted.forEach(evt => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastEvtInCol = columns[i][columns[i].length - 1];
        if (new Date(evt.startDate) >= new Date(lastEvtInCol.endDate)) {
          columns[i].push(evt);
          layouts.push({ event: evt, column: i, totalColumns: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([evt]);
        layouts.push({ event: evt, column: columns.length - 1, totalColumns: 0 });
      }
    });

    // Simple overlap detection for totalColumns
    layouts.forEach(l1 => {
      let maxCol = l1.column;
      layouts.forEach(l2 => {
        const s1 = new Date(l1.event.startDate).getTime();
        const e1 = new Date(l1.event.endDate).getTime();
        const s2 = new Date(l2.event.startDate).getTime();
        const e2 = new Date(l2.event.endDate).getTime();
        
        if (s1 < e2 && s2 < e1) {
          maxCol = Math.max(maxCol, l2.column);
        }
      });
      l1.totalColumns = maxCol + 1;
    });

    // Refine totalColumns: all overlapping events in a "cluster" should share the same totalColumns
    // For simplicity, let's just use columns.length for events that are part of an overlapping set
    return layouts.map(l => ({ ...l, totalColumns: columns.length }));
  };

  const renderEventBlock = (evt: CalendarEvent, column: number, totalColumns: number, rowHeight: number, cellDateStr: string) => {
    const start = new Date(evt.startDate);
    const end = new Date(evt.endDate);
    
    const gridStartMins = 5 * 60; // 5 AM
    const gridEndMins = 24 * 60;  // Midnight

    // Calculate start mins relative to current day
    let eventStartMins = start.getHours() * 60 + start.getMinutes();
    if (evt.startDate.substring(0, 10) < cellDateStr) {
      eventStartMins = gridStartMins;
    }

    // Calculate end mins relative to current day
    let eventEndMins = end.getHours() * 60 + end.getMinutes();
    if (evt.endDate.substring(0, 10) > cellDateStr) {
      eventEndMins = gridEndMins;
    }

    const effectiveStart = Math.max(gridStartMins, eventStartMins);
    const effectiveEnd = Math.min(gridEndMins, eventEndMins);
    const duration = effectiveEnd - effectiveStart;

    if (duration <= 0) return null;

    const top = ((effectiveStart - gridStartMins) / 60) * rowHeight;
    const height = (duration / 60) * rowHeight;

    const width = 100 / totalColumns;
    const left = column * width;

    return (
      <div
        key={evt.id}
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(evt);
        }}
        className="absolute p-1.5 rounded-lg border-none shadow-sm font-semibold transition-all hover:z-50 hover:scale-[1.01] overflow-hidden cursor-pointer"
        style={{ 
          top: `${top + 1}px`, 
          height: `${height - 2}px`,
          left: `${left}%`,
          width: `${width - 0.5}%`,
          backgroundColor: evt.color ? `${evt.color}DD` : "#8ab4f8DD", 
          color: "#ffffff",
          borderLeft: `4px solid ${evt.color || "#8ab4f8"}`,
          zIndex: 10 + column
        }}
        dir="rtl"
      >
        <div className="text-[11px] font-bold truncate text-right">{evt.title}</div>
        {height > 35 && (
          <div className="text-[9px] text-white/90 mt-0.5 font-medium">
            {getFormattedTime(evt.startDate)} - {getFormattedTime(evt.endDate)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#000000] overflow-hidden" id="calendar-grid-main">
      
      {/* Calendar Grid Container */}
      <div className="flex-1 overflow-y-auto">
        
        {/* ================= VIEW MODE: MONTH ================= */}
        {viewMode === "month" && (
          <div className="h-full flex flex-col min-w-[980px]" dir="ltr">
            <div className="flex-1 grid grid-cols-[28px_repeat(7,minmax(0,1fr))] grid-rows-6 border-t border-l border-[#2d2f31]" id="month-grid-cells">
              {monthRows.map((row, rowIdx) => (
                <React.Fragment key={`month-row-${rowIdx}`}>
                  <div className="border-r border-b border-[#2d2f31] bg-[#000000] text-[#c4c7c5] text-[10px] font-medium flex items-start justify-center pt-4">
                    {getIsoWeekNumber(row[0])}
                  </div>

                  {row.map((cellDate, colIdx) => {
                    const year = cellDate.getFullYear();
                    const monthStr = String(cellDate.getMonth() + 1).padStart(2, "0");
                    const dayStr = String(cellDate.getDate()).padStart(2, "0");
                    const dateCompareStr = `${year}-${monthStr}-${dayStr}`;
                    const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth();
                    
                    const today = new Date();
                    const isToday = cellDate.getDate() === today.getDate() && 
                                    cellDate.getMonth() === today.getMonth() && 
                                    cellDate.getFullYear() === today.getFullYear();

                    const monthShort = cellDate.toLocaleDateString("en-US", { month: "short" });

                    const sortedEvents = events
                      .filter((e) => {
                        const startD = e.startDate.substring(0, 10);
                        const endD = e.endDate.substring(0, 10);
                        return dateCompareStr >= startD && dateCompareStr <= endD;
                      })
                      .sort((a, b) => a.startDate.localeCompare(b.startDate));

                    const visibleEvents = sortedEvents.slice(0, 5);
                    const hiddenCount = sortedEvents.length - visibleEvents.length;

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        onClick={() => handleOpenAdd(`${dateCompareStr}T09:00`)}
                        className={`border-r border-b border-[#2d2f31] bg-[#000000] px-2 py-1 min-h-[120px] hover:bg-[#17181a] transition-colors cursor-pointer flex flex-col overflow-hidden ${
                          isCurrentMonth ? "" : "opacity-45"
                        }`}
                      >
                        <div className="flex flex-col items-center mb-1">
                          {rowIdx === 0 && (
                            <span className="text-[10px] font-bold tracking-wide text-[#c4c7c5] uppercase mb-1">
                              {DAYS_SHORT_EN[cellDate.getDay()]}
                            </span>
                          )}
                          <span
                            className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday ? "bg-[#8ab4f8] text-black font-bold" : "text-[#e3e3e3]"
                            }`}
                          >
                            {cellDate.getDate() === 1 ? `${monthShort} ${cellDate.getDate()}` : cellDate.getDate()}
                          </span>
                        </div>

                        <div className="flex-1 space-y-0.5 overflow-hidden">
                          {visibleEvents.map((evt) => (
                            <div
                              key={`${dateCompareStr}-${evt.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(evt);
                              }}
                              className="flex items-center gap-1.5 text-[10px] leading-5 text-[#f1f3f4] hover:bg-white/5 rounded px-1 transition-colors"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: evt.color || "#8ab4f8" }}
                              />
                              {renderDotEventText(evt)}
                            </div>
                          ))}

                          {hiddenCount > 0 && (
                            <div className="text-[10px] font-medium text-[#a8c7fa] px-1 pt-0.5">
                              {hiddenCount} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* ================= VIEW MODE: WEEK ================= */}
        {viewMode === "week" && (
          <div className="flex flex-col h-full overflow-y-auto relative" dir="ltr">
            {/* Header Days Row */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#2d2f31] text-center sticky top-0 bg-[#000000] z-20">
              <div className="py-4 bg-[#000000] font-bold text-[9px] text-[#c4c7c5] border-r border-[#2d2f31]">GMT+3</div>
              {getWeekDays(currentDate).map((day, idx) => {
                const today = new Date();
                const isToday = day.getDate() === today.getDate() && 
                                day.getMonth() === today.getMonth() && 
                                day.getFullYear() === today.getFullYear();
                return (
                  <div key={idx} className="py-2.5 bg-[#000000] border-r last:border-r-0 border-[#2d2f31] flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold text-[#c4c7c5] block">{DAYS_SHORT_EN[day.getDay()]}</span>
                    <span className={`text-xl font-medium w-9 h-9 flex items-center justify-center rounded-full mt-1 ${
                      isToday ? "bg-[#8ab4f8] text-black font-bold" : "text-[#e3e3e3]"
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hourly slots */}
            <div className="relative flex-1">
              {/* Red Time Indicator Line */}
              {getTimeLinePosition() !== null && (
                <div 
                  className="absolute left-0 right-0 z-40 pointer-events-none flex items-center"
                  style={{ top: `${getTimeLinePosition()}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ea4335] -ml-[5px]" />
                  <div className="flex-1 h-[2px] bg-[#ea4335]" />
                </div>
              )}

              <div className="flex h-full">
                {/* Hour Labels Column */}
                <div className="w-[56px] flex flex-col bg-[#000000] border-r border-[#2d2f31]">
                  {Array.from({ length: 19 }).map((_, index) => {
                    const hour = index + 5;
                    const amPm = hour >= 12 ? "PM" : "AM";
                    const displayHr = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    return (
                      <div key={hour} className="h-[64px] relative">
                        <span className="absolute -top-2.5 left-0 right-0 text-[10px] font-medium text-[#c4c7c5] text-center">
                          {`${displayHr} ${amPm}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Day Columns */}
                <div className="flex-1 flex divide-x divide-[#2d2f31] relative">
                  {getWeekDays(currentDate).map((day, dayIdx) => {
                    const cellDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                    
                    const dayEvents = events.filter(e => {
                      const eventStart = e.startDate.substring(0, 10);
                      const eventEnd = e.endDate.substring(0, 10);
                      return cellDateStr >= eventStart && cellDateStr <= eventEnd;
                    });
                    const eventLayouts = getEventLayouts(dayEvents);

                    return (
                      <div key={dayIdx} className="flex-1 relative group h-[1216px]">
                        {/* Hour grid lines */}
                        {Array.from({ length: 19 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="h-[64px] border-b border-[#2d2f31] hover:bg-white/[0.02] cursor-pointer"
                            onClick={() => handleOpenAdd(`${cellDateStr}T${String(i + 5).padStart(2, "0")}:00`)}
                          />
                        ))}
                        
                        {/* Events Overlay */}
                        {eventLayouts.map(layout => renderEventBlock(layout.event, layout.column, layout.totalColumns, 64, cellDateStr))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW MODE: DAY ================= */}
        {viewMode === "day" && (
          <div className="flex flex-col h-full overflow-y-auto relative" dir="ltr">
            <div className="grid grid-cols-[56px_1fr] border-b border-[#2d2f31] text-center sticky top-0 bg-[#000000] z-20">
              <div className="py-4 bg-[#000000] font-bold text-[10px] text-[#c4c7c5] border-r border-[#2d2f31]">GMT+3</div>
              <div className="py-2.5 bg-[#000000] text-sm font-bold text-white flex items-center justify-center gap-4">
                <span className="text-[#c4c7c5] uppercase tracking-wider">{ARABIC_DAYS[currentDate.getDay()]}</span>
                <span className="w-10 h-10 rounded-full bg-[#8ab4f8] text-black flex items-center justify-center text-xl font-bold">
                  {currentDate.getDate()}
                </span>
              </div>
            </div>

            <div className="relative flex-1">
              {/* Red Time Indicator Line */}
              {getTimeLinePosition() !== null && (
                <div 
                  className="absolute left-0 right-0 z-40 pointer-events-none flex items-center"
                  style={{ top: `${getTimeLinePosition()}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#ea4335] -ml-[6px]" />
                  <div className="flex-1 h-[2px] bg-[#ea4335]" />
                </div>
              )}

              <div className="flex h-full">
                {/* Hour Labels Column */}
                <div className="w-[56px] flex flex-col bg-[#000000] border-r border-[#2d2f31]">
                  {Array.from({ length: 19 }).map((_, index) => {
                    const hour = index + 5;
                    const amPm = hour >= 12 ? "PM" : "AM";
                    const displayHr = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    return (
                      <div key={hour} className="h-[80px] relative">
                        <span className="absolute -top-3 left-0 right-0 text-[11px] font-medium text-[#c4c7c5] text-center">
                          {`${displayHr} ${amPm}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Day Content Area */}
                <div className="flex-1 relative">
                  {/* Hour grid lines */}
                  <div className="flex flex-col h-[1520px]">
                    {Array.from({ length: 19 }).map((_, i) => {
                      const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
                      return (
                        <div 
                          key={i} 
                          className="h-[80px] border-b border-[#2d2f31] hover:bg-white/[0.02] cursor-pointer"
                          onClick={() => handleOpenAdd(`${currentDayStr}T${String(i + 5).padStart(2, "0")}:00`)}
                        />
                      );
                    })}
                  </div>

                  {/* Events Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="relative h-full pointer-events-auto">
                      {(() => {
                        const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
                        const dayEvents = events.filter(e => {
                          const eventStart = e.startDate.substring(0, 10);
                          const eventEnd = e.endDate.substring(0, 10);
                          return currentDayStr >= eventStart && currentDayStr <= eventEnd;
                        });
                        const eventLayouts = getEventLayouts(dayEvents);
                        return eventLayouts.map(layout => renderEventBlock(layout.event, layout.column, layout.totalColumns, 80, currentDayStr));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD EVENT ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="add-event-modal" dir="rtl">
          <div className="bg-[#1e1f20] border border-[#2d2f31] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-right">
            <h3 className="font-bold text-lg text-white">إضافة مهمة جديدة إلى تقويم أثر</h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#c4c7c5] block mb-1">اسم الفعالية / المهمة</label>
                <input
                  type="text"
                  placeholder="مثال: مراجعة الكود مع عبد الله"
                  className="w-full px-3 py-2 text-xs bg-[#131314] border border-[#2d2f31] rounded-xl focus:outline-none focus:border-[#8ab4f8] text-right text-white"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#c4c7c5] block mb-1">تفاصيل المهمة والمستهدفات</label>
                <textarea
                  placeholder="وصف تفصيلي للمخرجات المتوقعة في هذا السلوت..."
                  className="w-full h-16 px-3 py-2 text-xs bg-[#131314] border border-[#2d2f31] rounded-xl focus:outline-none focus:border-[#8ab4f8] text-right text-white resize-none"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#c4c7c5] block mb-1">تاريخ ووقت البدء</label>
                  <input
                    type="datetime-local"
                    className="w-full px-2 py-1.5 text-xs bg-[#131314] border border-[#2d2f31] rounded-xl text-center text-white"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#c4c7c5] block mb-1">تاريخ ووقت الانتهاء</label>
                  <input
                    type="datetime-local"
                    className="w-full px-2 py-1.5 text-xs bg-[#131314] border border-[#2d2f31] rounded-xl text-center text-white"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#c4c7c5] block mb-1">المشروع</label>
                  <select
                    className="w-full px-2 py-2 text-xs bg-[#131314] border border-[#2d2f31] rounded-xl text-right text-white"
                    value={newProject}
                    onChange={(e) => handleProjectChange(e.target.value)}
                  >
                    <option value="" disabled className="bg-[#1f1f1f]">اختر مشروعاً</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.name} className="bg-[#1f1f1f]">{proj.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#c4c7c5] block mb-1">القسم / التصنيف</label>
                  <select
                    className="w-full px-2 py-2 text-xs bg-[#131314] border border-[#2d2f31] rounded-xl text-right text-white"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Bootcamp" className="bg-[#1f1f1f]">Bootcamp</option>
                    <option value="Mentorship" className="bg-[#1f1f1f]">Mentorship</option>
                    <option value="Selection Day" className="bg-[#1f1f1f]">Selection Day</option>
                    <option value="Demo Day" className="bg-[#1f1f1f]">Demo Day</option>
                    <option value="Hackathon" className="bg-[#1f1f1f]">Hackathon</option>
                    <option value="Training Day" className="bg-[#1f1f1f]">Training Day</option>
                    <option value="Incubator" className="bg-[#1f1f1f]">Incubator</option>
                    <option value="إدارة" className="bg-[#1f1f1f]">إدارة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-[#c4c7c5] block mb-1">أولوية السلوت</label>
                  <select
                    className="w-full px-2 py-2 text-xs bg-[#131314] border border-[#2d2f31] rounded-xl text-right text-white"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as EventPriority)}
                  >
                    <option value="high" className="bg-[#1f1f1f]">🔥 عاجلة جداً</option>
                    <option value="medium" className="bg-[#1f1f1f]">⚡ متوسطة الأهمية</option>
                    <option value="low" className="bg-[#1f1f1f]">⚙️ اعتيادية / منخفضة</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#2d2f31] hover:bg-[#3c4043] text-[#e3e3e3] font-medium text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={submitNewEvent}
                className="px-5 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-xs rounded-xl shadow-md"
                disabled={!newTitle.trim()}
              >
                إضافة فاعلية للجدول
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL & RESCHEDULE ================= */}
      {showDetailModal && activeEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="detail-event-modal" dir="rtl">
          <div className="bg-[#1e1f20] border border-[#2d2f31] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2d2f31] pb-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                activeEvent.priority === "high" 
                  ? "bg-rose-950/40 text-rose-400 border border-rose-900/30" 
                  : activeEvent.priority === "medium" 
                  ? "bg-amber-950/40 text-amber-400 border border-amber-900/30" 
                  : "bg-sky-950/40 text-sky-400 border border-sky-900/30"
              }`}>
                {activeEvent.priority === "high" ? "أولوية مرتفعة" : activeEvent.priority === "medium" ? "أولوية متوسطة" : "أولوية منخفضة"}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={deleteActiveEvent}
                  className="p-1.5 text-rose-400 hover:bg-[#2d2f31] rounded-lg transition-colors cursor-pointer"
                  title="حذف الفعالية"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-right">
              <h3 className="font-bold text-base text-white">{activeEvent.title}</h3>
              <p className="text-xs text-[#c4c7c5] leading-relaxed bg-[#131314] p-3 rounded-xl border border-[#2d2f31]">{activeEvent.description || "لا يوجد وصف متوفر لهذه الفعالية."}</p>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#c4c7c5] font-bold block">توقيت البداية</span>
                  <div className="flex items-center gap-1.5 text-[#e3e3e3] bg-[#131314] p-2 rounded-xl border border-[#2d2f31]">
                    <Clock className="w-3.5 h-3.5 text-[#c4c7c5] shrink-0" />
                    <input
                      type="datetime-local"
                      value={activeEvent.startDate}
                      onChange={(e) => updateActiveSlotTime("startDate", e.target.value)}
                      className="bg-transparent text-[11px] font-semibold focus:outline-none flex-1 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#c4c7c5] font-bold block">توقيت النهاية</span>
                  <div className="flex items-center gap-1.5 text-[#e3e3e3] bg-[#131314] p-2 rounded-xl border border-[#2d2f31]">
                    <Clock className="w-3.5 h-3.5 text-[#c4c7c5] shrink-0" />
                    <input
                      type="datetime-local"
                      value={activeEvent.endDate}
                      onChange={(e) => updateActiveSlotTime("endDate", e.target.value)}
                      className="bg-transparent text-[11px] font-semibold focus:outline-none flex-1 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#131314] p-3 rounded-xl border border-[#2d2f31] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeEvent.color }} />
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">{activeEvent.project}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#c4c7c5]">{activeEvent.category}</span>
              </div>

              {/* Status update selector */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-[#c4c7c5] block mb-1">الوضع الحالي للمهمة</label>
                <div className="flex flex-wrap gap-1.5">
                  {["pending", "in_progress", "completed", "delayed"].map((st) => {
                    const isSelected = activeEvent.status === st;
                    const labelMap: Record<string, string> = {
                      pending: "معلق ⏳",
                      in_progress: "نشط ⚡",
                      completed: "مكتمل ✅",
                      delayed: "متأخر ⚠️"
                    };
                    const colorMap: Record<string, string> = {
                      pending: "bg-[#2d2f31] border-[#3c4043] text-[#e3e3e3]",
                      in_progress: "bg-sky-950/40 border-sky-900/30 text-sky-400",
                      completed: "bg-emerald-950/40 border-emerald-900/30 text-emerald-400",
                      delayed: "bg-rose-950/40 border-rose-900/30 text-rose-400"
                    };

                    return (
                      <button
                        key={st}
                        onClick={() => updateActiveStatus(st as EventStatus)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          isSelected 
                            ? `${colorMap[st]} shadow-sm font-extrabold border-2` 
                            : "bg-transparent border-[#2d2f31] text-[#c4c7c5] hover:text-white"
                        }`}
                      >
                        {labelMap[st]}
                        {isSelected && <span className="mr-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex pt-3 border-t border-[#2d2f31] justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setActiveEvent(null);
                }}
                className="px-5 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-xs rounded-xl"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
