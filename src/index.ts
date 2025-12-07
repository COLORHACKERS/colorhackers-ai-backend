// AI IMAGE: Generate Silo Realm
app.post('/api/generate-silo-realm', async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Failed to parse upload" });
      }

      const silo = fields.silo;
      const file = files.image;

      if (!silo || !file) {
        return res.status(400).json({ error: "Missing silo or image" });
      }

      // Read uploaded image
      const imgData = fs.readFileSync(file.filepath);

      // OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Call OpenAI to generate image
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `Transform this person into the ${silo} SILO realm. Use textures and atmosphere matching the SILO aesthetic.`,
        size: "1024x1024",
        image: imgData
      });

      const imageUrl = response.data[0].url;

      return res.json({ imageUrl });
    });

  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});
