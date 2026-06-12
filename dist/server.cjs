var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_supabase_js = require("@supabase/supabase-js");

// src/services/googleSheetsSync.ts
var SHEET_ID = "1VgA9yHKr9tA499rZ364jNHVqPdJWA6o9";
var GID = "1961861034";
var CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;
async function syncWithGoogleSheets(client, type = "manual") {
  if (!client) {
    return { updated: false, changesCount: 0, message: "Supabase client not initialized", error: "No Supabase client" };
  }
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error("\u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u062C\u062F\u0648\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A '\u0645\u0646\u0634\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0648\u064A\u0628' (File > Share > Publish to the web) \u0648\u0623\u0646\u0647 \u0628\u0635\u064A\u063A\u0629 CSV.");
    }
    const csvData = await response.text();
    if (csvData.includes("<!DOCTYPE html>") || csvData.includes("<html")) {
      throw new Error("\u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u062C\u062F\u0648\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A '\u0645\u0646\u0634\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0648\u064A\u0628' \u0643\u0640 CSV \u0648\u0644\u064A\u0633 \u0645\u062C\u0631\u062F \u0631\u0627\u0628\u0637 \u0645\u0634\u0627\u0631\u0643\u0629.");
    }
    const rows = parseCSV(csvData);
    if (rows.length <= 1) {
      return { updated: false, changesCount: 0, message: "\u062A\u0645 \u0627\u0644\u062A\u0632\u0627\u0645\u0646 \u0648\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0641\u064A \u0627\u0644\u062C\u062F\u0648\u0644" };
    }
    const dataRows = rows.slice(1);
    const { data: currentProjects } = await client.from("projects").select("name, color");
    const existingProjectNames = new Set(currentProjects?.map((p) => p.name) || []);
    const projectColorMap = new Map(currentProjects?.map((p) => [p.name, p.color]) || []);
    let changesCount = 0;
    for (const row of dataRows) {
      const [project, category, activity, startDate, endDate] = row;
      if (!activity || !project || !startDate) continue;
      if (project && !existingProjectNames.has(project)) {
        await client.from("projects").insert([{ name: project, color: "#8ab4f8" }]);
        existingProjectNames.add(project);
        projectColorMap.set(project, "#8ab4f8");
      }
      const itemPayload = {
        activity,
        project,
        category: category || "General",
        start_date: startDate,
        end_date: endDate || startDate,
        event_type: "all-day",
        // Default for sheet sync unless specified
        status: "pending",
        priority: "medium",
        color: projectColorMap.get(project) || "#8ab4f8"
      };
      const { data: existingItems } = await client.from("project_schedules").select("id").eq("activity", activity).eq("project", project).eq("start_date", startDate);
      if (existingItems && existingItems.length > 0) {
        const { error } = await client.from("project_schedules").update(itemPayload).eq("id", existingItems[0].id);
        if (!error) changesCount++;
      } else {
        const { error } = await client.from("project_schedules").insert([itemPayload]);
        if (!error) changesCount++;
      }
    }
    if (changesCount > 0) {
      return { updated: true, changesCount, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D" };
    } else {
      return { updated: false, changesCount: 0, message: "\u062A\u0645 \u0627\u0644\u062A\u0632\u0627\u0645\u0646 \u0648\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u062C\u062F\u064A\u062F\u0629" };
    }
  } catch (error) {
    console.error("Sync Error:", error);
    return { updated: false, changesCount: 0, message: "\u0641\u0634\u0644 \u0627\u0644\u062A\u0632\u0627\u0645\u0646 \u0645\u0639 \u0627\u0644\u062C\u062F\u0648\u0644", error: error.message };
  }
}
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let inQuotes = false;
    let currentValue = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
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

