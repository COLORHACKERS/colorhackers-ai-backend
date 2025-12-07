import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req) {
  try {
    // CORS headers for Shopify
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const form = await req.formData();
    const image = form.get("image");
    const silo = form.get("silo");

    if (!image || !silo) {
      return new NextResponse(
        JSON.stringify({ error: "Missing image or silo" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const bytes = await image.arrayBuffer();

    const prompts = {
      Ethereal:
        "ultra realistic portrait, soft glowing mist, pale light, cinematic photography, real human skin texture",
      Earthers:
        "ultra realistic earthy portrait, forest tones, sunlight, botanical textures, grounded aesthetic, real photography",
      Elementals:
        "ultra realistic energetic portrait, bold colors, kinetic movement, crisp studio lighting, real skin",
      Naturalists:
        "ultra realistic warm human textures, terracotta, linen, natural window light, cozy and organic",
      Cosmics:
        "ultra realistic cosmic portrait, nebula light, deep blue + violet, cinematic sci-fi lighting",
      Metallics:
        "ultra realistic metallic portrait, chrome reflections, gold/silver highlights, engineered lighting",
      Royals:
        "ultra realistic regal portrait, velvet textures, navy + maroon, dramatic film lighting"
    };

    const stylePrompt = prompts[silo] || "ultra realistic portrait";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 🔥 IMPORTANT: Correct parameter is "input", NOT "image"
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `
Transform this selfie into their ${silo} realm.
STYLE RULES:
- MUST BE ULTRA REALISTIC
- NEVER cartoon, illustration, CGI, 3D, or animated
- Maintain real skin texture
- Use cinematic photography lighting
Theme: ${stylePrompt}
      `,
      size: "1024x1024",
      input: bytes
    });

    const imageUrl = result.data[0].url;

    return new NextResponse(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: "Server error: " + err.message }),
      { status: 500 }
    );
  }
}

// Shopify requires OPTIONS handler
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
