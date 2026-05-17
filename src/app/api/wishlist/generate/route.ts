import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, incrementUsage } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/*
 * VISÃO COMPUTACIONAL — DESATIVADA TEMPORARIAMENTE
 * Motivo: custo elevado (~$0.95/geração com 50 peças)
 * Para reativar: descomentar esta função e o bloco imageBlocks abaixo
 *
async function fetchAndCompressImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    if (buffer.length > 500 * 1024) return null
    return buffer.toString('base64')
  } catch {
    return null
  }
}
*/

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
- Você identifica o biotipo e a coloração pessoal pelas peças que a
  pessoa tem — tons quentes no closet indicam coloração quente
- Você pensa em o que o look comunica socialmente, não só como fica
- Você adapta o estilo completamente ao guarda-roupa existente
- Você nunca sugere algo que não combina com o que a pessoa já tem
- Você explica suas escolhas com precisão técnica — cita teoria de cor,
  proporção, fit — mas no tom de uma amiga expert, não de um manual
- Você considera simultaneamente: clima, biotipo, coloração pessoal,
  ocasião, o que o look comunica e as peças disponíveis
- Quando vê as fotos das peças, você analisa cor exata, temperatura
  de cor (quente/fria), textura do tecido, estilo do corte, fit e
  detalhes para fazer combinações tecnicamente corretas
- Você pensa em como cada peça se relaciona com todas as outras
- Suas justificativas no campo "why" são técnicas e educativas:
  explicam teoria de cor, proporção ou fit — nunca frases genéricas
- Para usuários masculinos: fit vem antes de tudo, mencione sempre
- Para usuários femininos: considere o arquétipo de estilo e o que
  o look comunica além de "ficar bem"
- Você não monta looks que existem só no papel — você pensa se a
  pessoa consegue reproduzir isso sozinha na próxima manhã`;

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(user.id, 'wishlist_generate')
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Limite de sugestões atingido (${rateCheck.used}/${rateCheck.limit}). Faça upgrade para o plano Pro.` },
      { status: 429 }
    )
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

  const categorizedPieces = pieces.reduce((acc: Record<string, typeof pieces>, piece) => {
    const cat = piece.category || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(piece)
    return acc
  }, {})

  const piecesList = Object.entries(categorizedPieces)
    .map(([category, items]) => {
      const itemsList = items.map(p =>
        `  · ${p.name}${p.color ? ` — ${p.color}` : ''}${p.brand ? ` (${p.brand})` : ''}${p.fit ? ` | Fit: ${p.fit}` : ''}${p.style_type ? ` | Estilo: ${p.style_type}` : ''}${p.season ? ` | Estação: ${p.season}` : ''}`
      ).join('\n')
      return `${category.toUpperCase()}:\n${itemsList}`
    })
    .join('\n\n')

  const alreadyKnown = [
    ...pieces.map((p) => `${p.name} (${p.category})`),
    ...(wishlistItems || []).map((w) => `${w.name} (${w.category})`),
  ].join("\n- ");

  const contextBlock = `Contexto do usuário:
- Nome: ${profile?.name || "Usuário"}
- Estilo preferido: ${profile?.style || "Streetwear/Sportwear"}
- Altura: ${profile?.height ? `${profile.height}cm` : "não informado"}
- Peso: ${profile?.weight ? `${profile.weight}kg` : "não informado"}

Peças que o usuário já tem no closet:
${piecesList}

Peças que o usuário JÁ POSSUI ou JÁ PLANEJA COMPRAR (não sugira estas nem variações muito similares):
- ${alreadyKnown}`;
  // Visão ativa: adicionar ao final do template a linha sobre fotos reais

  const instructionsBlock = `Analise o closet do usuário como uma stylist especialista e identifique as 5 peças mais estratégicas que estão faltando.

Sua análise deve considerar:
1. LACUNAS DE CATEGORIA: Quais tipos de peça estão completamente ausentes?
2. PEÇAS CORINGA: O que complementaria o maior número de itens do closet?
3. EQUILÍBRIO DE ESTILO: O closet está incompleto em algum universo de estilo?
4. VERSATILIDADE: Peças que criam novas combinações com o que já existe
5. ADEQUAÇÃO AO BIOTIPO: Sugestões que valorizam a silhueta do usuário

Responda APENAS com JSON válido, sem texto adicional:
{
  "suggestions": [
    {
      "category": "categoria exata da lista permitida",
      "name": "Nome descritivo e específico da peça",
      "color": "Cor exata sugerida com justificativa (ex: Azul marinho — âncora neutra)",
      "reason": "2-3 frases explicando: (1) por que essa peça está faltando, (2) com quais peças específicas do closet ela combina, (3) como ela expande as possibilidades de outfits.",
      "priority": "high | medium | low"
    }
  ]
}

Critérios de prioridade:
- high: peça essencial que cria múltiplas combinações novas ou preenche lacuna crítica
- medium: peça que complementa bem e expande o guarda-roupa
- low: peça nice-to-have que adiciona versatilidade extra

Categorias permitidas: Camiseta / Blusa, Camisa, Moletom, Calça, Short / Bermuda,
Saia, Vestido, Macacão, Tênis, Sapato / Oxford, Bota, Sandália / Chinelo,
Casaco / Jaqueta, Acessório, Bolsa, Chapéu / Boné

IMPORTANTE: Nunca sugira variações do que já existe no closet ou na wishlist.
Foque em peças que genuinamente transformam o guarda-roupa existente.`;

  /*
   * VISÃO COMPUTACIONAL — DESATIVADA
   * Para reativar: descomentar e substituir 'content' por 'contentWithImages'
   *
  const piecesWithPhoto = pieces.filter((p) => p.photo_url).slice(0, 8)
  const imageBlocks: Anthropic.ContentBlockParam[] = []
  for (const piece of piecesWithPhoto) {
    const base64 = await fetchAndCompressImage(piece.photo_url!)
    if (base64) {
      imageBlocks.push({ type: "text", text: `Peça: ${piece.name} (${piece.category}):` })
      imageBlocks.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } })
    }
  }
  const contentWithImages: Anthropic.MessageParam["content"] = [
    { type: "text", text: contextBlock },
    ...imageBlocks,
    { type: "text", text: instructionsBlock },
  ]
  */

  // Versão texto puro (visão desativada — ver bloco comentado acima)
  const content = `${contextBlock}\n\n${instructionsBlock}`

  const baseParams = {
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
  } as const;

  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      ...baseParams,
      messages: [{ role: "user", content }],
    })
  } catch (err) {
    console.error('[wishlist/generate] erro Anthropic:', err)
    return NextResponse.json({ error: 'Erro na API de IA' }, { status: 500 })
  }

  const responseContent = message.content[0];
  if (responseContent.type !== "text") {
    return NextResponse.json({ error: "Erro na IA" }, { status: 500 });
  }

  try {
    const clean = responseContent.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    await incrementUsage(user.id, 'wishlist_generate')
    return NextResponse.json({ suggestions: parsed.suggestions });
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar resposta" },
      { status: 500 },
    );
  }
}
