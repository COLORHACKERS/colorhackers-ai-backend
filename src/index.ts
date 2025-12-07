// --- AI SILO REALM GENERATOR ---------------------------------------

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

      // YOU CAN CHANGE THE PROMPT
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
export default app;
