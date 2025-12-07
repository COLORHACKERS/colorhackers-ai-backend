// ───────────────────────────────────────────────
//  COLORHACKERS AI BACKEND – FULL WORKING VERSION
// ───────────────────────────────────────────────

import express from "express";
import cors from "cors";
import formidable from "formidable";
import fs from "fs";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";

// Resolve module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();

// ───────────────────────────────────────────────
//  CORS — allows Shopify to contact this backend
// ───────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

// Health check route
app.get("/api/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ───────────────────────────────────────────────
//  AI SILO REALM IMAGE GENERATOR
// ───────────────────────────────────────────────
app.post("/api/generate-silo-realm", async (req, res) => {
  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ Form parse error:", err);
        return res.status(400).json({ error: "Bad request" });
      }

      // Image
      const imageFile = files.image;
      if (!imageFile || !imageFile.filepath) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Silo
      const silo = fields.silo || "Unknown";

      // Read file
      const fileData = fs.readFileSync(imageFile.filepath);
      const base64Image = fileData.toString("base64");

      // AI client
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Prompt tailored to the silo
      const prompt = `
        Transform this selfie into a ColorHackers ${silo} Realm.
        Apply the correct colors, textures, light, and atmosphere for the ${silo}:
        - Ethereal → clouds, glow, soft light, pastel haze
        - Earthers → forests, clay, herbal tones
        - Elementals → color prisms, kinetic energy, paint splashes
        - Naturalists → beige, cream, clay, warmth, skin-tones
        - Cosmics → ultraviolet, deep space, pink nebula lights
        - Metallics → chrome, mirrors, gold, engineered reflections
        - Royals → velvet drapes, maroon, navy, garnet shadows
        Keep the person recognizable but stylized inside their silo world.
      `;

      // AI request
      const aiResponse = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        image: base64Image,
        size: "1024x1024",
      });

      const outputUrl = aiResponse.data[0].url;

      return res.json({ imageUrl: outputUrl });
    });
  } catch (error: any) {
    console.error("❌ AI Error:", error);
    return res.status(500).json({ error: "AI generation failed" });
  }
});

// ───────────────────────────────────────────────
//  DEFAULT HOME (optional, not needed for API)
// ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send(`<h1>ColorHackers AI Backend Running</h1>`);
});

// ───────────────────────────────────────────────
//  EXPORT
// ───────────────────────────────────────────────
export default app;
