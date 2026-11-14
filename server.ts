import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, systemInstruction, model: modelName = "gemini-2.0-flash", config } = req.body;
      
      const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
        console.error("GEMINI_API_KEY is missing or empty.");
        return res.status(400).json({ 
          error: "GEMINI_API_KEY is not set. Please set it in .env or via Settings in the application." 
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction || undefined,
        generationConfig: config || undefined
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Model returned an empty response.");
      }

      res.json({ text });
    } catch (error: any) {
      console.error("Gemini API Proxy Error:", error);
      
      const isQuotaError = error.message?.includes("429") || error.status === 429;
      const errorMessage = isQuotaError 
        ? "AI Rate Limit reached. Please wait a moment before trying again." 
        : (error.message || "Internal Server Error");

      res.status(isQuotaError ? 429 : 500).json({ 
        error: errorMessage,
        details: error.stack
      });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
