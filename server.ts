/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { syncWithGoogleSheets } from "./src/services/googleSheetsSync.js";

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
let supabase = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("Supabase client initialized successfully!");
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
} else {
  console.warn("Supabase URL or key missing, sync will be disabled!");
}

// Lazily initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Periodic analytics & AI reporting endpoint
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
      1. **الملخص التنفيذي**: A strategic summary of project status, general completions vs delays.
      2. **تحليل توزيع أعباء العمل وكفاءة المشاريع**: Identify which projects are doing great and which might be experiencing bottleneck issues.
      3. **مخاطر تخطي المواعيد (Alarms & Deadlines)**: Critical priorities that need attention.
      4. **توصيات ذكية لتحسين الإنتاجية**: Clear structural dynamic design recommendations.

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
  } catch (error: any) {
    console.error("Report generator failed:", error);
    res.status(500).json({ error: error?.message || "Failed to generate report using AI." });
  }
});

// Webhook endpoint for Google Sheets sync
app.post("/api/webhook/sync", async (req, res) => {
  try {
    console.log("Received webhook from Google Sheets:", new Date().toISOString());
    
    const { action, events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Events array is required." });
    }

    // First, clear existing events (or we can upsert)
    const { error: deleteError } = await supabase
      .from("project_schedules")
      .delete()
      .neq("id", "0"); // Delete all
    
    if (deleteError) {
      console.error("Error deleting existing events:", deleteError);
    }

    // Process each event from Google Sheets
    const eventsToInsert = [];
    
    for (const sheetEvent of events) {
      // Map sheet columns to our database fields
      // Adjust the mapping based on your actual sheet headers!
      const projectName = sheetEvent.project || sheetEvent.project_name || "Default";
      
      // Ensure project exists in projects table first
      const { data: existingProject } = await supabase
        .from("projects")
        .select("id, name, color")
        .eq("name", projectName)
        .single();
      
      let projectId = existingProject?.id;
      let projectColor = existingProject?.color || "#8ab4f8";
      
      if (!existingProject) {
        // Create new project if it doesn't exist
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert([{ name: projectName, color: projectColor }])
          .select()
          .single();
        
        if (projectError) {
          console.error("Error creating project:", projectError);
        } else {
          projectId = newProject.id;
        }
      } else {
        projectColor = existingProject.color;
      }

      // Build event payload
      eventsToInsert.push({
        activity: sheetEvent.activity || sheetEvent.title || "Untitled",
        project: projectName,
        category: sheetEvent.category || "General",
        start_date: sheetEvent.start_date || sheetEvent.date || new Date().toISOString().split('T')[0],
        end_date: sheetEvent.end_date || sheetEvent.start_date || sheetEvent.date || new Date().toISOString().split('T')[0],
        start_time: sheetEvent.start_time || "09:00",
        end_time: sheetEvent.end_time || "17:00",
        event_type: sheetEvent.event_type || sheetEvent.type || "timed",
        status: sheetEvent.status || "pending",
        priority: sheetEvent.priority || "medium",
        description: sheetEvent.description || "",
        color: projectColor
      });
    }

    // Insert all events
    if (eventsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("project_schedules")
        .insert(eventsToInsert);
      
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

  } catch (error: any) {
    console.error("Webhook sync failed:", error);
    res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
});

// Start Full-Stack listener
async function runServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start periodic sync with Google Sheets (every 1 hour)
  const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  if (supabase) {
    console.log(`Starting periodic sync with Google Sheets every ${SYNC_INTERVAL / (60 * 60 * 1000)} hour(s)...`);
    
    // Initial sync on server start
    try {
      console.log("Performing initial sync...");
      await syncWithGoogleSheets(supabase);
      console.log("Initial sync complete!");
    } catch (error) {
      console.error("Initial sync failed:", error);
    }
    
    // Periodic sync
    setInterval(async () => {
      try {
        console.log("Running scheduled sync...", new Date().toISOString());
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
