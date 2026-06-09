/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from "../supabaseClient";

const SHEET_ID = "1VgA9yHKr9tA499rZ364jNHVqPdJWA6o9";
// Using the gviz endpoint which is more reliable for shared sheets
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

export interface SyncResult {
  updated: boolean;
  changesCount: number;
  message: string;
  error?: string;
}

export async function syncWithGoogleSheets(type: "manual" | "auto" = "manual"): Promise<SyncResult> {
  if (!supabase) {
    return { updated: false, changesCount: 0, message: "Supabase client not initialized", error: "No Supabase client" };
  }

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        throw new Error("تأكد من أن جدول البيانات 'منشور على الويب' (File > Share > Publish to the web) وأنه بصيغة CSV.");
      }
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }

    const csvData = await response.text();
    // Check if the response is actually CSV or just HTML (which happens if it's not public)
    if (csvData.includes("<!DOCTYPE html>") || csvData.includes("<html")) {
      throw new Error("تأكد من أن جدول البيانات 'منشور على الويب' كـ CSV وليس مجرد رابط مشاركة.");
    }

    const rows = parseCSV(csvData);

    if (rows.length === 0) {
      return { updated: false, changesCount: 0, message: "تم التزامن ولا توجد تغييرات جديدة" };
    }

    // Expected columns: activity, category, project, start_date, end_date, color
    // We'll assume the first row is header
    const dataRows = rows.slice(1);
    
    // Fetch current data for comparison
    const { data: currentSchedules } = await supabase.from("project_schedules").select("*");
    const { data: currentProjects } = await supabase.from("projects").select("*");

    const currentSchedulesMap = new Map(currentSchedules?.map(s => [s.activity + s.project + s.start_date, s]));
    const currentProjectsMap = new Map(currentProjects?.map(p => [p.name, p]));

    let changesCount = 0;
    const newProjects = new Set<string>();

    // 1. Process Projects first
    for (const row of dataRows) {
      const projectName = row[2]; // project column
      const projectColor = row[5] || "#8ab4f8"; // color column

      if (projectName && !currentProjectsMap.has(projectName) && !newProjects.has(projectName)) {
        newProjects.add(projectName);
        const { error } = await supabase.from("projects").insert([{ name: projectName, color: projectColor }]);
        if (!error) changesCount++;
      }
    }

    // 2. Process Schedules
    // For simplicity, we'll clear and re-insert or do a basic merge
    // A more robust way is to compare each field, but for a demo, we'll do a simple "upsert" based on activity+project+start_date
    for (const row of dataRows) {
      const [activity, category, project, start_date, end_date, color] = row;
      
      if (!activity || !project || !start_date || !end_date) continue;

      const key = activity + project + start_date;
      const existing = currentSchedulesMap.get(key);

      if (!existing || existing.category !== category || existing.end_date !== end_date || existing.color !== color) {
        const { error } = await supabase.from("project_schedules").upsert([{
          activity,
          category,
          project,
          start_date,
          end_date,
          color: color || "#8ab4f8"
        }], { onConflict: 'activity,project,start_date' });
        
        if (!error) changesCount++;
      }
    }

    // Log the sync
    await supabase.from("sync_logs").insert([{
      sync_type: type,
      changes_applied: changesCount,
      status: "success",
      details: { rowCount: dataRows.length }
    }]);

    if (changesCount > 0) {
      return { updated: true, changesCount, message: "تم تحديث البيانات بنجاح" };
    } else {
      return { updated: false, changesCount: 0, message: "تم التزامن ولا توجد تغييرات جديدة" };
    }

  } catch (error: any) {
    console.error("Sync Error:", error);
    await supabase.from("sync_logs").insert([{
      sync_type: type,
      status: "error",
      error_message: error.message
    }]);
    return { updated: false, changesCount: 0, message: "فشل التزامن مع الجدول", error: error.message };
  }
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Basic CSV parser handling quoted values
    const row: string[] = [];
    let inQuotes = false;
    let currentValue = "";
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    row.push(currentValue.trim());
    rows.push(row);
  }
  
  return rows;
}
