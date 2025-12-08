import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Parse multipart form
    const form = await req.formData();
    const file = form.get("image") as File | null;
    const silo = form.get("silo") as string | null;

    if (!file || !silo) {
      return NextResponse.json({ error: "Missing image or silo" }, { status: 400 });
    }

    // Convert image to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const prompts: Record<string, string> = {
      Ethereal: "soft glowing ethereal mist, clouds, airy atmosphere, cinematic photography, ultra realistic",
      Earthers: "earth tones, forest light, botanical texture, grounded aesthetic, ultra realistic",
      Elementals: "dynamic color, motion energy, vibrant paint textures, sharp realism",
      Naturalists: "warm human textures, linen, terracotta, soft window light, realistic skin",
      Cosmics: "cosmic nebula light, ultraviolet shadows, dramatic lighting, ultra realistic",
      Metallics: "chrome reflections, gold + silver lighting, engineered metallic textures, ultra realistic",
      Royals: "velvet, maroon, navy, regal dramatic portrait lighting, ultra realistic"
    };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // USE images.edit (supports uploaded images)
    const result = await openai.images.edits({
      model: "gpt-image-1",
      image: base64Image,
      prompt: `Transform this person into a ${silo} Silo Realm. Style: ${prompts[silo]}. Must look ultra realistic.`,
      size: "1024x1024"
    });

    const imageUrl = result.data[0].url;

    return NextResponse.json({ imageUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
