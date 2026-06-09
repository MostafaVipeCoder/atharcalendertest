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

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DDTHH:mm
  endDate: string;   // YYYY-MM-DDTHH:mm
  status: EventStatus;
  priority: EventPriority;
  category: string;
  project: string; // Project Name
  color: string;
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
