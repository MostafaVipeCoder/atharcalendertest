import { SupabaseClient } from "@supabase/supabase-js";

// Updated Sheet Link and Column Mapping
// Sheet Name: sheet1
// Columns: Project | Category | Activity / Sub-Activity | Start Date | End Date
// Link: https://docs.google.com/spreadsheets/d/1VgA9yHKr9tA499rZ364jNHVqPdJWA6o9/edit?gid=1961861034#gid=1961861034

const SHEET_ID = "1VgA9yHKr9tA499rZ364jNHVqPdJWA6o9";
const GID = "1961861034"; // Correct GID from user link
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

export interface SyncResult {
  updated: boolean;
  changesCount: number;
  message: string;
  error?: string;
}

export async function syncWithGoogleSheets(client: SupabaseClient, type: "manual" | "auto" = "manual"): Promise<SyncResult> {
  if (!client) {
    return { updated: false, changesCount: 0, message: "Supabase client not initialized", error: "No Supabase client" };
  }

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error("تأكد من أن جدول البيانات 'منشور على الويب' (File > Share > Publish to the web) وأنه بصيغة CSV.");
    }

    const csvData = await response.text();
    if (csvData.includes("<!DOCTYPE html>") || csvData.includes("<html")) {
      throw new Error("تأكد من أن جدول البيانات 'منشور على الويب' كـ CSV وليس مجرد رابط مشاركة.");
    }

    const rows = parseCSV(csvData);
    if (rows.length <= 1) {
      return { updated: false, changesCount: 0, message: "تم التزامن ولا توجد بيانات في الجدول" };
    }

    // Expected columns from user: Project | Category | Activity / Sub-Activity | Start Date | End Date
    const dataRows = rows.slice(1);
    
    // Fetch current projects to sync project names
    const { data: currentProjects } = await client.from("projects").select("name, color");
    const existingProjectNames = new Set(currentProjects?.map(p => p.name) || []);
    const projectColorMap = new Map(currentProjects?.map(p => [p.name, p.color]) || []);

    let changesCount = 0;

    for (const row of dataRows) {
      // Mapping based on user input:
      // row[0] -> Project
      // row[1] -> Category
      // row[2] -> Activity / Sub-Activity
      // row[3] -> Start Date
      // row[4] -> End Date
      
      const [project, category, activity, startDate, endDate] = row;

      if (!activity || !project || !startDate) continue;

      // 1. Ensure project exists
      if (project && !existingProjectNames.has(project)) {
        await client.from("projects").insert([{ name: project, color: "#8ab4f8" }]);
        existingProjectNames.add(project);
        projectColorMap.set(project, "#8ab4f8");
      }

      const itemPayload = {
        activity: activity,
        project: project,
        category: category || "General",
        start_date: startDate,
        end_date: endDate || startDate,
        event_type: "all-day", // Default for sheet sync unless specified
        status: "pending",
        priority: "medium",
        color: projectColorMap.get(project) || "#8ab4f8"
      };

      // 2. Check if existing schedule exists and update, else insert
      const { data: existingItems } = await client
        .from("project_schedules")
        .select("id")
        .eq("activity", activity)
        .eq("project", project)
        .eq("start_date", startDate);

      if (existingItems && existingItems.length > 0) {
        // Update existing item
        const { error } = await client
          .from("project_schedules")
          .update(itemPayload)
          .eq("id", existingItems[0].id);
        if (!error) changesCount++;
      } else {
        // Insert new item
        const { error } = await client.from("project_schedules").insert([itemPayload]);
        if (!error) changesCount++;
      }
    }

    if (changesCount > 0) {
      return { updated: true, changesCount, message: "تم تحديث البيانات بنجاح" };
    } else {
      return { updated: false, changesCount: 0, message: "تم التزامن ولا توجد تغييرات جديدة" };
    }

  } catch (error: any) {
    console.error("Sync Error:", error);
    return { updated: false, changesCount: 0, message: "فشل التزامن مع الجدول", error: error.message };
  }
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
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
