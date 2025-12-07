import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const selfie = form.get("image") as File | null;
    const silo = form.get("silo") as string | null;

    if (!selfie || !silo) {
      return NextResponse.json(
        { error: "Missing image or silo" },
        { status: 400 }
      );
    }

    // Convert selfie to ArrayBuffer
    const selfieBytes = await selfie.arrayBuffer();

    // Silo-style prompts
    const styles: Record<string, string> = {
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

    const stylePrompt = styles[silo] || "ultra realistic portrait";

    // Initialize OpenAI
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    /**
     * ❗ IMPORTANT:
     * gpt-image-1 DOES NOT accept { image: ... } inside images.generate
     * For transformations, OpenAI requires "image" to be inside input array as:
     * 
     * input: [
     *   { role: "input_image", image: <bytes> },
     *   { role: "input_text", text: "Transform this selfie..." }
     * ]
     */

    const response = await client.images.generate({
      model: "gpt-image-1",
      size: "1024x1024",
      input: [
        {
          role: "input_image",
          image: selfieBytes
        },
        {
          role: "input_text",
          text: `
            Transform the person in the uploaded selfie into their ${silo} realm.

            MUST FOLLOW STYLE:
            ${stylePrompt}

            REQUIREMENTS:
            - ULTRA REALISTIC (NOT cartoon, NOT illustration)
            - Keep real skin texture
            - Cinematic photography lighting
            - Must look like a high-end professional portrait
          `
        }
      ]
    });

    const imageUrl = response.data[0].url;

    return NextResponse.json({ imageUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
