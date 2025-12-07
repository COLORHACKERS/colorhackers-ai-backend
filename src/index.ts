import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import formidable from "formidable";
import fs from "fs";
import { OpenAI } from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allow JSON
app.use(express.json());

// AI CLIENT
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------------
// GENERATE SILO REALM IMAGE
// -------------------------
app.post("/api/generate-silo-realm", (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload failed" });

    const imageFile = files.file;
    if (!imageFile) return res.status(400).json({ error: "No file uploaded" });

    const buffer = fs.readFileSync(imageFile.filepath);

    try {
      const response = await client.images.generate({
        model: "gpt-image-1",
        prompt:
          "Turn this selfie into a ColorHackers Silo Realm image, cinematic, high-end, glowing colors.",
        size: "1024x1024",
        image: buffer,
      });

      const image_base64 = response.data[0].b64_json;

      res.json({ image: image_base64 });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI generation failed" });
    }
  });
});

// -------------------------
// HEALTH CHECK
// -------------------------
app.get("/healthz", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// DEFAULT EXPORT FOR VERCEL
export default app;
