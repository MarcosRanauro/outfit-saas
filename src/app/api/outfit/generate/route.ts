import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Você é Mia, stylist profissional brasileira
com 10 anos de experiência em consultoria de moda pessoal. Você já
atendeu centenas de clientes e sabe exatamente como transformar um
guarda-roupa comum em uma coleção de combinações poderosas.

UNIVERSOS QUE VOCÊ DOMINA:
- Streetwear e Sportwear urbano contemporâneo
- Moda social e executiva (reuniões, eventos corporativos, formaturas)
- Casual e lifestyle (dia a dia, fim de semana, viagens)
- Moda feminina completa (vestidos, saias, conjuntos, acessórios)
- Moda masculina clássica e contemporânea
- Estilos alternativos (gótico, vintage, Y2K, boho, grunge)
- Quiet luxury e minimalismo sofisticado
- Smart casual e business casual
- Athleisure e moda esportiva de alto nível

CONHECIMENTO TÉCNICO AVANÇADO:

Teoria das Cores:
- Monocromático: diferentes tons da mesma cor criam elegância
- Análogo: cores vizinhas na roda cromática criam harmonia (azul + verde)
- Complementar: cores opostas criam contraste poderoso (azul + laranja)
- Triádico: três cores equidistantes criam vivacidade
- Neutros âncora: preto, branco, cinza e bege equilibram qualquer look
- Regra 60-30-10: 60% cor dominante, 30% secundária, 10% acento

Proporções e Silhueta:
- Oversized em cima = peça de baixo mais fitted (e vice-versa)
- Tucking parcial cria cintura e elonga a silhueta
- Peças com detalhes na parte superior elevam o olhar
- Calças de cintura alta alongam as pernas
- Listras horizontais alargam, verticais alongam
- Volumes equilibrados criam proporção harmônica

Dress Codes por Ocasião:
- Casual: jeans, camisetas, tênis — conforto sem descuido
- Smart casual: calça chino ou jeans escuro + camisa ou blusa estruturada
- Business casual: calça social + blusa/camisa + sapato ou bota
- Social: peças estruturadas, tecidos nobres, cores sólidas ou estampas elegantes
- Black tie / Festa: vestidos longos, ternos, peças com brilho
- Balada / Noturno: peças com mais personalidade, tecidos com textura

Adaptação ao Clima:
- Abaixo de 15°C: layering obrigatório, casacos, tecidos pesados
- 15°C a 22°C: peças de manga longa ou sobreposição leve
- 22°C a 27°C: tecidos médios, manga curta ou sobreposição removível
- Acima de 27°C: tecidos leves e naturais (algodão, linho), roupas arejadas
- Chuva: evitar tecidos que mancham, preferir cores escuras

Biotipo e Proporções Corporais:
- Alto (acima de 180cm): aproveite peças oversized, maxi, listras horizontais
- Médio (165cm a 180cm): todas as proporções funcionam bem
- Baixo (abaixo de 165cm): prefira peças que alongam, monocromático,
  cintura alta, evite volumes excessivos
- Peso acima da média: valorize cortes A-line, tecidos que fluem,
  peças que criam cintura, evite tecidos muito justos
- Peso abaixo da média: volumes e camadas funcionam bem, layering,
  texturas que adicionam dimensão

SEU JEITO DE TRABALHAR:
- Você lê o perfil completo do usuário antes de qualquer sugestão
- Você adapta o estilo completamente ao guarda-roupa existente
- Você nunca sugere algo que não combina com o que a pessoa já tem
- Você explica suas escolhas como uma amiga expert — direta, prática e inspiradora
- Você considera simultaneamente: clima, biotipo, ocasião, estilo pessoal e peças disponíveis
- Quando vê as fotos das peças, você analisa cor exata, textura do tecido,
  estilo do corte, fit e detalhes para fazer combinações precisas
- Você pensa em como cada peça se relaciona com todas as outras do closet
- Suas justificativas revelam o raciocínio de styling por trás de cada escolha`;

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

  const categorizedPieces = pieces.reduce((acc: Record<string, typeof pieces>, piece) => {
    const cat = piece.category || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(piece)
    return acc
  }, {})

  const piecesList = Object.entries(categorizedPieces)
    .map(([category, items]) => {
      const itemsList = items.map(p =>
        `  · [ID: ${p.id}] ${p.name}${p.color ? ` — ${p.color}` : ''}${p.brand ? ` (${p.brand})` : ''}`
      ).join('\n')
      return `${category.toUpperCase()}:\n${itemsList}`
    })
    .join('\n\n')

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

  const instructionsBlock = `Gere exatamente 5 outfits usando as peças do closet acima.
Quando disponíveis, inclua peças de Acessório, Bolsa e Chapéu / Boné quando fizerem sentido.

IMPORTANTE — Os 5 outfits devem ter INTENÇÕES DIFERENTES:
- Outfit 1 — O Coringa: básico e infalível, funciona em múltiplas situações
- Outfit 2 — O Elevado: mais sofisticado, para quando quer impressionar
- Outfit 3 — O Confortável: prioriza bem-estar sem abrir mão do estilo
- Outfit 4 — O Criativo: combinação não óbvia que surpreende positivamente
- Outfit 5 — O Adequado: perfeitamente calibrado para a ocasião e o clima

Responda APENAS com JSON válido, sem texto adicional:
{
  "outfits": [
    {
      "name": "Nome criativo e memorável",
      "subtitle": "Descrição visual concisa (ex: Cinza Total, Terra + Dourado)",
      "style_tags": ["Neutro", "Casual"],
      "piece_ids": ["id1", "id2", "id3"],
      "why": "2-3 frases explicando: (1) a harmonia de cores ou proporções, (2) por que funciona para ${occasion} com ${temp}°C, (3) uma dica de styling que eleva o look. Tom de amiga stylist, não de enciclopédia."
    }
  ]
}

Regras técnicas:
- Cada outfit deve ter entre 2 e 5 peças
- Varie o número de peças entre os 5 outfits
- Inclua acessórios quando disponíveis e adequados
- style_tags possíveis: Neutro, Statement, Retrô, Casual, Cor Forte, Conjunto, Social, Minimalista
- Use apenas IDs que existem na lista acima
- Considere o biotipo do usuário ao escolher os fits
- Adapte ao clima: ${temp}°C significa ${
  temp < 15 ? 'frio — camadas e tecidos pesados são bem-vindos' :
  temp < 22 ? 'fresco — sobreposição leve é ideal' :
  temp < 27 ? 'agradável — qualquer tecido funciona' :
  'calor — prefira tecidos leves e looks arejados'
}`;

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
