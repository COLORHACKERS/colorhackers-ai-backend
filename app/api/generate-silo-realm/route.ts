import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const prompts: Record<string, string> = {
  Ethereal: "soft glowing ethereal mist, dreamy light, cinematic ultra realistic photography",
  Earthers: "earth tones, forest shadows, botanical texture, grounded aesthetic, ultra realistic",
  Elementals: "dynamic energy, electric hues, kinetic movement, ultra realistic skin",
  Naturalists: "warm terracotta, linen texture, natural window light, cozy realism",
  Cosmics: "nebula glow, ultraviolet shadows, cosmic lighting, ultra realistic",
  Metallics: "chrome reflections, gold flecks, metallic studio lighting, ultra realistic",
  Royals: "velvet, maroon, navy, regal dramatic portrait lighting, ultra realistic",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    const silo = form.get("silo") as string | null;

    // Validate
    if (!file || !(file instanceof File) || !silo) {
      return NextResponse.json({ error: "Missing image or silo" }, { status: 400 });
    }

    const promptBody =
      `Transform this person into the ${silo} Silo Realm. ` +
      `Style: ${prompts[silo] ?? ""}. ` +
      `Must look ULTRA REALISTIC. No cartoon, no CGI. Keep natural skin texture.`;

    // *** KEY FIX ***
    // Pass the File directly. No ArrayBuffer. No Buffer.
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,               // ← FIX: pass File, not ArrayBuffer
      prompt: promptBody,
      size: "1024x1024",
    });

    const imageUrl = result.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL returned" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (err: any) {
    console.error("SILO ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Image generation failed" },
      { status: 500 }
    );
  }
}
