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
import_dotenv.default.config();
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
