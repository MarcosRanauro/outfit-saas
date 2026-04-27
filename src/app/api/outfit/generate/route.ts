import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { period, occasion, temp, weatherDesc } = await request.json();

  const { data: pieces } = await supabase
    .from("pieces")
    .select("*")
    .eq("user_id", user.id);

  if (!pieces || pieces.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma peça no closet" },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, style, height, weight")
    .eq("id", user.id)
    .single();

  const piecesList = pieces
    .map(
      (p) =>
        `- ID: ${p.id} | Nome: ${p.name} | Categoria: ${p.category} | Cor: ${p.color || "não informado"} | Marca: ${p.brand || "não informado"}`,
    )
    .join("\n");

  const prompt = `Você é um stylist especialista em moda streetwear e sportwear.

Contexto do usuário:
- Nome: ${profile?.name || "Usuário"}
- Estilo: ${profile?.style || "Streetwear/Sportwear"}
- Altura: ${profile?.height ? `${profile.height}cm` : "não informado"}
- Peso: ${profile?.weight ? `${profile.weight}kg` : "não informado"}
- Temperatura atual: ${temp}°C
- Clima: ${weatherDesc}
- Período: ${period === "dia" ? "Dia" : "Noite"}
- Ocasião: ${occasion}

Peças disponíveis no closet:
${piecesList}

Gere exatamente 5 outfits diferentes e criativos combinando as peças acima.
Cada outfit deve ser adequado para a ocasião "${occasion}" no período "${period === "dia" ? "dia" : "noite"}" com ${temp}°C.

Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:
{
  "outfits": [
    {
      "name": "Nome criativo do outfit",
      "subtitle": "Subtítulo descritivo (ex: Cinza Total, Bege + Marrom)",
      "style_tags": ["Neutro", "Casual"],
      "piece_ids": ["id1", "id2", "id3"],
      "why": "Explicação de 2-3 frases de por que este outfit funciona para esta ocasião, clima e período específicos."
    }
  ]
}

Regras:
- Cada outfit deve ter entre 2 e 4 peças
- style_tags podem ser: Neutro, Statement, Retrô, Casual, Cor Forte, Conjunto
- Varie os estilos entre os 5 outfits
- O campo "why" deve mencionar a ocasião e o clima
- Use apenas IDs de peças que existem na lista acima`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Erro na IA" }, { status: 500 });
  }

  try {
    const clean = content.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const outfitsWithPieces = parsed.outfits.map((outfit: any) => ({
      ...outfit,
      pieces: pieces.filter((p) => outfit.piece_ids.includes(p.id)),
    }));

    return NextResponse.json({ outfits: outfitsWithPieces });
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar resposta" },
      { status: 500 },
    );
  }
}
