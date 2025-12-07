import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // because we're using form-data
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File | null;
    const silo = formData.get("silo") as string | null;

    if (!file || !silo) {
      return NextResponse.json(
        { error: "Missing image or silo" },
        { status: 400 }
      );
    }

    // Convert file → buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // The Ultra Realistic Prompt
    const prompt = `
Create an ULTRA-REALISTIC portrait.
Use the user's face, lighting, and proportions exactly — NO CARTOON, NO SMOOTHING.

Blend them into the ${silo} visual universe:
- Ethereal → clouds, mist, soft light, lucid gradients, dreamy realism
- Earthers → forest, clay, botanicals, warm film texture
- Elementals → bright kinetic paint, glass, firelight, sharp realism
- Naturalists → textured neutrals, linen, stone, soft warm light
- Cosmics → deep blues, magenta, nebula haze, cinematic sci-fi realism
- Metallics → chrome, reflective metals, high contrast lighting
- Royals → velvet shadows, rich purples, dramatic light

NO distortion. NO abstraction. 
The final output must look like a **real editorial fashion photo**.
`;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      image: buffer,
      n: 1,
    });

    const image_base64 = response.data[0].b64_json;

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${image_base64}`,
    });
  } catch (err: any) {
    console.error("ERROR:", err);
    return NextResponse.json(
      { error: "Generation failed", details: err.message },
      { status: 500 }
    );
  }
}

