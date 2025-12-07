import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const silo = form.get("silo");

    if (!image || !silo) {
      return NextResponse.json({ error: "Missing image or silo" }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();

    const prompts = {
      Ethereal:
        "ultra realistic portrait, soft glowing ethereal mist, pale clouds, cinematic lighting, surreal airy atmosphere, gentle tones, photography not illustration",
      Earthers:
        "ultra realistic portrait, earthy clay tones, forest atmosphere, real sunlight, botanical textures, natural materials, grounded aesthetic, photography not illustration",
      Elementals:
        "ultra realistic vibrant energetic portrait, bold colors, kinetic paint splashes, motion energy, crisp studio lighting, photography not digital art",
      Naturalists:
        "ultra realistic portrait, warm human textures, linen, terracotta, natural window light, cozy environment, photography not illustration",
      Cosmics:
        "ultra realistic cosmic portrait, deep blues, violet nebula clouds, subtle futuristic shimmer, dramatic lighting, photography not CGI",
      Metallics:
        "ultra realistic metallic portrait, chrome reflections, gold + silver textures, engineered light, crisp specular highlights, photography not render",
      Royals:
        "ultra realistic regal portrait, velvet textures, maroon + navy tones, dramatic cinematic look, film lighting, photography not illustration"
    };

    const prompt = prompts[silo] || "ultra realistic portrait";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Transform the person in the uploaded selfie into their ${silo} realm. 
      STYLE REQUIREMENTS:
      - Must be ULTRA REALISTIC (no cartoon, no illustration, no CGI look)
      - Maintain real human skin texture
      - Use cinematic photography lighting
      - Use this silo theme: ${prompt}
      `,
      size: "1024x1024",
      image: bytes
    });

    const imageUrl = result.data[0].url;

    return NextResponse.json({ imageUrl });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
