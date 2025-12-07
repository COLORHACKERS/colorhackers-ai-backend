import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import formidable from "formidable";
import fs from "fs";
import cors from "cors";
import { OpenAI } from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// --- HEALTH CHECK -----------------------------------
app.get("/api/healthz", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- AI SILO REALM GENERATOR -------------------------
app.post("/api/generate-silo-realm", async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ error: "Bad form data" });
      }

      const imageFile = files.image?.[0];
      if (!imageFile) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Read uploaded file → base64
      const buffer = fs.readFileSync(imageFile.filepath);
      const base64 = buffer.toString("base64");

      const silo = fields.silo || "Unknown";

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Build the prompt
      const prompt = `
        Transform this selfie into a ${silo} Silo Realm.
        Apply the correct colors, atmosphere, and aesthetic.
      `;

      // NEW CORRECT API CALL (OpenAI Images v1)
      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        input: base64,            // <-- Correct field instead of "image"
      });

      const outputUrl = result.data[0].url;
      res.json({ imageUrl: outputUrl });
    });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// --- EXPORT EXPRESS APP ------------------------------
export default app;
