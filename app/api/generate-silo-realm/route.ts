import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Use Node runtime (safer for OpenAI client)
export const runtime = "nodejs";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

type EngineMode = "auto" | "text" | "photo" | "frequency";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let mode: EngineMode = "auto";

    // Normalized payload we’ll send to the AI engine
    const payload: {
      textDescription?: string;
      frequencyHz?: number;
      userNotes?: string;
      siloHint?: string;
      wantsImage?: boolean;
      // NOTE: we are NOT uploading the raw image to OpenAI yet,
      // we just use a text description for the generated artwork.
    } = { wantsImage: true };

    // 1) Handle multipart/form-data (Shopify style upload)
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      const text = form.get("text")?.toString();
      const notes = form.get("notes")?.toString();
      const siloHint = form.get("silo")?.toString();
      const freq = form.get("frequency_hz")?.toString();
      const wantsImage =
        form.get("wantsImage")?.toString().toLowerCase() !== "false";

      mode = (form.get("mode")?.toString() as EngineMode) || "photo";

      if (text) payload.textDescription = text;
      if (notes) payload.userNotes = notes;
      if (siloHint) payload.siloHint = siloHint;
      if (freq && !Number.isNaN(Number(freq))) {
        payload.frequencyHz = Number(freq);
      }
      payload.wantsImage = wantsImage;

      // If an <input type="file" name="image" /> is sent, we
      // could later read it for real image editing; for now we
      // just *know* it was a selfie and describe it in the prompt.
    }

    // 2) Handle JSON body (app / JS client)
    else {
      const body = await req.json().catch(() => ({}));
      mode = (body.mode as EngineMode) || "auto";

      if (body.text) payload.textDescription = body.text;
      if (body.userNotes) payload.userNotes = body.userNotes;
      if (body.siloHint) payload.siloHint = body.siloHint;
      if (body.frequencyHz) payload.frequencyHz = Number(body.frequencyHz);
      if (typeof body.wantsImage === "boolean") {
        payload.wantsImage = body.wantsImage;
      }
    }

    // Fallback defaults so the model always has something to chew on
    if (!payload.textDescription && !payload.frequencyHz) {
      payload.textDescription =
        "No description provided. Infer a gentle default profile.";
    }

    // ---- 3) Call the ColorHackers Engine (Chat completion) ----
    const schemaDescription = `
You are the ColorHackers Engine. Respond with STRICT JSON only.

Fields:
- silo_prediction:
    - primary_silo: one of ["Ethereal","Earther","Elementals","Naturalist","Cosmic","Metallic","Royals"]
    - confidence: number 0-1
    - secondary_silos: string[]
- color_profile:
    - primary_hex: string (like "#AABBCC")
    - secondary_hexes: string[]
    - vibe_words: string[] // 3-7 short descriptors
- frequency_analysis:
    - has_input: boolean
    - interpreted_frequency_hz: number | null
    - band: "infra-low" | "low" | "mid" | "high" | "ultra"
    - band_color_hex: string
- personality_notes: string   // 2-5 sentences, friendly, no line breaks
`;

    const userSummary = JSON.stringify(
      {
        mode,
        textDescription: payload.textDescription,
        frequencyHz: payload.frequencyHz ?? null,
        userNotes: payload.userNotes ?? null,
        siloHint: payload.siloHint ?? null,
      },
      null,
      2
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: schemaDescription.trim(),
        },
        {
          role: "user",
          content: `Analyze this ColorHackers user input and respond with JSON matching the schema:\n\n${userSummary}`,
        },
      ],
    });

    const rawContent = completion.choices[0].message.content || "{}";

    let engine;
    try {
      engine = JSON.parse(rawContent);
    } catch {
      // If the model didn't give valid JSON, wrap it
      engine = {
        silo_prediction: {
          primary_silo: "Ethereal",
          confidence: 0.5,
          secondary_silos: [],
        },
        color_profile: {
          primary_hex: "#FFFFFF",
          secondary_hexes: ["#000000"],
          vibe_words: ["fallback"],
        },
        frequency_analysis: {
          has_input: false,
          interpreted_frequency_hz: null,
          band: "mid",
          band_color_hex: "#888888",
        },
        personality_notes: String(rawContent).slice(0, 400),
      };
    }

    // ---- 4) Optional image generation for the silo realm ----
    let imageBase64: string | null = null;
    let imagePrompt = "";

    if (payload.wantsImage !== false) {
      const primarySilo =
        engine?.silo_prediction?.primary_silo || payload.siloHint || "Ethereal";
      const vibeWords =
        engine?.color_profile?.vibe_words?.join(", ") ||
        "soft, cinematic, glowing";

      const palette =
        engine?.color_profile?.primary_hex ||
        "#A0C4FF"; /* gentle default blue */

      imagePrompt = `
Ultra realistic portrait, blurred face, representing the "${primarySilo}" ColorHackers silo.
Mood: ${vibeWords}.
Color palette led by ${palette}.
Cinematic lighting, editorial yet mystical, no text, no words.
      `.trim();

      try {
        const img = await openai.images.generate({
          model: "gpt-image-1",
          prompt: imagePrompt,
          size: "1024x1024",
          n: 1,
          response_format: "b64_json",
        });

        imageBase64 = img.data[0]?.b64_json ?? null;
      } catch (err) {
        console.error("Image generation failed:", err);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        mode,
        engine,
        image: {
          prompt: imagePrompt,
          base64: imageBase64,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("ColorHackers engine error:", err);

    return NextResponse.json(
      {
        ok: false,
        error: "ColorHackers Engine failed. Check backend logs.",
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}
