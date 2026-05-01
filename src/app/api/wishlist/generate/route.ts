import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Você é Mia, uma stylist profissional brasileira com 10 anos de experiência em moda. Você domina todos os universos do vestuário:

ESTILOS QUE VOCÊ CONHECE:
- Streetwear e Sportwear urbano
- Moda social e executiva (trabalho, eventos formais)
- Casual e lifestyle (dia a dia, fim de semana)
- Moda feminina (vestidos, saias, acessórios, bolsas)
- Moda masculina clássica e contemporânea
- Estilos alternativos (gótico, vintage, Y2K, boho)
- Minimalismo e quiet luxury
- Smart casual (entre o casual e o social)

CONHECIMENTO TÉCNICO:
- Paleta de cores e teoria das cores aplicada à moda
- Proporções corporais e como cada peça valoriza diferentes biótipos
- Combinações clássicas infalíveis e combinações ousadas que funcionam
- Como adaptar o estilo ao clima, à ocasião e ao momento do dia
- Tendências atuais sem abrir mão do que é atemporal
- Como misturar peças de estilos diferentes com harmonia

SEU JEITO DE TRABALHAR:
- Você lê o estilo do usuário e se adapta completamente a ele
- Se o usuário tem peças sociais, você sugere outfits sociais elegantes
- Se tem streetwear, você sugere combinações urbanas e criativas
- Se tem os dois, você sabe quando misturar e quando não misturar
- Você nunca força um estilo que não combina com o guarda-roupa do usuário
- Suas justificativas são diretas, inspiradoras e práticas — como uma amiga stylist de verdade, não como uma enciclopédia de moda
- Você considera o clima, o biotipo e a ocasião em cada sugestão
- Quando fotos das peças forem fornecidas, analise cor exata, textura, estilo do corte e detalhes visuais para fazer combinações mais precisas.`;

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

  const piecesWithPhoto = pieces.filter((p) => p.photo_url);

  const contextBlock = `Contexto do usuário:
- Nome: ${profile?.name || "Usuário"}
- Estilo preferido: ${profile?.style || "Streetwear/Sportwear"}
- Altura: ${profile?.height ? `${profile.height}cm` : "não informado"}
- Peso: ${profile?.weight ? `${profile.weight}kg` : "não informado"}

Peças que o usuário já tem no closet:
${piecesList}

Peças que o usuário JÁ POSSUI ou JÁ PLANEJA COMPRAR (não sugira estas nem variações muito similares):
- ${alreadyKnown}${piecesWithPhoto.length > 0 ? "\n\nPara as peças abaixo, analise também a foto real:" : ""}`;

  const instructionsBlock = `Com base nas peças existentes e no estilo do usuário, sugira exatamente 5 peças que faltam e que complementariam bem o closet atual.

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
- category deve ser uma dessas: Camiseta / Blusa, Camisa, Moletom, Calça, Short / Bermuda, Saia, Vestido, Macacão, Tênis, Sapato / Oxford, Bota, Sandália / Chinelo, Casaco / Jaqueta, Acessório, Bolsa, Chapéu / Boné
- priority deve ser: high (peça essencial que falta), medium (complementaria bem), low (nice to have)
- Varie as categorias entre as 5 sugestões quando possível
- O campo reason deve mencionar especificamente peças do closet existente que combinam
- Sugira cores e estilos coerentes com o que o usuário já tem

IMPORTANTE: Nunca sugira peças que já estão na lista acima. Foque em peças que realmente complementem o guarda-roupa sem repetir o que já existe ou já está planejado.`;

  const contentWithImages: Anthropic.MessageParam["content"] = [
    { type: "text", text: contextBlock },
    ...piecesWithPhoto.flatMap(
      (piece): Anthropic.ContentBlockParam[] => [
        {
          type: "text",
          text: `Peça: ${piece.name} (${piece.category}):`,
        },
        {
          type: "image",
          source: { type: "url", url: piece.photo_url! },
        },
      ],
    ),
    { type: "text", text: instructionsBlock },
  ];

  const baseParams = {
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
  } as const;

  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      ...baseParams,
      messages: [{ role: "user", content: contentWithImages }],
    });
  } catch {
    message = await anthropic.messages.create({
      ...baseParams,
      messages: [
        { role: "user", content: `${contextBlock}\n\n${instructionsBlock}` },
      ],
    });
  }

  const responseContent = message.content[0];
  if (responseContent.type !== "text") {
    return NextResponse.json({ error: "Erro na IA" }, { status: 500 });
  }

  try {
    const clean = responseContent.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({ suggestions: parsed.suggestions });
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar resposta" },
      { status: 500 },
    );
  }
}
