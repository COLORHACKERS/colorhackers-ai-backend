import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import formidable from 'formidable';
import fs from 'fs';
import cors from 'cors';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Required for Shopify → Vercel
app.use(cors());
app.use(express.json());

// Health
app.get('/api/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------------------
// AI SILO REALM GENERATOR
// --------------------------
app.post('/api/generate-silo-realm', async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(400).json({ error: 'Bad request' });
      }

      const imageFile = files.image?.[0];
      if (!imageFile) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const fileData = fs.readFileSync(imageFile.filepath);
      const base64 = fileData.toString('base64');

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `
        Transform the person in this photo into their ColorHackers Silo realm.
        Apply colors, textures, atmosphere, and mood of their Silo.
      `;

      const ai = await client.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        image: base64,
        size: "1024x1024"
      });

      const imageUrl = ai.data[0].url;
      res.json({ imageUrl });
    });
  } catch (err) {
    console.error('AI ERROR:', err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// Export for Vercel
export default app;
