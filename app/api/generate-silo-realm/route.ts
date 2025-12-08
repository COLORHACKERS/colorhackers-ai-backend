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

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const prompts: Record<string, string> = {
      Ethereal: "soft glowing ethereal mist, dreamy light, cinematic ultra realistic photography",
      Earthers: "earth tones, forest shadows, botanical texture, grounded aesthetic, ultra realistic",
      Elementals: "dynamic color energy, electric hues, kinetic movement, ultra realistic skin",
      Naturalists: "warm terracotta, linen texture, natural window light, cozy realism",
      Cosmics: "nebula glow, ultraviolet shadows, cosmic lighting, ultra realistic",
      Metallics: "chrome reflections, gold flecks, metallic engineered lighting, ultra realistic",
      Royals: "velvet, maroon, navy, regal dramatic portrait lighting, ultra realistic"
    };

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });

    // Correct OpenAI method for editing images
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: base64Image,
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
