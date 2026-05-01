import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const VALID_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ValidMimeType = typeof VALID_MIME[number];

const ANALYZE_PROMPT = `Analise esta peça de roupa e retorne APENAS um JSON válido:
{
  "name": "nome descritivo da peça (ex: Camiseta Oversized Branca)",
  "category": "uma das categorias permitidas",
  "color": "cor principal em português",
  "brand": "marca se visível na peça, null se não visível",
  "fit": "um de: Oversized, Regular, Slim, Cropped, A-line",
  "style_type": "um de: Casual, Social, Esportivo, Streetwear, Minimalista",
  "season": "um de: Todas, Verão, Inverno, Meia estação"
}

Categorias permitidas: Camiseta / Blusa, Camisa, Moletom, Calça, Short / Bermuda, Saia, Vestido, Macacão, Tênis, Sapato / Oxford, Bota, Sandália / Chinelo, Casaco / Jaqueta, Acessório, Bolsa, Chapéu / Boné

Seja preciso na cor (ex: 'Azul marinho' não apenas 'Azul').
Se não conseguir identificar algum campo, use null.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { imageBase64: rawBase64, mimeType: rawMimeType } = await request.json();

    const imageBase64 = typeof rawBase64 === "string" && rawBase64.includes(",")
      ? rawBase64.split(",")[1]
      : rawBase64;

    const mimeType: ValidMimeType = (VALID_MIME as readonly string[]).includes(rawMimeType)
      ? rawMimeType as ValidMimeType
      : "image/jpeg";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: "Você é Mia, stylist profissional. Analise a foto de uma peça de roupa e extraia as informações solicitadas.",
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: imageBase64 },
          },
          { type: "text", text: ANALYZE_PROMPT },
        ],
      }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Erro na análise" }, { status: 500 });
    }

    const clean = content.text.replace(/```json|```/g, "").trim();
    const suggestion = JSON.parse(clean);
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Erro na análise:", error);
    return NextResponse.json({ error: "Erro interno", details: String(error) }, { status: 500 });
  }
}
