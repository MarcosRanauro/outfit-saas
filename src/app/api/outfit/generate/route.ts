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

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { period, occasion, temp, weatherDesc, eventDate, eventPeriod } = await request.json();

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

  const piecesWithPhoto = pieces.filter((p) => p.photo_url);

  const climateBlock = eventDate
    ? `- Evento: ${eventDate}${eventPeriod ? ` (${eventPeriod})` : ''}
- Temperatura prevista: ${temp}°C
- Clima previsto: ${weatherDesc}
- IMPORTANTE: Gere outfits adequados para este evento futuro, considerando o clima previsto naquele momento.`
    : `- Temperatura atual: ${temp}°C
- Clima: ${weatherDesc}`

  const contextBlock = `Contexto do usuário:
- Nome: ${profile?.name || "Usuário"}
- Estilo: ${profile?.style || "Streetwear/Sportwear"}
- Altura: ${profile?.height ? `${profile.height}cm` : "não informado"}
- Peso: ${profile?.weight ? `${profile.weight}kg` : "não informado"}
${climateBlock}
- Período: ${period === "dia" ? "Dia" : "Noite"}
- Ocasião: ${occasion}

Peças disponíveis no closet:
${piecesList}${piecesWithPhoto.length > 0 ? "\n\nPara as peças abaixo, analise também a foto real:" : ""}`;

  const instructionsBlock = `Gere exatamente 5 outfits diferentes e criativos combinando as peças acima.
Quando disponíveis, inclua peças das categorias 'Acessório', 'Bolsa' e 'Chapéu / Boné' nos outfits quando fizerem sentido para a ocasião.
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
- Cada outfit deve ter entre 2 e 5 peças
- Varie o número de peças entre os 5 outfits (alguns com 3, outros com 4 ou 5)
- Inclua acessórios quando disponíveis e adequados à ocasião
- style_tags podem ser: Neutro, Statement, Retrô, Casual, Cor Forte, Conjunto
- Varie os estilos entre os 5 outfits
- O campo "why" deve mencionar a ocasião e o clima
- Use apenas IDs de peças que existem na lista acima`;

  const contentWithImages: Anthropic.MessageParam["content"] = [
    { type: "text", text: contextBlock },
    ...piecesWithPhoto.flatMap(
      (piece): Anthropic.ContentBlockParam[] => [
        {
          type: "text",
          text: `Peça ID: ${piece.id} — ${piece.name} (${piece.category}):`,
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
