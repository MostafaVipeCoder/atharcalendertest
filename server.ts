/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Athar Corporate Calendar server live on port ${PORT}`);
  });
}

runServer().catch((err) => {
  console.error("Server boot crashed:", err);
});