// server.ts
import_dotenv.default.config();
var supabaseUrl = process.env.VITE_SUPABASE_URL || "";
var supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
var supabase = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    supabase = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceRoleKey);
    console.log("Supabase client initialized successfully!");
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
} else {
  console.warn("Supabase URL or key missing, sync will be disabled!");
}
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might fail.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "10mb" }));
var PORT = 3e3;
app.post("/api/generate-report", async (req, res) => {
  const { events, projects } = req.body;
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: "Calendar events are required." });
  }
  try {
    const ai = getGeminiClient();
    const prompt = `
      You are the CTO & CFO Operations Advisor. Examine the current status of all project calendar tasks and workloads.
      Events Data:
      ${JSON.stringify(events)}

      Projects List:
      ${JSON.stringify(projects)}

      Generate a comprehensive performance and progress report in formal Arabic. Include:
      1. **\u0627\u0644\u0645\u0644\u062E\u0635 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A**: A strategic summary of project status, general completions vs delays.
      2. **\u062A\u062D\u0644\u064A\u0644 \u062A\u0648\u0632\u064A\u0639 \u0623\u0639\u0628\u0627\u0621 \u0627\u0644\u0639\u0645\u0644 \u0648\u0643\u0641\u0627\u0621\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639**: Identify which projects are doing great and which might be experiencing bottleneck issues.
      3. **\u0645\u062E\u0627\u0637\u0631 \u062A\u062E\u0637\u064A \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F (Alarms & Deadlines)**: Critical priorities that need attention.
      4. **\u062A\u0648\u0635\u064A\u0627\u062A \u0630\u0643\u064A\u0629 \u0644\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629**: Clear structural dynamic design recommendations.

      Keep the tone highly professional, precise, and encouraging. Format utilizing Markdown.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional operations consultant. Write clear reports exclusively in elegant corporate Arabic language using markdown."
      }
    });
    res.json({ report: response.text });
  } catch (error) {
    console.error("Report generator failed:", error);
    res.status(500).json({ error: error?.message || "Failed to generate report using AI." });
  }
});
app.post("/api/webhook/sync", async (req, res) => {
  try {
    console.log("Received webhook from Google Sheets:", (/* @__PURE__ */ new Date()).toISOString());
    const { action, events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Events array is required." });
    }
    const { error: deleteError } = await supabase.from("project_schedules").delete().neq("id", "0");
    if (deleteError) {
      console.error("Error deleting existing events:", deleteError);
    }
    const eventsToInsert = [];
    for (const sheetEvent of events) {
      const projectName = sheetEvent.project || sheetEvent.project_name || "Default";
      const { data: existingProject } = await supabase.from("projects").select("id, name, color").eq("name", projectName).single();
      let projectId = existingProject?.id;
      let projectColor = existingProject?.color || "#8ab4f8";
      if (!existingProject) {
        const { data: newProject, error: projectError } = await supabase.from("projects").insert([{ name: projectName, color: projectColor }]).select().single();
        if (projectError) {
          console.error("Error creating project:", projectError);
        } else {
          projectId = newProject.id;
        }
      } else {
        projectColor = existingProject.color;
      }
      eventsToInsert.push({
        activity: sheetEvent.activity || sheetEvent.title || "Untitled",
        project: projectName,
        category: sheetEvent.category || "General",
        start_date: sheetEvent.start_date || sheetEvent.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        end_date: sheetEvent.end_date || sheetEvent.start_date || sheetEvent.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        start_time: sheetEvent.start_time || "09:00",
        end_time: sheetEvent.end_time || "17:00",
        event_type: sheetEvent.event_type || sheetEvent.type || "timed",
        status: sheetEvent.status || "pending",
        priority: sheetEvent.priority || "medium",
        description: sheetEvent.description || "",
        color: projectColor
      });
    }
    if (eventsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("project_schedules").insert(eventsToInsert);
      if (insertError) {
        console.error("Error inserting events:", insertError);
        return res.status(500).json({ error: "Failed to sync events", details: insertError.message });
      }
    }
    console.log(`Successfully synced ${eventsToInsert.length} events from Google Sheets`);
    res.status(200).json({
      success: true,
      message: `Synced ${eventsToInsert.length} events`,
      syncedCount: eventsToInsert.length
    });
  } catch (error) {
    console.error("Webhook sync failed:", error);
    res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
});
async function runServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const SYNC_INTERVAL = 30 * 1e3;
  if (supabase) {
    console.log(`Starting periodic sync with Google Sheets every ${SYNC_INTERVAL / 1e3} seconds...`);
    try {
      console.log("Performing initial sync...");
      await syncWithGoogleSheets(supabase);
      console.log("Initial sync complete!");
    } catch (error) {
      console.error("Initial sync failed:", error);
    }
    setInterval(async () => {
      try {
        console.log("Running scheduled sync...", (/* @__PURE__ */ new Date()).toISOString());
        await syncWithGoogleSheets(supabase);
        console.log("Scheduled sync complete!");
      } catch (error) {
        console.error("Scheduled sync failed:", error);
      }
    }, SYNC_INTERVAL);
  } else {
    console.warn("Supabase client not available, skipping sync!");
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Athar Corporate Calendar server live on port ${PORT}`);
  });
}
runServer().catch((err) => {
  console.error("Server boot crashed:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
