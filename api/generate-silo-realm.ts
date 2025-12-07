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

    const selfieBytes = await selfie.arrayBuffer();

    // =============================================================
    // 🎨 OPTIMIZED SILO STYLE PROFILES — CINEMATIC PHOTOGRAPHY ONLY
    // =============================================================
    const siloPrompts: Record<string, string> = {
      Ethereal: `
        ultra-realistic portrait photography,
        soft atmospheric glow,
        misty clouds,
        pale mint + sunrise tones,
        premium skin texture retention,
        volumetric cinematic lighting,
        airy surreal realism,
        background softly blurred like Leica f1.4
      `,
      Earthers: `
        ultra-realistic earth-tone portrait,
        clay + moss textures,
        real sunlight filtering through leaves,
        botanical warmth,
        rich natural skin texture,
        shallow depth of field,
        warm organic color grading,
        portrait shot on vintage film lens
      `,
      Elementals: `
        ultra-realistic energetic portrait,
        bold kinetic color bursts,
        high-contrast dramatic lighting,
        crisp studio reflections,
        motion energy atmosphere,
        expressive color splashes (real paint),
        premium photography realism
      `,
      Naturalists: `
        ultra-realistic humanistic portrait,
        linen and terracotta palette,
        natural window light,
        warm skin tones,
        handcrafted textures,
        cozy tactile depth,
        cinematic lifestyle realism
      `,
      Cosmics: `
        ultra-realistic cosmic portrait,
        deep navy + ultraviolet nebula mist,
        reflective sci-fi backlighting,
        soft rimlight glow around silhouette,
        atmospheric particles,
        realistic—not CGI,
        dramatic high-end photography
      `,
      Metallics: `
        ultra-realistic metallic portrait,
        chrome, silver and gold reflections,
        engineered light beams,
        shimmering specular highlights,
        clean futuristic realism,
        polished Vogue-style lighting
      `,
      Royals: `
        ultra-realistic regal portrait,
        velvet textures,
        maroon + navy cinematic palette,
        deep dramatic shadows,
        luxury editorial realism,
        Rembrandt-style contrast,
        premium film-grade portrait
      `
    };

    const style = siloPrompts[silo] || "ultra realistic portrait";

    // Complete prompt
    const finalPrompt = `
      Transform the uploaded selfie into a ${silo}-themed cinematic portrait.

      REQUIREMENTS:
      - Must be ULTRA REALISTIC (no cartoon, no illustration, no CGI)
      - Preserve REAL human facial structure (no distortions)
      - Preserve skin texture with high-end photographic quality
      - Cinematic lighting, depth, shadow, contrast
      - Professional portrait look (magazine cover quality)
      - ${style}

      Improve the background subtly to fit the theme,
      but keep the person recognizable and natural.
    `;

    // =============================================================
    // 🚀 CALL OPENAI — correct “input array” format (required)
    // =============================================================
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

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
          text: finalPrompt
        }
      ]
    });

    const imageUrl = response.data[0].url;

    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "AI image generation failed" },
      { status: 500 }
    );
  }
}
