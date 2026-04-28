import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: pieces } = await supabase
    .from("pieces")
    .select("*")
    .eq("user_id", user.id);

  if (!pieces || pieces.length < 3) {
    return NextResponse.json(
      { error: "Adicione pelo menos 3 peças ao closet" },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, style, height, weight")
    .eq("id", user.id)
    .single();

  const { data: wishlistItems } = await supabase
    .from("wishlist_items")
    .select("name, category, color")
    .eq("user_id", user.id);

  const piecesList = pieces
    .map(
      (p) =>
        `- ${p.name} (${p.category}${p.color ? `, ${p.color}` : ""}${p.brand ? `, ${p.brand}` : ""})`,
    )
    .join("\n");

  const alreadyKnown = [
    ...pieces.map((p) => `${p.name} (${p.category})`),
    ...(wishlistItems || []).map((w) => `${w.name} (${w.category})`),
  ].join("\n- ");

  const prompt = `Você é um personal stylist especialista em moda.

Contexto do usuário:
- Nome: ${profile?.name || "Usuário"}
- Estilo preferido: ${profile?.style || "Streetwear/Sportwear"}
- Altura: ${profile?.height ? `${profile.height}cm` : "não informado"}
- Peso: ${profile?.weight ? `${profile.weight}kg` : "não informado"}

Peças que o usuário já tem no closet:
${piecesList}

Peças que o usuário JÁ POSSUI ou JÁ PLANEJA COMPRAR (não sugira estas nem variações muito similares):
- ${alreadyKnown}

Com base nas peças existentes e no estilo do usuário, sugira exatamente 5 peças que faltam e que complementariam bem o closet atual.

Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:
{
  "suggestions": [
    {
      "category": "Blusa",
      "name": "Nome descritivo da peça",
      "color": "Cor sugerida",
      "reason": "Justificativa de 2-3 frases explicando por que essa peça complementa o closet existente e combina com o estilo do usuário, mencionando peças específicas que combinam.",
      "priority": "high"
    }
  ]
}

Regras:
- category deve ser uma dessas: Blusa, Calça, Short, Tênis, Acessório
- priority deve ser: high (peça essencial que falta), medium (complementaria bem), low (nice to have)
- Varie as categorias entre as 5 sugestões quando possível
- O campo reason deve mencionar especificamente peças do closet existente que combinam
- Sugira cores e estilos coerentes com o que o usuário já tem

IMPORTANTE: Nunca sugira peças que já estão na lista acima. Foque em peças que realmente complementem o guarda-roupa sem repetir o que já existe ou já está planejado.`;

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
    return NextResponse.json({ suggestions: parsed.suggestions });
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar resposta" },
      { status: 500 },
    );
  }
}
