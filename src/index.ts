import express from "express";
import cors from "cors";
import formidable from "formidable";
import fs from "fs";
import { OpenAI } from "openai";

const app = express();

// CORS for Shopify frontend
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

// ---- HEALTH CHECK ----
app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---- SILO REALM IMAGE GENERATION ----
app.post("/api/generate-silo-realm", async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ error: "Bad request" });
      }

      const imageFile = files.image?.[0];
      if (!imageFile) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const fileData = fs.readFileSync(imageFile.filepath);
      const base64 = fileData.toString("base64");

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = fields.silo
        ? `Transform this selfie into a ColorHackers ${fields.silo} realm aesthetic with accurate textures, colors, and atmosphere.`
        : `Transform this selfie into a ColorHackers Silo realm aesthetic.`;

      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        input: [
          {
            image: base64,
          },
        ],
      });

      const imageUrl = result.data[0].url;
      return res.json({ imageUrl });
    });
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ error: "AI generation failed" });
  }
});

export default app;
