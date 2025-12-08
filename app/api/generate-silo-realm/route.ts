import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const imageFile = form.get("image");
    const silo = form.get("silo");

    if (!imageFile || typeof imageFile === "string") {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    if (!silo) {
      return NextResponse.json({ error: "Missing silo" }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();

    const siloPrompts: Record<string, string> = {
      Ethereal:
        "ultra realistic portrait, soft glowing ethereal mist, pale clouds, dreamy atmosphere, cinematic soft light, film photography",
      Earthers:
        "ultra realistic portrait, earthy tones, natural greens, botanical textures, real sunlight, warm film color, grounded aesthetic",
      Elementals:
        "ultra realistic portrait, bold kinetic colors, motion energy, vibrant paint strokes, crisp studio light, intense dynamic look",
      Naturalists:
        "ultra realistic portrait, terracotta, linen, natural light through windows, warm human tone textures, organic environment",
      Cosmics:
        "ultra realistic portrait, cosmic nebula, ultraviolet glow, deep navy and violet, dramatic sci-fi lighting, surreal realism",
      Metallics:
        "ultra realistic portrait, chrome reflections, metallic gradients, engineered light, gold + silver highlights, hypermodern style",
      Royals:
        "ultra realistic portrait, velvet, maroon, navy shadows, regal dramatic lighting, cinematic rich tones"
    };

    const descriptionMap: Record<string, string> = {
      Ethereal:
        "Ethereals are emotional, transparent, sensitive dreamers who thrive in peace, softness, and inspiration.",
      Earthers:
        "Earthers are grounded, reliable, steady energies who bring calm, nature, and stability.",
      Elementals:
        "Elementals are full of color, vibrance, creativity, and kinetic energy — they spark movement.",
      Naturalists:
        "Naturalists crave honesty, texture, natural warmth, and human connection.",
      Cosmics:
        "Cosmics are innovators who thrive in mystery, depth, futuristic energy and the unseen.",
      Metallics:
        "Metallics are intense, reflective, brilliant individuals who feel engineered for impact.",
      Royals:
        "Royals carry emotional depth, dramatic presence, and magnetic classic power."
    };

    const paletteMap: Record<string, string[]> = {
      Ethereal: ["#FFF7C2", "#DCEBFF", "#E9DFF9", "#2C3450"],
      Earthers: ["#D5C6A1", "#7A8F63", "#4E6046", "#2B3A2A"],
      Elementals: ["#F9B43A", "#FF6B2A", "#E63900", "#4A9BFF"],
      Naturalists: ["#FCE0B8", "#E9C09A", "#C8A68A", "#3A2E23"],
      Cosmics: ["#F9E29B", "#D3A6FF", "#3A2D6F", "#0A0616"],
      Metallics: ["#F3C566", "#C9D6E0", "#7C8896", "#1B1F27"],
      Royals: ["#E7C36C", "#C85D76", "#4C1D69", "#2A0F36"]
    };

    const prompt = siloPrompts[silo as string] ?? "ultra realistic portrait";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `
Transform the person in this uploaded selfie into their ${silo} Realm.

STYLE REQUIREMENTS:
- MUST be ultra realistic (NOT cartoon, NOT CGI, NOT illustrated)
- Maintain real skin texture, real lighting + photographic look
- Cinematic light + atmosphere
- Use this thematic style: ${prompt}
`,
      size: "1024x1024",
      image: bytes
    });

    const imageUrl = result.data[0].url;

    return NextResponse.json({
      success: true,
      silo,
      description: descriptionMap[silo as string],
      palette: paletteMap[silo as string],
      image: imageUrl
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
