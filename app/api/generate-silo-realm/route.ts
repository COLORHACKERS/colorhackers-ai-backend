import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    const silo = form.get("silo") as string | null;

    if (!file || !silo) {
      return NextResponse.json(
        { error: "Missing image or silo" },
        { status: 400 }
      );
    }

    // Convert file to raw buffer (Uploadable format)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const prompts: Record<string, string> = {
      Ethereal: "soft glowing ethereal mist, dreamy light, cinematic ultra realistic photography",
      Earthers: "earth tones, forest shadows, botanical texture, grounded aesthetic, ultra realistic",
      Elementals: "dynamic energy, electric hues, kinetic movement, ultra realistic skin",
      Naturalists: "warm terracotta, linen texture, natural light, cozy realism",
      Cosmics: "nebula glow, ultraviolet shadows, cosmic lighting, ultra realistic",
      Metallics: "chrome reflections, gold flecks, metallic studio lighting, ultra realistic",
      Royals: "velvet, maroon, navy, regal dramatic portrait lighting, ultra realistic"
    };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // CORRECT: pass Buffer (Uploadable), NOT base64 string
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: buffer,           // <-- FIXED
      prompt: `Transform this person into the ${silo} Silo Realm. Style: ${prompts[silo]}. Ultra realistic portrait.`,
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
