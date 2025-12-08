import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const prompts: Record<string, string> = {
  Ethereal:
    "soft glowing ethereal mist, dreamy light, cinematic ultra realistic photography",
  Earthers:
    "earth tones, forest shadows, botanical texture, grounded aesthetic, ultra realistic",
  Elementals:
    "dynamic energy, electric hues, kinetic movement, ultra realistic skin",
  Naturalists:
    "warm terracotta, linen texture, natural window light, cozy realism",
  Cosmics:
    "nebula glow, ultraviolet shadows, cosmic lighting, ultra realistic",
  Metallics:
    "chrome reflections, gold flecks, metallic studio lighting, ultra realistic",
  Royals:
    "velvet, maroon, navy, regal dramatic portrait lighting, ultra realistic",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    const silo = form.get("silo") as string | null;

    // Basic validation
    if (!file || !(file instanceof File) || !silo) {
      return NextResponse.json(
        { error: "Missing image or silo" },
        { status: 400 }
      );
    }

    // Get raw bytes as an ArrayBuffer – this is already an Uploadable type
    const bytes = await file.arrayBuffer();

    const promptBody =
      `Transform this person into the ${silo} Silo Realm. ` +
      `Style: ${prompts[silo] ?? ""}. ` +
      `Must look ULTRA REALISTIC (no cartoon, no CGI, no illustration). ` +
      `Keep real skin texture and cinematic photo lighting.`;

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: bytes as ArrayBuffer, // <-- key fix: pass ArrayBuffer, not Buffer
      prompt: promptBody,
      size: "1024x1024",
    });

    const imageUrl = result.data[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image generation returned no URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (err: any) {
    console.error("SILO REALM ERROR", err);
    return NextResponse.json(
      { error: err?.message ?? "Image generation failed" },
      { status: 500 }
    );
  }
}
