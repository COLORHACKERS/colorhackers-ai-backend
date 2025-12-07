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

     const prompt = `
Create an ULTRA REALISTIC portrait photograph of the person in the uploaded image.
Do NOT change their face, age, features, hair, skin tone, or identity.

Blend them into a "${silo}" themed environment using realistic lighting and high-end
photographic techniques. Avoid making the person look AI-generated or stylized.

Requirements:
- Hyper-realistic skin texture
- Natural lighting (cinematic, soft diffused or rim light depending on environment)
- Real lens depth of field (no fake blur halos)
- No cartoon, no 3D, no illustration, no anime, no painterly effects
- Preserve facial integrity completely
- Integrate the environment subtly around/behind them

SILO ENVIRONMENTS:
Ethereal → soft mist, sunlit glow, cloud haze, gentle pastel light
Earthers → forest depth, organic textures, warm greens + clay tones
Elementals → energy, color streaks, photographic motion effects
Naturalists → warm interior light, neutrals, tactile fabrics
Cosmics → photoreal cosmic lighting, nebula fog, deep blues/purples
Metallics → reflective REAL metal surfaces, chrome light reflections
Royals → rich velvet lighting, maroon/navy shadows, dramatic portrait light

Output must look like a real high-end editorial photograph.
`;


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
