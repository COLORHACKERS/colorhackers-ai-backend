// AI Image Generation Endpoint
app.post("/api/generate-silo-realm", async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ error: "Invalid form data" });
      }

      const silo = fields.silo;
      const imageFile = files.image;

      if (!silo || !imageFile) {
        return res.status(400).json({ error: "Missing silo or image" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Read the uploaded image
      const imgBuffer = fs.readFileSync(imageFile.filepath);

      // Call OpenAI Image Model
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `Transform this person into the ${silo} color realm.`,
        image: imgBuffer,
      });

      const imageBase64 = result.data[0].b64_json;

      return res.json({
        imageUrl: `data:image/png;base64,${imageBase64}`,
      });
    });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});
