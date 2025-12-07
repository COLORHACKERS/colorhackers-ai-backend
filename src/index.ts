import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import formidable from "formidable";
import fs from "fs";
import { OpenAI } from "openai";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// ---------------- EXISTING ROUTES -------------------

app.get('/', (req, res) => {
  res.type('html').send(`...`)
})

app.get('/about', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'))
})

app.get('/api-data', (req, res) => {
  res.json({ message: 'Here is some sample API data' })
})

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})


// -----------------------------------------------------
// 🚀 AI SILO REALM GENERATOR ROUTE (your new code)
// -----------------------------------------------------

app.post('/api/generate-silo-realm', async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ error: "Bad request" });
      }

      const imageFile = files.image;
      if (!imageFile) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const fileData = fs.readFileSync(imageFile[0].filepath);
      const base64 = fileData.toString("base64");

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `
        Transform this selfie into a ColorHackers Silo Realm aesthetic.
        Apply the correct colors, tones, light, and atmosphere.
      `;

      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        image: base64,
      });

      const outputUrl = result.data[0].url;
      res.json({ imageUrl: outputUrl });
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});


// -----------------------------------------------------
// 🚨 DO NOT MOVE THIS — MUST BE AT THE END
// -----------------------------------------------------
export default app;
