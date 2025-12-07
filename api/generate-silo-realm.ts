import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Create an ULTRA-REALISTIC portrait.
Use the user's real facial features, lighting, and proportions — NO cartoon, NO blur, NO stylization.

Blend their real face into the ${silo} universe:
Ethereal → cinematic clouds, glowing light, airy realism  
Earthers → botanical realism, film texture  
Elementals → vibrant paint & glass realism  
Naturalists → neutral textures, earthy realism  
Cosmics → nebula, deep space realism  
Metallics → chrome-lit realism  
Royals → velvet shadows, rich editorial realism  

Must look like a REAL photograph — Vogue / Nike editorial style.
`;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      image: buffer,
      n: 1,
    });

    const base64 = response.data[0].b64_json;

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${base64}`,
    });
  } catch (err: any) {
    console.error("AI ERROR:", err);
    return NextResponse.json(
      { error: "Generation failed", details: err.message },
      { status: 500 }
    );
  }
}
