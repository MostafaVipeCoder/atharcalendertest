/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "admin" | "manager" | "employee";

export interface Project {
  id: string;
  name: string;
  color: string;
}

export type EventStatus = "pending" | "in_progress" | "completed" | "delayed";
export type EventPriority = "low" | "medium" | "high";

export type EventType = "all-day" | "timed";

export interface CalendarEvent {
  id: string;
  project: string;
  category: string;
  activity: string; // This will be the title
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: EventType;
  status: EventStatus;
  priority: EventPriority;
  description: string;
  color: string;
  title: string; // For compatibility with existing code
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success" | "alert";
  date: string;
  isRead: boolean;
  eventId?: string;
}

export interface WorkStats {
  employeeId: string;
  employeeName: string;
  completedTasks: number;
  totalTasks: number;
  efficiencyRate: number; // calculated percentage
  overdueTasks: number;
}
