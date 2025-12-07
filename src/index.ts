import express from "express";
import cors from "cors";
import formidable from "formidable";
import fs from "fs";
import { OpenAI } from "openai";

const app = express();

app.use(cors());
app.use(express.json());

// -------- HEALTH CHECK ----------
app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// -------- AI SILO REALM GENERATOR ----------
app.post("/api/generate-silo-realm", (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ Form parse error:", err);
        return res.status(400).json({ error: "Bad request" });
      }

      const imageFile = files.image?.[0];
      if (!imageFile) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const fileData = fs.readFileSync(imageFile.filepath);
      const base64 = fileData.toString("base64");

      const silo = fields.silo || "Ethereal";

      const prompt = `
      Transform this selfie into a ColorHackers ${silo} Silo Realm.
      Use correct lighting, textures, atmosphere, and color frequency.
      Retain the person but stylize the environment to match the Silo.
      `;

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        image: base64, // ✅ VALID FIELD
      });

      const imageUrl = result.data[0].url;
      res.json({ imageUrl });
    });

  } catch (error) {
    console.error("❌ AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
  app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);
});

// -------- EXPORT APP FOR VERCEL ----------
export default app;
