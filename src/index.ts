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

// Enable CORS for Shopify frontend
app.use(cors());

// Serve static files (optional but harmless)
app.use(express.static(path.join(__dirname, "..", "public")));

// ---------------------------
// HEALTH CHECK ENDPOINT
// ---------------------------
app.get("/api/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// ---------------------------
// AI SILO REALM GENERATOR
// ---------------------------
app.post("/api/generate-silo-realm", async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ error: "Bad form data" });
      }

      const imageUpload = files.image?.[0];
      if (!imageUpload) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Read file → base64
      const buffer = fs.readFileSync(imageUpload.filepath);
      const base64 = buffer.toString("base64");

      const silo = fields.silo || "Unknown";

      // OpenAI client
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `
        Transform this selfie into a ${silo} Silo Realm.
        Use the correct colors, lighting, and emotional atmosphere.
        Maintain likeness but stylize to match the ${silo} universe.
      `;

      // NEW OpenAI image call (correct API fields)
      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        input: base64  // <-- Correct field (NOT "image")
      });

      const outputUrl = result.data[0].url;
      res.json({ imageUrl: outputUrl });
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// ---------------------------
// DEFAULT APP ROUTE (optional)
// ---------------------------
app.get("/", (req, res) => {
  res.send(`
    <h2>ColorHackers AI Backend</h2>
    <p>Status: Running</p>
    <p>Try <a href="/api/healthz">/api/healthz</a></p>
  `);
});

// Export for Vercel
export default app;
